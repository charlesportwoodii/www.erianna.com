---
title: "AMD Ryzen 2 PCI Passthrough with OVMF+VFIO and libvirt on Ubuntu 18.04 to Windows 10"
description: "Information for getting PCI passthrough working between Ubuntu 18.04 and Windows 10 using OVMF, VFIO, and Libvirt"
keywords: "VFIO,PCI passthrough,GPU passthrough,OVMF,Libvirt"
date: 2018-09-07T09:00:00-05:00
lastmod: 2018-11-20T13:00:00-05:00
slug: "amd-ryzen2-pci-passthrough-vfio-libvirt-ubuntu1804-windows10"
draft: false
type: "blog"
---

Unable to tolerate the significant performance losses I was seeing on my aging i5-2500 desktop, I recently elected to upgrade my desktop to something a bit more powerful that would enable me to work faster and get more done.

While planning out this process, I stumbled up [this](https://level1techs.com/article/ryzen-gpu-passthrough-setup-guide-fedora-26-windows-gaming-linux) article from mid 2017 detailing the process of getting GPU passthrough working on Fedora 26 with Ryzen.

Exhausted by the constant performance losses incurred by Spectre and Meltdown I was experiencing on my old i5-2500, and wanting to capitalize on the cost-per-core benefit Ryzen 2 offered, I decided to take the plunge into GPU passthrough and to see if it would be a viable long term solution for me, and my have I been pleased.

<span class="image featured">
    <picture>
        <source srcset="https://assets.erianna.com/windows10-install/windows10-vfio.webp" crossorigin="anonymous" type="image/webp">
        <img src="https://assets.erianna.com/windows10-install/windows10-vfio.PNG" />
    </picture>
</span>

This write up details my experiences getting PCI passthrough working through Ubuntu 18.04 to Windows 10 using OVMF+VFIO and libvirt. While this document shouldn't be considered a comprehensive guide, it will cover what I needed to do to get this working (mainly so I can set it back up again if I ever need to), while also covering a few tips and tricks I've learned along the way.

<!--more-->

# Why do this?

Before getting into the _how_, I would like to cover _why_ you might want to do this. In brief, this is something you might want to consider if your needs align with any of the following:

1. Preferring or needing Linux toolset for your daily driver.

    As a software developer, I work with _many_ different languages and tools through the course of the day. Some days I'm writing for a web stack, using JavaScript, PHP, HTML, other days I'm working in Android Studio, other days I'm writing server side Swift 4, and some other days I'm writing server side Java.

    While achievable on Windows, working with this cornacopia of tools on a _daily_ basis is an extremely time consuming process on Windows 10. While Windows Subsystem for Linux (WSL) absolves _several_ of the key problems, it's not a _seamless_ solution for my workflow. Between upgrades breaking software, and bad performance for tools running in WSl (such as Docker), maintaining this system in a pure Windows environment is extremely stressful.

    Given that almost _every_ tool and server I manage and work with is on a Linux stack, being able to work directly with a normal Linux tools instead of cross-compiled or patched tools simply is a better long term experience.

2. Wanting to run Windows games or Windows only software with native GPU performance, but not needing Windows _all the time_.

    Firstly, support for Linux apps has come a _long_ way in the past 10 years. With the advent of Snap and Flatpak, Electron apps (not that I _like_ electron), Microsoft's embracing of Linux (both server side and on the app side), and the increasing popularity of Linux as a desktop, Linux is pretty viable for a daily driver.

    As I write this, there's only a _few_ things I'm unable to do on Linux, namely join Webex meetings, play DX12 games, and run a few Windows only tools and software. Slack, Visual Studio Code, Firefox, Postman, Spotify, and Wire (just to name a few apps), work perfectly compared to their Windows or MacOS counterparts.

    While WINE3 and PlayOnLinux have come a long way, the compatability level still isn't perfect. Trying to install or play new games on Linux is still incredibly difficult, and some tools, such as Office 2016 still can't be installed with perfect compatability. Other applications, such as Visual Studio proper, _only_ run on Windows.

    If you're like me, and only need to run Windows for the few apps that don't work natively on Linux sparingly, this is a pretty good solution that allows you to compartmentalize and isolate your Windows tools without leaving Linux as your day-to-day.

3. Privacy concerns with Windows

    [There](https://www.pcworld.com/article/2971725/windows/how-to-reclaim-your-privacy-in-windows-10-piece-by-piece.html) [are](https://www.computerworld.com/article/3025709/microsoft-windows/how-to-protect-your-privacy-in-windows-10.html) [privacy](https://www.theverge.com/2018/3/6/17086754/microsoft-windows-10-privacy-changes-features) [concerns](https://github.com/adolfintel/Windows10-Privacy) [with](https://www.makeuseof.com/tag/complete-guide-windows-10-privacy-settings/) [Windows 10](https://www.cnet.com/how-to/new-privacy-settings-in-windows-10-april-2018-update-what-you-need-to-know/). Windows 10 seems to ingurgitate every piece of data it can get it's hands on. Passwords, documents, and even mouse tracking make the operating system you _paid_ for feel like it's constantly spying on you.

    When you're dealing with sensative or secure data, and need to ensure that private keys or other sensative files aren't transmited offsite, how can you guarantee that Windows isn't sending all of that information to a server somewhere? You can read Windows' privacy settings, then you can read the next leak that details how your information _still_ isn't safe.

    Giving the rising security conciousness, isolating Windows 10 helps provide _some_ protection against these aggressive spying tactics.

4. Performance

    When I talk about performance, I don't mean _solely gaming_ performance, I'm talking about the wholistic performance of your machine _as it relates to your workload_. If you're building a computer solely as a gaming rig, install Windows 10 on it and be done.

    If you're dealing with mixed workloads, that include gaming however, you should be tailoring your hardware and software to maximize the workloads you deal with most often.

    In my case, this is running Docker, running a variety of Linux software tools, and compiling software (again, typically Linux software). For _my_ use case, the best performance is by doing all of that natively, rather than cross-compiling, compiling within a VM or a translation layer like WSL, and running Docker in a VM.

    For my purposes, the performance question boils down to, "Will I care about a 3fps drop in Fortnite, or will I care about disk thrasing during compilation more". The answer for me is the later.

## The alternatives (and why they aren't as good)

Before getting into further details, I do feel it is important to list the alternatives to this setup.

### Windows Subsystem for Linux (WSL)

To be entirely honest, WSL _works_ for the most part. Compared to dual booting or Cygwin, WSL _mostly_ works. However WSL isn't _perfect_, and after exclusivly using WSL for nearly a year, it has two major pain points in my opinion.

1. Performance issues & missing features

    WSL is a brilliant example of Microsoft's ability to adapt to a changing landscape. And while WSL works out of the box for 99% of the things a normal developer needs throughout the day, there are still some pretty bad outstanding issues that bite you if you go off the beaten path.

    For example, the only way to avoid Window's long file name support is to move your files into the WSL container. The only way to access files inside the WSL filesystem is through your terminal. While there are some things you can do to get around it, the more "hacks" you add to WSL to less stable it becomes.

    Services, systemd, accessing ports, package management, and other stability issues make WSL a challenge once you start needing to do more Linux based commands.

    Moreover, WSL doesn't entirely eliminate Hyper-V. If you want to run Docker, you still have to run it within a Hyper-V VM, reducing performance of your applications.

2. Filesystem support

    Before [DRVFS](https://blogs.msdn.microsoft.com/wsl/2016/06/15/wsl-file-system-support/), WSL limited you to local disks (pretty much `C:` and `D:`). DRVFS improved things somewhat by letting you mount USB drives (NTFS and ReFS volumes), but that still doesn't help access other file systems, such as smaller USB drives, and SD cards.

### Dual Booting

Dual booting is ideal if you want the best of both worlds, but leaves you with a significant inconvenience factor. Switching between systems usually pushes you to one system or the other until you decide to reclaim the disk space for one OS or the other. Grub and Windows' loaded often conflict, especially during upgrades, and full disk encryption poses problems on both systems.

### Cygwin

Before WSL Cygwin was how you got Linux tools working on Windows. The software support isn't perfect, and WSL makes Cygwin largely obsolete, simply since WSL runs native code instead of cross-compiled tools that don't have guarantee compatability.

# Let's talk terms and tech

Between platforms the underlying technology that enables this is roughly the same. Meaning that Ryzen isn't the _only_ platform that supports PCI passthrough. All of this can easily be accomplished on an comparable Intel system.

To understand how all of this is made possible on Linux, let's take a look at a _few_ of technologies that make this happen, and that more recently, make PCI passthrough much more viable.

## Virtual Function IO (VFIO)

VFIO, or [Virtual Function IO](https://www.kernel.org/doc/Documentation/vfio.txt). In short, the VFIO driver in Linux enables us to pass through low level devices to virtual machines, while allowing those virtual machines to access the underlying hardware as they would if they were directly attached. To quote the Linux Kernel docs:

> From a device and host perspective, this simply turns the VM into a userspace driver, with the benefits of significantly reduced latency, higher bandwidth, and direct use of bare-metal device drivers.

## IOMMU

IOMMU is a generic name for Intel VT-d or AMD IOV. At the hardware level, devices (such as PCI lanes, USB hubs, and chipsets) live in groupings that we can pass between our host and guest operating systems. This grouping allows devices to have direct access to memory, without us needing to worry about device fauilts, or malicious memory access.

## OVMF

OVMF is an UEFI bios our VM will run on. For more information be sure to check out the OVMF project's homepage at https://github.com/tianocore/tianocore.github.io/wiki/OVMF.

# Requirements & Setup

In order to make all of this work, there are a few hardware and kernel requirements we're going to need in place.

## Kernel / Ubuntu Kernel Upgrade Utility (UKUU)

At the kernel level, we're going to need something relatively modern. Ubuntu ships with 4.15, which will work for basic usage, however newer kernels (especially 4.17 and 4.18 have much better support for both Ryzen and modern AMD hardware).

The best stable Kernel I've found so far is 4.18+, which if you're running Ubuntu, means you'll need to upgrade your kernel.

> The reason I recommend 4.18+ is because of a bug in 4.15-4.17 with Intel XHCI driver in the kernel that would result in USB bus' passed to VM's not resetting correctly. These issues have been fixed in 4.18, which eliminates the need to reset your entire host OS after shutting down a VM.

Upgrading to a newer kernel can be a terrifying process, especially if you're thinking that means you need to compile the Linux kernel from scratch. Fortunately, a tool called UKUU (Ubuntu Kernel Upgrade Utility) exists that lets you easily upgrade to a mainline kernel without needing to compile it yourself.

On Ubuntu, simply install the utility from it's ppa:

```bash
sudo apt-add-repository -y ppa:teejee2008/ppa
sudo apt-get update
sudo apt-get install ukuu
```

Then open the utility and select the kernel you want to install.

> Note: While you shouldn't have any major issues with mainline kernels, there are some issues you may encounter. Mainline kernels are not supported by Canonical, so any issues you encounter are at your own peril.

> Additionally, kernel upgrades through UKUU are _only_ available through the UKUU utility, and not through `apt`. Every time you want to upgrade your kernel you'll need to go through UKUU.

### ACS Patch

The last kernel item I want to touch upon is something called the "ACS Patch". The ACS patch solves a major issue with IOMMU groups _if_ your hardware doesn't have "good" groupings.

Normally, when passing through PCI devices to a virtual machine, you need to pass through _every_ PCI device in that IOMMU group. The ACS patch effectively splits every device into it's own IOMMU group, making it easier to pass through individual devices. One caveat of this however, is that it's done almost entirely in software, and _most_ of the time the hardware _does not_ like it. Often items with ACS you'll encounter devices that won't reset properly after rebooting the VM, or worse, devices that will completely seize up, requiring you to reboot the host machine to regain control.

More information on the ACS patch can be found at https://vfio.blogspot.com/2014/08/iommu-groups-inside-and-out.html.

From my own experience, the ACS patch isn't really worth it. Purchasing a better motherboard will provide more stability and less headaches in the long term. _However_, if you understand the risks involved with ACS and know what you're doing, you'll need to compile the ACS patch into your kernel manually.

Since compiling the kernel from scratch for Ubuntu is non-trivial, I would recommend using a pre-built kernel, especially if you're just wanting to see if ACS is viable for you. The best option I've found so far is at: https://queuecumber.gitlab.io/linux-acs-override/.

## Hardware

Before getting into the setup, we need to talk about the type of hardware we're going to need.

### Graphics Cards

Yes, graphics _cards_, as in plural, as in more than one.

While it is _possible_ to pass a single graphics card back and forth between the host and the guest it's non-trivial, and will leave you without a graphics console should something go wrong.

My recommendation would be to get a cheap $50-$100 graphics card for the host, such as a low end Nvidia or RX 550, and dedicate your higher end card, such as an RX 580, Vega 64, or 1080 to the guest. The only downside with using two graphics cards is that your higher end card will be powered on but unusable when you're not running the guest OS. As of the time of writing, graphics card prices are normalizing back to MSRP following the fiasco that is Etherium mining. There are pleanty of sales going on, especially with the upcoming holidays that should make it easy to get a good deal on decent cards.

There really isn't a significant difference between AMD or Nvidia for your card. Everything will just work with AMD out of the box, while Nvidia will need a simple tweak to your KVM configuration to spoof the vendor ID (Nvidia wants you to get a Quatro card for virtualization, and is pretty hostile to PCI passthrough on their normal line up).

If you care about 4K gaming, get an Nvidia card. If you just want to play games at full 1080 (either due to your monitor limitation or not wanting to pay $1000 for a graphics card, go with a high end RX card).

Additionally, you need to ensure that you have two _different_ graphics cards, otherwise it'll be extremely difficult to figure out which one should be passed to the guest and which should be left to the host.

> Note that at this time, kernel support for Vega is still a bit weird. 4.18 improves Vega support in the kernel significantly, and 4.19 should be rock solid. At the time of writing though, Vega is both expensive and a tad unstable in Linux, so I'd pass on it in favor of something else.

### Motherboard

Your motherboard selection is probably the most important part of this process, as it determines your IOMMU groupings.

For Ryzen, you're going to want to get an X470 board of some kind. While passthrough does work with the B450 line, the X470 give you better groupings and better motherboard features.

ASRock, Asus, and Gigabyte all offer good motherboards, but some X470 boards are better than others. At the pricer end, the Asus Crosshair Hero VII gives you an IOMMU group for pretty much everything, while at the lower end the Gigabyte X470 only gives you a single PCI device an USB bus to work with.

At the end of the day, how much money you're willing to spend depends on your budget. Before purchasing a motherboard I recommend checking out the [/r/VFIO](https://old.reddit.com/r/vfio) subreddit to see what IOMMU groups exists for your board.

### Memory

Ryzen's performance scales well with faster memory, meaning that faster RAM kits will net you faster performance. While not critical to PCI passthrough, you will see better guest performance with more and faster memory. I would recommend getting at minimum 16GB of RAM, so that you can allocate 8GB directly to the guest. In terms of speed, I would recommend a 3200 Mhz kit - be sure to check your motherboard manufacturer's compatability list.

### CPU

This process will work on any Ryzen or Ryzen 2 CPU, however you'll get more bang for your buck and better performance by using a Ryzen 1700+ or Ryzen 2700+.

#### Storage

For the best performance I would recommend having each VM on it's own hard disk. Alternatively you can use QCOW2 or RAW disks. SSDs are cheap, so go for them if possible.

### My Hardware

For this write up, I'm using the following hardware:

- Asus Prime X470 Pro
- Corsair Vengance RGB PRO 3200
- Ryzen 2700
- XFX RX 550 (for host)
- MSI RX 580 (for guests)
- Samsung 960 EVO SSD M.2 (250 GB for host)
- WD Blue SSD M.2 (500 GB for Windows 10)

# Initial Host Setup

Now let's go through everything you'll need to do on the host side to get this setup. While this guide is _involved_, it is by no means _difficult_.

## UEFI/BIOS Setup

1. Download and install the latest BIOS from your motherboard vendor. BIOS updates fix several hardware issues, and open up better IOMMU groups, especially if you're several version behind.

2. After installing your BIOS updates, you need to enable IOMMU and Virtualization in the BIOS. IOMMU will appear as AMD-Vi and virtualization will show as AMD-V. Where these options appear in your motherboard will differ per brand and BIOS revision.

## Install Ubuntu

Download Ubuntu 18.04 from http://releases.ubuntu.com/18.04/ and create a bootable USB disk then install Ubuntu normally.

My recommendation would be to configure Ubuntu how you'd like _before_ you start messing with everything else. Figure out LVM, disk encryption, and all that good stuff before going any further, as nothing sucks more than getting 99% of the way there then needing to re-install your host OS.

## Stuff you should download while you're working

While we're working on everything, you'll need to download a copy of Windows 10 ISO and VirtIO Drivers.

1. Windows 10 ISO can be downloaded from https://www.microsoft.com/en-us/software-download/windows10ISO. Purchase a license from your vendor of choice.
2. The latest Red Hat VirtIO drivers can be downloaded from: https://fedorapeople.org/groups/virt/virtio-win/direct-downloads/stable-virtio/virtio-win.iso. More information is available on Fedora's website here: https://docs.fedoraproject.org/en-US/quick-docs/creating-windows-virtual-machines-using-virtio-drivers/.

## Upgrading your kernel

Upgrade your kernel to 4.18.

```bash
sudo apt-add-repository -y ppa:teejee2008/ppa
sudo apt-get update
sudo apt-get install ukuu
```

Then open the utility and install the latest 4.18 kernel available. Reboot, and check for stability.

## Installing QEMU & virtualization tools

We need QEMU and libvirt installed to virtualize our guest, so install the following packages.

```bash
sudo apt-get install qemu-kvm libvirt-bin bridge-utils virtinst ovmf qemu-utils virt-manager
```

## Enable IOMMU

First, check if IOMMU is actually enabled:

```
dmesg | grep AMD-Vi
```

If enabled you should see output similar to the following:

```
[    0.725377] AMD-Vi: IOMMU performance counters supported
[    0.727282] AMD-Vi: Found IOMMU at 0000:00:00.2 cap 0x40
[    0.727283] AMD-Vi: Extended features (0xf77ef22294ada):
[    0.727286] AMD-Vi: Interrupt remapping enabled
[    0.727286] AMD-Vi: virtual APIC enabled
[    0.727374] AMD-Vi: Lazy IO/TLB flushing enabled
```

Next, need to enable IOMMU at the kernel level. Edit `/etc/grub/default`, and edit the `GRUB_CMDLINE_LINUX_DEFAULT` line as follows:

```
GRUB_CMDLINE_LINUX_DEFAULT="quiet splash amd_iommu=on iommu=pt"
```

Then run:

```
sudo update-grub
```

Reboot to apply the changes

## VFIO & Modules

Next, we need to stub our guest graphics card and USB controllers we want to pass through to our guest.

For this section, you'll need to use the scripts listed in the [Useful Scripts & Tools](#useful-scripts-tools) section.

First we need to identify the PCI devices we want to pass through. As discussed earlier, when passing through a PCI device you'll need to pass through _all_ devices in that group for things to work correctly.

Using the IOMMU script listed below, identify both of your graphics cards. Assuming there in slot 1 and 2 on your motherboard, they should appear in neighboring groups.

### Different Graphics Cards

The simplest approach is to have two different graphics cards. On my system, the RX 550 and RX 580 show as as follows:

```
16 08:00.0 VGA compatible controller [0300]: Advanced Micro Devices, Inc. [AMD/ATI] Polaris12 [1002:699f] (rev c7)
16 08:00.1 Audio device [0403]: Advanced Micro Devices, Inc. [AMD/ATI] Device [1002:aae0]
17 09:00.0 VGA compatible controller [0300]: Advanced Micro Devices, Inc. [AMD/ATI] Ellesmere [Radeon RX 470/480] [1002:67df] (rev e7)
17 09:00.1 Audio device [0403]: Advanced Micro Devices, Inc. [AMD/ATI] Ellesmere [Radeon RX 580] [1002:aaf0]
```

There are a couple of things to note here:

1. Each graphics cards has 2 devices in each group, one of audio, another for visual. We'll need to pass through _both_ PCI devices to our guest.
2. Each PCI device should be in it's own group. If it's not, double check that IOMMU is enabled both in the BIOS and in your kernel boot parameters.
3. There's a few things we'll need to keep a record of. Take for instance the following lines:

   ```
    17 09:00.0 VGA compatible controller [0300]: Advanced Micro Devices, Inc. [AMD/ATI] Ellesmere [Radeon RX 470/480] [1002:67df] (rev e7)
    17 09:00.1 Audio device [0403]: Advanced Micro Devices, Inc. [AMD/ATI] Ellesmere [Radeon RX 580] [1002:aaf0]
   ```

1. The first number __17__ represents the IOMMU group the device is in.
2. The second number __09:00.0__ represents the bus, device, and function number of the PCI device.
3. And finally, the last set of numbers after the device name __1002:67df__ represents the vendor-id and device-id. In order to stub the device with the VFIO driver, this is numbers we'll need.

#### Modules

To enable VFIO for these devices, we'll first need to edit `/etc/modules`, and add the following lines:

```
vfio
vfio_iommu_type1
vfio_pci ids=1002:67df,1002:aaf0
```

The `vfio_pci ids=` should be a comma separated list of all `vendor-id:device-id` pairs you want stubbed by the VFIO driver. Remember that you must pass through all PCI devices in the same IOMMU group.

In this case here, I'm passthrough through both the audio and video components of the RX 580 `1002:67df` and `1002:aaf0` respectively.

#### Initramfs

Next, we'll need to repeat the process with our initramfs file.

Edit `/etc/initramfs-tools/modules`, and add the following lines:

```
vfio
vfio_iommu_type1
vfio_virqfd
vhost-net
vfio_pci ids=1002:67df,1002:aaf0
```

Then run `sudo update-initramfs -u` to update initramfs.

#### Modprobe

Finally, we need to tell our kernel modules to stub these devices.

1. Create a file called `/etc/modprobe.d/vfio_pci.conf` and add the following:
    ```
    options vfio_pci ids=1002:67df,1002:aaf0
    ```

2. There are some issues with Windows build 1830 that _may_ require you to have MSRS ignored in KVM. Create a few filed called `/etc/modprobe.d/msrs.conf` and add the following:
    ```
    options kvm ignore_msrs=1
    ```
3. Soft dep the AMDGPU driver so VFIO is used. Create `/etc/modprobe.d/amd64gpu.conf` and add the following:
    ```
    softdep amdgpu pre: vfio vfio_pci
    ```
4. Enable nested virtualization by creating `/etc/modprobe.d/qemu-system-x86.conf` if it doesn't already exist and add the following:
    ```
    options kvm_intel nested=1
    ```

At this point, make sure your grub configuration and initramfs configuration is loaded by running:

```
sudo update-grub
sudo update-initramfs -u
```

Then reboot.

### Identical Graphics Cards (WIP)

If you're using identical graphics cards, your setup will differ slightly. Take for instance the following 2 cards. Even though the manufacturer's are different the vendor ids are the same, so we need to split them out by PCI Group

```
IOMMU Group 16 08:00.0 VGA compatible controller [0300]: Advanced Micro Devices, Inc. [AMD/ATI] Ellesmere [Radeon RX 470/480/570/570X/580/580X] [1002:67df] (rev e7)
IOMMU Group 16 08:00.1 Audio device [0403]: Advanced Micro Devices, Inc. [AMD/ATI] Ellesmere [Radeon RX 580] [1002:aaf0]
IOMMU Group 17 09:00.0 VGA compatible controller [0300]: Advanced Micro Devices, Inc. [AMD/ATI] Ellesmere [Radeon RX 470/480/570/570X/580/580X] [1002:67df] (rev e7)
IOMMU Group 17 09:00.1 Audio device [0403]: Advanced Micro Devices, Inc. [AMD/ATI] Ellesmere [Radeon RX 580] [1002:aaf0]
```

> Note that your PCI order may change due to BIOS updates or cards changing. If you're using this method I recommend _disabing_ it in `initramfs` before performing those updates as you won't had a graphics interface to boot with. If you do run into this problem, follow the steps below to chroot via a live cd to recover.

1. Follow the steps outlined in the previous section _with the exception_ of the _initramfs_ section.
2. In our example, we're going to isolate the graphics card we _aren't_ booting from. In this case it's `09:00.0/1`. Create `/sbin/vfio-pci-override.sh` and add the following to it.

    ```
    #!/bin/sh

    for i in /sys/bus/pci/devices/*/boot_vga; do
        if [ $(cat "$i") -eq 0 ]; then
            GPU="${i%/boot_vga}"
            AUDIO="$(echo "$GPU" | sed -e "s/0$/1/")"
                echo "vfio-pci" > "$GPU/driver_override"
            if [ -d "$AUDIO" ]; then
                echo "vfio-pci" > "$AUDIO/driver_override"
            fi
        fi
    done

    modprobe -i vfio-pci
    ```

    Then make it executable:

    ```
    chmox +x /sbin/vfio-pci-override.sh
    ```

    This script will iterate over our PCI devices, find any card we're not booting from, then overwrite the driver with `vfio-pci`.

    > If you know the PCI slot, you can simply do `echo "vfio-pci" > /sys/bus/pci/devices/<slot>/driver_override` for the devices we're wanting to pass through. This script is a little more versatile for a single card however, as if your BIOS updates or you add a new PCI card the PCI address may change.

3. Next, we need to load this script into `initramfs` so it can be run _before_ LUKS is decrypted if we have it, and before our filesystem is mounted otherwise. Create `/etc/initramfs-tools/hooks/vfio-pci-override` and add the following:

    ```
    #!/bin/sh
    PREREQ=""
    prereqs()
    {
        echo "$PREREQ"
    }

    case $1 in
    prereqs)
        prereqs
        exit 0
        ;;
    esac

    . /usr/share/initramfs-tools/hook-functions

    mkdir -p ${DESTDIR}/sbin || true
    cp -pnL /sbin/vfio-pci-override.sh ${DESTDIR}/sbin/vfio-pci-override.sh
    chmod +x ${DESTDIR}/sbin/vfio-pci-override.sh
    ```

3. Open up `/etc/modprobe.d/vfio-pci.conf` and make the following changes:


    - Remove the `options` line we added earlier.
    ```
    #options vfio_pci ids=1002:67df,1002:aaf0,1022:145f
    ```

    - Add `install vfio-pci /sbin/vfio-pci-override.sh` to run our script.
    ```
    options vfio_pci ids=1022:145f
    install vfio-pci /sbin/vfio-pci-override.sh
    ```

    > If you have other PCI devices like a USB hub you're passing through you can keep the options line, just specify only the vendor:device_id slots you want.

4. Run `update-initramfs -u -k all`.
5. Reboot
6. Run `lspci -nnk | grep vfio-pci -B2` to verify that the `vfio-pci` driver is in use for your second card. Your output should look similar to the following.

    ```
    09:00.0 VGA compatible controller [0300]: Advanced Micro Devices, Inc. [AMD/ATI] Ellesmere [Radeon RX 470/480/570/570X/580/580X] [1002:67df] (rev e7)
            Subsystem: Micro-Star International Co., Ltd. [MSI] Ellesmere [Radeon RX 470/480/570/580] [1462:8a92]
            Kernel driver in use: vfio-pci
    --
    09:00.1 Audio device [0403]: Advanced Micro Devices, Inc. [AMD/ATI] Ellesmere [Radeon RX 580] [1002:aaf0]
            Subsystem: Micro-Star International Co., Ltd. [MSI] Ellesmere [Radeon RX 580] [1462:aaf0]
            Kernel driver in use: vfio-pci
    ```

> If you aren't seeing both the graphics and audio being bound, verify the PCI slot is correct, and attempt to run` modprobe -i vfio-pci` to forcefully bind any drivers.

## Networking setup

For the best networking result, you'll need to create a bridged network between your ethernet adapter and the guest. In Ubuntu 18.04, the traditional networking setup via `/etc/network/interfaces` was dropped in favor of a new tool called Netplan. Ideally, you're going to want a bridged network interface that works with NetworkManager since everything else is routed to there (especially if you're needing to connect to an L2TP/IPSec VPN or a Wireguard VPN).

Fortunatlly, this is simple enough.

1. Copy `/etc/netplan/01-network-manager-all.yaml` to `/etc/netplan/01-network-manager-all.yaml-BAK` so you have a backup of the original network plan.

2. Edit `/etc/netplan/01-network-manager-all.yaml` and replace it with the following.

    ```yaml
    # Let NetworkManager manage all devices on this system
    network:
    version: 2
    renderer: NetworkManager
    ethernets:
        enp7s0:
        dhcp4: no
        dhcp6: no

    bridges:
        br0:
        interfaces: [enp7s0]
        dhcp4: true
    dhcp6: no
    ```

    > Note that you'll need to adjusts `enp7s0` with the actual ethernet adapter on your machine.
    > Also note that YAML syntax is tab sensative. Make sure you're using 4 spaces for each element

3. Run `netplan apply` to apply the network configuration.

After your network is configured, reboot to make sure everything works on boot.

## Hugepages

When a Linux process uses memory, the CPU will mark that memory for use by that specific process. For effecincy, these _page_ sizes are 4K.

When working with virtual machines, the KVM process is mapping memory to and from the guest OS to the host. When the KVM processes uses 1GB of memory, that's 262144 entries to look up (1GB / 4K). If one Page Table Entry consume 8 bytes, that's 2MB (262144 * 8) to look-up. When scaling to upwards of 8GB for guest allocation, that number skyrockets to 2097152 entries the CPU needs to look up, and costs roughly 16MB just to look up a single memory page. As you can imagine, this is _incredibly_ ineffecient for the CPU, and will cause significant performance issues inside the guest.

On Linux, we can configure something called _huge pages_, which lets us increase the page size. There are two approaches to dealing with huge pages, _dynamic_ and _static_ sizing. For PCI passthrough, static huge pages are the best (and only) option since IOMMU requires the guest memory be allocated and pinned as soon as the VM starts.

On a 16 GB system with an 8 GB Windows 10 VM, that means that your host system will (at all times), only have 8 GB of usable RAM, regardless of whether the VM is running or not.

With the cost of RAM, this can be a pretty hefty fine for good VM performance. In general however there really isn't a "better" option and static huge pages. If you're running <= 16GB of RAM on your host system, reserving 8GB of huge pages for your VM is obviously the superior choice - and if you have 32GB+ and have RAM to spare, it's also the obvious choice _unless_ you're needing that extra RAM for host-only activities.

For this guide, I'll be describing how to configure _static_ huge pages. If you're interested in _dynamic_ hugepages be sure to read the []rch Linux VFIO Wiki on the topic](https://wiki.archlinux.org/index.php/PCI_passthrough_via_OVMF#Transparent_huge_pages).

> Note that this configuration assumes we're running libvirt as `root`. For additional security we can restrict our hugepages to a specific group using `hugetlb_shm_group`, and configure additional limits in `/etc/security/limits.conf`.

1. Check if hugepages is installed by running:
    ```bash
    sudo apt install hugepages
    ```

    Then run `hugeadm` to see your hugepage configuration.

    ```bash
    sudo hugeadm --explain
    ```

    Then edit `/etc/default/qemu-kvm` and add (or uncomment) the following line:

    ```
    KVM_HUGEPAGES=1
    ```
2. Reboot your host OS.
3. Run `hugeadm --explain` again to check your memmory page size. The output on my system is as follows:

    ```
    Total System Memory: 32097 MB

    Mount Point          Options
    /dev/hugepages       rw,relatime,pagesize=2M

    Huge page pools:
        Size  Minimum  Current  Maximum  Default
    2097152     4500     4500     4500        *
    1073741824        0        0        0

    Huge page sizes with configured pools:
    2097152

    The recommended shmmax for your currently allocated huge pages is 9437184000 bytes.
    To make shmmax settings persistent, add the following line to /etc/sysctl.conf:
    kernel.shmmax = 9437184000

    To make your hugetlb_shm_group settings persistent, add the following line to /etc/sysctl.conf:
    vm.hugetlb_shm_group = 0

    Note: Permanent swap space should be preferred when dynamic huge page pools are used.
    ```

    There's several items we need to extract from this output to configure hugepages.

    First, we need to determine how much memory we want to devote to our VM. By default our page size is `2097152 bytes` or `2MB`, so if we want to allocated 8GB, or 8192MB of RAM to our guest, our huge page size would be `4096` (8192 / 2). Ideally we'd want to add 2-10% overhead on top of that. If memory is scarce, you'll probably be ok with `4300`. Simply add whatever percentage you're willing to devote to huge pages to `4096`, then update `/etc/sysctl.conf` with that value:

    ```
    vm.nr_hugepages = 4500 # Your value here
    ```

    Next we need to determine our `shmax` value. We're specifically looking for the section that reads:

    ```
    The recommended shmmax for your currently allocated huge pages is X bytes.
    To make shmmax settings persistent, add the following line to /etc/sysctl.conf:
    kernel.shmmax = X
    ```

    Do as the instructions say, and open `/etc/sysctl.conf` and apply `kernel.shmmax`.

    ```
    kernel.shmmax = X # Your value here
    ```

    Then run `sudo sysctl -p` to apply it.
4. Finally, reboot again.

Later when we're configuring our guest virtual machine we'll ensure our VM has huge pages backing.

# Windows 10 guest setup

While the following process will work with nearly any operating system, in this section we'll talk specifically about getting Windows 10 working.

## Configuring KVM virtual machine

Creating a new VM using the libvirt GUI is straightforward. There's only a few adjustments we need to make to our VM configuration after setting everything up with the defaults.

### Disk Options

The first option we need to deal with is how exactly we want our disk setup. There's three real options available here, listed in order of _my_ preference, with the pros and cons for each option listed:

#### RAW Image

A RAW image on a dedicated SSD is going to get you near native performance with almost no downsides.

##### Pros
1. Near native disk performance. Compared to bare metal you aren't missing out on much.
2. On a LUKS volume you get full disk encryption without needing to deal with Bitlocker.
3. Backups are easy. Just copy the image file.

##### Cons
1. Bare metal disk will net faster disk IO, as requests go directly to the disk instead of through the Linux VM.
2. Can't do live-migrations. KVM offers a feature with QCOW2 images that allow you to migrate data between storage mediums while the VM is active.

> As of November 2018 I am now using a raw image on an encrypted LUKS volume instead of a dedicated SSD.

#### Dedicated SSD

##### Pros
1. Bare metal performance can't be beat.
2. Can boot directly into Windows from host side.*

##### Cons
1. Can boot directly into Windows from host side.*

   > While you _can_ boot directly into Windows I advise you don't, as it _will_ hose your activation license. While this is great for adjusting lighting that requires direct motherboard access (like Asus Aura lighting), it's _terrible_ for just about everything else. For instance if your BIOS re-arranges your boot priority when you plug in a USB hard drive and you boot into Windows by mistake you better hope you have a recovery image in place, otherwise you're in for a fun re-install Windows 10 experience.

> Before November 2018 I was using a physical SSD.

#### QCOW2 Image

#### Pros
1. Everything for RAW image
2. Can do live migrations.

#### Cons
1. Both RAW and a dedicated SSD are noticably faster.

### Initial CPU Selection

As of the time of writing, the Windows 10 installer doesn't behave well with `host-passthrough`. In my experience the CPU selection during the installation process does have a performance impact after switching to `host-passthrough`. For instance if you select `core2duo` then switch to `host-passthrough` after the installation results in weird system behavior.

The best approach is to select a CPU _most similar_ to the CPU you're going to pass through later. In the case of Ryzen, the `EPYC` selection is going to be your best bet.

We'll tune our CPU later on.

### Graphics

For the installation, you'll need the default Spice graphics attached so you can see the installer.

### PCI passthrough

During the installation I recommend having all PCI devices you want to pass through selected, as Windows 10 will automatically try to grab drivers for these as soon as you get network connectivity. The _Add new hardware_ option in the libvirt UI for your VM allows you to specify PCI devices you want to pass through.

Select the device ID's you previously isolated and pass them through.

### Networking

In the networking section of your VM configuration you'll want to specify the previously created `br0` interface.

### Boot priority

Remember those ISO images I told you to download earlier? We're finally going to use them. Attach the virtio ISO file and the Windows 10 installer to a VirtIO devices to your VM, then set your boot priority to be the hard drive you want Windows installer to, followed by the Windows 10 installer.

## Installing Windows 10

Assuming everything works, save your changes to your VM configuration then click the play button. You should be greeted by the TianoCore UEFI loader, followed by the Windows 10 installation screen.

<span class="image featured">
    <picture>
        <source srcset="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A07%3A27.webp" crossorigin="anonymous" type="image/webp">
        <img src="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A07%3A27.png" />
    </picture>
</span>

The rest of this section is screenshots with commentary. If you've done this before skip ahead.

----

After clicking install, you'll get the license screen. I recommend skipping adding your license until after you have Windows 10 installed just to ensure you don't burn your license on a hardware configuration you're not happy with.

<span class="image featured">
    <picture>
        <source srcset="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A07%3A38.webp" crossorigin="anonymous" type="image/webp">
        <img src="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A07%3A38.png" />
    </picture>
</span>

Regardless of what version of Windows you're _ultimately_ going to install, I recommend installing Windows 10 Pro _even if you have an Education or Home license_. Windows 10 will adjust it's feature set automatically after adding your license key.

<span class="image featured">
    <picture>
        <source srcset="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A07%3A52.webp" crossorigin="anonymous" type="image/webp">
        <img src="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A07%3A52.png" />
    </picture>
</span>

Windows 10 doesn't know how to access our disk until we tell it what driver to use, so we need to select a custom installation.

<span class="image featured">
    <picture>
        <source srcset="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A08%3A47.webp" crossorigin="anonymous" type="image/webp">
        <img src="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A08%3A47.png" />
    </picture>
</span>

So we tell Windows to load a custom driver.

<span class="image featured">
    <picture>
        <source srcset="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A08%3A55.webp" crossorigin="anonymous" type="image/webp">
        <img src="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A08%3A55.png" />
    </picture>
</span>

If your virio ISO disk was correctly added, navigate to that drive, then select `viostor\w10\amd64\viostor.inf`. If you don't see the virtio ISO disk you added, stop the VM and re-check your configuration. The correct driver will look as follows:

<span class="image featured">
    <picture>
        <source srcset="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A09%3A18.webp" crossorigin="anonymous" type="image/webp">
        <img src="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A09%3A18.png" />
    </picture>
</span>

Windows 10 will now see our disk, and we can do our normal partitioning.

<span class="image featured">
    <picture>
        <source srcset="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A09%3A44.webp" crossorigin="anonymous" type="image/webp">
        <img src="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A09%3A44.png" />
    </picture>
</span>

<span class="image featured">
    <picture>
        <source srcset="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A10%3A09.webp" crossorigin="anonymous" type="image/webp">
        <img src="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A10%3A09.png" />
    </picture>
</span>

And finally we're installing Windows 10.

<span class="image featured">
    <picture>
        <source srcset="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A10%3A32.webp" crossorigin="anonymous" type="image/webp">
        <img src="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A10%3A32.png" />
    </picture>
</span>

The VM will reboot, then we have to deal with the rest of the installer.

<span class="image featured">
    <picture>
        <source srcset="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A16%3A30.webp" crossorigin="anonymous" type="image/webp">
        <img src="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A16%3A30.png" />
    </picture>
</span>

You won't have network connectivity _quite_ yet, so we need to skip this for now.

<span class="image featured">
    <picture>
        <source srcset="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A17%3A46.webp" crossorigin="anonymous" type="image/webp">
        <img src="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A17%3A46.png" />
    </picture>
</span>

Follow the rest of the guided install from here on out. Adjust your preferences as desired.

# Windows 10 post installation

After completing the installation we'll launch into Windows.

## Driver installation

Our first step is to get the rest of the drivers installed so we have a stable system. Open up `Device Manager` to get started.

### Balloon Driver

The balloon driver allows for memory in the guest to be re-sized dynamically. In the `Other devices` category, you should see an option called `PCI Device`. Select the driver from the VirtIO ISO, which should be under `Balloon\w10\amd64`, then press install.

<span class="image featured">
    <picture>
        <source srcset="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A43%3A55.webp" crossorigin="anonymous" type="image/webp">
        <img src="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A43%3A55.png" />
    </picture>
</span>

### Networking

Next you'll want to install the network driver. Select the `Ethernet Controller` under `Other devices`. Install the `NetKVM\w10\amd64` driver.

<span class="image featured">
    <picture>
        <source srcset="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A43%3A20.webp" crossorigin="anonymous" type="image/webp">
        <img src="https://assets.erianna.com/windows10-install/Screenshot_Windows10_2018-08-17_11%3A43%3A20.png" />
    </picture>
</span>

Assuming your bridge adapter on the host is properly configured, Windows should automatically detect the new network interface after the driver is installed.

### Graphics

At this point Windows is going to try to do a bunch of things, namely install updates and grab any other drivers. At some point it'll try to install _a_ graphics drivers.

Before installing an updated graphics card, I _highly_ recommend you install a few remote access tools so that you can access your VM in the event your graphics card drivers act up.

After installing _and testing_ some remote access tools, find the latest graphics card driver and install it.

My recommendations for installation is to do a clean install before installing or upgrading any graphics drive. Both AMD and Nvidia offer tools that allow you to completely remove their driver. After removing the driver, reboot, then install the latest driver.

While this may be a pain, it does make graphics card driver updates easier.

## Remote Access

In the event your graphics card acts up, you'll need a way to access your VM. There are a couple of options I recommend:

1. NoMachine
NoMachine has good cross-platform compatibility, and is a good option in addition to any other remote desktop tools you plan to install.

2. Remote Desktop
The default remote desktop is a good tool, but depending upon the state of your graphics card, may not show anything more than a black screen.

3. Spice Graphics Adapter
In the worst case, you can always fall back to the spice graphics adapter that you used during installation.

## Activate Windows

Once you have your system in a state your happy with, activate Windows.

# XML Configuration Changes

After shutting down the VM we can make additional changes to your VM configuration to make it perform better.

## Disable Spice

In the libvirt UI, remove the Spice graphics adapter that was added.

## CPU Change

There's a few CPU changes we can make to improve performance.

### Host-Passthrough

In the libvirt UI, change the CPU type to be `host-passthrough`. Now the next time Windows it booted it should see the exact model of your CPU (though you still won't be able to use any special tools for your CPU like Ryzen Master).

```xml
<cpu mode='custom' match='exact' check='partial'>
    <model fallback='allow'>host-passthrough</model>
    <topology sockets='1' cores='6' threads='2'/>
</cpu>
```

### CPU Pinning

For better performance you can pin specific CPU threads for use in the guest. When using Windows I usually want as much processing power as is available dedicated to it, so on my Ryzen 2700, I pass through 12 of the 16 cores. Adjust your configuration as necessary.

```xml
<vcpu placement='static'>12</vcpu>
<iothreads>6</iothreads>
<cputune>
    <vcpupin vcpu='0' cpuset='0'/>
    <vcpupin vcpu='1' cpuset='1'/>
    <vcpupin vcpu='2' cpuset='2'/>
    <vcpupin vcpu='3' cpuset='3'/>
    <vcpupin vcpu='4' cpuset='4'/>
    <vcpupin vcpu='5' cpuset='5'/>
    <vcpupin vcpu='6' cpuset='6'/>
    <vcpupin vcpu='7' cpuset='7'/>
    <vcpupin vcpu='8' cpuset='8'/>
    <vcpupin vcpu='9' cpuset='9'/>
    <vcpupin vcpu='10' cpuset='10'/>
    <vcpupin vcpu='11' cpuset='11'/>
    <iothreadpin iothread='1' cpuset='0-1'/>
    <iothreadpin iothread='2' cpuset='2-3'/>
    <iothreadpin iothread='3' cpuset='4-5'/>
    <iothreadpin iothread='4' cpuset='6-7'/>
    <iothreadpin iothread='5' cpuset='8-9'/>
    <iothreadpin iothread='6' cpuset='10-11'/>
</cputune>
```

## HyperV entitlements

If you tell Windows 10 it's a VM, it'll behave appropriately. HyperV entitlements can be set in the `<features>` section. Setting the HyperV entitlements, KVM hidden state, and telling KVM what kind of clock it should use will improve performance.

```xml
<features>
    <acpi/>
    <apic/>
    <hyperv>
        <relaxed state='on'/>
        <vapic state='on'/>
        <spinlocks state='on' retries='8191'/>
    </hyperv>

    <kvm>
        <hidden state='on'/>
    </kvm>

    <clock offset='localtime'>
        <timer name='rtc' tickpolicy='catchup'/>
        <timer name='pit' tickpolicy='delay'/>
        <timer name='hpet' present='no'/>
        <timer name='hypervclock' present='yes'/>
    </clock>
</features>
```

## Disk IO threads

Performance issues outside of the graphics card are most likely caused by the physical disk itself. Disk IO can be moved to a dedicated thread by setting the `io=threads` option on your disk device. The relevant configuration is listed below.

```xml
<disk type='block' device='disk'>
    <driver name='qemu' type='raw' cache='none' io='threads'/>
    <source dev='/dev/disk/by-id/<device_id>'/>
    <target dev='vda' bus='virtio'/>
</disk>
```

# Peripherals

There's a dozen different ways you can setup your peripherals to work with this setup. I've listed a few of the options, and what my recommended approach is for each one. In general, there's almost always two options: hardware and software. Software is sometimes free and usually works well enough to get by on. Dedicated hardware will give you the best experience, but costs more.

## Mouse & Keyboard

You have a few options for how you may want to connect your mouse and keyboard.

##### PCI Passthrough

PCI passthrough of a USB controller will get you the best performance, and allow you to use hardware features such as custom profiles and lighting effects via iCue or similar software. In short, plug your mouse and keyboard into a USB device that you're passing to the guest via PCI passthrough.

If you're running short on PCI devices you can pass in a dedicated IOMMU group like I am, the best approach is to get plug your mouse and keyboard into a USB 2.0 switch, then plug that switch into a USB 3.0 hub, connected to your USB controller.

In my setup I have my mouse and keyboard plugged into a cheap USB 2.0 hub, which is connected to the input of a UGREEN USB 2.0 switch. The USB switch connects two inputs to the computer. The first goes to any USB 2.0 port on the motherboard, and the second goes to a PCI device I'm passing through. Because my passed through USB options were rather limited, I hooked the UGREEN Switch into a Anker USB 3.0 hub so I didn't lose my only 2 USB ports on my mouse and keyboard.

- [UGREEN USB 2.0 Switch](https://www.amazon.com/gp/product/B01CU4QD1I)
- [USB 2.0 Hub](https://www.amazon.com/gp/product/B00J9R1QCQ)
- [Anker USB 3.0 Hub](https://www.amazon.com/gp/product/B00O0KISQE)

Of course, your other option is to simply switch the mouse and keyboard USB cable each time, but the solution I have lets me press a single button and switch through all my periphials at once.

With PCI passthrough you're going to have full access to your mouse and keyboard hardware (including lighting controls), while having seamless performance.

##### EDEV

For those not-interested in spending more money on hardware, you can pass through your mouse and keyboard entirely in software. The performance on this for _most_ things is going to be pretty good. In the two weeks I used this method before my USB switch arrived I only had a few issues, mainly with key-rollover in games messing up input across the guest. I would recommend this if you're needing a Windows 10 guest for typing (programming and text editing). For gaming a simple USB switch will net you much less headaches.

1. Adding yourself to the `input` group. Logout and log back in.

    ```bash
    sudo usermod -a -G input <your_username>
    ```

2. Update AppArmor. Near the top of `/etc/apparmor.d/abstractions/libvirt-qemu` add the following line, then restart the AppArmor service.

    ```
    /dev/input/* rw,
    ```

3. Identify your mouse and keyboard in `/dev/input/by-id`. Your device should be easily identifiable.

    If you have more than 1 device per group run `cat /dev/input/by-id/[input device id]` on each device until you find the device that outputs garbled text when you move your mouse or type on your keyboard.

    > Note that some devices are split into multiple device ids, and you'll need to pass through all of them in the next step. Additionally not all devices will appear here.

4. Update your VM XML's file with `virsh edit <VM_NAME>`

    Ensure that the XML header is defined as follows:
    ```
    <domain type='kvm' id='1' xmlns:qemu='http://libvirt.org/schemas/domain/qemu/1.0'>
    ```

    Then add the following at the end of the XML before the `</domain>` closing section. Adjust the `KEYBOARD_NAME` and `MOUSE_NAME` to the ID's you identified in the previously step.

    ```xml
    <qemu:commandline>
        <qemu:arg value='-object'/>
        <qemu:arg value='input-linux,id=mouse1,evdev=/dev/input/by-id/MOUSE_NAME'/>
        <qemu:arg value='-object'/>
        <qemu:arg value='input-linux,id=kbd1,evdev=/dev/input/by-id/KEYBOARD_NAME,grab_all=on,repeat=on'/>
    </qemu:commandline>
    ```

5. VirtIO inputs work better in the VM with edev, so update your mouse and keyboard section to use the VirtIO driver.
    ```xml
    <input type='mouse' bus='virtio'>
        <address type='pci' domain='0x0000' bus='0x00' slot='0x0e' function='0x0'/>
    </input>
    <input type='keyboard' bus='virtio'>
        <address type='pci' domain='0x0000' bus='0x00' slot='0x0f' function='0x0'/>
    </input>
    <input type='mouse' bus='ps2'/>
    <input type='keyboard' bus='ps2'/>
    ```

    Then when you boot your machine, install the `vioinput\w10\amd64` driver.

Once edev is setup, you can toggle between the host and the guest by hitting both CTRL keys at the same time.

For more information, a great article on edev is available at: https://passthroughpo.st/using-evdev-passthrough-seamless-vm-input/.

##### Synergy

[Synergy](https://symless.com/synergy) is another good software solution for sharing a mouse and keyboard between the VM and guest. You can either buy a lifetime license, or compile Synergy2 from (Seamless' github page](https://github.com/symless/synergy-core).

Synergy will behave similarly to edev. It's great for typing and writing code, and functional in games to a point.

## Display

Multiple options exist for displays as well.

If your monitor supports multiple inputs, simply change the input each time you want to use the VM. If you want to see both monitors at the same time, simply buy another monitor.

Alternatively, you can use the [Looking Glass](https://looking-glass.hostfission.com/) software. Looking glass creates a shared memory buffer between the host and the guest to transmit raw data between the guest and host graphics card, and allows you to see whatever is on the guest graphics card in a normal window on Linux.

## Audio

Each person has different requirements for their audio setup. Some people are fine with only hearing audio on the device they're working on, while others need to hear audio from both the host and the guest at the same time. Consequently there's a lot of different options available. Listed below are a few of the options _in order of my preference_.

### Scream

[Scream](https://github.com/duncanthrax/scream) is a virtual networked soundcard that allows you to stream audio from Windows to your guest. The benefit of this is that you can mix audio from both the host and the guest on the host. Scream supports 5.1 digital over IVSHMEM (similar to how looking-glass works), allowing local, secure, and effectively latency free audio between your host and guest.

Short of buying dedicated audio hardware, this is the best option currently avaiable for audio between Windows and Linux.

1. Update your Windows VM's XML via `virsh` (eg `virsh edit Windows10`) and add the following before your closing `</devices>` tag.

    ```
    <shmem name='scream-ivshmem'>
      <model type='ivshmem-plain'/>
      <size unit='M'>2</size>
      <address type='pci' domain='0x0000' bus='0x00' slot='0x11' function='0x0'/>
    </shmem>
    ```

    > If you're using looking glass, adjust the slot number to be +1 whatever looking glass is.

2. Start the VM, and verify `/dev/shm/scream-ivshmem` is created.
3. Download the `scream-ivshmem` pulse-audio adapter from https://github.com/duncanthrax/scream/tree/master/Receivers/pulseaudio and compile it. Then start your receiver:

    ```
    scream-ivshmem-pulse /dev/shm/scream-ivshmem
    ```

    > Since `/dev/shm/scream-ivshmem` won't exist on boot, you can configure KVM to run a script that executes `scream-ivshmem-pulse /dev/shm/scream-ivshmem` once your VM is started.

4. Windows 10 won't prompt you to install the IVSHMEM driver so we'll need to install it manually. From the [looking-glass wiki]:

    > Windows will not prompt for a driver for the IVSHMEM device, instead it will use a default null (do nothing) driver for the device. To install the IVSHMEM driver you will need to go into device manager and update the driver for the device "PCI standard RAM Controller" under the "System Devices" node.

    > A signed Windows 10 driver can be obtained from Red Hat for this device from the below address:

    > https://fedorapeople.org/groups/virt/virtio-win/direct-downloads/upstream-virtio/

5. Within your VM, download Scream 3.1+ from the Github release page and install it.
6. Open up `regedit.exe` then add a DWORD `HKLM\SYSTEM\CurrentControlSet\Services\Scream\Options\UseIVSHMEM` and set it's value to match whatever your `<size unit='M'>2</size>` is in your XML configuration.
    >  Note that Scream will identify the device by it's size. Note also you may need to create the `Options` key.
7. Restart the guest and verify your audio connectivity.

#### Scream over Network

The IVSHMEM option is preferred as it gives latency free audio and is secure between the host and guest. If you'd still rather have networked audio you can use `scream-pulse` instead then add a user systemd script

```
./scream-pulse -i br0
```

For my purposes, I have Scream setup as a user systemd unit which spawns when I login. This allows for a seamless setup.

```
[Unit]
Description = Scream Audio Pulse Audio Server
After=network.target local-fs.target

[Timer]
OnBootSec=60

[Service]
Type=simple
RemainAfterExit=true
StandardOutput=journal
ExecStart=/path/to/scream-pulse -i br0
Restart=on-failure
PrivateTmp=true
NoNewPrivileges=true

[Install]
WantedBy=default.target
```

### PCI passthrough

There are several options for PCI passthrough.

#### HDMI audio

Any modern graphics card has a dedicated audio device. Your monitor most likely supports audio, and if it doesn't probably gives you the option to pass audio through to a 3.5mm device. The audio quality will be native, but you won't be able to mix it.

#### USB audio

As an alternative to audio sent along with the HDMI display, you can buy a cheap USB sound card and plug it in to the USB device you're passing through. Mixing audio from 2 3.5mm sources is pretty simple, assuming you have the hardware. Otherwise just plug in the audio device you want to listen to when switching inputs.

#### PCI passthrough of dedicated sound card

If you have available PCI slots in a dedicated IOMMU group you can add a dedicated sound card. Sound quality will be superb on your output device. If you need mixing buy additional hardware to mix multiple sources.

#### PCI passthrough of motherboard sound card

If you don't care about what's on the host, just pass through your motherboard's built in audio device (along with every other device in that IOMMU group). The audio on this will be great, bit passing through that much of your motherboard may give you problems.

# Tips and tricks

Listed below are a few tips and tricks I've learned in the 6 months since I've been using this setup full time.

## System image & backup

Take a full backup of your disk image. If you're using a RAW image, copy it to an external hard drive, or use Window's built in System Image tool. Re-installing Windows and all the software you installed is not a productive use of your time. In the event your configuration gets screwed up, recovering from a full system image backup is relatively painless process if you're using it.

My advice for Windows System Images is to store them on an external hard drive, and take a full backup as often as you deem necessary. In my case I like to take a full backup after each major software installation, and before and after each graphics card update.

1. Boot into your Windows 10 installer ISO, then launch recovery.
2. Launch Command Prompt, then load your VirtIO storage driver:

    ```
    drvload D:\viostor\w10\amd64\viostor.inf
    ```
3. Close Command Prompt, then choose the option to recover Windows from a backup. Select the backup you previously made then wait for the restore to finish.

## Overclocking

Windows 10 will inherit whatever CPU clockspeed you set in your BIOS. Test using Cinebench or other tools to ensure you have a stable overclock.

Personally, I prefer checking the overclock on the host using something that will take a while to compile and that will consume all threads. The best non-benchmarking tool I've found is to simply compile Swift4. If I can compile Swift 3 times in a row from a clean slate without a crash then the overclock is stable.

## Graphics driver installation

Graphics driver updates are scary due to their unique ability to hose a perfectly working system. My current approach with my AMD card is as follows:

1. Download the updated graphics driver from AMD's website.
2. Use the AMD clean un-install tool.
3. Reboot
4. Install the new driver from the previously download driver package.
5. Reboot and check stability.

If you encounter instability, rollback to the previously driver. If you lose graphics ever after rolling back to the previous driver, restore from a full system image.

## Fixing AppArmor after kernel upgrade

Unlike everything else in the Linux ecosystem, AppArmor is still as obnoxious as the day it was introduced. Upgrading your kernel will almost certainly break something either with libvirt itself, or with other parts of your system.

If you do encounter issues booting your VM (or anything else), reading the logs and running `dmesg -w` will help you identify what the problem is. If AppArmor is throwing `DENIED` errors, you have a permissions problem _somewhere_ in AppArmor.

AppArmor's error messages _aren't_ the best, so you may need to do some hunting before you find out the real culprit of your problems.

The two problems I encountered are listed below:

### Libvirt

Libvirt is most likely going to complain about ptrace problems. Check that your `/etc/apparmor/abstractions/libvirt-qemu` has `ptrace (readby, tracedby) peer=/usr/sbin/libvirtd,` somewhere in the file, then restart AppArmor.

### Snap Apps

Snap has outstanding issues with AppArmor on newer kernels. The _easiest_ solution is to upgrade snap core to the Beta channel which fixes ptrace issues with AppArmor.

```
sudo snap refresh core --beta
```

> See: https://forum.snapcraft.io/t/custom-kernel-error-on-readlinkat-in-mount-namespace/6097/33

## Recovering bad initramfs.

When working with initramfs it's pretty easy to break your setup by accident. If you have LUKS installed it makes recovering your system a bit more complicated. If your initramfs setup breaks your boot process will _eventually_ dump you to the following prompt.

```
BusyBox v.1.21.1 (Ubuntu 1:1.21.1-1ubuntu1) built-in shell (ash)
Enter 'help' for list of built-in commands.

(initramfs)
```

LUKS makes this a bit more complicated. Your recovery steps are as follows:

1. Determine your crypt volume name from `/etc/crypttab` for your root volume. You'll need this first as this value _must_ match what initramfs expects for booting.
2. Create a live USB and boot into it.
3. Decrypt your drive then mount it:
```
# cryptsetup luksOpen /dev/nvme0n1p5 nvme0n1p5_crypt
# vgchange -ay
# mount /dev/mapper/ubuntu--vg-root /mnt
# mount /dev/nvme0n1p1 /mnt/boot
# mount -t proc proc /mnt/proc
# mount -o bind /dev /mnt/dev
```
4. If you don't have networking, copy the live CD's `/etc/resolv.conf` to the mounted volume. Don't worry about any existing symlink, Ubuntu will fix it on next boot.
5. Chroot into the volume:
```
# chroot /mnt
```
5. Fix whatever is causing your initramfs issues, then update initramfs.
```
update-initramfs -c -k all
```
6. Reboot the live CD and hopefully you'll get a LUKS prompt.

# Useful scripts & tools

Listed below are a few useful tools and scripts I used during this process.

## Determining IOMMU groupings

The following script can be used to determine your IOMMU groups. Create a file called `iommu`, then mark it as executable via `chmod +x iommu`.

```bash
#!/bin/bash
for d in /sys/kernel/iommu_groups/*/devices/*; do
  n=${d#*/iommu_groups/*}; n=${n%%/*}
  printf 'IOMMU Group %s ' "$n"
  lspci -nns "${d##*/}"
done
```

The script can be then run as follows. I recommend sorting the output by group number just readability:

```
./iommu | cut -c13- | sort -g
```

The output for an Asus Prime X470 PRO is as follows:

```
0 00:01.0 Host bridge [0600]: Advanced Micro Devices, Inc. [AMD] Family 17h (Models 00h-0fh) PCIe Dummy Host Bridge [1022:1452]
1 00:01.1 PCI bridge [0604]: Advanced Micro Devices, Inc. [AMD] Family 17h (Models 00h-0fh) PCIe GPP Bridge [1022:1453]
2 00:01.3 PCI bridge [0604]: Advanced Micro Devices, Inc. [AMD] Family 17h (Models 00h-0fh) PCIe GPP Bridge [1022:1453]
3 00:02.0 Host bridge [0600]: Advanced Micro Devices, Inc. [AMD] Family 17h (Models 00h-0fh) PCIe Dummy Host Bridge [1022:1452]
4 00:03.0 Host bridge [0600]: Advanced Micro Devices, Inc. [AMD] Family 17h (Models 00h-0fh) PCIe Dummy Host Bridge [1022:1452]
5 00:03.1 PCI bridge [0604]: Advanced Micro Devices, Inc. [AMD] Family 17h (Models 00h-0fh) PCIe GPP Bridge [1022:1453]
6 00:03.2 PCI bridge [0604]: Advanced Micro Devices, Inc. [AMD] Family 17h (Models 00h-0fh) PCIe GPP Bridge [1022:1453]
7 00:04.0 Host bridge [0600]: Advanced Micro Devices, Inc. [AMD] Family 17h (Models 00h-0fh) PCIe Dummy Host Bridge [1022:1452]
8 00:07.0 Host bridge [0600]: Advanced Micro Devices, Inc. [AMD] Family 17h (Models 00h-0fh) PCIe Dummy Host Bridge [1022:1452]
9 00:07.1 PCI bridge [0604]: Advanced Micro Devices, Inc. [AMD] Family 17h (Models 00h-0fh) Internal PCIe GPP Bridge 0 to Bus B [1022:1454]
10 00:08.0 Host bridge [0600]: Advanced Micro Devices, Inc. [AMD] Family 17h (Models 00h-0fh) PCIe Dummy Host Bridge [1022:1452]
11 00:08.1 PCI bridge [0604]: Advanced Micro Devices, Inc. [AMD] Family 17h (Models 00h-0fh) Internal PCIe GPP Bridge 0 to Bus B [1022:1454]
12 00:14.0 SMBus [0c05]: Advanced Micro Devices, Inc. [AMD] FCH SMBus Controller [1022:790b] (rev 59)
12 00:14.3 ISA bridge [0601]: Advanced Micro Devices, Inc. [AMD] FCH LPC Bridge [1022:790e] (rev 51)
13 00:18.0 Host bridge [0600]: Advanced Micro Devices, Inc. [AMD] Family 17h (Models 00h-0fh) Data Fabric: Device 18h; Function 0 [1022:1460]
13 00:18.1 Host bridge [0600]: Advanced Micro Devices, Inc. [AMD] Family 17h (Models 00h-0fh) Data Fabric: Device 18h; Function 1 [1022:1461]
13 00:18.2 Host bridge [0600]: Advanced Micro Devices, Inc. [AMD] Family 17h (Models 00h-0fh) Data Fabric: Device 18h; Function 2 [1022:1462]
13 00:18.3 Host bridge [0600]: Advanced Micro Devices, Inc. [AMD] Family 17h (Models 00h-0fh) Data Fabric: Device 18h; Function 3 [1022:1463]
13 00:18.4 Host bridge [0600]: Advanced Micro Devices, Inc. [AMD] Family 17h (Models 00h-0fh) Data Fabric: Device 18h; Function 4 [1022:1464]
13 00:18.5 Host bridge [0600]: Advanced Micro Devices, Inc. [AMD] Family 17h (Models 00h-0fh) Data Fabric: Device 18h; Function 5 [1022:1465]
13 00:18.6 Host bridge [0600]: Advanced Micro Devices, Inc. [AMD] Family 17h (Models 00h-0fh) Data Fabric Device 18h Function 6 [1022:1466]
13 00:18.7 Host bridge [0600]: Advanced Micro Devices, Inc. [AMD] Family 17h (Models 00h-0fh) Data Fabric: Device 18h; Function 7 [1022:1467]
14 01:00.0 Non-Volatile memory controller [0108]: Samsung Electronics Co Ltd NVMe SSD Controller SM961/PM961 [144d:a804]
15 02:00.0 USB controller [0c03]: Advanced Micro Devices, Inc. [AMD] Device [1022:43d0] (rev 01)
15 02:00.1 SATA controller [0106]: Advanced Micro Devices, Inc. [AMD] Device [1022:43c8] (rev 01)
15 02:00.2 PCI bridge [0604]: Advanced Micro Devices, Inc. [AMD] Device [1022:43c6] (rev 01)
15 03:00.0 PCI bridge [0604]: Advanced Micro Devices, Inc. [AMD] Device [1022:43c7] (rev 01)
15 03:04.0 PCI bridge [0604]: Advanced Micro Devices, Inc. [AMD] Device [1022:43c7] (rev 01)
15 03:06.0 PCI bridge [0604]: Advanced Micro Devices, Inc. [AMD] Device [1022:43c7] (rev 01)
15 03:07.0 PCI bridge [0604]: Advanced Micro Devices, Inc. [AMD] Device [1022:43c7] (rev 01)
15 05:00.0 USB controller [0c03]: ASMedia Technology Inc. ASM1142 USB 3.1 Host Controller [1b21:1242]
15 06:00.0 USB controller [0c03]: Fresco Logic FL1100 USB 3.0 Host Controller [1b73:1100] (rev 10)
15 07:00.0 Ethernet controller [0200]: Intel Corporation I211 Gigabit Network Connection [8086:1539] (rev 03)
16 08:00.0 VGA compatible controller [0300]: Advanced Micro Devices, Inc. [AMD/ATI] Polaris12 [1002:699f] (rev c7)
16 08:00.1 Audio device [0403]: Advanced Micro Devices, Inc. [AMD/ATI] Device [1002:aae0]
17 09:00.0 VGA compatible controller [0300]: Advanced Micro Devices, Inc. [AMD/ATI] Ellesmere [Radeon RX 470/480] [1002:67df] (rev e7)
17 09:00.1 Audio device [0403]: Advanced Micro Devices, Inc. [AMD/ATI] Ellesmere [Radeon RX 580] [1002:aaf0]
18 0a:00.0 Non-Essential Instrumentation [1300]: Advanced Micro Devices, Inc. [AMD] Device [1022:145a]
19 0a:00.2 Encryption controller [1080]: Advanced Micro Devices, Inc. [AMD] Family 17h (Models 00h-0fh) Platform Security Processor [1022:1456]
20 0a:00.3 USB controller [0c03]: Advanced Micro Devices, Inc. [AMD] USB 3.0 Host controller [1022:145f]
21 0b:00.0 Non-Essential Instrumentation [1300]: Advanced Micro Devices, Inc. [AMD] Device [1022:1455]
22 0b:00.2 SATA controller [0106]: Advanced Micro Devices, Inc. [AMD] FCH SATA Controller [AHCI mode] [1022:7901] (rev 51)
23 0b:00.3 Audio device [0403]: Advanced Micro Devices, Inc. [AMD] Family 17h (Models 00h-0fh) HD Audio Controller [1022:1457]
```

## Determining USB bus details

Determining what devices exists on what USB bus and IOMMU group can be done using the following script. Create a file called `usb-bus` and mark it as executable `chmod +x usb-bus`

```bash
#!/bin/bash
for usb_ctrl in $(find /sys/bus/usb/devices/usb* -maxdepth 0 -type l); do
    pci_path="$(dirname "$(realpath "${usb_ctrl}")")";
    echo "Bus $(cat "${usb_ctrl}/busnum") --> $(basename $pci_path) (IOMMU group $(basename $(realpath $pci_path/iommu_group)))"; lsusb -s "$(cat "${usb_ctrl}/busnum"):";
    echo;
done
```

The command can be run by calling:

```
./usb-bus
```

On my system the output is as follows:

```
Bus 1 --> 0000:02:00.0 (IOMMU group 15)
Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub

Bus 2 --> 0000:02:00.0 (IOMMU group 15)
Bus 002 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub

Bus 3 --> 0000:05:00.0 (IOMMU group 15)
Bus 003 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub

Bus 4 --> 0000:05:00.0 (IOMMU group 15)
Bus 004 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub

Bus 5 --> 0000:06:00.0 (IOMMU group 15)
Bus 005 Device 006: ID 0a12:0001 Cambridge Silicon Radio, Ltd Bluetooth Dongle (HCI mode)
Bus 005 Device 004: ID 2109:2812 VIA Labs, Inc. VL812 Hub
Bus 005 Device 002: ID 1038:1260 SteelSeries ApS
Bus 005 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub

Bus 6 --> 0000:06:00.0 (IOMMU group 15)
Bus 006 Device 002: ID 2109:0812 VIA Labs, Inc. VL812 Hub
Bus 006 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub

Bus 7 --> 0000:0a:00.3 (IOMMU group 20)
Bus 007 Device 004: ID 0a12:0001 Cambridge Silicon Radio, Ltd Bluetooth Dongle (HCI mode)
Bus 007 Device 003: ID 0d8c:013c C-Media Electronics, Inc. CM108 Audio Controller
Bus 007 Device 002: ID 2109:2813 VIA Labs, Inc.
Bus 007 Device 007: ID 1b1c:1b2e Corsair
Bus 007 Device 006: ID 2516:0059
Bus 007 Device 005: ID 1a40:0101 Terminus Technology Inc. Hub
Bus 007 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub

Bus 8 --> 0000:0a:00.3 (IOMMU group 20)
Bus 008 Device 002: ID 2109:0813 VIA Labs, Inc.
Bus 008 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub
```

# XML

For reference, my current XML is available at [windows10-vfio.xml](/windows10-vfio.xml)
