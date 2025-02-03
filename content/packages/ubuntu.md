---
title: "Ubuntu"
type: "repository"
date: 2016-12-01T00:00:00-00:00
lastmod: 2024-02-02T00:00:00-00:00
slug: "ubuntu"
draft: false
image: https://assets.erianna.com/ubuntu.svg
description: "Software Packages for Ubuntu"
keywords: "Ubuntu"
---

The new apt repository (apt.erianna.com) currently supports Trusty (14.04), Xenial (16.04),, and Bionic (18.04) packages across two distributions: main and test. The test distribution contains software packages that are functional but should not be used in production.

## Package Signing

All software packages for Ubuntu are signed using an Ed25519 GnuPG key, which requires GnuPG 2.1.x. If your upstream provider does not provide support for GnuPG 2.1.x yet, it can be installed from the repository directly.

## Repository Pinning

As package names may conflict with existing package names provided by Ubuntu, it is advised to pin the repository by creating `/etc/apt/preferences.d/apt.erianna.com.pref` and adding the following content to the file to ensure that packages provided by Ubuntu do not overwrite packages provided by this repository.

```
Package: *
Pin: origin apt.erianna.com
Pin-Priority: 600
```
## Noble

The `Noble` repository can be added to your system by running the following commands:

```bash
# Install dependencies
apt update;
apt install gnupg2 curl wget apt-transport-https -y;

# Add the repository to sources.list.d
sh -c 'echo "deb https://apt.erianna.com/noble/ noble main" > /etc/apt/sources.list.d/apt.erianna.com.list';

# Import the repository GPG key
curl -qs https://www.erianna.com/key.asc | apt-key add -;

# Update the repository
apt update;
```

## Jammy

The `Jammy` repository can be added to your system by running the following commands:

```bash
# Install dependencies
apt update;
apt install gnupg2 curl wget apt-transport-https -y;

# Add the repository to sources.list.d
sh -c 'echo "deb https://apt.erianna.com/jammy/ jammy main" > /etc/apt/sources.list.d/apt.erianna.com.list';

# Import the repository GPG key
curl -qs https://www.erianna.com/key.asc | apt-key add -;

# Update the repository
apt update;
```

## Focal

The `Focal` repository can be added to your system by running the following commands:

```bash
# Install dependencies
apt update;
apt install gnupg2 curl wget apt-transport-https -y;

# Add the repository to sources.list.d
sh -c 'echo "deb https://apt.erianna.com/focal/ focal main" > /etc/apt/sources.list.d/apt.erianna.com.list';

# Import the repository GPG key
curl -qs https://www.erianna.com/key.asc | apt-key add -;

# Update the repository
apt update;
```

## Bionic

The `Bionic` repository can be added to your system by running the following commands:

```bash
# Install dependencies
apt update;
apt install gnupg2 curl wget apt-transport-https -y;

# Add the repository to sources.list.d
sh -c 'echo "deb https://apt.erianna.com/bionic/ bionic main" > /etc/apt/sources.list.d/apt.erianna.com.list';

# Import the repository GPG key
curl -qs https://www.erianna.com/key.asc | apt-key add -;

# Update the repository
apt update;
```

## Xenial

The `Xenial` repository can be added to your system by running the following commands:

```bash
# Install apt-transport-https
apt-get update;
apt-get install apt-transport-https -y;

# Add the repository to sources.list.d
sh -c 'echo "deb https://apt.erianna.com/xenial/ xenial main" > /etc/apt/sources.list.d/apt.erianna.com.list';

# Install GnuPG2 and GnuTLS3 from the archive to allow the Ed25519 key to be authenticated
# This is only necessary if you do not have GnuPG2 installed
apt-get --allow-unauthenticated update;
apt-get --allow-unauthenticated install gnupg2 gnutls3 -y;
ldconfig;

# Import the repository GPG key
curl -qs https://www.erianna.com/key.asc | apt-key add -;

# Update the repository
apt-get update;
```
