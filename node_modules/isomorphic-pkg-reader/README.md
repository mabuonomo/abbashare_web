# isomorphic-pkg-reader
Read IOS/Android package's(.apk/.ipa ) manifest info, for NodeJS/Webpack/Browserify.

## Introduction
For `.apk`, parse the `AndroidManifest.xml` and `resources.arsc` files, read all values listed in AndroidManifest.xml(both primitive and reference type), also you can get and show the icon of the apk file directly from the parsed result.

For `.ipa`, parse the `info.plist` and `embedded.mobileprovision` files, read all basic information in info.plist file, including the icon of the ipa file(already handled the crushed pngs).

## Install
```javascript
npm i isomorphic-pkg-reader
```

## Example

``` javascript

npm i;
npm run start;

```

Then open http://localhost:3000 to try the DEMO. You can find the basic usage for browser and NodeJS in the /example folder.

### Constructor

#### PkgReader(pkgFile, Extensions, options)

```javascript
var PkgReader = require('isomorphic-pkg-reader');

// in browser, it received a file object or a blob object.
var reader = new PkgReader(blob/file, 'apk', { withIcon: true, iconType: 'base64', searchResource: true });
```

##### pkgFile {Blob/File/String}
In browser, you can pass a File object that you can get from a `<input type=file>`, or you can pass a Blob directly.

In NodeJS, you need to pass the path or the file (Don't support passing a Buffer in here).

##### Extensions {String}
The extensions of your file, like 'apk' or 'ipa', because we need to make sure what type of the package is before we start to parse, and it's not reliable by detecting the extensions by the file name.

##### Options {Object}

##### Options.withIcon {Boolean}
Default: false.

Do you need the icon for showing. If it's true, we will find out the icon from the package and turn it into a BlobUrl or Base64, so you can directly use it for show like:
```javascript
var reader = new PkgReader(file, 'apk', {withIcon: true});
reader.parse(function(err, pkgInfo) {
  document.querySelector('img').src = pkgInfo.icon; // It's a base64 DataUrl or a BlobUrl depending on another options: iconType
});
```
This options only works for browser.

#### Options.iconType {String}
Default: 'base64'

What type of icon you need to show, this can be either 'base64' or 'blob'.

This options only works for browser too.

#### Options.searchResource {Boolean}
Default: true

This options only works for .apk files. Whether parse the `resources.arsc` or not, if it's `false`, it won't parse the `resources.arsc` file and will return the information in the AndroidManifest.xml directly (So you can't read all reference type values).

### APIs

#### reader.parse(callback)

The basic method, unzip the package file, read the information of the package.

The callback function received two parameters: error and pkgInfo: `callback(error, pkgInfo)`

What's the `pkgInfo` like is totally different from .apk to .ipa, also if you set the `options.withIcon=true`, you can access the icon from `pkgInfo.icon`, it'll be a BlobUrl or a DataUrl.

#### reader.getEntries(whatYouNeed, [options], callback)
Basically this method just calling the `unzip.getBuffer` function which you can find the docs [here](https://www.npmjs.com/package/isomorphic-unzip#unzipgetbufferwhatyouneed-callback).

##### whatYouNeed {Array}
An array of String/RegExp/Function that contains the entry name you want to access.

##### options {Object}
Emm...currently we don't have any options here, forget it.

##### options.callback {Function}
Will be called like: `callback(error, buffers)`.

`buffers` is a object that use the entry name as key, Buffer object as value.

#### reader.getEntry(entryName, options, callback)
This function works just like getEntries, but this will only search for one entry a time.

#### reader.parseIcon(buffer, callback)
This method repair the crushed pngs from ipa, turing a buffer/blob into a [Png Object](https://www.npmjs.com/package/pngjs#class-png), then you can call the `reader.redraw(png, function(err, base64Icon))` to get the repaired icon.

##### buffer {Buffer/Blob}
Buffer/Blob of your icon

##### callback(error, png)

Notice:

You can access this method only when you're parsing an ipa package, because for apk there is no need to use it.

Sometimes when you set `options.withIcon=true`, but we can't find out the icon from a ipa file in our search rules(In which you can read the source from /lib/utils -> `findOutIcon` function), so in this situation(maybe rare), you can also find out the icon yourself and use this to repair a curshed png.

#### reader.redraw(png, [type,] callback)

##### png {Object}
A [Png Object](https://www.npmjs.com/package/pngjs#class-png) that you get from calling `reader.parseIcon`.

##### type {String}
What type of data you need to show an icon, can be either 'base64' or 'blob', default to be 'base64'.

##### callback(error, icon)
When you set `type=base64`, the `icon` is an base64 format image, if `type=blob`, the `icon` is an BlobUrl.


## Additional

Basically this pkg reader can get everything the other readers could get, and it can run both on browser and NodeJS.

Don't worried about the efficiency in browser, it's all async by using WebWorkers(That means it required IE10+, and currently it's only async in the unzipping process).

It's now working fine on our production environment, if you have any issue when using this, please make us know.

## CHANGE LOG

2016.6.13 `1.1.15`

Fix some range error when parsing .apk resource map. 