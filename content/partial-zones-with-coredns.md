---
title: "Partially Authoritative DNS Zones with CoreDNS"
description: "Partial is a drop-in replcement for the CoreDNS file plugin to provide semi-authoritative DNS zones."
keywords: "CoreDNS, Plugin, Partial Zone, Semi-Authoritative"
date: 2021-07-07T00:00:00-05:00
slug: "partially-authoritative-dns-zone-with-coredns"
draft: false
type: "blog"
---
A semi-authoritative zone enables you to provide authoritative records for a given zone for records the DNS server is aware of, and forwarding all unknown requests to an upstream server.

Available as  a CoreDNS plugin, [_Partial_](https://github.com/charlesportwoodii/coredns-partial) is a drop-in replacement for the CoreDNS _file_ plugin that allows for partially or semi-authoritative DNS zones, and is available on Github at https://github.com/charlesportwoodii/coredns-partial.

<!--more-->

## Why Semi-Authoritative Zones?

Routing traffic to the right server, depending upon where the user is located at or where traffic is originating from is a huge problem both in corporate environments and at home. If you're on-site, or on a VPN, it usually makes sense to route traffic either directly to a server or a load balancer on your network, rather than sending traffic through your external firewall. While certain solutions such as split-horizon, or multi-view DNS exist, they typically are difficult to setup, configure, and manage.

Individuals and many organizations also utilize cloud services to host their zone, many of which limit the ability to provide split-horizon or multi-view, or even mirror zones from their services.

The typical way around this is to configure a local DNS server with a combination of host files, bind, and dnsmasq - overwriting specific entires using simple text files that don't conform to any traditional zone management.

A better way to handle these scenarios is to have a semi-authoritative zone - or a zone that's authoritative for things it knows about, and forwards everything else to an upstream provider. With the caveat of breaking DNSSEC, this enables you to spin up network DNS servers that don't require replication of an entire zone from a cloud provider, or deal with the administrative overhead of needing to know everything about a given zone. Instead, you can just popualte records for what you want, and trust that if a record isn't populate, it'll be forwarded to your upstream DNS provider.

To simplify this problem so that it can be managed by a single application, I've modified the _file_ plugin from CoreDNS to support the _fallthrough_ parameter, enabling semi-authoritative zones.

#### Caveats

This plugin comes with a few reasonable caveats, that for most local setups shouldn't matter, but that you should be aware of as we're violating DNS specification.

- DNSSEC validation won't reliably work. While you can sign your local zone, you'll get different responses based upon whether the response comes locally or from upstream.
- CoreDNS zone transfers will only transfer the zone itself, not the upstream responses. For redundancy you'll need to replicate the entire zone and configuration to a secondary.

## Plugin Configuration & Installation

Installation of the plugin is incredibly straight-forward - simply replace the _file_ plugin in CoreDNS with the _partial_ plugin, and rebuild CoreDNS:

```
$ git clone https://github.com/coredns/coredns
$ cd coredns/plugins
$ rm -rf file
$ git clone https://github.com/charlesportwoodii/coredns-partial file
$ go build
```

In CoreDNS, your `corefile` can then be configured as follows. Note that in this example CoreDNS creates a listener on port 53, and forwards all other requests to Cloudflare's 1.1.1.1 resolver.

```
.:53 {
    reload
    errors

    file /etc/coredns/db/example.com.db example.com {
		fallthrough
    }

    forward . tls://1.1.1.1 tls://1.0.0.1 {
            tls_servername cloudflare-dns.com
            health_check 5s
            expire 3600s
    }

cache 30
}
```

Of course, this plugin is fully backwards compatible, so you don't want the `fallthrough` behavior, simple remove the option.

And with this simple plugin change you have a semi-authoriative DNS zone you can use both in the office, at and home. At home I use this overwrite specific DNS entries for domains I own to redirect traffic to both local hosts, and to services only available on Wireguard.

If you found this plugin useful, or are interested in contributing, feel free to reach out both here and on Github!