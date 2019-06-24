---
title: "Alpine Linux"
type: "repository"
date: 2016-12-01T00:00:00-00:00
Lastmod: 2019-06-249T10:30:00+00:00
slug: "alpine-linux"
draft: false
image: https://assets.erianna.com/alpine.svg
description: "Software packages for Alpinx Linux"
keywords: "Alpine Linux,Alpine"
---

## Alpine Linux

The Alpine Linux repository is primarily used to provide packages for Docker, however the repository can be used independently. Before the repository can be added, you first need to download and install the signing key. Unlike Debian or RedHat systems, packages for Alpine Linux are signed using rather specific RSA 4096 key.

```bash
apk add curl wget --no-cache
curl -qs https://gist.githubusercontent.com/charlesportwoodii/2253f1e82b60c7334b78a012c2d2beea/raw/477a43a4ad16b2f3b83790e45131390f943f0691/charlesportwoodii@erianna.com-59ea3c02.rsa.pub -o /etc/apk/keys/charlesportwoodii@erianna.com-59ea3c02.rsa.pub
```

This RSA key is signed using my primary Ed25519 key. It's authenticity can be verified in the following Github Gist: https://gist.github.com/charlesportwoodii/2253f1e82b60c7334b78a012c2d2beea.

### Support

This repository only supports active supported versions of Alpine Linux and versions under security fixes. Any version of Alpine Linux that has reached End-of-Life is not supported. Older versions will be maintained for archival purposes but will not recieve future updates.

https://wiki.alpinelinux.org/wiki/Alpine_Linux:Releases


#### Main

After the RSA key has been added, the `main` repository can be installed by running the following commands:

```bash
sh -c 'echo "https://apk.erianna.com/v<version>/main" | tee -a /etc/apk/repositories'
apk update
```

> Be sure to update `<version`> with the version of Alpine Linux you wish to recieve packages for (eg `3.10`)

#### Test

After the RSA key has been added, the `test` repository can be installed by running the following commands:

```bash
sh -c 'echo "https://apk.erianna.com/v<version>/test" | tee -a /etc/apk/repositories'
apk update
```

> Be sure to update `<version`> with the version of Alpine Linux you wish to recieve packages for (eg `3.10`)
> Note that the `test` repository contains packages that are not suitable for production usage.
