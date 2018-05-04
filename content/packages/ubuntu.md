---
title: "Ubuntu"
type: "repository"
date: 2016-12-01T00:00:00-00:00
slug: "ubuntu"
draft: false
image: https://s3-us-west-2.amazonaws.com/cdn.ciims.io/erianna.ciims.io/ubuntu.svg
description: "Software Packages for Ubuntu"
---

The new apt repository (apt.erianna.com) currently supports Trusty (14.04), Xenial (16.04),, and Bionic (18.04) packages across two distributions: main and test. The test distribution contains software packages that are functional but should not be used in production.

## Package Signing

All software packages for Ubuntu are signed using an Ed25519 GnuPG key, which requires GnuPG 2.1.x. If your upstream provider does not provide support for GnuPG 2.1.x yet, it can be installed from the repository directly.

## Bionic 

The `Bionic` repository can be added to your system by running the following commands:

```bash
# Install dependencies
apt updat;
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

## Trusty 

The `Trusty` repository can be added to your system by running the following commands:

```bash
# Install apt-transport-https
apt-get update;
apt-get install apt-transport-https -y;

# Add the repository to sources.list.d
sh -c 'echo "deb https://apt.erianna.com/trusty/ trusty main" > /etc/apt/sources.list.d/apt.erianna.com.list';

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