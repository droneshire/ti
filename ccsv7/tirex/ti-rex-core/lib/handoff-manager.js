'use strict';
require('rootpath')();

const fs = require('fs-extra');
const path = require('path');

const async = require('async');

const vars = require('lib/vars');
const pathHelpers = require('lib/path-helpers');
const PackageManager = require('lib/package-manager');

/**
 * To manage handoffs
 * 
 */
class HandoffManager {
    constructor() {
        this._contentFolder = vars.CONTENT_BASE_PATH;        
        this._packageManager = new PackageManager(
            vars.contentPackagesConfig,
            vars.packageManagerFile,
            this._contentFolder
        );
        this._handoffQueue = async.queue((args, callback) => {
            this._handoffPackage(args, callback);
        });
    }

    /**
     * Handoff the package from a staging server to a handoff server
     *
     * @public
     * @param {Object} args
     *  @param {PackageManager~Entry} args.entry - The entry to handoff
     *  @param {String} args.contentFolder - where the entry is relative to.
     *  @param {String} args.handoffSubfolder - The subfolder the entries' content and zip folders are under.
     *  @param {Log} args.log
     * @param {ErrorCallback} callback
     */
    handoffPackage(args, callback=(()=>{})) {
        this._handoffQueue.push(args, callback);
    }

    _handoffPackage({entry, contentFolder, handoffSubfolder, log}, callback) {
        const {name, version, content, zips} = entry;
        async.series([(callback) => { 
            this._packageManager.updatePackage({
                entry: {
                    name,
                    version,
                    content: content.map((item) => {
                        return pathHelpers.removePathPiece(
                            item, handoffSubfolder
                        );
                    }),
                    zips: zips.map((zip) => {
                        return pathHelpers.removePathPiece(
                            zip, handoffSubfolder
                        );
                    })
                },
                log
            }, callback);
        }, (callback) => {
            fs.ensureDir(this._contentFolder, callback);
        }, (callback) => {
            async.map([content, zips], (items, callback) => {
                async.map(items, (item, callback) => {
                    const src = path.join(contentFolder, item);
                    const dst = path.join(
                        this._contentFolder,
                        pathHelpers.removePathPiece(
                            item, handoffSubfolder
                        )
                    );
                    fs.copy(src, dst, callback);
                }, callback);
            }, callback);
        }], callback);
    }
} module.exports = HandoffManager;
