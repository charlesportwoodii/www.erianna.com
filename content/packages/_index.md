---
title: "Erianna Package Repository"
description: "Stay up-to-date with apt & yum packages, and Docker images"
intro: |
    As a service to the community, and for my own personal purposes I maintain several apt and yum repositories, and several Docker repositories. These packages and images are free for personal or business use

    Primarily I maintain PHP (5.6, 7.0, 7.1, (& 7.2 in TEST)), Nginx, GnuPG2, and several other utility packages. The source code for the build packages are maintained on Github. Each build is signed and tagged by my primary GnuPG2 key, then is built on TravisCI before being uploaded to it's respective repository.

    ## Why should I use these packages?

    There are several reasons you should consider using these packages:

    - The build process for these packages is completely open source, and can be independently verified.
    - Packages I maintain work exactly the same across Ubuntu, CentOS7, and RHEL7. They have an identical configuration across each platform, allowing you to have a consistent infrastructure across platforms.
    - Updates and security fixes are promptly released.
docker_intro: |
    As an alternative to installing these packages directly, I also maintain a Docker registry at https://hub.docker.com/r/charlesportwoodii/, with dockerized images of many of the packages I maintain.

    > While I maintain build Docker images for other platforms, currently I only maintain Ubuntu 16.04 Xenial Docker images for packages such as Nginx and PHP.
ubuntu_intro: |
    The new apt repository (apt.erianna.com) currently only supports Xenial (16.04) packages across two distributions: xenial/main and xenial/test. The test distribution contains software packages that are functional but that are not yet ready for prime time (such as PHP 7.2).

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
centos_intro: |
    > This is my legacy CentOS7 repository, which will soon be superceded.

    ```bash
    # Add the package
    sh -c 'echo -e "[erianna]\nname=Erianna RPM Repository\nbaseurl=https://rpm.erianna.com/CentOS/7/x86_64\nenabled=1\ngpgcheck=0\nprotect=1\ngpgkey=https://www.erianna.com/key.asc" > /etc/yum.repos.d/rpm.erianna.com.repo';

    # Enable the repo
    yum --enablerepo=erianna clean metadata;
    yum clean all;
    ldconfig;
    ```
rhel_intro: |
    > This is my legacy RHEL repository, which will soon be superceded.

    ```bash
    # Add the package
    sh -c 'echo -e "[erianna]\nname=Erianna RPM Repository\nbaseurl=https://rpm.erianna.com/RHEL/7/x86_64\nenabled=1\ngpgcheck=0\nprotect=1\ngpgkey=https://www.erianna.com/key.asc" > /etc/yum.repos.d/rpm.erianna.com.repo';

    # Enable the repo
    yum --enablerepo=erianna clean metadata;
    yum clean all;
    ldconfig;
    ```

package_list:
    - { name: "php-fpm-build" , display_name: "PHP FPM", versions: "5.6, 7.0, 7.1, 7.2" }
    - { name: "nginx-build" , display_name: "Nginx", versions: "stable, mainline" }
    - { name: "libassuan-build" , display_name: "libassuan", versions: "2.4.x" }
    - { name: "luajit-build" , display_name: "LuaJIT", versions: "2.0.4" }
    - { name: "libbrotli-build" , display_name: "LibBrotli", versions: "1.0" }
    - { name: "libgpgcrypt-build" , display_name: "LibGCrypt", versions: "1.7.6" }
    - { name: "libksba-build" , display_name: "LibKSBA", versions: "1.3.5" }
    - { name: "libgpgerror-build" , display_name: "LibGPGError", versions: "1.17" }
    - { name: "gnutls-build" , display_name: "GnuTLS", versions: "3.5.x" }
    - { name: "libnettle-build" , display_name: "LibNettle", versions: "3.3" }
    - { name: "gnupg2-build" , display_name: "GnuPG2", versions: "2.1.x" }

docker_images:
    - { namespace: "charlesportwoodii", repo: "xenial", tag: "php70" }
    - { namespace: "charlesportwoodii", repo: "xenial", tag: "php71" }
    - { namespace: "charlesportwoodii", repo: "xenial-test", tag: "php72" }
    - { namespace: "charlesportwoodii", repo: "xenial", tag: "apache2" }
    - { namespace: "charlesportwoodii", repo: "xenial", tag: "nginx" }
---