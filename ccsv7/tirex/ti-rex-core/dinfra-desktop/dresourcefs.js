// Copyright (C) 2016 Texas Instruments Incorporated - http://www.ti.com/
const util = require('util');
const nstream = require('stream');
const npath = require('path');
const dinfra = require('./dinfra');
const denum = require('./denum');
const dresource = require('./dresource');
const TRACE = null; // console.log; // set to console.log for trace
const static = {
        uid: process.getuid(),
        gid: process.getgid(),
        dev: 0,
        rdev: 0,
        blksize: 32768,
    };

function ResourceStats(path, rinfo) {
    this.path = path;
    this.rinfo = rinfo;
    this.dev = static.dev;
    this.ino = rinfo.id;
    this.mode = (rinfo.executable ? 0755 : 0644);
    this.nlink = 1;
    this.uid = static.uid;
    this.gid = static.gid;
    this.rdev = static.rdev;
    this.size = rinfo.size;
    this.blksize = static.blksize;
    this.blocks = Math.floor((this.size + this.blksize - 1) / this.blksize);
    this.atime = new Date(rinfo.adjusted);
    this.mtime = new Date(rinfo.modified);
    this.ctime = new Date(rinfo.adjusted);
    this.birthtime = new Date(this.created);
}

ResourceStats.prototype.isFile = function () {
    return (this.rinfo.type == dresource.RTYPE.FILE);
}

ResourceStats.prototype.isDirectory = function () {
    return (this.rinfo.type == dresource.RTYPE.DIR);
}

ResourceStats.prototype.isBlockDevice = function () {
    return (false);
}

ResourceStats.prototype.isCharacterDevice = function () {
    return (false);
}

ResourceStats.prototype.isSymbolicLink = function () {
    return (this.rinfo.type == dresource.RTYPE.LINK);
}

ResourceStats.prototype.isSocket = function () {
    return (false);
}

/**
 * A ResourceError is a workalike for node SystemError.
 */
util.inherits(ResourceError, denum.ExtendError);

function ResourceError(code) {
    denum.ExtendError.call(this, code);

    if (code.indexOf("E") != 0) {
        throw new Error("invalid code: " + code);
    }

    this.code = code;
    this.errno = code;
    this.syscall = "none";
}

util.inherits(ResourceTransform, nstream.Transform);

function ResourceTransform() {
    nstream.Transform.call(this);

    this.blockedEvents = {};
    this.blockedData = [];
}

ResourceTransform.prototype._flush = function (callback) {
    if (TRACE) {
        TRACE("ResourceTransform._flush");
    }

    callback();
}

ResourceTransform.prototype._transform = function (chunk, encoding, callback) {
    if (TRACE) {
        TRACE("ResourceTransform._transform chunk", chunk.length);
    }

    callback(null, chunk, encoding);
}

ResourceTransform.prototype.blockEvent = function (event) {
    if (!(event in this.blockedEvents)) {
        this.blockedEvents[event] = [];
    }
}

ResourceTransform.prototype.unblockEvent = function (event) {
    var events = this.blockedEvents[event];

    delete this.blockedEvents[event];

    events.forEach(function (arg1) {
            if (TRACE) {
                TRACE("ResourceTransform.emit unblocked", event);
            }

            nstream.Transform.prototype.emit.call(this, event, arg1);
        });
}

ResourceTransform.prototype.emit = function (event) {
    if (!this.blockedEvents[event]) {
        if (TRACE) {
            TRACE("ResourceTransform.emit regular", event);
        }

        nstream.Transform.prototype.emit.apply(this, arguments);
    }
    else {
        // we only bother to block the first event argument, which
        // is a little slack ...
        this.blockedEvents[event].push(event, arguments[1]);

        if (TRACE) {
            TRACE("ResourceTransform.emit blocked", event);
        }
    }
}

/**
 * A ResourceFS emulates some of node's fs module asynchronous
 * operations over the top of the resource layer instead.  The
 * assists in porting simple FS code to the resource layer.
 * It is not a module, because it needs to be requested from
 * dinfra with particular options: how to handle versions and
 * branching, where to root the path tree and so on.
 */
function ResourceFS(manager, prefix, opts) {
    this.manager = manager;
    this.prefix = prefix;
    this.opts = opts;
    this.writeFileOpts = {
            create: true,
        };
    this.readFileOpts = {
        };
}

ResourceFS.prototype.followLinkPrivate = function (path, relative) {
    if (relative.indexOf("/") == 0) {
        path = relative;
    }
    else if ((path.length > 0) && (path.indexOf("/") == path.length - 1)) {
        path += relative;
    }
    else {
        path = npath.dirname(path) + "/" + relative;
    }

    return (path);
}

ResourceFS.prototype.newDefaultQuery = function () {
    return (dinfra.queryResources().
        withAllTypes());
}

ResourceFS.prototype.pathToResourceName = function (path) {
    var result = npath.normalize(this.prefix + path);

    if (result.indexOf(this.prefix) != 0) {
        return (null);
    }

    while ((result.length > 0) &&
            (result.lastIndexOf("/") == result.length - 1)) {
        result = result.substr(0, result.length - 1);
    }

    if (result == ".") {
        result = "";
    }

    return (result);
}

ResourceFS.prototype.resourceNameToPath = function (name) {
    if (name.indexOf(this.prefix) != 0) {
        throw new denum.StateError("invalid resource: " + name +
            " does not extend " + this.prefix);
    }

    return (name.substr(this.prefix.length, name.length - this.prefix.length));
}

ResourceFS.prototype.readFile = function (path, options, callback) {
    if (options instanceof Function) {
        callback = options;
        options = { encoding: null, flag: "r" };
    }
    else if (typeof(options) == "string") {
        options = { flag: options };
    }
    else if (options == null) {
        options = { encoding: null, flag: "r" };
    }

    var stream = this.createReadStream(path);
    var results = [];

    stream.
        on('error', function (error) {
            callback(error);
        }).
        on('data', function (chunk) {
            results.push(chunk);
        }).
        on('finish', function () {
            var result = Buffer.concat(results);

            if (options.encoding == null) {
                callback(null, result);
            }
            else {
                callback(null, result.toString(options.encoding));
            }
        });
}

ResourceFS.prototype.writeFile = function (path, data, options, callback) {
    if (options instanceof Function) {
        callback = options;
        options = { };
    }
    else if (typeof(options) == "string") {
        options = { flags: options };
    }
    else if (options == null) {
        options = { };
    }

    if (TRACE) {
        TRACE("ResourceFS.writeFile", path, options);
    }

    var stream = this.createWriteStream(path, {
            mode: options.mode,
            flags: options.flag,
        }).
        on('error', function (error) {
            if (TRACE) {
                TRACE("  writeFile error", error);
            }
            callback(error);
        }).
        on('close', function () {
            if (TRACE) {
                TRACE("  writeFile finish");
            }

            callback();
        });

    stream.end(data, options.encoding);
}

ResourceFS.prototype.exists = function (path, callback) {
    this.lstat(path, function (error, stat) {
            if (error != null) {
                if (error.code == "ENOENT") {
                    callback(null, false);
                }
                else {
                    callback(error);
                }
            }
            else {
                callback(null, true);
            }
        });
}

ResourceFS.prototype.createReadStream = function (path) {
    var transform = new ResourceTransform();
    var self = this;

    if (TRACE) {
        TRACE("ResourceFS.createReadStream", path);
    }

    var rname = this.pathToResourceName(path);

    if (rname == null) {
        setImmediate(function () {
                transform.emit('error', new ResourceError("EFAULT"));
            });
        return (transform);
    }

    this.checkDirOfPrivate(path, function (error) {
            if (error != null) {
                // seems redundant, but this is done for ENODIR
                transform.emit('error', error);
                return;
            }

            if (TRACE) {
                TRACE("  createReadStream openResource", rname);
            }

            dinfra.openResource(rname, self.readFileOpts,
                function (error, resource) {
                    if (error != null) {
                        transform.emit('error', error);
                    }
                    else if (resource == null) {
                        transform.emit('error', new ResourceError("ENOENT"));
                    }
                    else {
                        var stream = resource.openReadable();
                        var cleanup = function () {
                                if (TRACE) {
                                    TRACE("  createReadStream cleanup");
                                }

                                if (stream != null) {
                                    var ref = stream;

                                    stream = null;

                                    //ref.close();
                                    resource.close(function (error) {
                                            if (error != null) {
                                                transform.emit('error', error);
                                            }

                                            transform.emit('close');
                                        });
                                }
                            };

                        stream.on('end', cleanup);

                        stream.pipe(transform);
                    }
                });
        });

    return (transform);
}

ResourceFS.prototype.createWriteStream = function (path) {
    var transform = new ResourceTransform();
    var self = this;

    if (TRACE) {
        TRACE("ResourceFS.createWriteStream", path);
    }

    transform.pause();

    var rname = this.pathToResourceName(path);

    if (rname == null) {
        setImmediate(function () {
                transform.emit('error', new ResourceError("EFAULT"));
            });
        return (transform);
    }

    this.checkDirOfPrivate(path, function (error) {
            if (error != null) {
                transform.emit('error', error);
                return;
            }

            if (TRACE) {
                TRACE("  createWriteStream", "openResource");
            }

            dinfra.openResource(rname,
                self.writeFileOpts, function (error, resource) {
                    if (error != null) {
                        transform.emit('error', error);
                    }
                    else if (resource.type == dresource.RTYPE.DIR) {
                        resource.close(function () {
                                transform.emit('error', 'EISDIR');
                            });
                    }
                    else {
                        if (TRACE) {
                            TRACE("  createWriteStream", "openWritable");
                        }

                        var stream = resource.openWritable();
                        var cleanup = function () {
                                if (TRACE) {
                                    TRACE("  createWriteStream", "cleanup");
                                }

                                if (stream != null) {
                                    var ref = stream;

                                    stream = null;

                                    //ref.close();

                                    resource.close(function (error) {
                                            if (error != null) {
                                                transform.emit('error', error);
                                            }

                                            transform.emit('close');
                                        });
                                }
                            };
                        stream.on('finish', cleanup);

                        transform.pipe(stream);
                        transform.resume();
                    }
                });
        });

    return (transform);
}

ResourceFS.prototype.lstat = function (path, callback) {
    var rname = this.pathToResourceName(path);

    if (rname == null) {
        callback(new ResourceError("EFAULT"));
        return;
    }

    var rinfo = null;

    this.newDefaultQuery().
        withName(rname).
        on('error', function (error) {
            callback(error);
        }).
        on('result', function (result) {
            rinfo = result;
            this.next();
        }).
        on('end', function () {
            if (rinfo == null) {
                callback(new ResourceError("ENOENT"));
            }
            else {
                callback(null, new ResourceStats(path, rinfo));
            }
        }).
        next();
}

ResourceFS.prototype.symlink = function (oldpath, newpath, callback) {
    var rname = this.pathToResourceName(newpath);

    if (rname == null) {
        callback(new ResourceError("EFAULT"));
        return;
    }

    this.checkDirOfPrivate(newpath, function (error) {
            if (error != null) {
                callback(error);
            }
            else {
                dinfra.openResource(rname, {
                        create: true, 
                        link: oldpath,
                    },
                    function (error, resource) {
                        if (error != null) {
                            callback(error);
                        }
                        else {
                            resource.close(function (error) {
                                    if (error != null) {
                                        callback(error);
                                    }
                                    else if (resource.fresh) {
                                        callback(new ResourceError("EEXIST"));
                                    }
                                    else {
                                        callback();
                                    }
                                });
                        }
                    });
            }
        });
}

ResourceFS.prototype.stat = function (path, callback) {
    var self = this;

    this.lstat(path, function (error, stat) {
            if (error != null) {
                callback(error);
            }
            else if (stat.rinfo.type == dresource.RTYPE.LINK) {
                self.stat(self.followLinkPrivate(path, stat.rinfo.meta.link),
                    callback);
            }
            else {
                callback(null, stat);
            }
        });
}

ResourceFS.prototype.unlink = function (path, callback) {
    var rname = this.pathToResourceName(path);

    if (rname == null) {
        callback(new ResourceError("EFAULT"));
        return;
    }

    var self = this;

    this.lstat(path, function (error, stat) {
            if (error != null) {
                callback(error);
            }
            else if (stat.rinfo.type == dresource.RTYPE.DIR) {
                callback(new ResourceError("EISDIR"));
            }
            else {
                dinfra.destroyResource(rname, null, callback);
            }
        });
}

ResourceFS.prototype.deletePrivate = function (fname, callback) {
    dinfra.destroyResource(fname, null, callback);
}

ResourceFS.prototype.deleteListPrivate = function (list, callback) {
    if (list.length > 0) {
        var fname = list.pop();
        var self = this;

        this.deletePrivate(fname, function (error) {
                if (error != null) {
                    callback(error);
                }
                else {
                    self.deleteListPrivate(list, callback);
                }
            });
    }
    else {
        callback();
    }
}

/**
 * Recursively delete a path.
 */
ResourceFS.prototype.unlinkr = function (path, callback) {
    var rname = this.pathToResourceName(path); // ensure its in scope

    if (rname == null) {
        callback(new ResourceError("EFAULT"));
        return;
    }

    var self = this;
    var dirs = [];
    var stepper = dinfra.newResourceStepper(rname);

    stepper.
        on('error', callback).
        on('result', function (fpath, rinfo) {
            if (rinfo.type == dresource.RTYPE.DIR) {
                dirs.push(rinfo.name);
                stepper.next();
            }
            else {
                self.deletePrivate(rinfo.name,
                    function (error) {
                        if (error != null) {
                            callback(error);
                        }
                        else {
                            stepper.next();
                        }
                    });
            }
        }).
        on('end', function () {
            self.deleteListPrivate(dirs, callback);
        }).
        next();
}

/**
 * Create a directory.
 */
ResourceFS.prototype.mkdir = function (path, callback) {
    var self = this;

    this.checkDirOfPrivate(path, function (error) {
            if (error != null) {
                callback(error);
            }
            else {
                self.mkdirp(path, callback);
            }
        });
}

/**
 * This is an internal function that is used to check that a path
 * has a valid directory before executing some other code, since
 * dinfra usually doesn't care and will make directories automatically.
 */
ResourceFS.prototype.checkDirOfPrivate = function (path, callback) {
    var rname = this.pathToResourceName(path); // ensure its in scope

    if (rname == null) {
        callback(new ResourceError("EFAULT"));
        return;
    }

    var dname = npath.dirname(rname); // figure out its parent
    var found = null;

    if (TRACE) {
        TRACE("ResourceFS.checkDirOfPrivate", path, "dir", dname);
    }

    if (dname.length <= this.prefix.length) {
        if (TRACE) {
            TRACE("  checkDirOfPrivate", "path under prefix", path);
        }

        callback();
        return;
    }

    this.newDefaultQuery().withName(dname).
        on('error', callback).
        on('result', function (result) {
            found = result;
            this.next();
        }).
        on('end', function () {
            if (found == null) {
                if (TRACE) {
                    TRACE("  checkDirOfPrivate", "no directory", path);
                }

                callback(new ResourceError("ENOENT"));
            }
            else if (found.type != dresource.RTYPE.DIR) {
                if (TRACE) {
                    TRACE("  checkDirOfPrivate", "not a directory", path);
                }

                callback(new ResourceError("ENOTDIR"));
            }
            else {
                if (TRACE) {
                    TRACE("  checkDirOfPrivate", "found", path);
                }

                callback();
            }
        }).
        next();
}

/**
 * Create a directory and any intermediates.  Don't complain.
 */
ResourceFS.prototype.mkdirp = function (path, callback) {
    var rname = this.pathToResourceName(path);

    if (rname == null) {
        callback(new ResourceError("EFAULT"));
        return;
    }

    dinfra.openResource(rname + "/", // @todo change to explicit dir
        { create: true },
        function (error, resource) {
            if (error != null) {
                callback(error);
            }
            else {
                resource.close(function (error) {
                        if (error != null) {
                            callback(error);
                        }
                        else if (resource.type != dresource.RTYPE.DIR) {
                            callback(new ResourceError("ENOTDIR"));
                        }
                        else {
                            callback();
                        }
                    });
            }
        });
}

/**
 * Remove a directory.  Complain if it has files in it
 */
ResourceFS.prototype.rmdir = function (path, callback) {
    var self = this;
    var rname = this.pathToResourceName(path);

    if (rname == null) {
        callback(new ResourceError("EFAULT"));
        return;
    }

    var found = null;

    this.newDefaultQuery().
        withName(rname).
        on('error', function (error) {
            callback(error);
        }).
        on('result', function (result) {
            found = result;
            this.next();
        }).
        on('end', function() {
            if (found == null) {
                self.checkDirOfPrivate(path, function (error) {
                        if (error != null) {
                            callback(error);
                        }
                        else {
                            callback(new ResourceError("ENOENT"));
                        }
                    });
            }
            else {
                var children = false;

                self.newDefaultQuery().
                    withParentName(rname).
                    on('error', function (error) {
                        callback(error);
                    }).
                    on('result', function (result) {
                        children = true;
                        this.next();
                    }).
                    on('end', function() {
                        if (children) {
                            callback(new ResourceError("ENOTEMPTY"));
                        }
                        else {
                            dinfra.destroyResource(rname, callback);
                        }
                    }).
                    next();
            }
        }).
        next();
}

/**
 * Read a directory.
 */
ResourceFS.prototype.readdir = function (path, callback) {
    var results = [];
    var rname = this.pathToResourceName(path);

    if (rname == null) {
        callback(new ResourceError("EFAULT"));
        return;
    }

    this.newDefaultQuery().withParentName(rname).
        withOrderBySegment(true).
        on('error', callback).
        on('result', function (rinfo) {
            results.push(rinfo.name.substr(rname.length + 1));
            this.next();
        }).
        on('end', function () {
            callback(null, results);
        }).
        next();
}

exports.ResourceFS = ResourceFS;
