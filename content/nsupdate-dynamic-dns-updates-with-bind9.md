---
title: "Dynamic DNS with Bind9"
description: "Correctly implementing Dynamic DNS updates with nsupdate and Bind9"
keywords: "Dynamic DNS,Bind9,nsupdate"
date: 2013-03-18T21:29:00-05:00
lastmod: 2018-09-08T18:01:09-05:00
draft: false
type: "blog"
slug: "nsupdate-dynamic-dns-updates-with-bind9"
---

One of the things that really bugs me about online tutorials is that find one that’s accurate is a major pain. Recently I have to figure out (again) how to get secure dynamic DNS updates working with nsupdate and Bind9. Since I haven’t done this in nearly 3 years now, I had forgotten several important steps. In the hopes of saving someone else time (and mine in the future should I forget in the future). In truth getting this setup is relatively simple - you just have to know the right set of steps in order to get it done right.

For this tutorial I’ll be using the Ubuntu 12.04 and Bind9 from upstream.

<!--more-->

## Dealing With AppArmor

If you’re not using Ubuntu you can skip this section, otherwise it’s something that you’ll need to address for everything to work correctly.

On Ubuntu there is this tool called http://en.wikipedia.org/wiki/AppArmor, which is designed to help secure the Linux Kernel. It’s going to get in our way, so we need to update a few things in bind in order to get it to play nicely with our journal files.

First, you need to move all of your zone files to `/var/lib/bind` or another folder which you want to keep your zone files in. It really doesn’t matter where they’re move to, just so long as they are not in `/etc/bind`. By default, AppArmor is configure to prevent automated writes to that directory. To get around this limitation, just move your zone files somewhere else. Most likely, you’ll forget where you’ve placed them the next time you update the server, so my recommendation is to create a symlink to `/etc/bind/zones` as follows:

```bash
ln -s /var/lib/bind /etc/bind/zones
```

After doing this, you’ll need to update `/etc/bind/named.conf.local` so that your zone files point to `/var/lib/bind`.

The reason we need to do this, is because when nsupdate tries to run, AppArmor will prevent the bind journal file from being created. By moving our zones files outside of /etc/bind, the system will allow our journal files to be created.

## Creating our Secure DNS Keys

Run the following command to generate your TSIG keys. Be sure to replace example.com with your domain name and do not remove the . (period) at the end.

```bash
dnssec-keygen -a HMAC-SHA256 -b 128 -n HOST example.com.
```

> The period `.` at the end of the `dnssec-keygen` command is not a type. You must include this period for the TSIG key to be properly generated.

This will generate two files:

```bash
-rw-r--r-- 1 root bind 120 Mar  6 21:56 Kexample.com.+127+24536.key
-rw-r--r-- 1 root bind 229 Mar  6 21:56 Kexample.com.+127+24536.private
```

These keys should be readable only by the root user and the bind group. Update the permissions as follows:

```bash
chown root:bind Kexample.com*
chmod -R 640 Kexample.com*
```

Feel free to look through both files. What we really care about is the contents of the .key file. Run the following command to grab the key contents.

```bash
cat Kexample.com.+127+24536.key
```

The part that we care about is the base64 encoded string at the end. This is our key.

```bash
example.com. IN KEY 512 3 157 z4PhNX7vuL3xVChQ1m2AB9Yg5AULVxXcg/SpIdNs6c5H0NE8XYXysP+DGNKHfuwvY7kxvUdBeoGlODJ6+SfaPg==
```

Open up` /etc/bind/named.conf.local` and add the following section. Be secure to replace the secret section with your key. The “name” of the key can be whatever you want it to be, in case you don’t like naming it after the key file you generated. Just remember it because we’re going to use it in the next step

```bash
key "example.com." {
  algorithm hmac-sha256;
  secret "z4PhNX7vuL3xVChQ1m2AB9Yg5AULVxXcg/SpIdNs6c5H0NE8XYXysP+DGNKHfuwvY7kxvUdBeoGlODJ6+SfaPg==";
};
```

In the same file (or wherever your zone components are located at, update the zone so that it has an allow-update section. Our example.com zone section would look as follows. The “key” in the allow-update section is whatever you named your key in the first step. Notice also that our zone file is outside of `/etc/bind`.

```bash
zone "example.com" {
    type master;
    file "/var/lib/bind/example.com.db";
    allow-update { key "example.com."; };
};
```

Save and close the files, then restart bind service.

```bash
systemctl restart bind9
```

Assuming everything went well and you have no typos, bind should restart without a problem. Just a precaution, make sure that you check your bind log (`/var/log/syslog`) to make sure there weren’t any errors.

## Testing Our Configuration

What’s really cool about nsupdate is that you can technically do an nsupdate from the same machine. So to test our configuration, we’re going to run nsupdate locally.

Fire up nsupdate by using the following command. Technically you can use the .private file as well, I just prefer to use the .key file

```bash
nsupdate -k Kexample.com.+127+24536.key
```

You’ll then be dropped to an nsupdate prompt where you can type nsupdate commands directly. Be sure to replace your items appropriately. Here is a brief explaination of the important items:

```bash
    server ns1.example.com                      # This is your DNS server hostname or IP address.
    zone example.com.                           # This is the zone we want to update. Be mindful of the period at the end. It's important
#   update [add|delete] fqdn                    # TTL Record Type  Record
    update add            subdomain.example.com 60   A                  127.0.0.1
```

The update command can take a variety of forms and work with any type of record [A|AAAA|CNAME|NS]. Read up on the nsupdate manpage to get more details about it. All together, your command set should look like this.

```bash
    server ns1.example.com
    debug yes
    zone example.com.
    update add subdomain.example.com 60 A 127.0.0.1
    show
    send
```

If you followed all the instructions, you should get a `NOERROR` response. I recommend while you are performing updates that you are also running the follow command on your bind logfile to verify that everything is working.

```bash
tail -f /var/log/syslog | grep named
```

This will give you details information about the nsupdate and will let you know. If everything worked or not. Because the nsupdates are written to a journal file, you may not see them immediately show up in your zone file. Once they’re in the journal file thought they’re applied. If you want to see them actually applied to the zone file simply restart bind. While the zone files are usually updated a couple minutes after the nsupdate command is run, restarting bind is a good way to make sure they’re being applied before you go into production with this.

## Running on a Remote Server

Once you’re configuration works, it’s time to make it work on your remote host which you want to perform updates from.

Copy both the .key and .private file to your remote host to a secure location such as /var/lib/bind/. Both the key and private file need to be in the same folder, so don’t try separating them out.

Then you should be able to follow all the previous steps to get it working on the remote host. And just to help you out, here is a small script that will automatically fetch your current external IP address and update your DNS server. My recommendation is to put it on your crontab so updates happen automatically. Feel free to modify it to suite your needs.

```bash
#!/bin/bash
# This script fetches the current external IP Address, writes out an nsupdate file
# Then performs an nsupdate to our remote server of choice
# This script should be placed on a 10 minute crontab

WGET=$(which wget)
ECHO=$(which echo)
NSUPDATE=$(which nsupdate)

IP=$($WGET -q -O - checkip.dyndns.org|sed -e 's/.*Current IP Address: //' -e 's/
<.*$//')

$ECHO "server ns1.example.com" > /tmp/nsupdate
$ECHO "debug yes" >> /tmp/nsupdate
$ECHO "zone example.com." >> /tmp/nsupdate
$ECHO "update delete subdomain.example.com" >> /tmp/nsupdate
$ECHO "update add subdomain.example.com 60 A $IP" >> /tmp/nsupdate
$ECHO "send" >> /tmp/nsupdate

$NSUPDATE -k /var/lib/bindKexample.com.+127+24536.key -v /tmp/nsupdate 2>&1
```

## Troubleshooting

The reason I made this post is to hopefully eliminate most of the troubleshooting. The biggest issues that you’ll run into are either issued with AppArmor preventing the journal file being create, or TSIG errors.

1. If you run into issues with AppArmor, see the very first section of this guide.
2. If `nsupdate` returns a TSIG transfer error like the following:
    ```bash
    request has invalid signature: TSIG transfer: tsig verify failure (BADSIG)
    ```

    Then the generated key isn't valid. I recommend starting this guide over and carefully re-reading all of the instructions and notes. The biggest issue I had when getting this setup was that I wasn’t adding a (.) period to the end of my `dnssec-keygen` command, which resulted in an incorrectly generated key. Other things to check are:

    - Verifying the key was copied correctly to your key section of `/etc/bind/named.conf.local`.
    - Verify your allow-update section specifies the right key.

If this guide helped your out at all, or your have any questions or comments I’d love to hear from you.
