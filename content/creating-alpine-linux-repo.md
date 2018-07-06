---
title: "Creating an Alpine Linux Repository"
description: "Creating & Hosting an Alpine Linux Package Repository for Docker packages"
date: 2017-11-04T13:00:00-05:00
slug: "creating-a-alpine-linux-repository"
draft: false
type: "blog"
---
One of the common problems developers run into when creating their own Docker images is the sheer size of the final output image. Even after compressing and squashing, images based off of Ubuntu or CentOS can still be hundreds of megabytes in size.

As part of my personal dockerization efforts I've spent the past several weeks working on repackaging my PHP and Nginx packages so that they work on Alpine Linux with the aspiration of significantly reducing the size of the Docker images I provide.

To reduce the complexity of my Docker images, I pre-build packages for a given operating system, then install them using the operating system's built in package manager. After creating packages for Alpine Linux (which was troublesome in it's own right), I discovered there was little to no _accurate_ documentation on how to create a web repository for Alpine Linux.

In this article I'll cover the steps I needed to take to create a maintainable ALpine Linux web repository.

<!--more-->

# It starts with proper packaging

Alpine Linux packages are different than your traditional _deb_ or _rpm_ packages. While _deb_ and _rpm_ file formats have their own complexities and issues, the APK file format has some unique quirks that have to be addressed at package time to ensure it will work with your repository.

There are two things of importance I noted when creating my packages:

1. To work with a web repository, packages need to be named with the following format:

```
<package_name>-<version>.apk
```

As an example, the following package: `nginx-1.12.2-1~x86_64.apk` is setup as follows:

```
<package_name> = nginx
<version> = 1.12.2-1~x86_64
```

While Alpine Linux doesn't particularly care about what the version string is, I've found it useful to setup my version string as follows.

```
<upstream_version>-<internal_release_version>~<architecture>
```

This structure makes it very easy to identify at a glance several important details about the package, while also providing an easy way to address the problem that Alpine Linux doesn't have the concept of past or previous versions (which is an issue I'll cover once we get into creating the package repository).

2. The second issue I encountered when building my packages was that I needed to explicitly declare the architecture when I built the package.

When working with _deb_ or _rpm_ packages, I've always enjoyed the convenience of throwing packages into a dedicated folder (such as `xenial/x86_64` or `rhel/7/x86_64`) and relying `yum` or `apt` to seamlessly take care of downloading and fetching the appropriate packages. With Alpine Linux you do not have this luxury. 

> For the curious, the `APKFILE.tar.gz` we'll build later uses information embedded in the package to indicate to the `apk` console command where the package should be fetched from, rather than relying on the directory packages are fetched from.

# Setting up the repository

With our packages properly configured, we can now create our repository. First, we need to decide where we want our packages should live.

```bash
mkdir -p /apk
```

We also need to create sub-directories for the Alpine Linux version, repository name, and the architecture of our packages.

```bash
mkdir -p /apk/v3.6/main/x86_64
```

In this example we're creating a repository to host `x86_64` packages named `main` for Alpine Linux `3.6`.

> For the next steps, the following commands will need to be run within an Alpine Linux host. Later in the article I will cover how to automate this process with Docker.

After uploading our packages to our directory, we next need to create our `APKINDEX.tar.gz` file using the `apk index` command.

```bash
cd /apk/v3.6/main/x86_64
apk index -vU -o APKINDEX.tar.gz *.apk
```

# Signing our repository

At this point we have created an repository that works with the `--allow-untrusted` flag of `apk`. Our next step is to make the repository fully trusted so that our packages can be verified by anyone who wishes to use them.

## Creating a keypair

To sign our repository, we need to download the `abuild` tools, and create a signing key.

```bash
apk add gcc abuild --no-cache
abuild-keygen -a -i
```

`abuild-keygen` will prompt you for a filename to save the keypair. The standard practice for naming the key is to use the email address of the maintainer or mailing list (as an example `alpine@example.com`), as the prefix, following by an alphanumeric suffix which `abuild-keygen` automatically generates.

This will create a public and private key.

```bash
alpine@example.com-59ea3c02.rsa.pub
alpine@example.com-59ea3c02.rsa
```

> Do note lose these keys. You will need the private key to re-sign the repository anytime you make updates, and the public key if you wish to distribute your repository.

> To make simplify distribution of your repository, I recommend copying your public key to your webroot.

## Signing the APKINDEX

Once you have created the signing key, the final step is to sign the `APKINDEX.tar.gz` file using our signing key.

```bash
abuild-sign -k /path/to/alpine@example.com-59ea3c02.rsa /apk/v3.6/main/x86_64/APKINDEX.tar.gz
```

> Note that you must provide the full path to the private key in order to sign the repository.

# Hosting your repository with Nginx

To make our Alpine Linux repository publicly available, we can use a very simple Nginx configuration.

```nginx
server {
    listen 443 ssl;
    listen [::]:443 ssl;
    ssl on;
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/key.key;

    server_name apk.example.com;
    root /apk;

    location / {
        autoindex on;
    }
}
```

> __Let's talk about TLS.__ 
>
> While there's no __requirement__ that your Alpine Linux repository needs to be hosted over TLS, there's also isn't a good reason __not__ to use TLS if it's in your power. While your public key will protect __your__ packages from spoofing, hosting your repository over plain HTTP does not protect you from DNS spoofing or MITM attacks against your infrastructure. To protect both your infrastructure and any users of your repository I strongly encourage you to use TLS on your web server configuration.
>
> If you need a TLS certificate, [Let's Encrypt](https://letsencrypt.org/) offers them __completely for free__, and hosts a large ecosystem of tools and utilities to generate certificates and to automatically renew them.

# Adding your repository to your image

Now that you have a working web server configured to host your packages, we can now add our repository to our Alpine Linux images. With your image this is a painless process.

```bash
# Install wget if it isn't installed
apk add wget --no-cache

# Add our repository to `/etc/apk/repositories
echo "https://apk.example.com/v3.6/main" | tee -a /etc/apk/repositories

# Download and store our signing key to /etc/apk/keys
wget -P /etc/apk/keys/ https://apk.example.com/alpine@example.com-59ea3c02.rsa.pub
```

# Dealing with versions

As mentioned earlier, one of the major issues I've discovered with `apk index` is that it doesn't handle versions very well. Meaning that if I have the following packages:

```
# Initial version
nginx-1.12.1-1~x86_64.apk

# Updated version of 1.12.1
nginx-1.12.1-2~x86_64.apk

# Completely new version
nginx-1.12.2-1~x86_64.apk
```

I don't have a guarantee that `nginx-1.12.2-1~x86_64.apk` will be the package that is served by `APKINDEX.tar.gz`. Moreover, Alpine Linux doesn't really have a policy on hosting old versions of packages. While this is fine from a hosting perspective, it complicates throwing all of your packages into a single directory and letting `apk index` solve the problem of picking the right version.

To get around this problem, I created a very simple PHP script that parses the previously defined package name structure, determines the latest and greatest version of your packages, then outputs them as a single line which you can then throw at `apk index`

```php
#!/usr/bin/env php
<?php

$path = '/mnt/apk.example.com';
$directory = $argv[1] ?? 'main';
$aVersion = $argv[2] ?? '3.6';
$arch = $arvg[3] ?? 'x86_64';

$files = \glob("$path/v$aVersion/$directory/$arch/*.apk");
$finalList = [];
foreach ($files as $file) {
        $file = str_replace("$path/v$aVersion/$directory/$arch/", '', $file);
        $v = str_replace('-', '', strrchr($file, '-'));
        $revision = explode('~', $v)[0];
        $architecture = explode('~', $v)[1];
        $name = substr(str_replace($v, '', $file), 0, -1);
        $parts = explode('-', $name);
        $last = array_pop($parts);
        $parts = [implode('_', $parts), $last];

        $packageName = $parts[0];
        $packageVersion = $parts[1];
        $compareVersion = str_replace('.', '', $packageVersion) . $revision;
        if (!isset($finalList[$packageName])) {
                $finalList[$packageName] = [
                        'file' => $file,
                        'version' => $compareVersion,
                        'dVersion' => $packageVersion . '-' . $revision
                ];
        } else {
                if ($compareVersion > $finalList[$packageName]['version']) {
                        $finalList[$packageName] = [
                                'file' => $file,
                                'version' => $compareVersion,
                                'dVersion' => $packageVersion . '-' . $revision
                        ];
                }
        }
}

$packageNames = array_values(array_map(function($el) {
        return $el['file'];
}, $finalList));

echo implode($packageNames, ' ');
```

## Usage

Using the script is fairly straight forward. By default it will query all packages in `/apk/v3.6/main/x86_64`.

```
./build-apk
```

The first argument will override the repository name from `main`. The second argument will change the Alpine version (if you're hosting a repository for 3.5 _and_ 3.6), and the third argument will change the architecture from `x86_64`.

If you're running an Alpine Linux box that has PHP installed, the script can be run as follows:

```bash
PACKAGES=$(./build-apk main) apk index -vU -o APKINDEX.tar.gz $PACKAGES
```

This will instruct `apk index` with exactly what packages you want to be included in the index, rather than leaving it up to change.

> PHP was chosen for the script as it was the tool I had available on the server, and I wasn't interested in downloading and installing a separate programming language to the server to address the problem. The script can easily be converted to Python, Ruby, or your favorite programming language.

# Hosting on another platform

If you're like me, you probably don't want to spin up a dedicated Alpine Linux box just for serving up packages, and would much rather use a more familiar operating systems to actually 
serve your packages.

To deal with the fact that we need to be running these commands on an Alpine Linux box, I created the following `docker-compose.yml` file.

```yaml
version: "3.3"
services: 
  package: 
    command: sh -c "apk add gcc abuild --no-cache &&  cp /root/.abuild/$${KEYFILE}.pub /etc/apk/keys/ &&  echo \"$${REPOSITORY_URL}/$${REPOSITORY_VERSION}/$${REPOSITORY_NAME}\" | tee -a /etc/apk/repositories && apk index -vU -o APKINDEX.tar.gz $PACKAGES && abuild-sign -k /root/.abuild/$${KEYFILE} APKINDEX.tar.gz && apk update"
    image: alpine:3.6
    volumes: 
      - /mnt/apk.example.com/${REPOSITORY_VERSION}/${REPOSITORY_NAME}/${REPOSITORY_ARCH}:/data
      - /home/user/.abuild:/root/.abuild
    working_dir: /data
    environment:
      - PACKAGES=$PACKAGES
      - KEYFILE=charlesportwoodii@erianna.com-59ea3c02.rsa
      - REPOSITORY_URL=$REPOSITORY_URL
      - REPOSITORY_VERSION=$REPOSITORY_VERSION
      - REPOSITORY_NAME=$REPOSITORY_NAME
      - REPOSITORY_ARCH=$REPOSITORY_ARCH
```

This will create an Alpine 3.6 container, then run the following commands:

```bash
# Install the necessary dependencies
apk add gcc abuild --no-cache

# Copy the public key from the mounted volume to /etc/apk/keys
cp /root/.abuild/alpine@example.com-59ea3c02.rsa.pub /etc/apk/keys/

# Add our repository to /etc/apk/repositories
echo \"https://apk.example.com/v3.6/main\" | tee -a /etc/apk/repositories

# Create an APKINDEX.tar.gz file from the $PACKAGES provided via ENV
apk index -vU -o APKINDEX.tar.gz $PACKAGES

# Sign the repository
abuild-sign -k /root/.abuild/alpine@example.com-59ea3c02.rsa APKINDEX.tar.gz

# Run apk update to verify our repository was signed correctly.
apk update
```

Coupled with the previously provided `build-apk` script, it can be run as follows to automatically package and sign your repository, while giving you full control over what repository you wish to sign if you're actively maintaining multiple Alpine Linux repositories.

```bash
REPOSITORY_NAME=main \
REPOSITORY_VERSION=v3.6 \
REPOSITORY_ARCH=x86_64 \
PACKAGES=$(./build-apk $REPOSITORY_NAME $REPOSITORY_VERSION $REPOSITORY_ARCH) \
REPOSITORY_URL=https://apk.example.com \
docker-compose run package
```

# Closing thoughts

The results of all of this hard work and effort is to drastically simply the work that needs to be done at build time when building your Docker containers.

Rather than needing to recompile your packages each and every time you need to update a Dockerfile, instead you can manage your software packages _independently_ of your Dockerfile and resulting Docker images. This has the benefit of reducing complexity in your Dockerfile, while also reducing the amount of time it takes to build Docker images.

If you found this article useful, or know of a better way to create and maintain and Alpine Linux repository be sure to reach out!
