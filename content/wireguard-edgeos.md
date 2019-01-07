---
title: "Wireguard on EdgeOS for a faster home VPN"
description: "Installing Wireguard on Ubiquiti routers for faster home VPN"
date: 2018-08-11T13:00:00-05:00
slug: "wireguard-ubiquity-edgeos"
draft: false
type: "blog"
---
[Wireguard](https://www.wireguard.com/) is an extremely simple, fast, and modern VPN. With it's introduction into the [mainline linux kernel](https://marc.info/?l=linux-netdev&m=153306429108040&w=2), Wireguard promises to provide a simpler, faster, and more secure way for setting up a VPN without needing to deal with traditional solutions like OpenVPN and L2TP/IPSEC, which can be cumbersome and slow.

In this article I'll cover how to install Wireguard on a Ubiquiti router, and how to connect a remote client to it.

<!--more-->

## Setting up the Router

The first step in getting Wireguard installed on EdgeOS is to SSH into your router. If SSH is not already set up on your router, it can be enabled by following [this guide](https://help.ubnt.com/hc/en-us/articles/204976424-EdgeSwitch-Management-Access-using-HTTPS-and-SSH).

Once you can SSH into your router, download the appropriate DEB package from https://github.com/Lochnair/vyatta-wireguard, and install it via `dpkg`.

```
cd /tmp

# Download the appropriate version
curl -qLs https://github.com/Lochnair/vyatta-wireguard/releases/download/0.0.20180802-1/wireguard-e50-0.0.20180802-1.deb -o wireguard.deb
sudo dpkg -i wireguard.deb
```

Once Wireguard is installed on your router it can be configured via the standard Vyatta interface.

> Note that since Wireguard is not software bundled with the EdgeOS firmware, firmware upgrades necessitate re-installing the Wireguard debian package. Once the wireguard package is re-installed re-applying the existing Vyatta config file, or rebooting will restore your interfaces.

Your first step is to generate a private key for your router, and to generate a public key which you can distribute to clients.

```
$ wg genkey | tee /dev/tty | wg pubkey
```

This will output two lines, the first being your private key, and the second being your public key.

```
0GbmWkPkYB9y2s5aIaAxUrAPoSnsDFnuhHjRnujEsm8=
KsVzrtWPGWDbuCLPUyTsTL6pQOfiS+96VOXsMnPo+SI=
```

Next, using the standard Vyatta `configure` tool, we're going to set up Wireguard:

```
configure

# Adjust the address route as necessary
set interfaces wireguard wg0 address 192.168.33.1/24
set interfaces wireguard wg0 listen-port 51820
set interfaces wireguard wg0 route-allowed-ips true

set interfaces wireguard wg0 private-key <private_key>

commit
```

These commands will create a wireguard network on `192.168.33.1/24`, and will route all traffic on `192.168.33.1/24` through the new wireguard interface.

## Setting up the Client

With our router now set up, we next need to repeat the key generation process on our client and exchange public keys to establish a connection.

First, we need to install Wireguard on our client. On Ubuntu, this can be done by runnung:

```
$ sudo add-apt-repository ppa:wireguard/wireguard
$ sudo apt-get update
$ sudo apt-get install wireguard
```

Instructions for additional platforms are available on the [wireguard wiki](https://www.wireguard.com/install/).

On your client device (Mac or Linux), repeat the key generation command:

```
$ wg genkey | tee /dev/tty | wg pubkey
eFzrSu/yJMgDjZDNXL9dJsDcT9n00hySFYUOCFulO1Y=
aWLc3A6WnKtVpTYPki3TRrKGDg8JUS0HephzxpnP8js=
```

Now, we need to create the wireguard interface on our client by creating `/etc/wireguard/wg0.conf`

```
# touch /etc/wireguard/wg0.conf
# chown root:root /etc/wireguard/wg0.conf
# chmod 600 /etc/wireguard/wg0.conf
```

Then we need to populate this file with the interface information, and the information for our router.

```
[Interface]
Address = 192.168.33.2/32
PrivateKey = eFzrSu/yJMgDjZDNXL9dJsDcT9n00hySFYUOCFulO1Y=

[Peer]
PublicKey = KsVzrtWPGWDbuCLPUyTsTL6pQOfiS+96VOXsMnPo+SI=
AllowedIPs = 192.168.33.0/24
Endpoint = public_ip_of_router:51820
```

As this file is the most confusing part of Wireguard, let's take a moment to break down exactly what each block is doing.

### Client Interface

The `[Interface]` block defines the private key of the client, and the IP address that the interface should use for connecting to any peer. The IP address should be in CIDR/32 format, since we'll only ever have a single IP address.

```
[Interface]
Address = 192.168.33.2/32
PrivateKey = eFzrSu/yJMgDjZDNXL9dJsDcT9n00hySFYUOCFulO1Y=
```

### Peer

The `[Peer]` block defines who we're connecting to, and what routes we want to Wireguard to send over the previously created interface.

```
[Peer]
PublicKey = KsVzrtWPGWDbuCLPUyTsTL6pQOfiS+96VOXsMnPo+SI=
AllowedIPs = 192.168.33.0/24
Endpoint = public_ip_of_router:51820
```

The `PublicKey` line is the public key of our router, and the `Endpoint` defines where our router is located at on the public internet.

The `AllowedIPs` line tells the `wg0` interface what routes we want to send through the interface. In this example, Wireguard will route any traffic to `192.168.33.0/24` over the Wireguard interface and to our router.

While this gets us connectivity to our router, it doesn't let us access other devices on our LAN behind our router. To do that, we simply need to update the `AllowedIPs` section with our LAN IP range. For instance, of devices on your network have an IP within `192.168.0.0/24`, we can simply update our `AllowedIPs` line to look as follows:

```
AllowedIPs 192.168.33.0/24, 192.168.0.0/24
```

Now traffic over our VPN, and to our LAN will be routed over the Wireguard interface and to our router, which will seamlessly handle forwarding to clients on our LAN.

### Peering our router

Now that we have our public key of our client, we need to update our router's configuration.

```
set interfaces wireguard wg0 peer aWLc3A6WnKtVpTYPki3TRrKGDg8JUS0HephzxpnP8js= allowed-ips 192.168.33.2/32

commit
save
```

This command tells our router to accept traffic from our client with the public key of `aWLc3A6WnKtVpTYPki3TRrKGDg8JUS0HephzxpnP8js=` (which we generated earlier), and to only forward and accept traffic from the IP address of our client, `192.168.33.2/32`.

> When configuring your router with multiple peers, it's important that you don't create overlapping entries for the `allowed-ips` line, as the router won't be able to route traffic appropriately.

### Bringing the Client Interface Up

Back on the client, we can now bring our `wg0` interface up by running:

```
sudo wg-quick up wg0
```

We can verify connectivty by running `sudo wg`, which will give us information about peers we are connected to.

```
interface: wg0
  public key: QLpJ0XIWAgPtC+8P2ctmmRITv1SufXOzRqKIdlzcd1I=
  private key: (hidden)
  listening port: 55972

peer: aWLc3A6WnKtVpTYPki3TRrKGDg8JUS0HephzxpnP8js=
  endpoint: ip_of_router:51820
  allowed ips: 192.168.33.0/24, 192.168.0.0/24
  latest handshake: 49 minutes, 26 seconds ago
  transfer: 472 B received, 6.01 KiB sent
```

We can repeat the `sudo wg` command on our router to verify connectivity as well.

After confirming that Wireguard thinks it's connected, we can use any of our standard networking tools to connect to hosts behind our LAN, such as ping, SSH, etc...

#### Automatically bringing the interface up on Linux

On Linux, Wireguard comes a `systemd` command which can be used to automatically bring the interface up on boot. It can be enabled by running:

```
$ sudo systemctl enable wg-quick@wg0.service
$ sudo systemctl start wg-quick@wg0.service
```

# Closing Thoughts

Wireguard is a very fast VPN, and once it has mainline support in the Linux kernel, it'll be even faster. As this article has shown, setting up Wireguard is _extremely_ easy, especially compared to other VPN solutions such as OpenVPN or L2TP/IPSEC.

I hope you find this article useful - be sure to reach out with any questions if you have them. I look forward to hearing from you.