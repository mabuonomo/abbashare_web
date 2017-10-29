# #abbashare
With #abbashare you can install ios ipa (adhoc/enterprise profile) via browser Safari on iOS, without TestFlight or iTunes

Official Site: https://abbashare.com


## Prerequisites

On Windows, the installer can be found at https://www.meteor.com/install.

On Linux/macOS, use this line:

```bash
curl https://install.meteor.com/ | sh
```

## Quick Start

Install nodejs dependencies:
```bash
meteor npm install
```

Create a "settings.json" file in the root of the project:
```json
{
    "public": {
        "dropbox_api_id": "",
        "sentry_public": "",
        "admin_email": ""
    },
    "private": {
        "sentry_private": "",
        "email_user": "",
        "email_pass": "",
        "email_port": 0,
        "email_smtp": ""
    }
}
```

Run abbashare in development mode:
```bash
meteor --settings settings.json
```

Open a browser at:
```bash
http://localhost:3000
```

## Follow us
* Facebook      https://goo.gl/9E7QLF
* Twitter       https://goo.gl/P2a6aR
* Google Plus   https://goo.gl/Zn9f3g

## Technologies
* MeteorJS https://meteor.com
* NodeJS https://nodejs.org
* MongoDB https://www.mongodb.com
* AngularJS https://angularjs.org/
* Angular Material https://material.angularjs.org
* Socket.IO https://socket.io/
* Docker https://www.docker.com/
* Let's encrypt https://letsencrypt.org/
* Sentry https://sentry.io
* and more, see full stack at: https://stackshare.io/mabuonomo/abbashare

## Support us, coffee? No give me a beer!
[![paypal](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://goo.gl/HA5uc3)