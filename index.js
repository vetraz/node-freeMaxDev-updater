var fs = require('fs'),
    http = require('http'),
    gzip = require('zlib').createUnzip(),
    inherits = require('util').inherits,
    eventEmitter = require('events').EventEmitter,
    md5File = require('md5-file');

module.exports = FreeMaxmindUpdater;

function FreeMaxmindUpdater (settings) {
    if (!(this instanceof FreeMaxmindUpdater)) return new FreeMaxmindUpdater();

    this.options = {
        destFile: '/tmp/GeoLite2-Country.mmdb.gz',
        md5url: 'http://geolite.maxmind.com/download/geoip/database/GeoLite2-Country.md5',
        originFile: '/GeoLite2-Country.mmdb',
        timeout: 24 * 60 * 60 * 1000, // 1 day
        url: 'http://geolite.maxmind.com/download/geoip/database/GeoLite2-Country.mmdb.gz'
    };

    this.hashes = {
        localDb: '', //filled after first upload
        serverDb: ''
    };

    if (settings && typeof settings === 'object') {
        var optionNames = Object.getOwnPropertyNames(this.options);
        for (var attr in optionNames) {
            attr = optionNames[attr];
            if (settings.hasOwnProperty(attr)) {
                this.options[attr] = settings[attr];
            }
        }
    }

    this.on('downloaded', this.replaceOriginal);
    this.on('serverhash', this.updater);
}

inherits(FreeMaxmindUpdater, eventEmitter);

FreeMaxmindUpdater.prototype.downloadFile = function () {
    var that = this;
    var download = fmmu_download(this.options.url, this.options.destFile);
    download.on('error', function (err) {
        that.emit('error', err);
    });
    download.on('end', function () {
        that.unGzip();
    });
};

FreeMaxmindUpdater.prototype.setfileHash = function (fileSrc, continueProcessing) {
    var that = this;
    md5File(fileSrc, function(err, hash) {
        if (err) {
            that.emit('error', 'MaxMind free database updater: Unable to get file hash');
            return;
        }
        that.hashes.localDb = hash;
        if (continueProcessing) {
            if (that.hashes.serverDb === that.hashes.localDb) {
                that.emit('downloaded', hash);
            } else {
                that.emit('error', 'MaxMind free database updater: Hashes mismatch');
            }
        }
    });
};

FreeMaxmindUpdater.prototype.serverHash = function (link) {
    var that = this;

    if (!link) {
        link = this.options.md5url;
    }

    var callback = function (response) {
        var str = '';

        response.on('data', function (chunk) {
            str += chunk;
        });

        response.on('end', function () {
            if (str) {
                if (str.length !== 32) {
                    that.emit('error', 'MaxMind free database updater: Wrong server hash');
                    return;
                }
                that.hashes.serverDb = str;
                that.emit('serverhash', str);
            } else {
                that.emit('error', 'MaxMind free database updater: Unable to get server hash');
            }
        });

        response.on('error', function () {
            that.emit('error', 'MaxMind free database updater: Unable to load hash from server');
        });
    };

    http
        .get(link, callback)
        .on('error', function (err) {
                that.emit('error', err);
            })
        .end();
};

FreeMaxmindUpdater.prototype.unGzip = function () {
    var that = this,
        outFile = this.options.destFile.replace('.gz', ''),
        inp = fs.createReadStream(this.options.destFile),
        out = fs.createWriteStream(outFile, {flags: 'w'});

    inp.on('error', function(){
        that.emit('error', 'MaxMind free database updater: Unable to open downloaded gzip archive');
    });

    out.on('error', function(){
        that.emit('error', 'MaxMind free database updater: Unable to create ungzipped database file');
    });

    inp.pipe(gzip).pipe(out);

    out.on('close', function () {
        that.setfileHash(outFile, true);
    });
};

FreeMaxmindUpdater.prototype.replaceOriginal = function () {
    var that = this;
    fs.rename(this.options.destFile.replace('.gz', ''), this.options.originFile, function (err) {
        if (err) {
            that.emit('error', 'MaxMind free database updater: Unable to move file');
        } else {
            that.emit('update', 'MaxMind free database updater: Database has been successfully updated');
        }
    });
};

FreeMaxmindUpdater.prototype.needsUpdate = function () {
    return this.hashes.localDb !== this.hashes.serverDb;
};

FreeMaxmindUpdater.prototype.updater = function () {
    if (this.needsUpdate()) {
        this.downloadFile();
    } else {
        this.emit('notice', 'MaxMind free database updater: Database is up to date');
    }
};

FreeMaxmindUpdater.prototype.start = function () {
    var that = this;

    this.serverHash();
    this.timeout = setInterval(function () {
        that.serverHash();//set that.hashes.serverDb from remote server hash link
    }, this.options.timeout);

    this.emit('notice', 'MaxMind free database updater has been successfully initiated to start every ' + this.options.timeout + ' milliseconds');
};

FreeMaxmindUpdater.prototype.stop = function () {
    clearInterval(this.timeout);
    this.emit('notice', 'MaxMind free database updater has been successfully stopped');
};

function fmmu_download(src, output) { //extracted from npm wget module.
    var downloader = new eventEmitter(),
        req;

    req = http.request(src, function (res) {
        var writeStream;
        if (res.statusCode === 200) {
            writeStream = fs.createWriteStream(output, {
                flags: 'w',
                encoding: 'binary'
            });

            writeStream.on('error', function(err){
                downloader.emit('error', err);
            });

            res.on('error', function (err) {
                writeStream.end();
                downloader.emit('error', err);
            });
            res.on('data', function (chunk) {
                writeStream.write(chunk);
            });
            res.on('end', function () {
                writeStream.end();
                downloader.emit('end', output);
            });
        } else {
            downloader.emit('error', 'Server respond ' + res.statusCode);
        }
    });

    req.on('error', function (err) {
        downloader.emit('error', err);
    });

    req.end();

    return downloader;
}