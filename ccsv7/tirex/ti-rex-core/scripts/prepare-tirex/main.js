'use strict'
const path = require('path');
const fs = require('fs');

const glob = require('glob');

function main() {
    return Promise.all([linkZips()]);
}

function linkZips() {
    const zipsFolder = path.join(
        'home',
        'auser',
        'ccs-cloud-storage',
        'ti-rex',
        'git',
        'ti-rex-content',
        'zips'
    );
    return new Promise((resolve, reject) => {
        glob(path.join(zipsFolder, '**/*.zip'), (err, files) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(files);
        });
    }).then((files) => {
        return Promise.all(files.map((file) => {
            if (file.indexOf('__all') > -1) {
                return Promise.all(['__linux', '__macos', '__win'].map((ext) => {
                    return createLink(file, '__all', ext);
                }));
            }
            else {
                return Promise.resolve();
            }
        }));
    });
}

function createLink(file, oldExtension, newExtension) {
    return new Promise((resolve, reject) => {
        const link = file.replace(oldExtension, newExtension);
        fs.stat(link, resolve);
    }).then((not_exists) => {
        return new Promise((resolve, reject) => {
            if (not_exists) {
                fs.symlink(file, file.replace(oldExtension, newExtension), (err) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    resolve();
                });
            }
            else {
                resolve();
            }
        });
    });
}

if (require.main === module) {
    main().then(() => {
        console.log('done');
    }).catch((err) => {
        console.log(err);
    });
}
