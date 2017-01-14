'use strict';

var fs = require('fs-extra');
var path = require('path');
var mkdirp = require('mkdirp');

/*
 * Private file system utilities
 */

function _isDir(dir) {
    try {
        return fs.statSync(dir).isDirectory();
    } catch(err) {
        // any error
    }
    return false;
}
/*
 * Make directory if not already exist.
 */
function _makeDir(dir) {
    // note that fs.existsSync() is deprecated
    try {
        fs.statSync(dir).isDirectory();
    } catch(err) {
        // not exists
        mkdirp.sync(dir);
    }
}
/*
 * Remove recursively child directories which is empty.
 */
function _removeEmptyDir(dir, level) {
    if (fs.existsSync(dir) === false) {
        // invalid dir
        return;
    }
    var nextLevel = level+1;
    var children = fs.readdirSync(dir);
    if(children.length === 0 && level > 0) {
        fs.rmdirSync(dir);
    }
    else {
        for (var i = 0; i < children.length; i++) {
            var child = children[i];
            var fullpath = path.join(dir, child);
            var isdir = _isDir(fullpath);
            if (isdir) {
                _removeEmptyDir(child, nextLevel);
            }
        }
    }
}
/*
 * Remove recursively parent directories which is empty up to the specified vroot.
 */
function _removeEmptyDirReverse(filepath, vroot) {
    var _filepath = filepath;
    while(_filepath) {
        if(_filepath === vroot) {
            // stop at vroot
            break;
        }
        try {
            var _result;
            if (fs.statSync(_filepath).isDirectory()) {
                _result = fs.rmdirSync(_filepath);
            }
        } catch (err) {
            //
            if(err.code !== 'ENOENT') {
                break;
            }
        }
        _filepath = path.dirname(_filepath);
    }
}
/*
 * Remove a file or directory.
 * Arguments:
 *   rmdir: remove parent directory if it is empty up to vroot (exclusive)
 */
function _removeFile(filepath, rmdir, vroot) {
    try {
        if(_isDir(filepath)) {
            fs.removeSync(filepath);
        }
        else {
            fs.unlinkSync(filepath);
        }
        if(rmdir && vroot) {
            _removeEmptyDirReverse(path.dirname(filepath), vroot);
        }
    } catch (err) {
    }
}
/*
 * Move a folder. If the destination folder exist then merge/overwrite the content in it.
 * Arguments:
 *   vroot: cleanup empty folders up to this directory (exclusive)
 */
function _moveFolder (from, to, vroot, callback) {
    if(from == null || to == null || from == to) {
        callback();
        return;
    }
    // try rename first (faster), good for empty destination
    fs.rename(from, to, function (err) {
        if (err) {
            // failed, try move (slower), requires fs-extra, will merge contents into destination
            fs.move(from, to, function(err) {
                // cleanup
                _removeEmptyDirReverse(from, vroot);  // should be empty already
                callback(err);
            });
        }
        else {
            callback();
        }
    });
}
/*
 * Move a file. If the destination folder exist then merge/overwrite the content in it.
 * Arguments:
 *   vroot: cleanup empty folders up to this directory (exclusive)
 */
function _moveFile(from, to, vroot, callback) {
    if(from == null || to == null || from == to) {
        callback();
        return;
    }
    fs.move(from, to, {clobber:true}, function (err) {  // clobber=true -> always replace existing
        // cleanup
        _removeEmptyDirReverse(path.dirname(from, vroot));
        if(err && err.code === 'ENOENT') {
            err = null;
        }
        callback(err);
    });
}
/*
 * Move a file or folder. If the destination folder exist then merge/overwrite the content in it.
 * Arguments:
 *   vroot: cleanup empty folders up to this directory (exclusive)
 */
function _move(from, to, vroot, callback) {
    if(from == null || to == null || from == to) {
        setImmediate(callback);
        return;
    }
    var isdir = _isDir(from);
    if(isdir) {
        _moveFolder(from, to, vroot, callback);
    }
    else {
        _moveFile(from, to, vroot, callback);
    }
}

/**
 * Recursively read dir files. Only files are returned, NO dirs.
 * @param rootDir: the returned paths will be relative to this dir
 * @param fileFilter: regex file filter
 * @param depth: number of dir levels to recurse into (null or -1: no limit; 0: always returns an empty array)
 */
function readDirRecursive(rootDir, fileFilter, depth) {
    var result = [];
    if (fs.statSync(rootDir).isDirectory() === true) {
        _readDirRecursive('', 1);
    }
    return result;

    /**
     * Recursively read dir contents
     * @param relDir: normally set to '' (used by the recursive calls to pass along dir names)
     */
    function _readDirRecursive(relDir, currentLevel) {
        if (depth == null || depth === -1 || currentLevel <= depth) {
            var files = fs.readdirSync(path.join(rootDir, relDir));
            for (var i = 0; i < files.length; i++) {
                var file = path.join(relDir, files[i]);
                var stat = fs.statSync(path.join(rootDir, file));
                if (stat.isFile() === true) {
                    if (fileFilter == null || fileFilter.test(file) === true) {
                        result.push(file);
                    }
                } else if (stat.isDirectory() === true) {
                    _readDirRecursive(file, currentLevel + 1);
                }
            }
        }
    }
}

module.exports = {
    makeDir: _makeDir,
    removeEmptydir: _removeEmptyDir,
    removeFile : _removeFile,
    move : _move,
    readDirRecursive : readDirRecursive
};