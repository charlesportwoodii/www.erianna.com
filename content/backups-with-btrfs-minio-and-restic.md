---
title: "Encrypted BTRFS backups with Minio, Systemd, and Restic"
description: "Automate backups on systemd-enabled Linux distributions to a encrypted BTRFS store with Restic and Minio."
keywords: "btrfs,restic,minio,backups,encrypted,backblaze"
date: 2020-04-18T17:30:00-05:00
lastmod: 2020-04-18T17:30:00-05:00
slug: "encrypted-btrfs-backups-with-minio-systemd-and-restic"
draft: false
type: "blog"
---

If you've ever lost an important document or file you know how essential timely and reliable backups are. Getting backups done effeciently can prove to be challenge however, especially on Linux where a dozen different tools exist and do a variation on the same theme.

Until recently I've been using [Duplicati](https://www.duplicati.com/) which is an excellent tool, but struggles to start reliably on newer Linux kernel version, resulting in inconsistent backup states and data loss when you need to recover something.

In this article I'll cover how I automate backups of all my Linux desktops, servers, and laptops to a locally encrypted BTRFS store, and off-site to a cloud provider.

<!--more-->

## Design Goals

While this approach is by no means unique, I did have some design goals in mind when building it.

1. Full encryption

   At both the transport layer and storage layer anything I backup from any location should be encrypted, preferrably end-to-end when applicable.

2. Cross platform compatability

   Having a single tool that operates the same on all platforms makes backing up and restoring consistent.

3. Fast, performant, and automatable

   Backups are only worthwhile if they are done. Infrequent backups or solutions that don't get done while the device is powered are useless.

4. Local with off-site mirrors

   Paying for bandwidth and storage costs to an offsite-vendor is fine, but if you ever need to restore a large file it can be time-consuming and expensive. Ideally you'd have local backups on a home server or machine with low storage and network costs, then cold backups offsite on the least expensive cloud service you can find. Whatever tool is used should be able to handle both, with your home server facilitating the off-site mirroring component.

## Software & Systems

To achieve the aforementioned design goals outlined the technical solution for achieving this look as follows:

* A home server with an encrypted BTRFS file-store.

   BTRFS is a resiliant file-system, and unlike EXT4 is simple to add redundancy, expand, and repair.

* [Wireguard](https://www.wireguard.com)

   Specifically to faciliate secure transfer of data both within and outside of my home network so that all of my systems can both backup to the same location and utilize the same featureset.

* [Restic](https://restic.net/)

   Restic remains one of the simplest and easier to automate backup tools I've used at a consumer level.

* [Minio](https://min.io/)

   Minio is Amazon S3, on your own disks - convenient in the sense that setting up shared SSH keys is more obnoxious than simply giving a client S3 credentials and things just working. I'll be running Minio in a docker container so I don't need to install it locally, and fronting it with Nginx and a valid TLS certificate.

* [systemd](https://systemd.io/)

  For all the hate systemd gets for feature creep, I do adore only needing to configure one system start and stop tasks both manually and on timers. init.d + cron is, in my opinion vastly inferior. Having the majority of my tools uses systemd as their init and timer system reduces cognative load.

## Setup

### BTRFS

First thing we need to do is create an encrypted BTRFS LUKS volume, which I've covered in detail in [a separate article]({{< relref "encrypting-a-second-hard-drive-with-luks.md" >}}).

When it comes to formatting the disk, you can format the volume in btrfs by running:

```
# mkfs.btrfs /dev/vg/data
```

And can be mounted in `/etc/fstab`

```
/dev/mapper/vg--vg-data  		/backups   	btrfs    defaults        0       2
```

### Minio

Minio is fairly easy to install, but is trivial to manage with Docker. I opt to use `docker-compose` as I can front the container with my own Nginx image.

1. Creating a few working directories

   ```
   # mkdir -p minio/nginx
   ```

2. Generate valid TLS keys for Nginx.

   LetsEncrypt certificates through Certbot are ideal, especially if you have a DNS provider that provides a API to retrieve certs so you don't have to publish a `.well-known` directory on an internal server. Alternative, you can follow [my guide to making ECDSA self-signed certs and CAs]({{< relref "ecdsa-certificate-authorities-and-certificates-with-openssl.md">}})

3. Create your access key and secret key.

   You can use any strings for these values. I recommend generating random values from a password manager.

4. Create the Nginx configuration to front Minio and place in `minio/nginx/nginx.conf`.

   As a preference, I find fronting any web application with Nginx to be a more reliable, consistent, and secure alternative to exposing applications natively.

   ```
   server {
        listen 9000 ssl http2 default deferred;
        listen [::]:9000 ssl http2 default deferred;

        ssl_certificate /etc/nginx/conf/ssl/server.crt;
        ssl_certificate_key /etc/nginx/conf/ssl/server.key;

        include /etc/nginx/conf/ssl.conf;
        include /etc/nginx/conf/security-headers.conf;

        server_name _;
        root /etc/nginx/minio;

        ignore_invalid_headers off;
        client_max_body_size 0;
        proxy_buffering off;

        location / {
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Host $http_host;

            proxy_connect_timeout 300;
            proxy_http_version 1.1;
            proxy_set_header Connection "";
            chunked_transfer_encoding off;

            proxy_pass http://minio:9000;
        }
    }
    ```

4. Create a `minio/docker-compose.yml` file for your configuration. Adjust the paths, `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` relative to your system.

    ```
    version: '3.7'

    services:
        nginx:
            image: charlesportwoodii/nginx:mainline
            ports:
                - "9000:9000"
            volumes:
                - /path/to/minio/nginx/nginx.conf:/etc/nginx/conf/conf.d/default.conf:ro
                - /path/to/server.crt:/etc/nginx/conf/ssl/server.crt:ro
                - /path/to/server.key:/etc/nginx/conf/ssl/server.key:ro
            networks:
            main:
                aliases:
                - nginx

        minio:
            image: minio/minio:latest
            volumes:
                - /backups:/data
            command: server /data
            environment:
                MINIO_ACCESS_KEY: <access-key-id>
                MINIO_SECRET_KEY: <secret-access-key>
            healthcheck:
            test: ["CMD", "curl", "-f", "http://localhost:9000/minio/health/live"]
            interval: 30s
            timeout: 20s
            retries: 3
            networks:
            main:
                aliases:
                - minio

        networks:
            main:
    ```

5. `docker-compose up -d` then check that https://<ip>:9000 is returning a Minio screen and that you can login using the credentials you defined.

### Restic

1. Download [restic](https://restic.net/) using the [install guide](https://restic.readthedocs.io/en/stable/020_installation.html). Make sure `restic` is in your `$PATH`.

2. Initialize a new repository.

    ```
    # AWS_ACCESS_KEY_ID="<MINIO_ACCESS_KEY>" AWS_SECRET_ACCESS_KEY="<MINIO_SECRET_KEY" restic -r s3:<ip>:9000/<repo-name> init
    ```

    Replace your AWS keys using the ones you made for Minio previously, use the public or internal IP address where docker-compose is running, and give your backups a unique `<repo-name>`. My strategy is a single backup per device.

    During this phase you'll be prompted for password. I recommend initially generating a random password that you can give to systemd. Restic supports multiple passwords per repository, so afterwards you can add a easier to remember password by running:

    ```
    # AWS_ACCESS_KEY_ID="<MINIO_ACCESS_KEY>" AWS_SECRET_ACCESS_KEY="<MINIO_SECRET)KEY" restic -r s3:<ip>:9000/<repo-name> key add
    ```

3. Test that everything is working by doing an inital backup.

    ```
    /usr/local/bin/restic backup --cache-dir=/tmp --verbose --one-file-system /path/to/backup
    ```

### Automate with systemd

After confirming everything is working with Restic and Minio we can now automate the process with systemd.

To automate, we'll be creating 2 .service files and .timer files - one to backup the data, and another to initiate pruning of the data from Minio since Restic performs those two tasks independently.

1. Before making the scripts we should create a dedicated system user to run our backups as and grant it read and execute permissions so it can grab any files.

    ```
    # useradd -rMU restic
    # setfacl -d -Rm u:restic:rx,g:restic:rx /path/to/backup
    # setfacl -Rm u:restic:rx,g:restic:rx /path/to/backup
    ```

2. Next, we're going to make a configuration directory for Restic to use with systemd. This'll allow us to define everything we want to backup or exclude from a config file so we don't have to reload system.d every time we want to make a change.

    ```
    # mkdir -p /etc/restic/<repo>
    # touch /etc/restic/<repo>/{files,restic.conf,exclude}
    # chown -R root:restic /etc/restic/<repo>
    ```

    Within this directory we've created 3 files:

    * `files` is a list of files we wanted to backup
    * `exclude` is a lsit of iles we want to be ignored.
    * `restic.conf` contains our configuration systemd will read.

    `files` and `exclude` is a simple new-line separated list of paths and files that you can populate.

    `restic.conf` should look as follows, adjusted for your environment. This is just a simple dot-env style environment file so you can populate it with whatever you'd like systemd to know about. More about that later.

    ```
    RESTIC_REPOSITORY=s3:<ip>:9000/<repo-name>
    AWS_ACCESS_KEY_ID=<MINIO_ACCESS_KEY>
    AWS_SECRET_ACCESS_KEY=<MINIO_SECRET_KEY>
    RESTIC_PASSWORD=<RESTIC_REPO_PASSWORD>
    RESTIC_CACHE_DIR=/tmp
    DAILY=3
    WEEKLY=2
    MONTHLY=6
    YEARLY
    ```

3. Create `/etc/systemd/system/restic@.service`

    ```
    [Unit]
    Description=Local restic backup for %i
    Wants=network-online.target
    After=network.target network-online.target

    [Service]
    Type=oneshot
    User=restic
    EnvironmentFile=/etc/restic/%i/restic.conf
    WorkingDirectory=/etc/restic/%i
    IOSchedulingClass=idle

    ExecStart=/usr/local/bin/restic backup --cache-dir=/tmp --verbose --one-file-system --tag systemd.timer --files-from="/etc/restic/%i/files" --exclude-file="/etc/restic/%i/exclude"
    ExecStart=/usr/local/bin/restic forget --cache-dir=/tmp --verbose --tag systemd.timer --group-by "paths,tags" --keep-daily=${DAILY} --keep-weekly=${WEEKLY} --keep-monthly=${MONTHLY} --keep-yearly=${YEARLY}
    ExecStart=/usr/local/bin/restic stats --verbose
    ```

4. Create a timner `/etc/systemd/system/restic@.timer`. This one runs daily at 10AM.

    ```
    [Unit]
    Description=Restic backup of %i

    [Timer]
    OnCalendar=*-*-* 10:00:00
    Persistent=true

    [Install]
    WantedBy=timers.target
    ```

5. Create a pruning script `/etc/systemd/system/restic-prune@.service`

    ```
    [Unit]
    Description=Restic backup service (data pruning %i)

    [Service]
    Type=oneshot
    ExecStart=/usr/local/bin/restic prune
    EnvironmentFile=/etc/restic/%i/restic.conf
    ```

6. Create a pruning timer `/etc/systemd/system/restic-prune@.timer`

    ```
    [Unit]
    Description=Prune data from the restic %i repository monthly

    [Timer]
    OnCalendar=*-*-* 16:00:00
    Persistent=true

    [Install]
    WantedBy=timers.target
    ```

7. Reload systemd then add the timers. If you aren't familiar with systemd, the `@` symbol in the service and timer allows us to dynamically define our services with an input variable `%i` in our scripts. In my case, I have multiple backups running from the same machine to different repos. Each repo has their own configuration in `/etc/restic` and the dynamic systemd file allows me to re-use the same script.

    ```
    # systemctl daemon-reload
    # systemctl enable restic@<repo>.timer
    # systemctl enable restic-prune@<repo>.timer
    ```

    At this point, your backups will run at the times defined in your systemd timers.

    Alternatively if you want to manually initate a backup you can run:

    ```
    # systemctl start restic@<repo>`
    ```

    And tail the output via:

    ```
    # journalctl -xe -f -u restic@<repo>
    ```

#### Restoring

Should you ever need to restore, the [Restic documentation](https://restic.readthedocs.io/en/latest/050_restore.html) outlines what you need to do.

### Backuping up your backups

At this point you'll have a working local or off-site backup system in place. If you just have local backups however your vulnerable to local destructive elements, such as a hammer weilding child or a house fire. As Backblaze now supports an S3 compatible API, you can use a variety of different S3 tools to sync your backups to Backblaze:

Minio fortunately makes it very easy to backup your backups using it's own command line tool to Backblaze B2, which at the time of writing offers the cheapest storage and bandwidth costs = for less than a cup of coffee at your local barista you can get about 1TB of storage, so let's talk about what needs to be done to get that backed up.

1. Create a Backblaze B2 account at https://www.backblaze.com/b2, then create a dedicated Application Key for Minio to use. While you're here, create a private backup to backup to.

2. Use s3cmd, or the minio client mc to mirror your repositories. Feel free to use any S3 compatible tool!

### Extras

You may want to do something _before_ initiating a backup such as:

* Making a KVM/QEMU snapshot
* Creating a LXC Snapshot
* Doing a data compression/extraction

Whatever the case, take advantage of `ExecStartPre=` in your restic@.service file. Any command or script placed here will run before Restic starts a backup, and if the Pre task fails Restic won't start.

More information about `ExecStartPre=` can be found on [systemd manpage](https://www.freedesktop.org/software/systemd/man/systemd.service.html).

## Closing Thoughts

I've found this approach to file backups to be extremely effective and simple to work with. The local storage options allow you to expand your data store as necessary, while still allowing for off-site backups.

If you found this article useful feel free to send me a message, I'd love to hear from you.