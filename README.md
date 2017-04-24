node-freeMaxMind-updater
================================================================================================================================

Javascript module for updating free Geo IP Maxmind binary databases (aka mmdb or geoip2). 
Based on Node.js EventEmitter, so that it can be combined with other Maxmind based modules. 

## GEO databases

Free GEO databases are available for [download here](http://dev.maxmind.com/geoip/geoip2/geolite2/).

## Installation

```shell
npm i fmaxmind-updater
```

## Usage

```javascript
var ipDatabaseUpdater = require('fmaxmind-updater');

var ipDbUpdater = new ipDatabaseUpdater({
  destFile: '/tmp/GeoLite2-Country.mmdb.gz',
  md5url: 'http://geolite.maxmind.com/download/geoip/database/GeoLite2-Country.md5',
  originFile: '/dbWillBeHere/GeoLite2-Country.mmdb',
  timeout: 24*60*60*1000,
  url: 'http://geolite.maxmind.com/download/geoip/database/GeoLite2-Country.mmdb.gz'
});

ipDbUpdater.on('error', function(data){ console.log(new Date(), data) });
ipDbUpdater.on('notice', function(data){ console.log(new Date(), data) });
ipDbUpdater.on('update', function(data){ console.log(new Date(), data) }); //reload maxmind plugin on this event

ipDbUpdater.start();
```

## Methods
### .start()
Initially get server hash which triggers all update process. Also set timeout to repeat this process. 
```javascript
var ipDatabaseUpdater = require('fmaxmind-updater');
var ipDbUpdater = new ipDatabaseUpdater();
ipDbUpdater.start();
```
### .stop()
Clears timeout, i.e. prevents next server hash checking.
```javascript
...
ipDbUpdater.stop();
```

## Events
Emits following events:

- error
- notice
- update

### error
Triggered when error occurs
```javascript
var ipDatabaseUpdater = require('fmaxmind-updater');
var ipDbUpdater = new ipDatabaseUpdater();

ipDbUpdater.on('error', function(data){ console.log(new Date(), data) });
```
### notice
Triggered when plugin has been started, stopped or database is up to date
```javascript
var ipDatabaseUpdater = require('fmaxmind-updater');
var ipDbUpdater = new ipDatabaseUpdater();

ipDbUpdater.on('notice', function(data){ console.log(new Date(), data) });
```
### update
Triggered when database has been updated
```javascript
var ipDatabaseUpdater = require('fmaxmind-updater');
var ipDbUpdater = new ipDatabaseUpdater();

ipDbUpdater.on('update', function(data){ console.log(new Date(), data) });
```

## Options
### destFile
Temporary file location which is used for downloading from server. Should have .gz extension.
```javascript
var ipDbUpdater = new ipDatabaseUpdater({
  ...
  destFile: '/tmp/GeoLite2-Country.mmdb.gz',
  ...
});
```
### md5url
Url for obtaining database md5 hash from maxmind server.
```javascript
var ipDbUpdater = new ipDatabaseUpdater({
  ...
  destFile: '/tmp/GeoLite2-Country.mmdb.gz',
  ... 
});
```
### originFile
Path to file to be updated.
```javascript
var ipDbUpdater = new ipDatabaseUpdater({
  ...
  originFile: '/dbWillBeHere/GeoLite2-Country.mmdb',
  ... 
});
```
### timeout
Checks for updates every 'timeout' milliseconds.
```javascript
var ipDbUpdater = new ipDatabaseUpdater({
  ...
  timeout: 24*60*60*1000,
  ... 
});
```
### url
Url of gziped free database.
```javascript
var ipDbUpdater = new ipDatabaseUpdater({
  ...
  url: 'http://geolite.maxmind.com/download/geoip/database/GeoLite2-Country.mmdb.gz',
  ... 
});
```

## Dependencies
md5-file by [linusu](https://www.npmjs.com/~linusu) [github repo](https://github.com/roryrjb/md5-file)

## License
MIT
