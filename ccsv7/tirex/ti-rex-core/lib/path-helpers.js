'use strict';

const fs = require('fs-extra');
const path = require('path');
const helpers = require('lib/helpers');

/**
 * Helper functions for dealing with paths / folders
 */
class PathHelpers {
    /**
     * Makes the path separators all path.sep,
     * removes any excess path separators,
     * and ensures it ends with a trailing path.sep
     * 
     * i.e normalize('foo//bar/baz\\foo') => 'foo/bar/baz/foo/'
     *
     * @param {String} path
     * @returns {Stirng} normalizedPath
     */
    static normalize(aPath) {
        return path.normalize(aPath.replace(/(\/|\\)/g, path.sep) + path.sep);
    }

    /**
     * @param {String} absolutePath - The absolute path to convert.
     * @param {String} relativeTo - The point of reference.
     * 
     * @returns {String} relativePath (or null on err)
     *
     */
    static getRelativePath(absolutePath, relativeTo) {
        const normailzedAbs = this.normalize(absolutePath);
        const normailzedPointOfReference = this.normalize(relativeTo);
        if (normailzedAbs.indexOf(normailzedPointOfReference) !== 0) {
            return null;
        }

        const newPath = normailzedAbs.replace(normailzedPointOfReference, '');
        return newPath.substr(0, Math.max(newPath.length - 1, 0));
    }

    /**
     * @param {String} potentialSubfolder
     * @param {String} folder
     * 
     * @returns {Boolean} isSubfolder
     *
     */
    static isSubfolder(potentialSubfolder, folder) {
        const normSubfolder = this.normalize(potentialSubfolder);
        const normFolder = this.normalize(folder);
        return normFolder !== normSubfolder &&
            normSubfolder.indexOf(normFolder) > -1;
    }

    /** 
     * Remove a piece of a path (relative or abs)
     *
     * @param {String} path
     * @param {String} peice
     *
     * @return {String} newPath
     */
    static removePathPiece(_path, piece) {
        const newPath = _path.replace(piece, '');
        if (newPath.length > 0 && (newPath[0] === '/' ||
                                   newPath[0] === '\\')) {
            // case where we remove the first piece of a relative path
            return newPath.substr(1);
        }
        else {
            return path.normalize(newPath);
        }
    }
    
    /**
     * Returns a unique path which starts with prefixPath
     *
     * @param {String} prefixPath
     * @param callback(err, uniqueFolderPath, uniqueSubfolder)
     */
    static getUniqueFolderPath(prefixPath, callback) {
        const potentialUniquePath = prefixPath +
              ';' + helpers.getRandomInt(0, 10000);
        fs.stat(potentialUniquePath, (err) => {
            if (err) {
                // Unique (does not exist)
                callback(null, potentialUniquePath,
                         path.basename(potentialUniquePath));
            }
            else {
                this.getUniqueFolderPath(prefixPath, callback);
            }
        });
    }
} module.exports = PathHelpers;
