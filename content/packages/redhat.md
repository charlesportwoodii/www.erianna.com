---
title: "RedHat"
type: "repository"
date: 2016-12-01T00:00:00-00:00
slug: "redhat"
draft: false
image: https://assets.erianna.com/redhat.svg
description: "Software packages for RedHat Enterprise Linux",
keywords: "Redhat"
---

## Red Hat Enterprise Linux 7

The RHEL 7 repository can be added to your system by running the following commands.

> Note that while the repository is signed using my Ed25519 key, RedHat currently does not support Ed25519 keys, meaning that GPG checking is disabled.

```bash
# Add the package
sh -c 'echo -e "[erianna]\nname=Erianna RPM Repository\nbaseurl=https://rpm.erianna.com/RHEL/7/x86_64\nenabled=1\ngpgcheck=0\nprotect=1\ngpgkey=https://www.erianna.com/key.asc" > /etc/yum.repos.d/rpm.erianna.com.repo';

# Enable the repo
yum --enablerepo=erianna clean metadata;
yum clean all;
ldconfig;
```