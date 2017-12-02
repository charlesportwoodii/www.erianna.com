---
title: "CentOS"
type: "repository"
date: 2016-12-01T00:00:00-00:00
slug: "centos"
draft: false
image: https://s3-us-west-2.amazonaws.com/cdn.ciims.io/erianna.ciims.io/centos.svg
description: "Software packages for CentOS"
---

## CentOS 7

The CentOS 7 repository can be added to your system by running the following commands.

> Note that while the repository is signed using my Ed25519 key, CentOS7 currently does not support Ed25519 keys, meaning that GPG checking is disabled.

```bash
# Add the package
sh -c 'echo -e "[erianna]\nname=Erianna RPM Repository\nbaseurl=https://rpm.erianna.com/CentOS/7/x86_64\nenabled=1\ngpgcheck=0\nprotect=1\ngpgkey=https://www.erianna.com/key.asc" > /etc/yum.repos.d/rpm.erianna.com.repo';

# Enable the repo
yum --enablerepo=erianna clean metadata;
yum clean all;
ldconfig;
```