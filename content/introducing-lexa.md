---
title: "Introducing Lexa"
description: "DNS & HTTP Service Discovery for LXD Containers"
keywords: "Lexa,DNS Discovery, HTTP Discovery, Service Discovery, LXD Container Discovery, LXD"
date: 2022-03-25T17:00:00-05:00
slug: "introducing-lexa-dns-discovery-for-lxd"
draft: false
type: "blog"
---

Lexa is a instance and service discovery tool for LXD containers that exposes DNS, DoT and a JSON REST endpoint to make discovery of containers and services within containers on LXD instances easier.

Lexa can be used as a stand-alone service to identify what LXD containers are running on a given host, or can be used in conjunction with tools such as HaProxy, Traefik, or even your own DNS server to automate load balancing between hosts, blue/green or red/black deployments, CNAME to hosts, and other scenariors. Lexa also provides a local agent (wip) that notifies the main server of any defines services running in the container. Think of it like a local, slimmed down Consul agent.

<!-- more -->

TL;DR: Lexa facilitates container instance and service discovery for LXD containers over DNS, DoT, DoH, and HTTPS. Checkout the documentation on Github (https://github.com/kaidyth/lexa) for more information!

------------------------

LXD is a pretty awesome container system - however connecting to and discovering containers themselves and services that they provide is difficult especially when trying to use tools such as Traefik or HAProxy, and while tools like Consul can help with service discovery you're still left with needing to do discovery on the actual containers themselves, especially if you're using an internally bridged interface like lxdbr0.

To solve both the problem of "discovering" the correct IPs for LXD containers I have built Lexa, a single Golang binary that you can run both on your LXD hosts, and within your LXD containers via systemd.

A few examples to showcase what you can do with Lexa:

## JSON REST API for all containers on a given host

Discovery all of your containers running on a given host. Change the _.lexa_ suffix to _.lexa.host_ to easily identify LXD instances running on a specific host, find all IP address (including Docker IPs for Docker in LXD) running on a given container, and list all the services, ports, protocols, and tags exposed by a specific container

```json
curl -qqsk https://127.0.0.1:18443/containers/ | jq .
{
  "hosts": [
    {
      "name": "nginx-php-74.lexa",
      "interfaces": {
        "ipv4": [
          {
            "eth0": "10.123.201.141"
          }
        ],
        "ipv6": [
          {
            "eth0": "fd42:aa04:d9d5:3541:216:3eff:fe06:6996"
          }
        ]
      },
      "services": [
        {
          "name": "http",
          "port": 80,
          "proto": "tcp",
          "tags": [
            "foo",
            "bar"
          ]
        },
        {
          "name": "https",
          "port": 443,
          "proto": "tcp",
          "tags": [
            "foo2",
            "bar2"
          ]
        }
      ]
    },
    {
      "name": "nginx-php-80.lexa",
      "interfaces": {
        "ipv4": [
          {
            "eth0": "10.123.201.178"
          }
        ],
        "ipv6": [
          {
            "eth0": "fd42:aa04:d9d5:3541:216:3eff:fe39:b94d"
          }
        ]
      },
      "services": null
    }
  ]
}
```

### DNS, DoT, and DoH Discovery

Pair with tools such as Traefik or HAPRoxy to do load balancing, black/red // green/blue deployments of your containers for 0 downtime, rolling LXD deployments on a single host.

```
dig hostname.lexa @127.0.0.1 -p 18053
```

Or load balance against a specific interface name

```
dig eth0.interface.hostname.lexa @127.0.0.1 -p 18053
```

Alternatively, do service based DNS discovery with HAProxy using  HAProxy's DNS `server-template` feature:

```
server-template web 5 app.https.service.lexa check resolvers lexa init-addr none  ssl verify none
server-template web 5 _https._tcp.service.lexa check resolvers lexa init-addr none  ssl verify none
```

### Integrate with your DNS Server

Or integrate Lexa with your DNS resolver to advertise DNS names across your entire network!

> Example for CoreDNS

```
lexa {
    bind 127.0.0.53
    reload
    errors
    forward . 127.0.0.1:18053 {
            health_check 5s
    }

    # Or use the DoT resolver
    # forward . tls://127.0.0.1 {
    #     tls_servername <servername>
    #     health_check 5s
    # }
}
```

I'd love to hear what more you can do with LXD containers combined with Lexa! Lexa is currently alpha (but stable) software and works both in home deployments, and in production environments. I'd love to see what you can build with Lexa, and if you have comments, feedback (or bugs) please connect with me within the Github Issues for Lexa!