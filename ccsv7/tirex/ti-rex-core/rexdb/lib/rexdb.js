/**
 * rexdb - small in-memory database with file system persistence and optional query cache
 * Always returns a deep copy of documents
 *
 * Note: CACHING IS TURNED OFF
 *
 * APIs are similar to MongoDB
 *
 * osohm, 7/21/2014
 */

'use strict';

var logger = require('../../lib/logger')();
var fs = require('fs');
var path = require('path');
var lruCache = require('lru-cache');
var jsonStableStringify = require('json-stable-stringify');
var async = require('async');

/**
 * Constructor
 * @param {String} file name - if null then this is new a in-memory database
 * @constructor
 */
function RexDB(file) {
    // fields
    this.useCache = false; // CACHING IS TURNED OFF
    this.file = file;
    this.dbName = path.basename(this.file);
    this.documents = [];
    this.indices = {_id: {} };
    // caches the references, not the documents themselves
    this.cache = lruCache({
        max: 2 * 1024 * 1024 / 8, /* 2 MB / 8 bytes = ~ 260k documents (memory requirement is assuming the size of an object ref is 64 bits...) */
        length: function (n) {
            if (n && n.length) {
                return n.length;
            } else {
                return 1;
            }
        },
        dispose: function (key, n) {
            logger.tracefiner('rexdb ' + this.dbName  + ' cache disposing:' + key);
        }
    });

    if (file != null) {
        try {
            var data = fs.readFileSync(file, 'utf8');
            this.documents = JSON.parse(data);
            data = fs.readFileSync(file + '.index', 'utf8');
            this.indices = JSON.parse(data);
        } catch (err) {
            // ignore
            logger.tracefiner(err);
        }
    }
}

module.exports = RexDB; // object that's returned by a require call

/**
 * Save the database to the file
 * @param {Function} callback(err)
 */
RexDB.prototype.save = function(callback) {
    var that = this;
    if (this.file == null) {
        throw new Error('Cannot save. Database is in-memory only');
    }
    // avoid creating one huge string here that may result in memory allocation failure
    // instead write record by record and, this is important, allow to drain before writing more data
    var ws = fs.createWriteStream(this.file)
        .on('open', function() {
            ws.write('[\n');
            async.forEachOfSeries(that.documents, function (document, index, callback) {
                setImmediate(function () {
                    var isDrained = ws.write(JSON.stringify(document));
                    if (index < that.documents.length - 1) {
                        ws.write(',');
                    }
                    if (isDrained === true) {
                        callback();
                    } else {
                        ws.once('drain', callback);
                    }
                });
            }, function () {
                ws.end('\n]', function() {
                    fs.writeFile(that.file + '.index', JSON.stringify(that.indices), 'utf8', callback);
                });
            });
        }
    );
};

/**
 * Insert single document or array of document
 *
 *  * _id field is optional; if present it will be indexed
 *
 * @param {Array} newDocs
 * @param {Function} callback
 */
RexDB.prototype.insert = function(newDocs, callback) {
    // simulate async
    var that = this; // see http://stackoverflow.com/questions/346015/javascript-closures-and-this-context
    setImmediate(function() {
        that.insertSync(newDocs);
        callback(null, that.documents);
    });
};

/**
 * Update a single document
 * @param {Object} query: only '_id' is supported
 * @param {Object} update: the updated record to put (the whole record is replaced with the updated record)
 * @param {Function} callback(err)
 */
RexDB.prototype.update = function(query, update, callback) {
    // simulate async
    var that = this; // see http://stackoverflow.com/questions/346015/javascript-closures-and-this-context
    setImmediate(function() {
        var i;
        if (query._id == null) {
            callback({message: '_id field required'});
        } else if ((i = that.indices._id[query._id]) == null) {
            callback({message: '_id ' + query._id + ' does not exist', notexist: true});
        } else {
            update._id = query._id; // make sure they stay in sync...
            that.documents[i] = update;
            that.cache.reset();
            callback(null);
        }
    });
};

/**
 * Update or insert a single document
 * @param {Object} query: only '_id' is supported
 * @param {Object} update: the updated record to put (the whole record is replaced with the updated record or a new one is created if none is found)
 * @param {Function} callback(err)
 */
RexDB.prototype.upsert = function(query, update, callback) {
    // simulate async
    var that = this; // see http://stackoverflow.com/questions/346015/javascript-closures-and-this-context
    setImmediate(function() {
        var i;
        if (query._id == null) {
            callback({message: '_id field required'});
        } else if ((i = that.indices._id[query._id]) == null) {
            that.insertSync(update);
            callback(null, that.documents);
        } else {
            update._id = query._id; // make sure they stay in sync...
            that.documents[i] = update;
            that.cache.reset();
            callback(null);
        }
    });
};

/**
 * Insert single document or array of document (synchronous)
 *
 * _id field is optional; if present it will be indexed
 *
 * @param {Array} newDocs
 */
RexDB.prototype.insertSync = function(newDocs) {
    if (Array.isArray(newDocs)) {
        for (var i = 0; i < newDocs.length; i++) {
            if (newDocs[i]._id != null) {
                if (this.indices._id[newDocs[i]._id] != null) {
                    logger.warn('rexdb insert: _id already exists: ' + newDocs[i]._id + '(' + newDocs[i].name + '). Skipping.');
                    continue;
                }
                this.indices._id[newDocs[i]._id] = this.documents.length;
            }
            this.documents.push(newDocs[i]);
        }
    } else {
        if (newDocs._id != null) {
            if (this.indices._id[newDocs._id] != null) {
                logger.warn('rexdb insert: _id already exists: ' + newDocs._id + '(' + newDocs.name + '). Skipping.');
                return;
            }
            this.indices._id[newDocs._id] = this.documents.length;
        }
        this.documents.push(newDocs);
    }
    this.cache.reset();
};

/**
 * Insert or skip single document or array of document (synchronous)
 *
 * _id field is mandatory
 *
 * @param {Array} newDocs
 */
RexDB.prototype.insertOrSkipSync = function(newDocs) {

    if (Array.isArray(newDocs)) {
        for (var i = 0; i < newDocs.length; i++) {
            insertOne.call(this,newDocs[i]);
        }
    } else {
        insertOne.call(this,newDocs);
    }
    this.cache.reset();

    function insertOne(newDoc) {
        if (!newDoc._id) {
            // only work with element with ID
            return;
        }
        var _e = this.indices._id[newDoc._id];
        if(_e != null) {
            // skip
            return;
        }
        else {
            this.indices._id[newDoc._id] = this.documents.length;
            this.documents.push(newDoc);
        }
    }
};

/**
 * Always removes documents matching the query
 * @param {Object} query: {} - remove all
 * @param {Function} callback
 * @api public
 */
RexDB.prototype.remove = function(query, callback) {
    // simulate async
    var that = this; // see http://stackoverflow.com/questions/346015/javascript-closures-and-this-context
    setImmediate(function() {
        if (Object.keys(query).length === 0) { // i.e. query is {}
            that.documents.length = 0;
            that.indices = {_id: {} };
            that.cache.reset();
            callback(null);
        } else {
            that._find(query, false,  true, () => {
                that.cache.reset();
                callback(null);
            });
        }
    });
};

/**
 *
 * @param {Object} query: filter values can be a RegExp
 * @param {Boolean} findOne
 * @param {Boolean} del: true - all matching records will be set to null
 * @param {Function} callback(err:String, result:Array)
 * @api private
 */
RexDB.prototype._find = function(query, findOne, del, callback) {
    var that = this;
    var andFilter = [];
    var result = [];

    if (this.documents.length === 0) {
        return setImmediate(callback, null, []);
    }

    if ('$and' in query) {
        andFilter = query.$and;
    } else {
        // if query in simple format, build the andFilter array
        for (var property in query) {
            if (query.hasOwnProperty(property)) {
                var filter = {};
                filter[property] = query[property];
                andFilter.push(filter);
            }
        }
    }

    // empty query: return all docs
    if (andFilter.length === 0) {
        for (var dd = 0; dd < this.documents.length; dd++) {
            if (this.documents[dd] != null) {
                result.push(this.documents[dd]);
            }
        }
        return setImmediate(callback, null, result);
    }

    // optimization if query has ONLY _id specified: use the index
    if (andFilter[0]._id != null && andFilter.length === 1) {
        var di = this.indices._id[andFilter[0]._id];
        if (di != null) {
            result.push(this.documents[di]);
            if (del === true) {
                delete this.indices._id[this.documents[di]._id];
                this.documents[di] = null; // must keep array structure as is
            }
            return setImmediate(callback, null, result);
        } else {
            return setImmediate(callback, 'Error: Index ' + andFilter[0]._id + ' not found', null);
        }
    }

    // tokenize $text.$search string
    // for more on mongodb $text search: http://docs.mongodb.org/manual/reference/operator/query/text/#op._S_text
    for (var ff = 0; ff < andFilter.length; ff++) {
        if (Object.keys(andFilter[ff])[0] === '$text') {
            var $searchStrings = andFilter[ff].$text.$search.split(/\s*[ ,;|/]+\s*/);
            for (var ss = 0; ss < $searchStrings.length; ss++) {
                $searchStrings[ss] = $searchStrings[ss].toLowerCase().trim();
            }
            andFilter[ff].$text.$searchStrings = $searchStrings;
        }
    }

    // break up find loop into multiple async pages to not block other requests
    var PAGE_SIZE = 10000;
    var allResults = [];
    var startDoc = 0;
    var pageLength;
    async.doWhilst(
        function(callback) {
            pageLength = Math.min(PAGE_SIZE, that.documents.length - startDoc);
            var pageResults = that._findLoop(andFilter, startDoc, pageLength, findOne, del);
            allResults = allResults.concat(pageResults);
            setImmediate(callback, null, allResults);
        },
        function() {
            if (findOne && allResults.length > 0) {
                return false;
            }
            if (startDoc + pageLength >= that.documents.length) {
                return false;
            }
            startDoc += PAGE_SIZE;
            return true;
        },
        function(err, allResults) {
            setImmediate(callback, err, allResults);
        });
};

/**
 *
 * @param andFilter
 * @param startDoc
 * @param pageLength
 * @param del
 * @returns {Array} results
 * @private
 */
RexDB.prototype._findLoop = function(andFilter, startDoc, pageLength, findOne, del) {
    var results = [];
    var matched = false;
    for (var d = startDoc; d < startDoc + pageLength;  d++) {
        if (this.documents[d] == null) { continue; }
        for (var f = 0; f < andFilter.length; f++) {
            var key = Object.keys(andFilter[f])[0];
            if (key === '$text') {
                // handle $text search
                var $searchMatch = false;
                for (var field in this.documents[d]) {
                    if (this.documents[d].hasOwnProperty(field) && this.documents[d][field] != null) {
                        var docString = this.documents[d][field].toString().toLowerCase();
                        for (var s = 0; s < andFilter[f].$text.$searchStrings.length; s++) {
                            if (docString.indexOf(andFilter[f].$text.$searchStrings[s]) !== -1) {
                                $searchMatch = true;
                                break;
                            }
                        }
                        if ($searchMatch === true) {
                            break;
                        }
                    }
                }
                matched = $searchMatch;
            } else {
                // handle all other searches
                var valueDoc = (key in this.documents[d]) ? this.documents[d][key] : null; // to match mongodb behaviour: http://docs.mongodb.org/manual/faq/developers/#faq-developers-query-for-nulls
                var valueFilter = andFilter[f][key];
                if (typeof valueFilter === 'object' && valueFilter != null && valueFilter.$in != null) {
                    // handle $in
                    var $inList = valueFilter.$in;
                    var $inListMatch = false;
                    for (var i = 0; i < $inList.length; i++) {
                        $inListMatch = this._match(valueDoc, $inList[i]);
                        if ($inListMatch === true) {
                            break;
                        }
                    }
                    matched = $inListMatch;
                }
                else if (typeof valueFilter !== 'undefined') { // if undefined treat as DON'T CARE
                    // handle regular field/value
                    matched = this._match(valueDoc, valueFilter);
                }
            }
            if (matched === false) {
                break;
            }
        }
        if (matched === true) {
            if (del === true) {
                if (this.documents[d]._id != null) {
                    delete this.indices._id[this.documents[d]._id];
                }
                this.documents[d] = null; // must keep array structure as is
            } else {
                results.push(this.documents[d]);
                if (findOne === true) {
                    break;
                }
            }
        }
    }
    return results;
};

/**
 *
 * @api private
 */
RexDB.prototype._match = function (valueDoc, valueFilter) {
    if (Array.isArray(valueDoc) === false) {
        if (valueFilter instanceof RegExp) {
            return valueFilter.test(valueDoc);
        } else {
            return (valueDoc === valueFilter);
        }
    } else {
        for (var i = 0; i < valueDoc.length; i++) {
            if (this._match(valueDoc[i], valueFilter) === true) {
                return true;
            }
        }
    }
    return false;
};

/**
 *
 * @param {Object} query
 * @param {Function} callback(err, Array:results)
 * @api public
 */
RexDB.prototype.find = function(query, callback) {
    var that = this;
    this._findInCache(query, false, function(err, results) {
        callback(err, that.deepCopy(results));

    });
};

/**
 * Faster and less memory intensive find() avoiding the deep copy
 * The results cannot be modified, if attempted a freeze exception is thrown
 *
 * @param {Object} query
 * @param {Function} callback(err, Array:results)
 * @api public
 */
RexDB.prototype.findNoDeepCopy = function(query, callback) {
    this._findInCache(query, false, function(err, results) {
        callback(err, results == null ? null : Object.freeze(results));

    });
};

/**
 *
 * @param {Object} query
 * @param {Function} callback(err, Object:result)
 * @api public
 */
RexDB.prototype.findOne = function(query, callback) {
    var that = this;
    this._findInCache(query, true, function(err, results) {
        if (err || !results) {
            return callback(err);
        }
        if (results.length === 0) {
            callback(err, null);
        } else {
            callback(err, that.deepCopy(results[0]));
        }
    });
};

// [Bruce temp for small DB
// RexDB.prototype.findOneSync = function(query) {
//     var result = this._find(query, true, false);
//     return result;
// };
// ]

/**
 *
 * @param {Object} query
 * @param {Boolean} findOne
 * @param {Function} callback(err, Array:results)
 * @api private
 */
RexDB.prototype._findInCache = function(query, findOne, callback) {
    // simulate async
    var that = this; // see http://stackoverflow.com/questions/346015/javascript-closures-and-this-context
    var result;
    var queryString = jsonStableStringify(query);
    if (that.cache.has(queryString)) {
        logger.tracefiner('rexdb ' + that.dbName + ' cache hit: ' + queryString);
        result = that.cache.get(queryString);
        setImmediate(callback, null, result);
    } else {
        logger.tracefiner('rexdb ' + that.dbName + ' cache miss: ' + queryString);
        that._find(query, findOne, false, function(err, results) {
            if (this.useCache) {
                that.cache.set(queryString, results);
            }
            callback(null, results);
        });
    }
};

/**
 * Based on http://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-clone-an-object/5344074#5344074
 * Note: it doesn't copy functions, Date and Regex's
 * @param obj
 * @returns {*}
 */
RexDB.prototype.deepCopy = function(obj) {
    return JSON.parse(JSON.stringify(obj));
};
