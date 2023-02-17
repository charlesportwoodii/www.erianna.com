---
title: "Introducing Lexa 2.0"
description: "DNS & HTTP Service Discovery for LXD Containers"
keywords: "Lexa,DNS Discovery, HTTP Discovery, Service Discovery, LXD Container Discovery, LXD, Rust"
date: 2023-02-18T17:00:00-05:00
slug: "introducing-lexa-2.0-dns-discovery-for-lxd"
draft: false
type: "blog"
---

Lexa is a instance and service discovery tool for LXD containers that exposes DNS, DoT and a JSON REST endpoint to make discovery of containers and services within containers on LXD instances easier, except now it's written entirely in Rust.

Lexa can be used as a stand-alone service to identify what LXD containers are running on a given host, or can be used in conjunction with tools such as HaProxy, Traefik, or even your own DNS server to automate load balancing between hosts, blue/green or red/black deployments, CNAME to hosts, and other scenariors. Lexa also provides a local agent (wip) that notifies the main server of any defines services running in the container. Think of it like a local, slimmed down Consul agent.

TL;DR: Lexa facilitates container instance and service discovery for LXD containers over DNS, DoT, DoH, and HTTPS. Checkout the documentation on Github (https://github.com/kaidyth/lexa/tree/rust) for more information!

The rust port of Lexa has the same features and compatibility as the golang variant, now just with memory safety built in! Go check it out!
