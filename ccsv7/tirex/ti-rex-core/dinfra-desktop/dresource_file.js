// Copyright (C) 2016 Texas Instruments Incorporated - http://www.ti.com/
const util = require('util');
const stream = require('stream');
const fs = require('fs');
const crypto = require('crypto');
const denum = require('./denum');
const dschema = require('./dschema');
const dschema_file = require('./dschema_file');
const dresource = require('./dresource');
const dinfra = require('./dinfra');
const TRACE = null; // console.log; // set to console.log for trace

util.inherits(FileResourceManager, dresource.ResourceManager);

function FileResourceManager(logger, writableGroup, readableGroup,
        retryManager, encryptManager, opts) {
    dresource.ResourceManager.call(this, logger, writableGroup,
        readableGroup, retryManager, encryptManager, opts);
}

FileResourceManager.prototype.openResource = function (name, opts, callback) {
    return (new FileResource(this, name, opts).openPrivate(callback));
}

FileResourceManager.prototype.getResourceSchema = function () {
    return (resourceSchema);
}

FileResourceManager.prototype.newResourceQuery = function () {
    return (new FileResourceQuery(this));
}

util.inherits(FileResource, dresource.Resource);

function FileResource(manager, name, opts) {
    if ((opts.branch != null) || (opts.version != null)) {
        throw new denum.StateError(
            "versions are not allowed with file-based resource layer engines");
    }

    dresource.Resource.call(this, manager, name, opts);
}

FileResource.prototype.updateMetaPrivate = function () {
    var self = this;

    this.conn.update(dresource.resourceTablePrefix, this.id, {
            meta: this.meta
        },
        function (error) {
            if (error != null) {
                self.closePrivate(error);
            }
            else {
                self.retryHandler.
                    withRewindProperty(self, "metaChanged", false);
                self.updateHeaderPrivate();
            }
        });
}

FileResource.prototype.updateHeaderPrivate = function () {
    var self = this;

    this.conn.update(dresource.resourceTablePrefix, this.id, {
            size: this.size,
            change: this.change,
            modified: this.modified
        },
        function (error) {
            if (error != null) {
                self.closePrivate(error);
            }
            else {
                self.retryHandler.
                    withRewindProperty(self, "original", self.change);
                self.closePrivate(null);
            }
        });
}

FileResource.prototype.statPrivate = function() {
    var self = this;

    denum.openNamedLock(this.name,
        function (lock) {
            self.lock = lock;

            var query = self.manager.newResourceQuery().
                withNoAssumptions().
                withName(self.name).
                invoke(function (error, record) {
                    if (error != null) {
                        self.closePrivate(error);
                    }
                    else if (record == null) {
                        self.summaryPrivate();
                    }
                    else if (record.version != null) {
                        self.versions[record.version] = record;
                        self.idVersionMap[record.id] = record;
                    }
                    else {
                        self.master = record;
                    }
                });
        });
}

FileResource.prototype.ensureParentsPrivate = function() {
    var parentName = this.getParentName();

    if (this.name == parentName) {
        this.createPrivate();
        return;
    }

    var self = this;

    if (TRACE) {
        TRACE("FileResource.ensureParentsPrivate", parentName);
    }

    dinfra.openResource(parentName + "/", { // indicate directory with /
            connection: this.conn, // fixed connection, single transaction
            dependent: true,
            create: true,
        }, function (error, resource) {
            if (error != null) {
                self.closePrivate(error);
            }
            else if (resource == null) {
                self.closePrivate(new Error("no resource from create"));
            }
            else {
                resource.close(function (error) {
                        if (error != null) {
                            self.closePrivate(error);
                        }
                        else {
                            self.createPrivate();
                        }
                    });
            }
        });
}

FileResource.prototype.openReadable = function (opt) {
    var writableGroup = this.manager.writableGroup;

    var fileName = writableGroup.defaults.path + "/content";

    if (this.name.indexOf("/") != 0) {
        fileName += "/";
    }

    fileName += this.name;

    return (fs.createReadStream(fileName));
}

util.inherits(FileResourceWritable, stream.Transform);

function FileResourceWritable(resource, writableGroup, fileName, opt) {
    stream.Transform.call(this);

    this.writableGroup = writableGroup;
    this.fileName = fileName;
    this.total = 0;
    this.resource = resource;
    // etag and headers stolen from dresource_sql ...
    this._etagAlgorithm = null;
    this._etagHash = null;
    this._headers = false;

    if (opt != null) {
        if (opt.etag == null) {
            this._etagAlgorithm = null;
        }
        else if (opt.etag == false) {
            this._etagAlgorithm = null;
        }
        else if (opt.etag == true) {
            // sufficient and short for non-crypto purposes
            this._etagAlgorithm = "sha1";
        }
        else {
            this._etagAlgorithm = opt.etag;
        }

        if (opt.headers) {
            this._headers = true;
        }
    }

    if (this._etagAlgorithm != null) {
        this._etagHash = crypto.createHash(this._etagAlgorithm);
    }

    var self = this;

    this.pause();

    this.pipe(fs.createWriteStream(fileName, {
            flags: 'w'
        }).
        on('open', function () {
            self.resume();
        }));

    /*
        Note that this has to be on the finish for the transform,
        not on the lower level fs writable.
    */
    this.on('finish', function () {
            if (self._etagHash != null) {
                /**
                 * Because this is an HTTP header, not just a meta-data
                 * storage value, it actually contains the standard ETag
                 * formatting, which for a "Strongly Cacheable" entity,
                 * means putting the tag in double quotes, but omitting
                 * the leading "w/".
                 */
                self.resource.setHeader("ETag",
                    '"' + this._etagHash.digest('hex') + '"');
                self._etagHash = null;
            }

            if (self._headers) {
                // make sure this is called *after* setSize and
                // when modified is set.
                self.resource.updateHeaders();
            }

            self.resource.setSize(self.total);
        });
}

FileResourceWritable.prototype._transform = function (chunk, encoding,
        callback) {
    if (encoding != null) {
        chunk = new Buffer(chunk, encoding);
    }
    else if (chunk instanceof Buffer) {
        // OK
    }
    else {
        throw new denum.UnsupportedError("unsupported chunk type " +
            typeof(chunk));
    }

    this.total += chunk.length;

    if (this._etagHash != null) {
        this._etagHash.update(chunk);
    }

    this.push(chunk);

    callback();
}

FileResource.prototype.openWritable = function (opt, callback) {
    var writableGroup = this.manager.writableGroup;

    var fileName = writableGroup.defaults.path + "/content";

    if (this.name.indexOf("/") != 0) {
        fileName += "/";
    }

    fileName += this.name;

    return (new FileResourceWritable(this, writableGroup, fileName, opt));
}

FileResource.prototype.relinkPrivate = function() {
    throw new denum.UnsupportedError();
}

FileResource.prototype.createPrivate = function() {
    var writableGroup = this.manager.writableGroup;
    var fileName = writableGroup.defaults.path + "/content" + this.name;
    var self = this;

    writableGroup.ensureDirsFor(fileName, function (error) {
            if (error != null) {
                self.closePrivate(error);
            }
            else {
                self.createRecordPrivate();
            }
        });
}

FileResource.prototype.createRecordPrivate = function() {
    var self = this;

    this.modified = Date.now();
    this.created = this.modified;

    this.conn.insert(dresource.resourceTablePrefix, {
            name: this.name,
            parent: this.getParentName(),
            segment: this.getSegment(),
            sparse: null,
            version: null,
            prev_version: null,
            encryption: null,
            material: null,
            type: this.type,
            size: this.size,
            modified: this.modified,
            created: this.created,
            change: this.change,
        }, function (error, result) {
            if (error != null) {
                self.closePrivate(error);
            }
            else {
                self.retryHandler.withRewindProperty(self, "id", result.id);

                self.closePrivate();
            }
        });
}

FileResource.prototype.deleteByIdsPrivate = function (ids, callback) {
    var self = this;

    this.acquireConnPrivate(this, "deleteByIds", function (error, conn) {
            if (error != null) {
                callback(error);
            }
            else {
                self.conn.delete("dinfra_resource", ids, function (error) {
                        self.releaseConnPrivate(function (anError) {
                                if (error == null) {
                                    error = anError;
                                }

                                callback(error);
                            });
                    });
            }
        });
}

util.inherits(FileResourceQuery, dresource.ResourceQuery);

function FileResourceQuery(manager) {
    dresource.ResourceQuery.call(this, manager, "id");
}

exports.newResourceManager = function (logger, writableGroup,
            readableGroup, retryManager, encryptManager, opts) {
        return (new FileResourceManager(logger, writableGroup,
            readableGroup, retryManager, encryptManager, opts));
    };
