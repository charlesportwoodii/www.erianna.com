---
title: "Adding a Secondary Encrypted Hard Drive with LVM & LUKS on Ubuntu"
description: "A guide to encrypting a second drive on Ubuntu with LVM"
date: 2018-07-21T13:50:00-05:00
slug: "adding-an-secondary-encrypted-drive-with-lvm-to-ubuntu-linux"
draft: false
type: "blog"
---
Similar to Bitlocker on Windows, the native Ubuntu installer provides the capabilities during installation to encrypt your primary hard drive. Getting secondary, or even external devices encrypted however is a bit more complicated.

In this article I'll cover how to encrypt a second hard drive after installing Ubuntu, and set it up with LVM for easy expansion later. Additionally I'll cover the steps necessary to automatically decrypt external drives on boot when you decrypt your primary hard drive, and how to access this media once logged into the system.

<!--more-->

# Linux Unified Key Setup (LUKS)

Whether you're someone who wants to protect data on a mobile device, such as a laptop or a flash drive, or you're a business looking to protect sensative information on servers or in transit, full disk encryption plays a vital role in securing that information.

On Linux, the standard set of tools of performing full disk encryption is called [Linux Unified Key Setup](https://gitlab.com/cryptsetup/cryptsetup/), or LUKS for short. Using the tools provided by LUKS we can perform full disk encryption of secondary disks.

On Ubuntu 12.10 and later, encrypting your primary hard disk is as simple as selecting the "Encrypt the new Ubuntu installation for security when the installer runs.

<center>
![Ubuntu Full Disk Encryption](https://s3-us-west-2.amazonaws.com/cdn.ciims.io/erianna.ciims.io/ac8717444f85d57c67f5c4e8e0d1ff76.png)
</center>

Secondary or external disks however, require some more manual work to get setup.

## Encrypting Secondary Hard Drives

To get started encrypting secondary drives, we first need to identify the drive we want to encrypt. The `fdisk` utility is usually the easiest way to identify your disk, especially if you already know the size of the disk.

```
# fdisk -l | grep ^Disk
Disk /dev/nvme0n1: 232.9 GiB, 250059350016 bytes, 488397168 sectors
Disk /dev/sda: 931.5 GiB, 1000204886016 bytes, 1953525168 sectors
Disk /dev/sdb: 111.8 GiB, 120034123776 bytes, 234441648 sectors
Disk /dev/sdc: 149.1 GiB, 160041885696 bytes, 312581808 sectors
Disk /dev/sdd: 465.8 GiB, 500107862016 bytes, 976773168 sectors
```

Once you've identified the disk you want to encrypt, we first want to write random data to the drive. This is done to further blur the boundary between encrypted data and unencrypted data. From your terminal window, we can use the `shred` tool to accomplish this. Be sure to replace `/dev/sd?X` with the driver you're shredding.

```
# shred -v -n 1 /dev/sd?X
```

> This operation will likely take some time depending upon the size and speed of your drive.

Once this operation is complete, we're then going to create the partition table on our drive.

```
fdisk /dev/sd?X
```

At the first prompt, type `g`, then at the next prompt, type `w` to write out a standard GPT partition table to the drive.

Once that is done, it's time to encrypt the drive using the `cryptsetup` tool.

```
# cryptsetup -y -v luksFormat /dev/sd?X
```

During this phase you'll be prompted to provided a password for the the drive itself. You can set this to whatever you want, just bear in mind once we're done you'll use the password you created during your Ubuntu installation to not only decrypt your primary drive, but also this new drive as well.

After encrypting the drive, we'll need to open it to start setting up our LVM and EXT4 mappings. The first parameter to `luksOpen` is the drive we just encrypted, and the second is a descriptive name. We'll use this name later to map the encrypted drive.

```
# cryptsetup luksOpen /dev/sd?X sd?X_crypt
```

Next, we'll setup LVM and EXT4 on the drive. For this we'll be using the standard LVM tools. 

First we'll create our physical volume and volume group, then we'll tell LVM to use the entire disk for LVM, then we'll format the newly created volume to EXT4.

```
# pvcreate /dev/mapper/sd?X_crypt
# vgcreate crypt_vg /dev/mapper/sd?X_crypt
# lvcreate -l 100%FREE -n data /dev/crypt_vg
# mkfs.ext4 /dev/crypt_vg/data
```

At this point, you can now mount your drive:

```
mount /dev/crypt_vg/data /mnt/data
```

## Unlocking External Drives on Boot

At this point you have a fully encrypted secondary drive that you can mount and unmount as you see fit using `cryptsetup` and `mount`. For a rarely accessed device, or a flash drive, this is probablly all you need.

For more persistent storage devices however, it's _much_ easier _and_ convenient to configure Linux to decrypt the drive for you when you decrypt your main drive.

First, we'll need to create a keyfile if we don't already have one. This will _replace_ the password we set on the device earlier.

```
# dd if=/dev/urandom of=/root/.keyfile bs=1024 count=4
# chmod 0400 /root/.keyfile
# cryptsetup luksAddKey /dev/sd?X /root/.keyfile
```

Next, we need to grab the device UUID for `/dev/sd?X`

```
blkid /dev/sd?X
```

> The value you want is the UUID of `/dev/sd?X`, not `/dev/mapper/sd?X_crypt`.

Then, in order to automatically unlock the parition on startup, we'll need to add the following line to `/etc/crypttab`

```
sd?X_crypt UUID=<device UUID> /root/.keyfile luks,discard
```

And finally, we can add our drive to `/etc/fstab` to automatically mount the disk.

```
/dev/mapper/sd?X_crypt  /<mount-point>   ext4    defaults        0       2
```

And that's it! You now have an encrypted secondary drive setup with LVM. In the future if you ever want to expand your storage capacity, you can simply encrypt the new drive, add the same `/root/.keyfile` to it using `luksAddKey`, update your `/etc/crypttab` with the drive information, then expand your LVM drive as you would normally.

Be sure to reach out if you found this guide useful! I look forward to hearing from you.