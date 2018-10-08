---
title: "Alpine Linux"
type: "repository"
date: 2016-12-01T00:00:00-00:00
Lastmod: 2018-05-09T16:43:34+00:00
slug: "alpine-linux"
draft: false
image: https://assets.erianna.com/alpine.svg
description: "Software packages for Alpinx Linux"
---

## ALpine Linux

The Alpine Linux repository is primarily used to provide packages for Docker, however the repository can be used independently. Before the repository can be added, you first need to download and install the signing key. Unlike Debian or RedHat systems, packages for Alpine Linux are signed using rather specific RSA 4096 key.

```bash
apk add curl wget --no-cache
curl -qs https://gist.githubusercontent.com/charlesportwoodii/2253f1e82b60c7334b78a012c2d2beea/raw/477a43a4ad16b2f3b83790e45131390f943f0691/charlesportwoodii@erianna.com-59ea3c02.rsa.pub -o /etc/apk/keys/charlesportwoodii@erianna.com-59ea3c02.rsa.pub
```

This RSA key is signed using my primary Ed25519 key. It's authenticity can be verified in the following Github Gist: https://gist.github.com/charlesportwoodii/2253f1e82b60c7334b78a012c2d2beea.

### Alpine 3.7

The Alpine 3.7 repository is broken into a `main` and `test` repository.

### Main

After the RSA key has been added, the `main` repository can be installed by running the following commands:

```bash
sh -c 'echo "https://apk.erianna.com/v3.7/main" | tee -a /etc/apk/repositories'
apk update
```

### Test

After the RSA key has been added, the `test` repository can be installed by running the following commands:

```bash
sh -c 'echo "https://apk.erianna.com/v3.7/test" | tee -a /etc/apk/repositories'
apk update
```

> Note that the `test` repository contains packages that are not suitable for production usage.

### Alpine 3.6

The Alpine 3.6 repository is broken into a `main` and `test` repository.

### Main

After the RSA key has been added, the `main` repository can be installed by running the following commands:

```bash
sh -c 'echo "https://apk.erianna.com/v3.6/main" | tee -a /etc/apk/repositories'
apk update
```

### Test

After the RSA key has been added, the `test` repository can be installed by running the following commands:

```bash
sh -c 'echo "https://apk.erianna.com/v3.6/test" | tee -a /etc/apk/repositories'
apk update
```

> Note that the `test` repository contains packages that are not suitable for production usage.
