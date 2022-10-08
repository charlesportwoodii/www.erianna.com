---
title: "A secure bluetooth DFU bootloader for nRF52"
description: "A better bootloader for nRF52 chipsets"
keywords: "Kaidyth,nRF, nRF52,nRF52840,Bootloader,Arduino,Adafruit"
date: 2022-10-08T09:00:00-05:00
lastmod: 2022-10-08T09:00:00-05:00
slug: "kaidyth-nrf52-bootloader"
draft: false
type: "blog"
---

Today I am publicly announcing the availability of a new nRF52 bootloader for nRF52840 circuits, which source code and binaries available at: https://github.com/kaidyth/nrf52_bootloader.

<!--more-->

## What is Kaidyth bootloader?

Kaidyth bootloader is an nRF52 bootloader that supports both pre-built, and custom nRF52 boards, with support ranging from Adafruit feather boards, Sparkfun Pro, Partical boards, Pitaya, Maker Diary, Arduino Nano, and more. It is an opinionated approach to bootloaders for these chipsets that feature the following main features:

- Secure Bootloader support. Updates and applications must be signed for installation, upgrading, and distribution.
- DFU support over BLE OTA, and USB Serial
- Self upgradable via BLE OTA, and USB
- Support for bootloader downgrading (with compile option)
- Double-tap to reset DFU trigger.

Prebuilt binaries for a variety of boards, including a generic debug variant is available on the Github releases page: https://github.com/kaidyth/nrf52_bootloader/tags. And instructions on how to compile and build the bootloader yourself are available on the main Github repo page: https://github.com/kaidyth/nrf52_bootloader.

## A note on Arduino

If you're looking for a bootloader for an Arudino application, I'd recommend you use the stock Adafruit nRF52 bootloader (https://github.com/adafruit/Adafruit_nRF52_Bootloader) rather than this one due to limitations with the soft-device on the nRF52 SDK.

### Arduino Support

This bootloader should compatible with Arduino Libraries excluding ones that interface with the Soft Device. Things such as I2C, GPIO, and Neopixels should work using their respective libaries, though I can't guarantee or provide support. Be sure to adjust your board linker settings and RAM regions to align with the Soft-Device version being used in the bootloader.

### Bluetooth / ArdinoBLE / Adarfruit NRF52 Bluefruit

The Nordic Secure Bootloader, and by proxy this bootloader do not officially support any operation that directly interfaces with the Soft Device, include Arduino BLE and Adafruit Bluefruit. If you want to use bluetooth functionality you are strongly encouraged to use the nRF5 SDK.