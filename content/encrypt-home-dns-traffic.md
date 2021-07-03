---
title: "Encrypt Home DNS Traffic"
description: "Fully secure your home DNS traffic with CoreDNS"
keywords: "CoreDNS, encrypt dns, DoH, DoT, DNS over HTTPS, DNS over TLS"
date: 2021-07-09T00:00:00-05:00
slug: "encrypt-home-dns-traffic"
draft: false
type: "blog"
---

Your DNS server knows a lot about you - in fact it knows every single website your visit. Between ISP's intercepting both valid and invalid domains, and potentially selling your browsing history to advertisers, it's both prudent and _remarkably_ simple to encrypt all of your DNS to prevent this and to more importantly, encrypt this traditionally plain-text data to prevent prying eyes.

<!--more-->

## Software & Hardware

To fully secure your DNS you'll need two pieces of software [CoreDNS](https://coredns.io/) and [DNSProxy](https://github.com/AdguardTeam/dnsproxy), both of which are highly performant GoLang based DNS programs that you can download from each of their Github Release pages.

With these two programs we'll setup a DNS, DNS over TLS, and DNS over HTTPS server.

As both CoreDNS and DNSProxy are incredibly lightweight and non-resource intensive, we can easily run a fully secure local DNS server on something as small as a Raspberry Pi (I recommend a 2GB Pi 4 just for the ethernet connection), or as something more robust like a local VM, LXD, or even a Docker Container!

## Configuration

Configuring CoreDNS and DNSProxy is rather straight forward, however for DoH and DoT, you'll need a valid TLS certificate. You can [use my guide](/ecdsa-certificate-authorities-and-certificates-with-openssl/) to generate a CA and sign a cert, or if you plan on using an existing domains with my [_partial_ plugin](/partially-authoritative-dns-zone-with-coredns/), can sign your certificate with [certbot](https://certbot.eff.org/).

### CoreDNS

After you obtain a valid certificate, we can go ahead and download CoreDNS from the Releases page on Github for your platform https://github.com/coredns/coredns/releases. Copy this binary over to /usr/bin, and mark it as executable.

```bash
$ wget https://github.com/coredns/coredns/releases/download/v1.8.4/coredns_1.8.4_linux_amd64.tgz
$ tar -xf coredns_1.8.4_linux_amd64.tgz
$ chmod +x coredns
$ mv coredns /usr/bin
```

For security reasons, we'll run CoreDNS under it's own user. On Ubuntu we can easily make this new user as follows:

```bash
$ useradd -Umrs /bin/false coredns
```

Create a directory to store your CoreDNS configuration, and assign it ownership to CoreDNS

```bash
$ mkdir -p /etc/coredns
$ chown root:coredns
```

Next, create `/etc/coredns/Corefile`, and place the following. Note that in this example we're using a LetsEncrypt certificate - make sure you adjust the path as necessary.

```
.:1054 {
	reload
    errors

    forward . tls://1.1.1.1 tls://1.0.0.1 {
            tls_servername cloudflare-dns.com
            health_check 5s
            expire 3600s
    }

	cache 30
}

tls://.:853 {
	reload
	errors
	
	tls /opt/letsencrypt/live/coredns.example.com/fullchain.pem /opt/letsencrypt/live/coredns.example.com/privkey.pem {
		client_auth verify_if_given
	}

    forward . 127.0.0.1:1054 {
            health_check 5s
            expire 3600s
            policy sequential
    }
}

.:53 {
	reload
	errors
    forward . 127.0.0.1:1054 {
            health_check 5s
            expire 3600s
            policy sequential
    }
}
```

Before moving forward, let's break down exactly what this does from bottom to top:

#### DNS Resolver

Here we have your standard DNS resolver that forwards everything it receives to an internal port 1054. As most requests are un-encrypted, this'll ensure that all requests to your DNS server are forwarded to an upstream server that'll ensure that those requests get encrypted before leaving your network.

```
.:53 {
	reload
	errors
    forward . 127.0.0.1:1054 {
            health_check 5s
            expire 3600s
            policy sequential
    }
}
```

#### DoT Resolver

Applications that support it can use the DNS over TLS (DoT) resolver, which does the exact same thing as the standard DNS resolver - forwarding all traffic to our upstream server on port 1054 that'll encrypt everything beyond it.

```
tls://.:853 {
	reload
	errors
	
	tls /opt/letsencrypt/live/coredns.example.com/fullchain.pem /opt/letsencrypt/live/coredns.example.com/privkey.pem {
		client_auth verify_if_given
	}

    forward . 127.0.0.1:1054 {
            health_check 5s
            expire 3600s
            policy sequential
    }
}
```

#### Internal Forwarding Server

And finally we have our internal forwarding server running on port 1054. This is only used internally, and ensures that all requests get forwarded to a trusted DNS server over TLS. In this example I'm using Cloudflare, but you can use any upstream provider you want.

Additionally, if you wanted to add any custom rules or enable any plugins, add them before the forward section.

```
.:1054 {
	reload
    errors

    forward . tls://1.1.1.1 tls://1.0.0.1 {
            tls_servername cloudflare-dns.com
            health_check 5s
            expire 3600s
    }

	cache 30
}
```

Next, we need to create a systemd file to start and manage CoreDNS. You can place this in `/etc/systemd/system/coredns.service`

```
[Unit]
Description=CoreDNS DNS server
Documentation=https://coredns.io
After=network.target

[Service]
PermissionsStartOnly=true
LimitNOFILE=1048576
LimitNPROC=512
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
AmbientCapabilities=CAP_NET_BIND_SERVICE
NoNewPrivileges=true
User=coredns
WorkingDirectory=/tmp
ExecStart=/usr/bin/coredns -conf=/etc/coredns/Corefile
ExecReload=/bin/kill -SIGUSR1 $MAINPID
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Finally, open the firewall on your machine for 53 and 853, and start the service.

```bash
$ ufw allow 53
$ ufw allow 853

$ systemctl daemon-reload
$ systemctl enable coredns
$ systemctl start coredns
```

Validate CoreDNS is running vial `journalctl`, `systemd status`, or by checking if the process is running (`ps aux | grep coredns`), and then you can validate it working using both `dig` and `kdig`.

### DNSProxy

While CoreDNS provides DNS and DoT resolvers, but doesn't provide a DNS over HTTPS or DoH resolver, which is used by Firefox and Chrome as part of their "secure DNS" options. Fortunately, this is rather straight-forward to setup and enable.

First, download and install DNSProxy from the Github page to `/usr/local/bin`

```bash
$ wget https://github.com/AdguardTeam/dnsproxy/releases/download/v0.38.1/dnsproxy-linux-amd64-v0.38.1.tar.gz
$ mv path/to/dnsproxy /usr/local/bin
$ chmod +x /usr/local/bin/dnsproxy
```

DNSProxy is rather simple to setup, which means we can cram all of our configuration in our systemd file at `/etc/systemd/system/dnsproxy.service`. At a high level, this creates a DoH resolver on port 443 and 8443 for QUIC, that forwards everything to CoreDNS, ensuring that everything is encrypted all the way up.

```
[Unit]
Description=DNSProxy - DoH and DoQ Proxy for CoreDNS
Documentation=https://github.com/AdguardTeam/dnsproxy
After=network.target

[Service]
PermissionsStartOnly=true
LimitNOFILE=1048576
LimitNPROC=512
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
AmbientCapabilities=CAP_NET_BIND_SERVICE
NoNewPrivileges=true
User=coredns
WorkingDirectory=/tmp
ExecStart=/usr/local/bin/dnsproxy -l 0.0.0.0 --tls-min-version=1.2 --quic-port=8853 --https-port=443 --tls-crt=/opt/letsencrypt/live/coredns.example.com/fullchain.pem --tls-key=/opt/letsencrypt/live/coredns.example.com/privkey.pem -u 127.0.0.1:53 -p 0
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Finally, open the ports and start the service and you have a fully encrypted local DNS

```bash
$ ufw allow 443
$ ufw allow 8443
$ systemctl enable dnsproxy
$ systemctl start dnsproxy
```

Don't forget to either update your `resolve.conf` file to point to your new DNS server, or to apply your configuration network wide, update your router configuration to advertise the IP of your DNS server running CoreDNS.

## Validation

We can validate our configuration using `dig`, `kdig`, and `curl` for DNS, DoT, and DoH, respectively.

Normal DNS validation is rather straightforward:

```bash
dig www.google.com @127.0.0.1
```

DoT validation requires [knot-dns](https://www.knot-dns.cz/), but once installed can be checked by running the following command.

```bash
kdig www.google.com @coredns.example.com +tls
```

DoH validation is equally as straightforward, but I personally prefer to use the tool [`dog`](https://github.com/ogham/dog) to validate this.

```
dog example.com --https @https://coredns.example.com/dns-query
```

Of course, you can use something like `dog` to validate TLS and UDP and TCP endpoints as well.

### Firefox + Chrome

Firefox and Chrome provide little guidance for how to configure them with a custom DoH provider.

For Google Chrome, go to security settings, and change the DoH to Custom, using the following adjusted URL: `https://coredns.example.com/dns-query`. For Firefox, the change is idential.

The easiest way to verify Firefox is working correctly is if you visit `about:networking#dns`, and see if TRR (Trusted Recursive Resolver) is returning true for any domains.

## Closing

Of course, this entire setup is fully compatible with something like PiHole, to enable additional ad-blocking if set either as an upstream or a downstream server. I personally find CoreDNS to be much more robust, lightweight, and flexible of a DNS server than BIND or DNMasq