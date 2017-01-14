/** 
 * @module make 
 */
'use strict';

const os = require('os');
const path = require('path');
const p = require('child_process');

// defined after calling get_modules
// (since we may be building ourselves and not have
// these modules available initially)

let glob,
    fs,
    async,
    uglifyJS,
    uglifyCSS,
    uglifyHTML;

let pathHelpers,
    transpile,
    util;

/**
 * @readonly
 * @enum {String} BuildType
 */
const BuildType = {
    PRODUCTION: 'production',
    DEVELOP: 'develop',
    SELF: 'self'
};

/**
 * Define all modules to be used.
 * Note: in some builds we may not have all of these available initially
 */
function defineModules() {
    require('rootpath')();
    glob = require('glob');
    fs = require('fs-extra');
    async = require('async');
    uglifyJS = require('uglify-js').minify;
    uglifyCSS = require('uglifycss').processFiles;
    uglifyHTML = require('html-minifier').minify;

    pathHelpers = require('lib/path-helpers');
    transpile = require('./transpile').transpile;
    util = require('./util');
}

/**
 * Make tirex core
 * @param {Object} args
 *  @param {module:make~BuildType} args.buildType
 *  @param {String} args.platform
 *  @param {String} args.arch
 *  @param {String} args.nodeVersion
 * @param {ErrorCallback} callback
 */
exports.make = function({buildType, platform, arch, nodeVersion},
                        callback=(()=>{})) {
    const src = path.join(__dirname, '..');
    const dst = path.join(src, 'target', buildType, 'tirex', 'ti-rex-core');
    if (buildType === BuildType.PRODUCTION) {
        defineModules();
        handleProductionBuild(src, dst, {
            platform,
            arch,
            nodeVersion
        }, callback);
    }
    else if (buildType === BuildType.DEVELOP) {
        defineModules();
        handleDevBuild(src, dst, {
            platform,
            arch,
            nodeVersion
        }, callback);
    }
    else {
        handleSelfBuild(src, {
            platform,
            arch,
            nodeVersion
        }, callback);
    }
};

/**
 * @typedef {Object} BuildInfo
 * @property {String} platform - same as os.platform()
 * @property {String} arch - same as os.arch()
 * @property {String} nodeVersion - same as process.version
 */

/** 
 * Handle a production build.
 * 
 * @param {String} src - The source directory.
 * @param {String} dst - The destination directory.
 * @param {modules:make~BuildInfo} buildInfo - The config values.
 * @param {ErrorCallback} callback
 */
function handleProductionBuild(src, dst, {platform, arch, nodeVersion},
                               callback) {
    async.series([(callback) => {
        async.parallel([
                _copyProduction,
                (callback) => {
                    getModules(src, dst, {platform, arch, nodeVersion},
                               callback);
                }
            ], callback);
        }, (callback) => { 
            async.parallel([
                (callback) => { // prune the node modules
                    p.exec('npm prune --production', {cwd: dst}, 
                           (error, stdout, stderr) => {
                               callback(error,
                                        'An error occurred while pruning ' +
                                        'the node modules\n' + stderr);
                           });          
                },
                (callback) => { // get the binaries
                    getBinaries(src, dst, {
                        platform,
                        arch,
                        nodeVersion
                    }, callback);
                },
                (callback) => { // uglify
                    uglify(src, dst, callback);
                }
            ], callback);   
        }
    ], callback);
    
    /**
     * Copy the relevant files from src to dst for production.
     *
     * @param {ErrorCallback} callback
     */
    function _copyProduction(callback) {
        async.series([
            (callback) => {
                // copy all the relevant folders / files relative to the
                // root directory
                const toCopy = [
                    'config', 
                    'dinfra-desktop',
                    'package.json',
                    path.join('3rd_party', 'shared', 'front_end_modules'),
                    'public',
                    'routes',
                    'scripts',
                    'views'
                ];
                async.each(toCopy, (item, callback) => {
                    fs.copy(path.join(src, item),
                            path.join(dst, item),
                            callback);
                }, callback);
            },
            (callback) => {
                // remove all the unnecessary folders / files relative to the
                // root directory (some subset of what we copied)
                const toRemove = [
                    path.join('public', 'js')
                ];
                async.each(toRemove, (item, callback) => {
                    fs.remove(path.join(dst, item), callback);
                }, callback);
            }
        ], callback);
    }
}

/** 
 * Handle a dev build.
 * 
 * @param {string} src - The source directory.
 * @param {string} dst - The destination directory.
 * @param {module:make~BuildInfo} config - The config values.
 * @param {ErrorCallback} callback
 */
function handleDevBuild(src, dst, {platform, arch, nodeVersion},
                        callback) {
    async.series([(callback) => {
        _copyDev(callback);
    }, (callback) => {
        async.parallel([(callback) => {
            transpileFrontend(dst, callback);
        }, (callback) => {
            getBinaries(src, dst, {platform, arch, nodeVersion}, callback);
        }, (callback) => {
            getModules(src, dst, {platform, arch, nodeVersion}, callback);
        }], callback);
    }], callback);

    /**
     * Copy the relevant files from src to dst for development.
     *
     * @param {ErrorCallback} callback
     */
    function _copyDev(callback) {
        async.series([(callback) => {
            fs.copy(src, dst, callback);
        }, (callback) => {
            const toRemove = [
                'target',
                'node_modules'
            ];
            async.each(toRemove, (item, callback) => {
                fs.remove(path.join(dst, item), callback);
            }, callback);
        }], callback);
    }
}

/** 
 * Handle building yourself.
 * 
 * @param {string} src - The source directory.
 * @param {string} dst - The destination directory.
 * @param {module:make~BuildInfo} config - The config values.
 * @param {ErrorCallback} callback
 */
function handleSelfBuild(src, {platform, arch, nodeVersion},
                         callback) {
    getModules(src, src, {platform, arch, nodeVersion}, (err) => {
        if (err) {
            callback(err);
            return;
        }
        defineModules();
        async.parallel([(callback) => {
            transpileFrontend(src, callback);
        }, (callback) => {
            getBinaries(src, src, {platform, arch, nodeVersion}, callback);
        }], callback);    
    });
}

///
// Helpers
///

/** 
 * Uglify the relevant html/css/js in src and put 
 * it in the same relative location in dst.
 * 
 * @param {string} src - The source directory.
 * @param {string} dst - The destination directory.
 * @param {ErrorCallback} callback
 */
function uglify(src, dst, callback) {
    async.parallel([
        (callback) => {
            _uglifyJS(src, dst, callback);
        },
        (callback) => {
            _uglifyCSS(src, dst, callback);
        },
        (callback) => {
            _uglifyHTML(src, dst, callback);
        }
    ], (err, results) => {
        if (err) {
            callback(err);
            return;
        }
        const items = results.reduce((result1, result2) => {
            return result1.concat(result2);
        });
        async.each(items, ({data, location}, callback) => {
            fs.outputFile(location, data, callback);
        }, callback);
    });
}

/**
 * @typedef UglifiedFileData
 * @property {String} data - The uglified data.
 * @property {String} location - The file path of the ugilfied file.
 */

/**
 * @callback UglifiedFiles
 * @param {Error} error
 * @param {Array.<module:make~UglifiedFileData>} files
 */

/**
 * @param {String} src
 * @param {String} dst
 * @param {module:make~UglifiedFiles} callback
 */
function _uglifyJS(src, dst, callback) {
    async.parallel([
        (callback) => { // backend - uglify
            async.map(util.backendJsItems, (item, callback) => {
                async.waterfall([(callback) => {
                    fs.stat(item , callback);
                }, (stats, callback) => {
                    if (stats.isDirectory()) {
                        glob(path.join(item, '**/*.js'), callback);
                    }
                    else {
                        setImmediate(callback, null, [item]);
                    }
                }, (files, callback) => {
                    const results = files.map((file) => {
                        const relativeFile = path.join(
                            pathHelpers.getRelativePath(path.dirname(file), src),
                            path.basename(file)
                        );
                        // don't uglify because it isn't transpiled currently
                        return {data: fs.readFileSync(file), 
                                location: path.join(dst, relativeFile)};
                    });
                    setImmediate(callback, null, results);
                }], callback);
            }, (err, result) => {
                const files = result.reduce((item1, item2) => {
                    return item1.concat(item2);
                }, []);
                callback(err, files);
            });
        }, (callback) => { // front end - transpile into bundleFile, then uglify
            transpileFrontend(src, (err, bundleFile) => {
                if (err) {
                    callback(err);
                    return;
                }
                callback(err, [{
                    data: uglifyJS(path.join(src, bundleFile), {
                        mangle: false
                    }).code,
                    location: path.join(dst, bundleFile)
                }]);
            });
        }
    ], (err, results) => {
        if (err) {
            callback(err);
            return;
        }
        const items = results.reduce((result1, result2) => {
            return result1.concat(result2);
        });
        callback(err, items);
    });
}

/**
 * @param {String} src
 * @param {String} dst
 * @param {module:make~UglifiedFiles} callback
 */
function _uglifyCSS(src, dst, callback) {
    glob(path.join(src, 'public', 'stylesheets', '**/*.css'),
         (err, files) => {
             if (err) {
                 callback(err);
                 return;
             }
             const results = files.map((file) =>  {
                 const relativeFile = path.join(
                     pathHelpers.getRelativePath(path.dirname(file), src),
                     path.basename(file));
                 return {data: uglifyCSS([file]),
                         location: path.join(dst, relativeFile)};
             });
             callback(err, results); 
         });
}

/**
 * @param {String} src
 * @param {String} dst
 * @param {module:make~UglifiedFiles} callback
 */
function _uglifyHTML(src, dst, callback) {
    glob(path.join(src, 'public', '**/*.html'),
         (err, files) => {
             const results = files.map((file) =>  {
                 const relativeFile = path.join(
                     pathHelpers.getRelativePath(path.dirname(file), src),
                     path.basename(file)
                 );
                 return {data: fs.readFileSync(file, 'utf8'),
                         location: path.join(dst, relativeFile)};
             });
             callback(null, results); 
         });
}

/**
 * Create the bin folder in dst from the folders in src
 *
 * @param {String} src - the src directory.
 * @param {String} dst - the dst directory.
 * @param {module:make~BuildInfo} config
 * @param {ErrorCallback} callback
 */
function getBinaries(src, dst, {platform, arch, nodeVersion}, callback) {
    async.series([(callback) => {
        fs.ensureDir(path.join(dst, 'bin'), callback);
    }, (callback) => {
        fs.copy(
            path.join(src, '3rd_party', platform, arch, nodeVersion, 'bin'),
            path.join(dst, 'bin'),
            callback
        );
    }, (callback) => {
        fs.copy(
            path.join(src, '3rd_party', platform, arch, nodeVersion, 'bin'),
            path.join(dst, '..'),
            callback
        );
    }], callback); 
}

/**
 * Create the node_modules folder in dst from the folders in src
 *
 * @param {String} src - the src directory.
 * @param {String} dst - the dst directory.
 * @param {Object} config
 *  @param {String} config.platform
 *  @param {String} config.arch
 *  @param {String} config.nodeVersion
 *  @param {Boolean} config.clearDst - Clear the dst folder before creation
 * @param {ErrorCallback} callback
 */
function getModules(src, dst, {platform,
                               arch,
                               nodeVersion,
                               clearDst=false}, callback) {
    // require this way since the modules may not be installed yet
    // (this function installs them when we are the dst)
    const _async = require('../3rd_party/shared/node_modules/async');
    const _fs = require('../3rd_party/shared/node_modules/fs-extra');
    
    const modules_folders = [
        path.join(src, '3rd_party', 'shared', 'node_modules'),
        path.join(src, '3rd_party', platform, arch, nodeVersion, 'node_modules')
    ];
    _async.series([(callback) => {
        if (clearDst) {
            _fs.remove(dst, callback);
        }
        else {
            setImmediate(callback);
        }
    }, (callback) => {
        _fs.ensureDir(path.join(dst, 'node_modules'), callback);
    }, (callback) => {
        _async.each(modules_folders, (folder, callback) => {
            _fs.copy(path.join(folder, path.sep),
                     path.join(dst, 'node_modules'),
                     callback);
        }, callback);
    }], (err) => {
        if (err) {
            callback(err);
            return;
        }
        callback(err);
    });
}

/**
 * Transpiles the frontend code into a bundle file.
 *
 * @param {String} src
 * @param callback(err, bundleFile)
 */
function transpileFrontend(src, callback) {
    const bundleFile = path.join('public', 'lib', 'bundle.js');
    transpile({
        sourceDir: path.join(src, 'public', 'js'),
        destinationFile: path.join(src, bundleFile)
    }, (err) => {
        callback(err, bundleFile);
    });
}

///
// Yargs Command config
///
exports.command = 'build [options]';
exports.describe = 'Build ti-rex-core';
exports.builder = {
    platform: {
        alias: 'p',
        describe: '"darwin", "linux", or "win32" same as node\'s os.platform())',
        default: os.platform()
    },
    arch: {
        alias: 'a',
        describe: '"ia32" or "x64" (same as node\'s os.arch())',
        default: os.arch()
    },
    nodeVersion: {
        alias: 'n',
        describe: 'e.g. v0.10.26 (same as process.version)',
        default: process.version
    },
    develop: {
        describe: 'for development builds'
    },
    production: {
        describe: 'for production builds'
    },
    self: {
        describe: 'for building yourself (default)'
    }
};
exports.handler = function(argv) {
    argv.buildType = BuildType.SELF;
    if (argv.develop) {
        argv.buildType = BuildType.DEVELOP;
    }
    else if (argv.production) {
        argv.buildType = BuildType.PRODUCTION;
    }
    exports.make(argv, (err) => {
        if (err) {
	    console.log('An error has occured during the build');
	    console.log('Error: ', err);
	}
	else {
	    console.log('Build Successful!');
        }
    });
};

