'use strict';

require('rootpath')();

const async = require('async');
const request = require('request');
const fs = require('fs-extra');
const path = require('path');
const yauzl = require('yauzl');
const nodemailer = require('nodemailer');

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
    console.time('hello');
    yauzl.open(zip, {lazyEntries: true}, (err, zipfile) => {
        if (err) {
            callback(err);
            return;
        }
        
        const numParallelItems = 10;
        const topLevelItems = new Set();
        const entryQueue = async.queue((entry, callback) => {
            // Directory
            if (/(\/|\\)$/.test(entry.fileName)) {
                zipfile.readEntry();
                topLevelItems.add(entry.fileName.split(path.sep)[0] + path.sep);
                const folder = path.join(dst, entry.fileName);
                fs.ensureDir(folder, (err) => {
                    callback(err);
                });
            }
            // File
            else {
                if ((entry.fileName.match(/(\/|\\)/g) || []).length === 0) {
                    // Top level file
                    topLevelItems.add(entry.fileName);
                }
                const file = path.join(dst, entry.fileName);
                fs.ensureDir(path.dirname(file), (err) => {
                    if (err) {
                        callback(err);
                        return;
                    }
                    zipfile.openReadStream(entry, (err, readStream) => {
                        zipfile.readEntry();
                        if (err) {
                            callback(err);
                            return;
                        }
                        readStream.pipe(fs.createWriteStream(file));
                        readStream.on('end', () => {
                            callback();
                        });
                    });
                });
            }
        }, numParallelItems);

         // to prevent multiple entries from returning errors
        let entryError = false;

        zipfile.on('entry', (entry) => {
            entryQueue.push(entry, (err) => {
                if (err && !entryError) {
                    entryError = true;
                    callback(err);
                }
            });
        });
        zipfile.once('end', () => {
            // wait until the remaining items finish, then report the result
            entryQueue.drain = () => {
                const items = Array.from(topLevelItems).map((item) => {
                    return path.join(dst, item);
                });
                console.timeEnd('hello');
                if (!entryError) {
                    callback(null, items);
                }
            };
        });

        // starts things off
        zipfile.readEntry();
    });
};

exports.email = function({sender,
                          reciver,
                          subject,
                          payload}) {
    if (!exports.email.transporter) {
        // create reusable transporter object using the default SMTP transport
        const smtpConfig = {
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            proxy: 'http://wwwgate.ti.com:80/'
        };
        exports.email.transporter = nodemailer
            .createTransport(smtpConfig);
    }

    // setup e-mail data with unicode symbols
    var mailOptions = {
        from: '"Test Script" <foo@blurdybloop.com>',
        to: 'j-grech@ti.com',
        subject: 'Hope this works',
        text: 'Hello world',
        html: '<b>Hello world</b>'
    };

    // send mail with defined transport object
    exports.email.transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: ' + info.response);
    });
};
