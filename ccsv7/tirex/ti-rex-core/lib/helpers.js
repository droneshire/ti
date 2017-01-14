'use strict';

require('rootpath')();

const async = require('async');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

const vars = require('lib/vars');

const request = require('request').defaults({proxy: vars.HTTP_PROXY,
                                             forever: true});

/**
 * Gets a random int between min (included) and max (excluded)
 *
 * @param {Integer} min
 * @param {Integer} max
 *
 * @returns {Integer} randomInt
 */
exports.getRandomInt = function(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
};

/**
 * Gets the file from the provided url.
 *
 * @param {String} url - The url to download the zip from.
 * @param {String} dst - the destination folder.
 * @param callback(err, file)
 */
exports.downloadFile = function(url, dst, callback) {
    let fileName = path.join(dst, path.basename(url));
    let ws = fs.createWriteStream(fileName);
    async.parallel([(callback) => {
        ws.on('finish' , () => {
            callback(null);
        });
    }, (callback) => {
        request
            .get(url)
            .on('response', (response) => {
                if (response.statusCode !== 200) {
                    callback('got status ' + response.statusCode +
                             ' for url ' + url);
                }
                else {
                    callback(null);
                }
            })
            .on('error', (err) => {
                callback(err);
            })
            .pipe(ws);
    }], (err, results) => {
        callback(err, fileName);
    });
};

/**
 * Extract the zip at the given location.
 *
 * @param {String} zip - The file name of the zip to extract.
 * @param {String} dst - the destination folder.
 * @param callback(err, topLevelItems) - where topLevelItems is the
 *  files / folders located at the root of the zip.
 */
exports.extract = function(zip, dst, callback) {
    const yauzl = require('yauzl');
    
    yauzl.open(zip, {lazyEntries: true}, (err, zipfile) => {
        if (err) {
            callback(err);
            return;
        }
        let topLevelItems = new Set();
        zipfile.readEntry();
        zipfile.on('entry', (entry) => {
            // Directory
            if (/(\/|\\)$/.test(entry.fileName)) {
                topLevelItems.add(entry.fileName.split(path.sep)[0] + path.sep);
                let folder = path.join(dst, entry.fileName);
                fs.ensureDir(folder, (err) => {
                    if (err) {
                        callback(err);
                        return;
                    }
                    zipfile.readEntry();
                });
            }
            // File
            else {
                if ((entry.fileName.match(/(\/|\\)/g) || []).length === 0) {
                    // Top level file
                    topLevelItems.add(entry.fileName);
                }
                let file = path.join(dst, entry.fileName);
                fs.ensureDir(path.dirname(file), (err) => {
                    if (err) {
                        callback(err);
                        return;
                    }
                    fs.stat(file, (err, stats) => {
                        if (!err && stats.isDirectory()) {
                            const msg = 'error folder exists with same name and location as file ' + file;
                            callback(msg);
                            return;
                        }
                        zipfile.openReadStream(entry, (err, readStream) => {
                            if (err) {
                                callback(err);
                                return;
                            }
                            const mode = (entry.externalFileAttributes >> 16 &
                                          0xfff).toString(8);
                            readStream.pipe(fs.createWriteStream(
                                file, (os.platform() !== 'win32') ? {mode} : {}));
                            readStream.on('end', () => {
                                zipfile.readEntry();
                            });
                        });
                    });
                });
            }
        });
        zipfile.once('end', () => {
            const items = Array.from(topLevelItems).map((item) => {
                return path.join(dst, item);
            });
            callback(null, items);
        });
    });
};

/**
 * @callback emailCallback
 * @param {Error} error
 * @param {Object} res
 */

/**
 * Send an email with the given config.
 *
 * @param {Object} args
 *  @param {String} args.sender
 *  @param {String} args.receiver
 *  @param {String} args.subject
 *  @param {String} args.payload
 *  @param {Array.<Object>} args.attachments
 * @param {emailCallback} callback
 */
exports.email = function({sender,
                          receiver,
                          subject,
                          payload,
                          attachments}, callback=(()=>{})) {
    if (receiver.trim().length === 0) {
        setImmediate(callback);
        return;
    }
    
    const nodemailer = require('nodemailer');
    
    if (!exports.email.transporter) {
        // create reusable transporter object using the default SMTP transport
        const smtpConfig = {
            host: 'smtp.mail.ti.com',
            port: 25
        };
        exports.email.transporter = nodemailer.createTransport(smtpConfig);
    }
    
    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: sender,
        to: receiver,
        subject: subject,
        html: payload,
        attachments
    };

    // send mail with defined transport object
    exports.email.transporter.sendMail(mailOptions, callback);
};
