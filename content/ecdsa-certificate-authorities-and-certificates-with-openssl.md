---
title: "ECDSA Certificate Authorities and Certificates With OpenSSL"
description: "Everything you wanted to know about generating the next generation of public key ECC ECDSA certificates and certificate authorities with OpenSSL."
date: 2015-05-07T23:00:00-05:00
draft: false
type: "blog"
slug: "ecdsa-certificate-authorities-and-certificates-with-openssl"
---

A lot has been said recently about ECSDA certificates and elliptical curve cryptography (ECC), and about how they are the future of the humble SSL Certificate. [Cloudflare](https://www.cloudflare.com) has written [serveral](https://blog.cloudflare.com/a-relatively-easy-to-understand-primer-on-elliptic-curve-cryptography/) [articles](https://blog.cloudflare.com/ecdsa-the-digital-signature-algorithm-of-a-better-internet/) describing what excatly ECSDA certs are and how they function with ECC.


If you're not familiar with ECC yet though, Cloudflare provided a pretty basic __TL;DR;__ of what exactly ECC is and why it is important:

> [...] ECC is the next generation of public key cryptography and, based on currently understood mathematics, provides a significantly more secure foundation than first generation public key cryptography systems like RSA. If you're worried about ensuring the highest level of security while maintaining performance, ECC makes sense to adopt.
_https://blog.cloudflare.com/a-relatively-easy-to-understand-primer-on-elliptic-curve-cryptography/_

Based upon our current understanding of mathamatics, ECC provides _significantly_ better security and performance than a typica 2048 RSA certificate. In this article, we'll cover how to make a ECDSA Certificate Authority, a ECDSA compatible CSR, and how to sign ECDSA certs.

<!--more-->

## Generating Certificates

The basic steps in generating a CA with OpenSSL is to generate a key file, and then self-sign a cert using that key. To generate a new key file, you can run the following command:

```bash
openssl ecparam -genkey -name prime256v1 -out ca.key
```

Compared to our typical RSA certificate, there's a few different thigns going on here. First, instead of using ``rsa`` we're using the ```ecparam``` option in OpenSSL (see https://www.openssl.org/docs/apps/ecparam.html), which generates the eliptical curve parameters for our key. The next quirka bout generating ECC keys is the use of the ```-name prime256v1```, which specifies the exact curve we want to use.

At the time being, ```secp256p1``` is the only modern curve that works with most browsers. A list of all available curves can be viewed by running:

```bash
openssl ecparam -list_curves
```

Next, we'll want to self-sign the CA and generate a certificate file. If you're familiar at all with generating RSA certificates with OpenSSL, this should look familiar. The only other option we've added in here is the use of ```-SHA385```. From a security standpoint, there's no functional security benefit over using ```-SHA256```, so feel free to substitute whichever hash strength you're more comfortable with.

```bash
openssl req -x509 -new -SHA384 -nodes -key ca.key -days 3650 -out ca.crt
```

At this point, follow the on-screen prompts OpenSSL provides. We now have a self-signed root CA that we can use to sign other certificates.

### Creating a ECDSA CSR

Next, we'll want to generate the private key for our server certificate. This is the same command we used before to generate our CA keyfile.

```bash
openssl ecparam -genkey -name prime256v1 -out server.key
```

Then, we'll create a certificate signing request (CSR), which we'll use to either sign our certificate ourselves using our CA, or that we can pass on to a fully trusted CA.

```bash
openssl req -new -SHA384 -key server.key -nodes -out server.csr.
```

Once generated, you can view the full details of the CSR you generated as follows:

```bash
openssl req -in server.csr -noout -text
```

If you're signing the certificate yourself using the CA you created earlier, you can then run the following command:

```bash
openssl x509 -req -SHA384 -days 3650 -in server.csr -CA ca.crt -CAkey ca.key -CAcreateserial -out server.crt
```

Which will then generate the certificate for the domain in question.

When examining your cert now (I recommend using a tool like [SSLLabs](https://www.ssllabs.com/ssltest), you should see the following details.


<span class="image featured">
    <img src="https://assets.erianna.com/13iyP1lFRKqZSk2hTVhtrW9tw1lcd.PNG" />
</span>

----------------

If you have any questions about generated a ECC certificate, certificate authority, or CSR to sent to a trusted CA - or have any comments in general please leave a comment. I'd love to hear from you.
