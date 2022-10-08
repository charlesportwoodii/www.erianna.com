---
title: "Announcing PBrick"
description: "A USB-C PD powered, Bluetooh controlled motor driver and IO software and hardware."
keywords: "Kaidyth,nRF,nRF52,nRF52840,pbrick,USB-C,USB-PD,Accelerometer,Motor Driver,Power toys,Power Legos"
date: 2022-10-08T10:00:00-05:00
lastmod: 2022-10-08T10:00:00-05:00
slug: "pbrick"
draft: false
type: "blog"
---

Today I am making source-available one of my pandemic projects - pbrick -- a  USB-C PD powered, Bluetooh controlled motor driver and IO software and hardware.

<span class="image featured" style="width: 75%; margin: 0 auto;">
    <picture>
        <source srcset="https://raw.githubusercontent.com/charlesportwoodii/pbrick/TB67H420FTG-24MM-C-a/pbrick.png" crossorigin="anonymous" type="image/png">
        <img src="https://raw.githubusercontent.com/charlesportwoodii/pbrick/TB67H420FTG-24MM-C-a/pbrick.png" />
    </picture>
</span>

<!--more-->

## About

PBrick is a personal project born out of a desire to learn Kicad, and develop embedded software, learn USB-C PD, and create a full end-to-end software solutions. I currently use pbrick to power a few custom toys, and other things that require motor driver for myself and kids.

While I won't call this "battle-tested" hardware and software, I have successfully manufactured and used it for over a year now without problem or incident.

This board has been in various stages of development since 2018, and has been significantly impacted by the semi-conductor supply chain.

## Features

- Dual motor driver for powering two separate motors independently, up to 20V5A (100W of power), and 12V3A per rail
- Dual motor driver ouputs on rear of board with input power output rails + GND
- USB-C Power Delivery (PD) input
- Configurable JST-2 pin connector for either PD output when using USB-C PD, or direct power input with backfeed protection
    (You may power the board either by USB-PD or by this PIN)
- i2c output on rear of board for running and powering additional accessories
- Programmable LED Status light
- Single button with double tap to reset functionality available in the [Kaidyth Bootloader](https://github.com/kaidyth/nrf52_bootloader)
- Accelerometer for rollover detection
- 4 Layer board with dedicated GND layer

<span class="image featured" style="width: 75%; margin: 0 auto;">
  <img src="https://raw.githubusercontent.com/charlesportwoodii/pbrick/TB67H420FTG-24MM-C-a/board_front.png" />
</span>

## Schematic
The current schematic is available at https://github.com/charlesportwoodii/pbrick/blob/TB67H420FTG-24MM-C-a/board/schematic.pdf.

More information about the board is available on Github: https://github.com/charlesportwoodii/pbrick

<span class="image featured" style="width: 75%; margin: 0 auto;">
  <img src="https://raw.githubusercontent.com/charlesportwoodii/pbrick/TB67H420FTG-24MM-C-a/board_rear.png" />
</span>

## License

Generally I am opposed to non-open source licenses however I've invested a enough time, energy, and money that at this point this project won't be considered "open-source". I am making the source code available online for Github for non-commercial purposes only, meaning that you may create and compile the code (and even mirror it elsewhere) under the BSD-3 clause license, but any commercial usage of it is not permitted. If you are interested in obtaining a commercial license for this please feel free to reach out and we can discuss terms based upon volume.