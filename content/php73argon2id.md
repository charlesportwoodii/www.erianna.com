---
title: "Protecting Passwords with Argon2id in PHP 7.3"
description: "Better password security in PHP 7.3 with Argon2id"
keywords: "Argon2id,PHP,PHP 7.3,password_hash,Password"
date: 2018-06-12T13:30:00-05:00
slug: "introducing-support-for-argon2id-in-php73"
draft: false
type: "blog"
---
Starting with PHP 7.3, Argon2id may be used as part of the `password_*` functions to provide better password security.

This article I cover the benefits of Argon2id, how to compile Argon2id into PHP, how to use Argon2id within your PHP 7.3 applications, and some useful pieces of information about Argon2id usage within applications in general.

For more information on Argon2id support within PHP 7.3, reference the [Argon2 Password Hash Enhancements RFC](https://wiki.php.net/rfc/argon2_password_hash_enhancements) on the PHP Wiki.

<!--more-->

# Why use Argon2id?

Argon2id is a hybrid of Argon2i and Argon2d, using a combination of data-depending and data-independent memory accesses, which gives some of Argon2i's resistance to side-channel cache timing attacks and much of Argon2d's resistance to GPU cracking attacks.

Due to these reasons, Argon2id is the preferable choice when hashing passwords.

More information on Argon2id can be found on the [IETF Draft Specification](https://www.ietf.org/archive/id/draft-irtf-cfrg-argon2-03.txt).

# Including Argon2id in PHP 7.3

Similar to the original [Argon2 RFC](https://wiki.php.net/rfc/argon2_password_hash), Argon2id support can be compiled into PHP by declaring the `--with-password-argon2[=DIR]` configure argument when building PHP. Unlike the original RFC however, support for Argon2id within PHP is only available if you're using [libargon2 >= 20161029](https://github.com/P-H-C/phc-winner-argon2/releases).

## Compiling libargon2

If your operating systems does not bundle the appropriate version of libargon2, you can easily download and compile it manually.

```bash
# Download the latest version
git clone https://github.com/P-H-C/phc-winner-argon2 -b 20171227 libargon2
cd libargon2
CFLAGS="-fPIC" make -j1  # OPTTARGET=i686
                         # If you're having runtime issues, define the OPTTARGET to your system
# Run `make install` to install it to your system

# To statically compile libargon2 to your system, run the following commands instead
# ln -s . lib
# ln -s . lib64
# ln -s . libs
# rm -rf libargon2.so*
```

## Configuring PHP

Now that you have the latest libargon2 version installed, you can recompile PHP.

If libargon2 is installed to your system, adding support is as simple as running:
```bash
./configure --with-password-argon2
```

If you wish for libargon2 to be statically compiled, use the following command instead:
```bash
./configure --with-password-argon2=/path/to/libargon2
```

# Using Argon2id in PHP 7.3

The Argon2id RFC introduces a new constant, `PASSWORD_ARGON2ID`, which can be used identically to the `PASSWORD_ARGON2I` constant.

## Hashing Passwords

`PASSWORD_ARGON2ID` uses the same defaults as `PASSWORD_ARGON2I`, so if you're already using `PASSWORD_ARGON2I`, upgrading to Argon2id is as simple as replacing the algorithm constant.

```php
$hash = \password_hash('password', PASSWORD_ARGON2ID);
```

Similar to `PASSWORD_ARGON2I`, the memory, time, and threads constant can be adjusted manually to suite your needs.

```php
$hash = \password_hash(
    'password',
    PASSWORD_ARGON2ID,
    [
        'memory_cost' => 1<<12,
        'time_cost' => 2,
        'threads' => 2
    ]);
```

### Optimal Options

Due to the variety of platforms PHP runs on, the cost factors are deliberately set low as to not accidentally exhaust system resources on shared or low resource systems when using the default cost parameters.

```
memory_cost = 1024 KiB
time_cost = 2
threads = 2
```

Consequently, users should adjust the cost factors to match the system they're working on. The following list outlines hashing performance on various systems using these default cost values.

```
Common Cloud Server 512 MB, 1 Core: 3-5 ms
Common Cloud Server 2 GB, 2 Core, 1-3 ms
512 MB Raspberry Pi Zero: 75-85ms
```

As Argon2 doesn't have any "bad" values, however consuming more resources is considered better than consuming less. Users are encouraged to adjust the cost factors for the platform they're developing for.

When tuning Argon2, it's advisable to try to hit a 0.5ms target for hashing passwords

For the time being, my recommendation to start with the following cost factors, then adjust them as necessary to hit a 0.5ms hashing time for the system your intend to hash passwords on.

```
[
    'memory_cost' => 1<<12,
    'time_cost' => 3,
    'threads' => 2
]
```

## Verifying Passwords

Argon2id hashes can be verified using the `password_verify` function.

```php
$password = 'test';
$hash = '$argon2id$v=19$m=1024,t=2,p=2$WS90MHJhd3AwSC5xTDJpZg$8tn2DaIJR2/UX4Cjcy2t3EZaLDL/qh+NbLQAOvTmdAg'
var_dump(password_verify($password, $test));
// => true
```

## Retrieving Password Hash Info

Information about Argon2id hashed can be retrieved using the `password_get_info` function.

```php
var_dump(password_get_info('$argon2id$v=19$m=1024,t=2,p=2$ZUhOUVczSHpZRDBDU2ZBRA$k/vI1wKP4s0ecJIpUybRfgBeo3as1PhIV1Od6PvOEFA'));

array(3) {
  ["algo"]=>
  int(3)
  ["algoName"]=>
  string(8) "argon2id"
  ["options"]=>
  array(3) {
    ["memory_cost"]=>
    int(1024)
    ["time_cost"]=>
    int(2)
    ["threads"]=>
    int(2)
  }
}
```

## Rehashing

You can determine if password needs to be rehashed by using the `password_needs_rehash` function.

```php
$hash = password_hash('test', PASSWORD_ARGON2ID);
var_dump(password_needs_rehash($hash, PASSWORD_ARGON2ID));
// => false
var_dump(password_needs_rehash($hash, PASSWORD_ARGON2ID, ['memory_cost' => 1<<17]));
// => true
```

# Why Argon2id wasn't in 7.2

The original [password_hash RFC](https://wiki.php.net/rfc/argon2_password_hash) was created before Argon2id draft spec was complete or made available. When the original RFC was introduced, only Argon2i and Argon2d existed.

Argon2id was not introduced into the reference library until after the original RFC was voted on, approved, and merged into PHP 7.2. Per RFC rules for the `password_*` functions, any new algorithm requires a distinct and separate vote. To avoid last minute changes to the implementation in 7.2, Argon2id was omitted with the intent of adding it within 7.3

# Conclusion

Argon2id support will initially appear in PHP 7.3 Alpha 3, and will be fully supported on all platforms when PHP 7.3 released. For more information about the RFC, please refer to the <a href="#references">references</a> section below.

Be sure to reach out if you have any questions about support for Argon2id within PHP 7.3, or if you're interested in seeing more modern cryptography tools included in PHP in the future!

# References

[Argon2 RFC](https://wiki.php.net/rfc/argon2_password_hash)
[Argon2 Password Hash Enhancements RFC](https://wiki.php.net/rfc/argon2_password_hash_enhancements)
[PHP Merge Commit](https://github.com/php/php-src/commit/55277a668409b9d62ac42695934aca64e354869f)