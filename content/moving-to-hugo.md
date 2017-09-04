---
title: "Moving to Hugo"
description: "Migrating my personal blog from CiiMS to Hugo"
date: 2017-09-04T10:59:40-05:00
slug: "moving-to-hugo"
draft: false
type: "blog"
---

It's hard to believe that it has almost been an entire year since my last blog post. In that time a lot has happened and changed both with my personal life and in the web development world. With those changes comes the need to re-think the way I both host and manage my personal blog -- including the platform.

<!--more -->

Starting today, I'm moving my personal blog (and several other pages scattered across the internet) from being hosted on [CiiMS](https://www.github.com/charlesportwoodii/CiiMS) to being hosted on Google Storage with [Hugo](https://gohugo.io/). Along with this move comes re-consolodation of existing content, and dropping of some of the less beneficial content (such as package updates) from the site. My hope is that using Hugo will help me worry less about maintaining CiiMS as a platform and enable me to spend more time writing.

## The Reasons

There's a few reason, outside of the one previously shared for this migration:

1. One of the benefits of working with a platform is that you gain stability. Being platform developer means you can dicate the pace at which you adopt new technologies and integrate it into your system. As that platform ages however, you quickly become tied to the technology choices that you make. Since CiiMS was my _main_ side project, this wasn't allowing me to learn and adopt new technologies at the rate I wanted to - technologies such as Webpack2, SCSS, ES6, and so forth. In the web world, tooling changes rapidly, and if I can't adapt to new tools due to the platform then I need to change platforms.

2. There's only so much I can do with a single 512MB server. I host the majority of the content that requires a scripting language on a single 512MB server on DigitalOcean. Over the years there's been a lot of things that get added. This server runs PHP, Nginx, MySQL, Postgresql, Redis, Ruby, Python, and even Docker containers for all my personal uses, all under 512MB of RAM.

    As impressive as this may be, it comes with certain drawbacks. While MySQL is very performant, it is very memory hungry. nearly half of the memory on this server gets allocated just to MySQL. Furthermore, when MySQL innevitably crashes due to low memory constraints, it causes problems; namely that whenever I want to make a blog post on CiiMS I need to tweak InnoDB settings and restart MySQL. This is tedious at worst, but often times sucks up enough of the time I allocated to writing something down that I never get around to writing it down.

3. At the end of the day I care about the performance and uptime of my site. While I can achieve all of that through CiiMS, I can do it better by using a static site generator such as Hugo. For all the performance benefits CiiMS has, rendering a static page from disk is always going to be faster.

    While there will always be a place for more complex blogging platforms, I can get by and do everything I need on a static site generator. Getting by on less just makes sense.

4. And finally, Hugo enables me to do something CiiMS will never be able to do. I can push my content to Github, and pull it down anywhere in the world on any computer and start writing, _without_ the need to configure Docker, Vagrant, PHP, Nginx, or anything else. Hugo makes is super easy to write content and improve my site from any computer I may be at. This requires less resources on my personal computer, and removes another barrier to writing.

## Technical Details

For the technically inclined, here's a brief overview of how I write content and deploy my site now.

This site is broken up into 2 repositories, [a theme repo](https://github.com/charlesportwoodii/hugo-erianna-theme) where I can work on theme related aspects of the site (and work wiith SCSS and Webpack2). And [a content repo](https://github.com/charlesportwoodii/www.erianna.com) where I upload all of my content.

This makes my development workflow _very_ easy. Assuming I already have Hugo and Yarn installed, I simply pull the latest updates, start the Hugo development server, and watch my Webpack assets. With a single `yarn` command inside my themes folder, I can make content updates and theme updates and see them reflected via Hugo's live reload in real time.

```bash
yarn run dev
```

Once I'm satisfied with all of my changes, I simply push them to Github. Github triggers a [travis ci](https://travis-ci.org/charlesportwoodii/www.erianna.com) build, which downloads all the build dependencies and generates the static assets for the final site. Once everything passes the site is uploaded to Google Cloud Storage.

Nginx (running on this server) then performs a reverse proxy to Google Storage to display everything for your viewing pleasure.

I _vastly_ prefer this workflow to working with CiiMS, as it lets me develop both content and themage from anywhere, at a very low cost.

Thus far I am very happy with what I've been able to achieve with Hugo, and can't wait to get writing again.

> If you discover any issues with the site, or want to talk about my development or deployment strategy feel free to reach out. I'd love to chat!