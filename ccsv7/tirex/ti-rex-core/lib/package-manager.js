'use strict';
require('rootpath')();

const path = require('path');
const glob = require('glob');
const async = require('async');
const fs = require('fs-extra');

const vars = require('lib/vars');
const pathHelpers = require('lib/path-helpers');

const tasks = {
    UPDATE_PACKAGE: 'updatePackage',
    UPDATE_PACKAGES_FILE: 'updatePackagesFile'
};

/**
 * Manages packages in a content folder.
 * 
 */
class PackageManager {
    /**
     * @typedef {Object} PackageManager~Entry
     * @property {String} name
     * @property {String} version
     * @property {Array.String} content - Relative to the content folder.
     * @property {Array.String} zips - Relative to the content folder.
     */

    /**
     * @typedef {Object} PackageManager~PackageInfo
     * @property {String} name
     * @property {String} version
     */
    
    /**
     * Note: All paths are absolute.
     *
     * @param {String} packagesFile - i.e default.json
     * @param {String} packageManagerFile - i.e tirex.json
     * @param {String} contentFolder
     */
    constructor(packagesFile, packageManagerFile, contentFolder) {
        this._packagesFile = packagesFile;
        this._packageManagerFile = packageManagerFile;
        this._contentFolder = contentFolder;

        this._updateQueue = async.queue((task, callback) => {
            this._processTask(task, callback);
        });

    }
    
    //////////////////////
    // Public Functions
    //////////////////////
    
    /**
     * Update the package (may be a new package).
     *
     * @param {Object} args
     *  @param {PackageManager~Entry} args.entry - The entry to update.
     *  @param {Log} args.log
     * @param {ErrorCallback} callback
     */
    updatePackage(args, callback) {
        this._updateQueue.push({task: tasks.UPDATE_PACKAGE, args}, callback);
    }

    _updatePackage({entry, log}, callback) {
        const {content} = entry;
        async.waterfall([(callback) => { // update the packageManagerFile
            this._updatePackageManagerFileEntry({entry, log}, callback);
        }, (oldEntry, callback) => { // update the packagesFile
            this._updatePackagesFile({
                addPackageFolders: content,
                removePackageFolders: (oldEntry ? oldEntry.content : []),
                log,
                mergeWithExisting: true
            }, callback);
        }], callback);
    }

    /**
     * Update the packagesFile with the added / removed package folders
     *
     * @param {Object} args
     *  @param {Array.String} args.addPackageFolders - Any package folders we wish to add (relative to the content folder).
     *  @param {Array.String} args.removePackageFolders - Any package folders we wish to remove (relative to the content folder).
     *  @param {Log} args.log
     *  @param {Boolean} arg.mergeWithExisting - If true, keep existing package folders in the config file.
     * @param {ErrorCallback} callback
     *
     * Note: if you request to remove and add the same package folder, it will be added, not removed.
     */
    updatePackagesFile(args, callback) {
        this._updateQueue.push({task: tasks.UPDATE_PACKAGES_FILE,
                                args}, callback);
    }

    _updatePackagesFile({addPackageFolders=[],
                         removePackageFolders=[],
                         log,
                         mergeWithExisting=false}, callback) {
        addPackageFolders = addPackageFolders.map((pkg) => {
            return pathHelpers.normalize(pkg);
        });
        removePackageFolders = removePackageFolders
            .map((pkg) => {
                return pathHelpers.normalize(pkg);
            })
            .filter((pkg) => {
                return addPackageFolders.indexOf(pkg) < 0;
            });
        async.waterfall([
            (callback) => {
                if (mergeWithExisting) {
                    PackageManager._readJson(
                        this._packagesFile, (err, oldPackages) => {
                            if (err) {
                                callback(err);
                                return;
                            }
                            callback(null, PackageManager._mergePackages(
                                oldPackages, addPackageFolders
                            )); 
                        });
                }
                else {
                    setImmediate(callback, null, addPackageFolders);
                }
            }, (packages, callback) => {
                const finalPackageFolders = packages.filter((pkg) => {
                    return removePackageFolders.indexOf(pkg) < 0;
                });
                fs.writeJson(this._packagesFile, finalPackageFolders, callback);
            }
        ], callback);
    }

    /**
     * @callback PackageManager~zipsMirrorPackageFolderStructureCallback
     * @param {Error} error
     * @param {Array.String} newZips - absolute paths.
     */
    
    /**
     * Create a folder structure in the downloadFolder which mirrors the packages folder structure in the extractFolder, then move the zips into the folders structures in the downloadFolder. 
     * Note: all paths are absolute
     *
     * @param {Object} args
     *  @param {String} args.downloadFolder - Where the zips were downloaded.
     *  @param {String} args.extractFolder - Where the packages were extracted.
     *  @param {Array.String} args.zips
     *  @param {Array.String} args.packageFolders - Subfolders of extractFolder which are packages. (absolute paths, must be in the extractFolder).
     * @param {PackageManager~zipsMirrorPackageFolderStructureCallback} callback
     */
    static zipsMirrorPackageFolderStructure({downloadFolder,
                                             extractFolder,
                                             zips,
                                             packageFolders}, callback) {
        // TODO map zip folders to packageFolders so we don't need to copy
        // all the zips into every folder structure
        const relativePackageFolders = packageFolders
              .map((pkg) => {
                  return pathHelpers.getRelativePath(pkg, extractFolder);
              })
              .filter((pkg) => {
                  return pkg;
              });
        async.waterfall([(callback) => {
            async.map(relativePackageFolders, (pkgFolder, callback) => {
                const zipFolder = path.join(downloadFolder, pkgFolder);
                fs.ensureDir(zipFolder, (err) => {
                    callback(err, zipFolder);
                });
            }, callback);
        }, (zipFolders, callback) => {
            async.map(zipFolders, (zipFolder, callback) => {
                // shouldn't need to do this for every zip
                // only the ones for the package (TODO above).
                async.map(zips, (zip, callback) => {
                    const newZip = path.join(zipFolder, path.basename(zip));
                    fs.copy(zip, newZip, (err) => {
                        callback(err, newZip);
                    });
                }, callback);
            }, (err, newZipLists) => {
                const newZips = newZipLists.reduce((newZips1, newZips2) => {
                    return newZips1.concat(newZips2);
                }, []);
                callback(err, newZips);
            });
        }, (newZips, callback) => { // remove the original zips
            async.map(zips, (zip, callback) => {
                fs.remove(zip, callback);
            }, (err) => {
                callback(err, newZips);
            });
        }], callback);
    }

    /**
     * @callback PackageManager~getPackageFoldersCallback
     * @param {Error} error
     * @param {Array.string} packages - absolute paths.
     */
    
    /**
     * Search the items for packages (folders containing a package.tirex.json file).
     * Note: all paths are absolute.
     *
     * @param {Array.string} items - folders to search.
     *  Note: (may contain files, folders must end with path.sep)
     * @param {PackageManager~getPackageFoldersCallback} callback
     */
    static getPackageFolders(items, callback) {
        const folders = items.filter((item) => {
            return /(\/|\\)$/.test(item);
        });
        if (folders.length === 0) {
            callback(null, []);
            return;
        }
        async.map(folders, (folder, callback) => {
            glob(path.join(folder, '**/package.tirex.json'), {dot: true},
                 (err, files) => {
                     if (err) {
                         callback(err);
                         return;
                     }
                     const pkgFolders = files.map((packageFile) => {
                         if (packageFile.indexOf(path.join(
                             vars.METADATA_DIR, 'package.tirex.json')) > -1) {
                             packageFile = path.normalize(
                                 packageFile.replace(vars.METADATA_DIR, ''));
                         }
                         return path.dirname(packageFile);
                     });
                     callback(err, pkgFolders);
                 });
        }, (err, results) => {
            if (err) {
                callback(err);
                return;
            }
            const result = results.reduce((r1, r2) => {
                return r1.concat(r2);
            });
            callback(err, result);
        });
    }

    /**
     * @callback getPackageInfoCallback
     * @param {Error} error
     * @param {PackageManager~PackageInfo} info
     */
    
    /**
     * Get the package.tirex.json based package info
     *
     * @param {String} packageFolder - absolute path to the package.
     * @param {PackageManager~PackageInfo} callback
     */
    static getPackageInfo(packageFolder, callback) {
        async.waterfall([(callback) => {
            const packageMetadataFile = path.join(
                packageFolder, vars.METADATA_DIR, 'package.tirex.json'
            );
            fs.readJson(packageMetadataFile, (err, data) => {
                if (err) {
                    const packageMetadataFile = path.join(
                        packageFolder, 'package.tirex.json');
                    fs.readJson(packageMetadataFile, callback);
                    return;
                }
                callback(err, data);
            });
        }, ([{id, version}], callback) => {
            setImmediate(() => {
                callback(null, {name: id, version});
            });
        }], callback);
    }

    ///////////////////////
    // Private Functions
    //////////////////////

    /**
     * @private
     * @callback PackageManager~_updatePackageManagerFileEntryCallback
     * @param {Error} error
     * @param {PackageManager~Entry} oldEntry
     */
    
    /**
     * Update the entry in the package manager file (it may be a new entry)
     * 
     * @private
     * @param {Object} args
     *  @param {PackageManager~Entry} args.entry
     *  @param {Log} args.log
     * @param {PackageManager~_updatePackageManagerFileEntryCallback} callback
     */
    _updatePackageManagerFileEntry({entry, log}, callback) {
        async.waterfall([(callback) => { // get the entry
            this._getPackageManagerFileEntry(entry, callback);
        }, (oldEntry, idx, callback) => { // update the list of packages
            PackageManager._readJson(
                this._packageManagerFile, (err, data) => {
                    const {packages} = data;
                    if (err) {
                        callback(err);
                        return;
                    }
                    if (idx > -1) {
                        packages[idx] = entry;
                    }
                    else {
                        packages.push(entry);
                    }
                    data.packages = packages;
                    callback(null, data, oldEntry);
                });
        }, (data, oldEntry, callback) => { // update the package manager file
            fs.writeJson(this._packageManagerFile, data, (err) => {
                callback(err, oldEntry);
            });
        }, (oldEntry, callback) => { // remove the old content & zips
            if (!oldEntry) {
                setImmediate(callback, null, oldEntry);
                return;
            }
            const {content, zips} = oldEntry;
            async.parallel([(callback) => {
                async.map(content, (item, callback) => {
                    fs.remove(path.join(this._contentFolder, item), (err) => {
                        // Ignore the error (i.e if one item contains another
                        // then we try to delete it twice)
                        // or if it was manually deleted
                        callback();
                    });
                }, callback);
            }, (callback) => {
                async.map(zips, (zip, callback) => {
                    fs.remove(path.join(this._contentFolder, zip), (err) => {
                        // Ignore the error (i.e if one item contains another
                        // then we try to delete it twice)
                        // or if it was manually deleted
                        callback();
                    });
                }, callback);
            }], (err) => {
                callback(err, oldEntry);
            });
        }], callback);
    }

    /**
     * @private
     * @callback PackageManager~_getPackageManagerFileEntryCallback
     * @param {Error} error
     * @param {PackageManager~Entry} entry - null if not found
     * @param {integer} idx - -1 if not found
     */
    
    /**
     * Get the entry in the package manager file.
     * Note: this function assumes the package manager file is already initialized.
     * 
     * @private
     * @param {PackageManager~PackageInfo} entry
     * @param {PackageManager~_getPackageManagerFileEntryCallback} callback
     */
    _getPackageManagerFileEntry({name, version}, callback) {
        const targetName = name;
        const targetVersion = version;
        PackageManager._readJson(this._packageManagerFile, (err, {packages}) => {
            if (err) {
                callback(err);
                return;
            }
            const packageEntryIdx = packages.findIndex(({name, version}) => {
                return name === targetName && version === targetVersion;
            });
            callback(err,
                     packageEntryIdx > -1 ? packages[packageEntryIdx] : null,
                     packageEntryIdx);
        });
    }

    _processTask({args, task}, callback) {
        if (task === tasks.UPDATE_PACKAGE) {
            async.parallel([(callback) => {
                this._initPackageManagerFile(callback);
                }, (callback) => {
                    this._initPackagesFile(callback);
                }], (err) => {
                    if (err) {
                        callback(err);
                        return;
                    }
                this._updatePackage(args, callback);
            });
        }
        else if (task === tasks.UPDATE_PACKAGES_FILE) {
            this._initPackagesFile((err) => {
                if (err) {
                    callback(err);
                    return;
                }
                this._updatePackagesFile(args, callback);
            });
        }
        else {
            setImmediate(callback);
        }
    }

    /**
     * Initialize the package manager file.
     *
     * @private
     * @param {ErrorCallback} callback
     */
    _initPackageManagerFile(callback) {
        async.series([(callback) => { // make sure the file exists
            fs.stat(this._packageManagerFile, (err) => {
                if (err) {
                    fs.outputFile(this._packageManagerFile, '', callback);
                }
                else {
                    callback();
                }
            });
        }, (callback) => { 
            PackageManager._readJson(this._packageManagerFile, (err, json) => {
                if (Array.isArray(json) && json.length === 0) { // un-initialized
                    fs.writeJson(this._packageManagerFile,
                                 {contentFolder: this._contentFolder,
                                  packages: []}, callback);
                }
                else { // make sure the contentFolder matches
                    const {contentFolder} = json;
                    callback((contentFolder !== this._contentFolder ?
                              'error incorrectly configured contentFolder' : null));
                }
            });
        }], callback);
    }

    /**
     * Initialize the packages file.
     *
     * @private
     * @param {ErrorCallback} callback
     */
    _initPackagesFile(callback) {
        async.series([(callback) => { // make sure the file exists
            fs.stat(this._packagesFile, (err) => {
                if (err) {
                    fs.outputFile(this._packagesFile, '', callback);
                }
                else {
                    callback();
                }
            });
        }, (callback) => {
            PackageManager._readJson(this._packagesFile, (err, json) => {
                if (err) {
                    callback(err);
                    return;
                }
                
                if (Array.isArray(json) && json.length === 0) { // un-initalized
                    fs.writeJson(this._packagesFile, json, callback);
                }
                else {
                    callback(err);
                }
            });
        }], callback);
    }


    /** 
     * Read json from the file. Handles the case where the file is empty.
     *
     * @private
     * @param {String} file
     * @param callback(err, json)
     * @param {Object} emptyValue - The value of the json if the file is empty.
     */
    static _readJson(file, callback, emptyValue=[]) {
        fs.readFile(file, (err, data) => {
            if (err) {
                callback(err);
                return;
            }
            callback(err, data.toString()
                     .replace(/(\r?\n|\r)|\'|\"/g, '')
                     .trim()
                     .length > 0 ? JSON.parse(data) : emptyValue);
        });
    }

    /**
     * Merge the packages into a unique set of packages.
     * 
     * @private
     * @param {Array.String} oldPackages - The old relative package folders.
     * @param {Array.String} newPackages - The new relative package folders.
     * 
     * @returns {Array.String} mergedPackages - The unique set of old and new
     *  packages.
     */
    static _mergePackages(oldPackages, newPackages) {
        let merged = oldPackages
            .concat(newPackages)
            .map((pkg) => {                
                return pathHelpers.normalize(pkg);
            });

        // cast to a set for uniqueness
        return Array.from(new Set(merged));
    }
} module.exports = PackageManager;
