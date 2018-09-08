---
title: "AMD Ryzen 2 GPU Passthrough with OVMF+VFIO and libvirt on Ubuntu 18.04 to Windows 10"
description: "Information for getting GPU passthrough working between Ubuntu 18.04 and Windows 10 using OVMF, VFIO, and Libvirt"
date: 2018-09-07T09:00:00-05:00
slug: "amd-ryzen2-gpu-passthrough-vfio-libvirt-ubuntu1804-windows10"
draft: false
type: "blog"
---

Unable to tolerate the significant performance losses I was seeing on my aging i5-2500 desktop, I recently elected to upgrade my desktop to something a bit more powerful that would enable me to work faster and get more done.

While planning out this process, I stumbled up [this](https://level1techs.com/article/ryzen-gpu-passthrough-setup-guide-fedora-26-windows-gaming-linux) article from mid 2017 detailing the process of getting GPU passthrough working on Fedora 26 with Ryzen.

Exhausted by the constant performance losses incurred by Spectre and Meltdown I was experiencing on my old i5-2500, and wanting to capitalize on the cost-per-core benefit Ryzen 2 offered, I decided to take the plunge into GPU passthrough and to see if it would be a viable long term solution for me, and my have I been pleased.

<figure>
    <img data-src="https://s3-us-west-2.amazonaws.com/cdn.ciims.io/erianna.ciims.io/windows10-install/windows10-vfio.PNG" class="lazy image fit">
    <figcaption>
        <h4 class="align-center">Virtualized Windows 10 running on Ubuntu 18.04 with GPU passthrough</h4>
    </figcaption>
</figure>

This write up details my experiences getting GPU passthrough working through Ubuntu 18.04 to Windows 10 using OVMF+VFIO and libvirt. While this document shouldn't be considered a comprehensive guide, it will cover what I needed to do to get this working (mainly so I can set it back up again if I ever need to), while also covering a few tips and tricks I've learned along the way.

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

To be entirely honest, WSL _works_ for the most part. Compared to dual booting or Cygwin, WSL _mostly_ works. However WSL isn't _perfect_, and after exclusivly using WSL for nearly a year, it has some pretty bad pain points.

1. Performance issues & missing features

    WSL is a brilliant example of Microsoft's ability to adapt to a changing landscape. And while WSL works out of the box for 99% of the things a normal developer needs throughout the day, there are still some pretty bad outstanding issues that bite you if you go off the beaten path.

    For example, the only way to avoid Window's long file name support is to move your files into the WSL container. The only way to access files inside the WSL filesystem is through your terminal. While there are some things you can do to get around it, the more "hacks" you add to WSL to less stable it becomes.

    Services, systemd, accessing ports, package management, and other stability issues make WSL a challenge once you start needing to do more Linux based commands.

2. Filesystem support

    Before [DRVFS](https://blogs.msdn.microsoft.com/wsl/2016/06/15/wsl-file-system-support/), WSL limited you to local disks (pretty much `C:` and `D:`). DRVFS improved things somewhat by letting you mount USB drives (NTFS and ReFS volumes), but that still doesn't help access other file systems, such as smaller USB drives, and SD cards.

3. Backup & upgrading

4. Doesn't completely eliminate Hyper-V

### Dual Booting

### Cygwin

# OVMF? VFIO? IOMMU? GPU passthrough? What does it all mean for Ryzen?

# Requirements & Setup

## Kernel / Ubuntu Kernel Upgrade Utility (UKUU)

## Hardware

### Graphics Cards

### Motherboard

### My Hardware

# Initial Host Setup

## BIOS Setup

## Stuff you should download while you're working

## Installing QEMU & virtualization tools

## Enable IOMMU

## VFIO & Modules

# Windows 10 Guest Setup

## Networking setup

## Configuring KVM virtual machine

## Installing Windows 10

# Windows 10 post installation

## Driver installation

## Remote Access

## PCI passthrough

# Periphials

## Mouse & Keyboard

## Display

## Audio

# "Gotcha's"

## Overclocking

## Driver installation

# Useful scripts & tools

## Determining IOMMU groupings

## Determining USB bus details