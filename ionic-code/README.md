# README example...

This README is only for example, is related to an hybrid application with Ionic:
[Reach app play store](https://play.google.com/store/apps/details?id=com.globalenglish.reach&hl=en_US)

![Alt text](readme-files/reach-app.png?raw=true "Reach app")

## Instalation

## Dependences
* [Android SDK](https://developer.android.com/studio/releases/sdk-tools.html)
  * OSX
    * XCode Command Line Tools
* [NodeJS 6.10 LTS](https://nodejs.org/en/)
* [Ionic 3](https://ionicframework.com/docs/v2/intro/installation/)
  * Angular 4
  * Cordova
  * TypeScript 2

```bash
$ sudo npm install -g ionic cordova
```

### Instalation

```bash
$ npm install
```
## Testing dependences

Install Karma Cli
```bash
npm install -g karma-cli
```
### Emulate with the Ionic CLI:

Web

```bash
$ ionic serve
```

Android

```bash
$ ionic cordova platform add android
```

```bash
$ ionic cordova build android
```

Run the emulator

```bash
$ ionic cordova run android
```

## Configuration

### Setup

The configuration file is based on two JSON files. The `default.json` is the base config file which is versioned in the GIT repo and contain all the default values for every configurable setting. On the other hand there's `local.json` which is not versioned and it's needed to create it manually in order to override any of the `default.json` values.

### Usage

The configuration file is provided through a `Config` class placed in `src/config/config.ts`. It's not an Angular Service so that it can be used even before Angular is ready.

In order to retrieve the config values it has a static method `get()` , it also has the same functionally as lodash's `get()` method.

Example:

`src/config/default.json`
```javascript
{
  "foo": "bar",
  "some": {
    "nested": {
      "value": 1 
    }
  },
  "override_me": "not overridden"
}
```

`src/config/local.json`
```json
{
  "override_me": "overridden"
}
```

```javascript
import { Config } from '../config/config';

Config.get('foo'); // bar
Config.get('some.nested.value'); // 1
Config.get('override_me'); // overridden
```

## Commands

### update-cordova-config

A command for editing the config.xml file

#### Usage:

```bash
$ npm run update-cordova-config -- -i "com.globant.geappdevelopment" -n "Ge App QC" -b 123 --fabricApiKey "FABRIC_API_KEY" --fabricApiSecret "FABRIC_SECRET"
```

### compare-json-i18n

A command for comparing i18n JSON files.

Internally uses https://www.npmjs.com/package/compare-json

It will output errors and differences between all the i18n files and will exit the process with error code 1 when at least one error was found.

#### Usage:

```bash
$ npm run compare-json-i18n
```
