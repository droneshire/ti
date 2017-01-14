/**
 * @class Query
 *
 *  Note on performance:
 *  Performance bottlenecks are (1) text search db (since rexdb is not indexed) and (2) processResultsSync().
 *  To improve (1) a search cache is used that caches the db query results of the top level search request
 *  (i.e. the one w/o 'path' in the req.query) which then can be re-used by subsequent requests that open the sub-
 *  nodes. To improve (2) the result set that needs to be processed is kept as small as possible by adding the 'path' as
 *  a filter (filtering the db is much faster than processing it), i.e. as the tree is descended the result set becomes
 *  smaller and smaller.Note however that when results are returned from the search cache this doesn't apply, i.e. as
 *  the tree is descended always all results have to be processed. So there's a cross over point where using the search
 *  cache becomes less effective and using 'path' in the filter becomes more effective. Based on experiments the
 *  cross over point is set to 15000 results after which search caching is turned off.
 *
 * osohm, 8/26/2014
 *
 */

'use strict';

// 3rd party modules
var logger = require('./logger')();
var async = require('async');
var path = require('path');
var lruCache = require('lru-cache');
var sortStable = require('stable'); // Array.sort is not 'stable' (i.e. equal comparisons may be re-ordered)
var jsonStableStringify = require('json-stable-stringify');

// our modules
var devicesBuilder = require('./dbBuilder/devices');
var vars = require('./vars');

var debugDisableResponseCache = false;

var responseCache = lruCache({
    // 100 MB / 400 bytes = ~ 2621 resource nodes (memory requirement is assuming the size of an object for one resource
    // node, i.e the query results sent to the client, is 400 bytes; this is a very, very rough guess, but should be good
    // enough; we just want to limit the cache size to around 100 MB ...)
    max: 100 * 1024 * 1024 / 400,
    length: function (n) {
        if (n && n.length) {
            return n.length;
        } else {
            return 1;
        }
    },
    dispose: function (key) {
        logger.trace('response cache disposing:' + key);
    }
});

var searchCache = lruCache({
    max: 50000, // equiv. of entire MSPWare metadata, probably ~ 200-300 MB (just a guesstimate on what is the reasonable
                // amount of memory to allocate for cache)
    length: function (n) {
        if (n && n.length) {
            return n.length;
        } else {
            return 1;
        }
    },
    dispose: function (key) {
        logger.trace('search cache disposing:' + key);
    }
});

exports.clearCaches = function () {
    responseCache.reset();
    searchCache.reset();
};

/**
 *
 * @param req
 * @returns {{resourceQuery: Object, resourceQueryNoPath: Object, overviewQuery: Object}}
 */
exports.makeNormalizedQueries = function(req_query) {
    var filter = [];
    var filterNoPath;
    var overviewFilter = []; // need to filter overview entries w/o devices, devtools and search to prevent them from being removed if they are not tagged
    var overviewFilterNoPath;
    var cond;

    if (req_query.search != null) {
        filter.push({$text: {$search: req_query.search}}); // $text search
    }
    if (req_query.device != null) {
        filter.push({'devices': req_query.device}); // no devices field, no match
    }
    if (req_query.devtool != null) {
        filter.push({'devtools': req_query.devtool}); // no devtools field, no match
    }
    if (req_query.package != null) {
        cond = {'packageUId': {$in: req_query.package.split(vars.PACKAGE_LIST_DELIMITER)}};
        filter.push(cond);
        overviewFilter.push(cond);
        //filter.push({'root0': req_query.package});
    }
    if (req_query.language != null) {
        cond = {'language': {$in: [req_query.language, null]}}; // no or null language field matches ANY language
        filter.push(cond);
        overviewFilter.push(cond);
    }
    if (req_query.ide != null) {
        cond = {'ide': {$in: [req_query.ide, null]}}; // no or null ide field matches ANY ide
        filter.push(cond);
        overviewFilter.push(cond);
    }
    if (req_query.id != null) {
        filter.push({'_id': req_query.id});
    }

    filterNoPath = deepCopy(filter); // for search
    overviewFilterNoPath = deepCopy(overviewFilter); // for makeoffline

    // not a necessary filter, but narrows down results more which speeds up post-processing by quite a bit
    if (req_query.path != null) {
        var pathArray = req_query.path.split('/');
        for (var i = 0; i < pathArray.length; i++) {
            cond = {'fullPaths': pathArray[i]};
            filter.push(cond);
            overviewFilter.push(cond);
        }
    }
    return {resourceQuery: {$and: filter}, resourceQueryNoPath: {$and: filterNoPath}, overviewQuery: {$and: overviewFilter},
        overviewFilterNoPath: {$and: overviewFilterNoPath}};
};

/**
 * Resource query for Download and Make Available Offline
 *
 * Note that the query for overviews is broader than the resource query (since
 * overview/categoryInfo records are often not tagged with device, devtool, etc) and can therefore result in more overviews
 * being made offline than strictly necessary.
 *
 * @param dbResources
 * @param dbOverviews
 * @param req
 */
exports.makeofflineOrDownloadQuery = function(dbResources, dbOverviews, dbPureBundles, query, callback) {
    var normalizedQueries = exports.makeNormalizedQueries(query);
    // searchCache key is always w/o paths: a search always starts off w/o paths and then subsequent requests descend
    // the tree; those requests then will be based on the original cached search query to speed things up
    var searchCacheKey = jsonStableStringify(normalizedQueries.resourceQueryNoPath);
    async.waterfall([
        // query resources (check searchCache but don't update it)
        // IMPORTANT: resources in the searchCache must not be modified since they may be re-used again; if a field needs to be modified, create a deepCopy first
        function (callback) {
            if (query.search != null && searchCache.has(searchCacheKey)) {
                logger.trace('search cache hit: ' + searchCacheKey);
                var resourcesReadOnly = searchCache.get(searchCacheKey);
                setImmediate(callback, null, resourcesReadOnly);
            } else {
                if (query.search != null) {
                    logger.trace('search query cache miss: ' + searchCacheKey);
                }
                // DON'T handle single resource that are also folders here, they are handled below
                if (query.includechildren !== 'true') {
                    normalizedQueries.resourceQuery.$and.push({linkType: 'local'}); // for now don't download or make offline any external resources
                    dbResources.findNoDeepCopy(normalizedQueries.resourceQuery, function (err, resourcesReadOnly) {
                        if (err) {
                            var errMsg = 'resource query error: ' + JSON.stringify(err);
                            logger.error(errMsg);
                            callback(errMsg);
                            return;
                        }
                        callback(null, resourcesReadOnly);
                    });
                } else {
                    setImmediate(callback, null, []);
                }
            }
        },
        // for single resource that are also folders (e.g. projects.*): if requested also get child resources
        function (resourcesReadOnly, callback) {
            if (query.id != null && query.includechildren === 'true') {
                // first get the single resource
                normalizedQueries.resourceQueryNoPath.$and.push({linkType: 'local'}); // for now don't download or make offline any external resources
                dbResources.findOne(normalizedQueries.resourceQueryNoPath, function (err, resource) {
                    if (err != null || resource == null) {
                        var errMsg = 'resource query error: ' + JSON.stringify(err);
                        logger.error(errMsg);
                        callback(errMsg);
                        return;
                    }
                    var singleResource = [resource]; // remember and add it back to the result at the very end (so that processResultsSync doesn't filter it out)
                    // now run the query without the id to get the child resources (assuming here that 'path' was set in query string)
                    var queryCpy = deepCopy(query);
                    delete queryCpy.id;
                    var dbQuery = exports.makeNormalizedQueries(queryCpy);
                    normalizedQueries.resourceQuery.$and.push({linkType: 'local'}); // for now don't download or make offline any external resources
                    dbResources.findNoDeepCopy(dbQuery.resourceQuery, function (err, childResourcesReadOnly) {
                        if (err) {
                            var errMsg = 'resource query error: ' + JSON.stringify(err);
                            logger.error(errMsg);
                            callback(errMsg);
                            return;
                        }
                        callback(null, childResourcesReadOnly, singleResource);
                    });
                });
            } else {
                setImmediate(callback, null, resourcesReadOnly, []);
            }
        },
        // get overviews
        function (resourcesReadOnly, singleResource, callback) {
            // Separate DB for overviews exists mainly for performance reasons since we need to query overviews
            // w/o device/devtool/search and there are relatively few overview entries.
            // Note: Use NoPath filter to get overviews for ALL parent categories up the tree. Overviews that are above
            // the path are purely needed for showing the overviews but will not be treated as a bundle, i.e.
            // includedFiles/Resources/Urls will be ignored when making offline.
            dbOverviews.find(normalizedQueries.overviewFilterNoPath, function (err, overviews) {
                var extraOverviews = [];
                if (query.path != null) {
                    var queryPathArr = query.path.split('/');
                    // only keep the overview for each of the path elements of the path filter
                    for (var iName = 0; iName < query.path.length; iName++) {
                        var found = false;
                        for (var iOverview = 0; iOverview < overviews.length; iOverview++) {
                            var overview = overviews[iOverview];
                            if (overview.name === queryPathArr[iName]) {
                                for (var iFullPath = 0; iFullPath < overview.fullPaths.length; iFullPath++) {
                                    var fullPath = overview.fullPaths[iFullPath];
                                    if (fullPath.length === iName) {
                                        found = true;
                                        for (var e = 0; e < fullPath.length; e++) {
                                            if (fullPath[e] !== queryPathArr[e]) {
                                                found = false;
                                                break;
                                            }
                                        }
                                    }
                                    if (found === true) {
                                        break;
                                    }
                                }
                            }
                            if (found === true) {
                                overview._extraOverview = true;
                                extraOverviews.push(overview);
                                break;
                            }
                        }
                    }
                }
                callback(null, resourcesReadOnly, singleResource, overviews, extraOverviews);
            });
        },
        // process resources
        function (resourcesReadOnly, singleResource, overviews, extraOverviews, callback) {
            // exclude singleResource and extraOverviews from processing as to not filter them out based on the query.path
            // (need overviews for ALL parent folders up the tree)
            var data = exports.processResultsSync(resourcesReadOnly.concat(overviews), null, query, null, null);
            var result = {resources: singleResource.concat(data.resources), overviews: data.folderOverviews};
            setImmediate(callback, null, result, extraOverviews);
        },
        // find all dependent bundles (in resources and overviews, but excluding extraOverviews)
        function (result, extraOverviews, callback) {
            dbOverviews.find({resourceType: 'packageOverview'}, function (err, packages) {
                var bundles = {};
                async.eachSeries([result.resources, result.overviews], function(records, callback) {
                    async.eachSeries(records, function(record, callback) {
                        async.eachSeries(record.dependencies, function(dependency, callback) {
                            //var specified_dependency = dependency;

                            //if( query.removeoffline ){
                                exports.findBundle(dependency.refId, dependency.version, dbOverviews, dbPureBundles, dbResources, function (err, bundle) {
                                    var bundleKey = dependency.refId + dependency.version;
                                    if (bundles[bundleKey] == null) {
                                        // new dependent bundle found
                                        if (err == null && bundle != null) {
                                            // 'require' and 'message' in dependency entry overrides the ones in the bundle
                                            if (dependency.require != null) {
                                                bundle.require = dependency.require;
                                            }
                                            if (dependency.message != null) {
                                                bundle.message = dependency.message;
                                            }
                                            // default is 'optional'
                                            if (bundle.require == null) {
                                                bundle.require = 'optional';
                                            }
                                            bundles[bundleKey] = bundle;
                                        }
                                    } else {
                                        // bundle previously found already: merge 'require': mandatory trumps everything
                                        if (bundles[bundleKey].require === 'optional' && dependency.require === 'implicit') {
                                            bundles[bundleKey].require = 'mandatory';
                                        } else if (bundles[bundleKey].require === 'implicit' && dependency.require === 'optional') {
                                            bundles[bundleKey].require = 'mandatory';
                                        } else if (bundles[bundleKey].require !== 'mandatory' && dependency.require === 'mandatory') {
                                            bundles[bundleKey].require = 'mandatory';
                                        }
                                    }
                                    callback();
                                });
/*
                            }
                            else{

                                //TODO should use conversion and do a semver compare.
                                //For now this not doing this as there was some problem with the info being used for bundle
                                //Also for now the below sort works since for a package all the versions are the same format, which is what we care for now (i.e. sorting within a package)
                                //and not the versions across all packages

                                //for(var i=0;i<packages.length;i++) {
                                //    packages[i].packageVersion = convertVersion(packages[i].packageVersion);
                                //}
                                for(var a=0;a<packages.length-1;a++){
                                    for(var b=a+1;b<packages.length;b++){
                                        if( packages[a].packageVersion.localeCompare(packages[b].packageVersion) == -1){
                                            var temp = packages[a];
                                            packages[a] = packages[b];
                                            packages[b] = temp;
                                        }
                                    }
                                }



                                //async.eachSeries(packages, function( full_package, callback) {
                                packages.forEach(function(full_package) {
                                    //logger.trace('dependency: ' +  specified_dependency.version);
                                    if (dependency.refId === full_package.packageId) {
                                        var package_version = convertVersion( full_package.packageVersion );
                                        var specified_version_range = convertVersion( dependency.version );

                                        var cond = semver.satisfies( package_version, specified_version_range);
                                        if (cond) {
                                            logger.tracefinest('match');
                                            exports.findBundle(full_package.packageId, full_package.packageVersion, dbOverviews, dbPureBundles, dbResources, function (err, bundle) {
                                                var bundleKey = dependency.refId + dependency.version;
                                                if (bundles[bundleKey] == null) {
                                                    // new dependent bundle found
                                                    if (err == null && bundle != null) {
                                                        // 'require' and 'message' in dependency entry overrides the ones in the bundle
                                                        if (dependency.require != null) {
                                                            bundle.require = dependency.require;
                                                        }
                                                        if (dependency.message != null) {
                                                            bundle.message = dependency.message;
                                                        }
                                                        // default is 'optional'
                                                        if (bundle.require == null) {
                                                            bundle.require = 'optional';
                                                        }
                                                        bundles[bundleKey] = bundle;
                                                    }
                                                } else {
                                                    // bundle previously found already: merge 'require': mandatory trumps everything
                                                    if (bundles[bundleKey].require === 'optional' && dependency.require === 'implicit') {
                                                        bundles[bundleKey].require = 'mandatory';
                                                    } else if (bundles[bundleKey].require === 'implicit' && dependency.require === 'optional') {
                                                        bundles[bundleKey].require = 'mandatory';
                                                    } else if (bundles[bundleKey].require !== 'mandatory' && dependency.require === 'mandatory') {
                                                        bundles[bundleKey].require = 'mandatory';
                                                    }
                                                }
                                                //callback();
                                            });
                                        }
                                        else {
                                            logger.trace('mismatch');
                                            //callback();
                                        }
                                    }
                                    else {
                                        //callback();
                                    }
                                });
                                //}, callback);
                                callback();

                            }
				*/
                        }, (err) => setImmediate(callback, err));
                    }, (err) => setImmediate(callback, err));
                }, () => {
                    result.dependentBundles = Object.keys(bundles).map(function(key) {return bundles[key];});
                    setImmediate(callback, null, result, extraOverviews);
                });
            });
        }
    ], (err, result, extraOverviews) => {
        // don't get missing parents for includedFiles (otherwise projects appear importable in offline mode even if not all dependencies offline)
        result.overviews = result.overviews.concat(extraOverviews);
        setImmediate(callback, err, result);
    });
};

var convertVersion = function( _v )
{
    var package_version = _v;
    var version_regexp = /(\d+\.\d+\.\d+)\.\d+/;
    var match = version_regexp.exec(package_version);
    if (match != null) {
        package_version = match[1];
    }
    var lz_regexp = new RegExp('0+(\\d)', '');
    match = lz_regexp.exec(package_version);
    while (match != null) {
        package_version = package_version.replace(lz_regexp, match[1]);
        match = lz_regexp.exec(package_version);
    }

    return package_version;
};

exports.findBundle = function(id, version, dbOverviews, dbPureBundles, dbResources, callback) {
    var query = {id: id};
    if (version != null) {
        query.version = version;
    }
    var foundBundle;
    async.eachSeries([dbOverviews, dbPureBundles, dbResources], function(db, callback) {
        db.findOne(query, function (err, bundle) {
            if (err != null) {
                callback(JSON.stringify(err));
                return;
            }
            if (bundle != null) {
                foundBundle = bundle;
                callback('EARLY_EXIT'); // found it, exit early
            } else {
                callback();
            }
        });
    }, function(err) {
        if (err === 'EARLY_EXIT') {
            err = null;
        }
        setImmediate(callback, err, foundBundle);
    });
};

/**
 * Resource query for browsing
 *
 * @param dbResources
 * @param dbOverviews
 * @param dbDevices
 * @param dbDevtools
 * @param dbDownloads
 * @param req
 * @param res
 * @param callback(err, result)
 */
exports.doQuery = function (dbResources, dbOverviews, dbDevices, dbDevtools, dbDownloads, req, res, callback) {
    var normalizedQueries = exports.makeNormalizedQueries(req.query);

    // searchCache key is always w/o paths: a search always starts off w/o paths and then subsequent requests descend
    // the tree; those requests then will be based on the original cached search query to speed things up
    var searchCacheKey = jsonStableStringify(normalizedQueries.resourceQueryNoPath);

    // always with paths
    var responseCacheKey = jsonStableStringify(normalizedQueries.resourceQuery);

    logger.trace('Normalized query: ' + jsonStableStringify(normalizedQueries.resourceQuery));

    if (responseCache.has(responseCacheKey)) {
        logger.trace('response cache hit: ' + responseCacheKey);
        var response = responseCache.get(responseCacheKey);
        callback(null,  response);
        return;
    }

    var packageUIds;
    if (req.query.package != null) {
        packageUIds = req.query.package.split(vars.PACKAGE_LIST_DELIMITER);
    }

    logger.trace('response cache miss: ' + responseCacheKey);
    async.waterfall([
        // query and cache
        function (callback) {
            if (req.query.search != null && searchCache.has(searchCacheKey)) {
                logger.trace('search cache hit: ' + searchCacheKey);
                var resources = searchCache.get(searchCacheKey);
                setImmediate(callback, null, resources);
            } else {
                if (req.query.search != null) {
                    logger.trace('search query cache miss: ' + searchCacheKey);
                }
                dbResources.findNoDeepCopy(normalizedQueries.resourceQuery, function (err, resourcesReadOnly) {
                    if (err) {
                        var errMsg = 'Resource query error: ' + JSON.stringify(err);
                        logger.error(errMsg);
                        callback(errMsg);
                    } else {
                        // Important: only cache initial search query and only if not too many resources to prevent excessive memory usage
                        // if query was evicted don't try re-cache it to prevent thrashing (achieved by including req.query.paths here)
                        // limit to 15000: probably could be even lower - aim is to speed up reasonable and useful searches/filters
                        // - anything above that is way too many results to be useful
                        if (req.query.search != null && req.query.path == null && resourcesReadOnly.length < 15000) {
                            searchCache.set(searchCacheKey, resourcesReadOnly);
                        }
                        callback(null, resourcesReadOnly);
                    }
                });
            }
        },
        // single resource response
        function (resourcesReadOnly, callback) {
            if ('id' in req.query) {
                var resources = deepCopy(resourcesReadOnly);
                deleteUnwantedProperties(resources);
                setImmediate(callback, 'waterfallEarlyExit', resources);
            } else {
                setImmediate(callback, null, resourcesReadOnly);
            }
        },
        // get overviews
        function (resourcesReadOnly, callback) {
            // separate DB for overviews exists mainly for performance reasons since we need to query overviews
            // w/o device/devtool/search and there are relatively few overview entries
            dbOverviews.find(normalizedQueries.overviewQuery, function (err, overviews) {
                callback(null, resourcesReadOnly, overviews);
            });
        },
        // get missing parents for includedFiles
        function (resourcesReadOnly, overviews, callback) {
            exports.getMissingParentsForIncludes(resourcesReadOnly, dbResources, function (parentRecords) { // to avoid dangling source files w/o parents when doing searches
                callback(null, resourcesReadOnly, overviews, parentRecords);
            });
        },
        // full path filter: used to rank a resource's paths and keep only the most relevant one if possible
        // build fullPath filter for the selected device (device name and related devtools)
        function (resourcesReadOnly, overviews, parentRecords, callback) {
            var fullPathFilter = [];
            if (req.query.device != null) {
                fullPathFilter.push(req.query.device);
                dbDevtools.find({devices: req.query.device}, function (err, result) {
                    if (!err) {
                        for (var i = 0; i < result.length; i++) {
                            fullPathFilter.push(result[i].name);
                        }
                    }
                    callback(null, resourcesReadOnly, overviews, parentRecords, fullPathFilter);
                });
            } else {
                setImmediate(callback, null, resourcesReadOnly, overviews, parentRecords, fullPathFilter);
            }
        },
        // build fullPath filter for the selected devtool (devtool name and related devices)
        function (resourcesReadOnly, overviews, parentRecords, fullPathFilter, callback) {
            if (req.query.devtool != null) {
                fullPathFilter.push(req.query.devtool);
                dbDevtools.findOne({name: req.query.devtool}, function (err, result) {
                    if (!err && result != null && result.devices != null) {
                        fullPathFilter = fullPathFilter.concat(result.devices);
                    }
                    callback(null, resourcesReadOnly, overviews, parentRecords, fullPathFilter);
                });
            } else {
                setImmediate(callback, null, resourcesReadOnly, overviews, parentRecords, fullPathFilter);
            }
        },
        // build fullPath filter with search term
        function (resourcesReadOnly, overviews, parentRecords, fullPathFilter, callback) {
            setImmediate(function () {
                if (req.query.search != null) {
                    fullPathFilter.push(req.query.search);
                }
                callback(null, resourcesReadOnly, overviews, parentRecords, fullPathFilter);
            });
        },
        // process resources
        function (resourcesReadOnly, overviews, parentRecords, fullPathFilter, callback) {
            // TODO: add overviews and parent resources to the searchCache too
            var data = exports.processResultsSync(resourcesReadOnly.concat(overviews).concat(parentRecords), fullPathFilter, req.query, req.route, req.url);
            addImportAndLinkToAPI(data.resources, function () {
                callback(null, data);
            });
        },
        // process folders
        function (data, callback) {
            processFolders(data, function () {
                var response = data.resources.concat(data.folders); // put leaf resources first for better UI
                deleteUnwantedProperties(response);
                if (debugDisableResponseCache !== true) {
                    responseCache.set(responseCacheKey, response); // always cache responses
                }
                callback(null, response);
            });
        }
    ], function(err, response) {
        if (err === 'waterfallEarlyExit') {
            err = null;
        }
        callback(err, response);
    });


    /**
     * Return the appropriate api call for the given resource.
     *
     * @param resource
     */
    function getAPIForResource(resource) {
        return (resource.resourceType === 'file.executable') ?
            ('api/runOffline/' + resource._id) : ('api/linkTo/' + resource._id);
    }
    
    /**
     * adds importProject for the client (importProjectCSS is kept internal to hide any absolute paths as a security measure)
     * in the cases where a project has to be generated first, we need to provide the device variant to CCS which we'll try
     * to get from 'path' in the query part of the URL
     *
     * also replaces the direct 'link' to content with a 'linkTo' API to be used by the browser which is mainly done for analytics to
     *   (1) force external links through rex server so that we can count them
     *   (2) eliminate secondary content requests, such as icons for selector list or embedded in html content
     *   (3) eliminate multiple partial requests, such as for large pdf files which are split up by the browser into multiple GET request
     *
     * @param resources
     * @param callback
     */
    function addImportAndLinkToAPI(resources, callback) {
        async.each(resources, function (resource, callback) {
            var extname = null;
            async.series([
                // linkTo
                function (callback) {
                    if (resource.link != null) {
                        if (resource.fileType != null) {
                            extname = resource.fileType;  // fileType / extname must include '.' since the browser UI expects it
                            if (extname.charAt(0) !== '.') {
                                extname = '.' + extname;
                            }
                        } else {
                            extname = path.extname(resource.link);
                        }
                        // TODO: don't overwrite link - better now change .link to .location in the db
                        resource.link = getAPIForResource(resource);
                    }
                    setImmediate(callback);
                },
                // importProject
                function (callback) {
                    if (resource._importProjectCCS != null) {
                        delete resource._importProjectCCS;
                        exports.detectDeviceVariantAndDevtool(dbDevices, dbDevtools, resource, req.query.device, req.query.devtool, req.query.path,
                            function (deviceVariantExact, deviceVariantCandidates, deviceFamily, devtoolExaxt, devtoolCandidates) {
                                // CCS project, projectspec
                                if (resource.resourceType === 'project.ccs' ||
                                    (resource.resourceType === 'projectSpec' && !resource.advanced.overrideProjectSpecDeviceId)) {
                                    // no device variant needed
                                    resource.importProject = 'api/importProject/' + resource._id;
                                    // if available, provide the default connection for the devtool/board
                                    if (devtoolExaxt != null && devtoolExaxt.connections != null && devtoolExaxt.connections[0] != null) {
                                        resource.importProject += '?connection=' + devtoolExaxt.connections[0];
                                    }
                                    callback();
                                } else if (resource.resourceType === 'projectSpec' && resource.advanced.overrideProjectSpecDeviceId) {
                                    // NOTE: the browser always gets an importProject property which can point to either tirex/api/importProject or tirex/api/createProject
                                    resource.importProject = 'api/importProject/' + resource._id + '/{coreTypeId}'; // the base - will need to replace the actual core ID...
                                    // ... either we figure the device variant here out here or browser has to ask the user based on the device list
                                    if (deviceVariantExact != null) {
                                        var coreTypeId = determineCoreTypeId(deviceVariantExact, req.query.path);
                                        resource.importProject = resource.importProject.replace('{coreTypeId}', coreTypeId);
                                        delete resource.devicesVariants; // no longer needed this we figured out the device name to use
                                    } else {
                                        // browser uses resource.devicesVariants to pop dialog; TODO: user needs to be shown core types
                                    }
                                    // if available, provide the default connection for the devtool/board
                                    if (devtoolExaxt != null && devtoolExaxt.connections != null && devtoolExaxt.connections[0] != null) {
                                        resource.importProject += '?connection=' + devtoolExaxt.connections[0];
                                    }
                                    callback();
                                    // CCS Energia sketch: try to narrow down possible Energia board IDs as much as possible
                                } else if (resource.resourceType === 'project.energia') {
                                    resource.importProject = 'api/importProject/' + resource._id + '/{energiaBoardId}'; // the base - will need to replace the variant name ...
                                    if (devtoolExaxt != null) {
                                        // narrowed down to a specific devtool: if it has only one board ID pick that, if not all board IDs are candidates (and user has to choose)
                                        if (devtoolExaxt.energiaBoards == null) {
                                            logger.error('Cannot generate import API because Energia boards are not specified: ' + JSON.stringify(devtoolExaxt.name));
                                        } else if (devtoolExaxt.energiaBoards.length === 1) {
                                            resource.importProject = 'api/importProject/' + resource._id + '/' + devtoolExaxt.energiaBoards[0].id;
                                        } else {
                                            resource.energiaBoards = devtoolExaxt.energiaBoards;
                                        }
                                        callback();
                                    } else if (devtoolCandidates != null) {
                                        // couldn't narrow down to a a specific devtool: all board IDs of all devtools are candidates (and user has to choose)
                                        resource.energiaBoards = [];
                                        async.each(devtoolCandidates, function (devtoolName, callback) {
                                            dbDevtools.findOne({name: devtoolName}, function (err, devtool) {
                                                if (devtool == null) {
                                                    logger.error('Energia import: devtool not found in devtool tree: ' + devtoolName);
                                                } else {
                                                    resource.energiaBoards = resource.energiaBoards.concat(devtool.energiaBoards);
                                                }
                                                callback();
                                            });
                                        }, callback);
                                    } else {
                                        logger.error('Cannot generate import API because devtool could not be determined for: ' + JSON.stringify(resource));
                                        callback();
                                    }
                                } else {
                                    callback();
                                }
                            });
                    } else {
                        setImmediate(callback);
                    }
                },
                // createProject: file.importable, folder.importable
                function (callback) {
                    // TODO: browser UI doesn't understand 'file.importable': temp workaround: change back to 'file'
                    if (resource.resourceType === 'file.importable') {
                        resource.resourceType = 'file';
                    }
                    if (resource._createProjectCCS != null) {
                        delete resource._createProjectCCS;
                        // NOTE: the browser always gets an importProject property which can point to either tirex/api/importProject or tirex/api/createProject
                        resource.importProject = 'api/createProject/' + resource._id + '/{coreTypeId}'; // the base - will need to replace the actual core ID...
                        // ... either we figure the device variant here out here or browser has to ask the user based on the device list
                        exports.detectDeviceVariantAndDevtool(dbDevices, dbDevtools, resource, req.query.device, req.query.devtool, req.query.path, function (deviceRecord) {
                            if (deviceRecord != null) {
                                var coreTypeId = determineCoreTypeId(deviceRecord, req.query.path);
                                resource.importProject = resource.importProject.replace('{coreTypeId}', coreTypeId);
                                delete resource.devicesVariants; // no longer needed this we figured out the device name to use
                            }
                            callback();
                        });
                    } else {
                        delete resource.devicesVariants;
                        setImmediate(callback);
                    }
                },
                // add packageOrder field from the packageOverview
                function(callback) {
                    dbOverviews.findOne({resourceType: 'packageOverview', packageUId: resource.packageUId}, function (err, packageOverview) {
                        if (packageOverview != null) {
                            resource.packageOrder = packageOverview.packageOrder;
                        } else {
                            err = 'packageOverview is null';
                        }
                        callback(err);
                    });
                },
                // append analytics info to APIs so that we can figure out the associated device, devtool, etc. `for each action (view, import, download)
                function (callback) {
                    var analyticsUrlQuery = 'analyticsDevice=' + encodeURIComponent(req.query.device) +
                        '&analyticsDevtool=' + encodeURIComponent(req.query.devtool) + '&analyticsPath=' +
                        encodeURIComponent(req.query.path);
                    if (resource.importProject != null) {
                        if (resource.importProject.indexOf('?') === -1) {
                            resource.importProject += '?' + analyticsUrlQuery;
                        } else {
                            resource.importProject += '&' + analyticsUrlQuery;
                        }
                    }
                    if (resource.link != null) { // linkTo
                        resource.link += '?' + analyticsUrlQuery;
                    }
                    if (resource.downloadLink != null) {
                        resource.downloadLink += '&' + analyticsUrlQuery;
                    }
                    setImmediate(callback);
                },
                function (callback) {
                    // append extension of original link so that browser can show the right icon (has to be appended at the end!)
                    if (resource.link != null) { // linkTo
                        resource.link += '&extname=' + extname;
                    }
                    setImmediate(callback);
                }
            ], callback); // to async.each
        }, function(err) {
            // sort resources
            sortStable.inplace(resources, orderComparator);
            setImmediate(callback, err); // to function arg
        });

        /**
         * Determine core type id based on the path in the query
         * @param deviceRecord
         * @param callback
         */
        function determineCoreTypeId(deviceRecord, reqQueryPath) {
            var coreTypeId = null;
            if (deviceRecord.coreTypes_id != null) {
                if (deviceRecord.coreTypes_id.length === 1) {
                    coreTypeId = deviceRecord.coreTypes_id[0];
                } else if (reqQueryPath != null) {
                 var pathArr = reqQueryPath.split('/');
                    for (var i = 0; i < pathArr.length, coreTypeId == null; i++) {
                        for (var j = 0; j < deviceRecord.coreTypes_name.length, coreTypeId == null; j++) {
                            if (pathArr[i] === deviceRecord.coreTypes_name[j]) {
                                coreTypeId = deviceRecord.coreTypes_id[j];
                                break;
                            }
                        }
                    }
                }
            }
            return coreTypeId;
        }
    }

    /**
     * Post process folders
     * @param data
     * @param callback
     */
    function processFolders(data, callback) {
        logger.tracefinest('Processing folders: ' + JSON.stringify(data.folders));

        async.eachSeries(data.folders, function (folder, callback) {
            async.series([
                /**
                 Merge a same-name resource and folder (to show source files for project.ccs, projectSpec, project.energia, etc)
                 */
                    function (callback) {
                    for (var i = data.resources.length - 1; i >= 0; i--) {
                        var resourceRecord = data.resources[i];
                        if (folder.text === resourceRecord.name) {
                            for (var prop in resourceRecord) {
                                if (resourceRecord.hasOwnProperty(prop)) {
                                    // merge properties
                                    if (prop === 'type') {
                                        // nop: keep 'type' as 'folder'
                                    } else if (prop === 'downloadLink' || prop === 'makeofflineLink' || prop === 'removeofflineLink') {
                                        // add resource id and includechildren to folder's download/makeoffline link
                                        // (so that we can download/makeoffline both the resource and it's children)
                                        folder[prop] += '&id=' + resourceRecord._id + '&includechildren=true';
                                    } else {
                                        // merge everything else
                                        folder[prop] = resourceRecord[prop];
                                    }
                                }
                            }
                            folder.order = 0; // prioritize these kind of merged folders over others
                            data.resources.splice(i, 1); // remove the record from resources
                        }
                    }
                    setImmediate(callback);
                },
                /**
                 Rules for auto opening and selecting folders
                 */
                    function (callback) {
                    folder.state.opened = false;

                    // if search, open the root level
                    if (req.query.search != null && req.query.path == null) {
                        folder.state.opened = true;
                    }

                    // only auto open if there's a single lonely folder...
                    //var pathArray = req.query.path.split('/');
                    //if (pathArray.length > 1) {
                    //    if (data.folders.length /*=number of sibling folders*/ > 1 || folder.numImmediateChildren > 99999) {
                    //        folder.state.opened = false;
                    //    }
                    //}

                    // auto open the 'Devices' folder if a device was selected in the drop down selector
                    if (req.query.device != null && (folder.text === 'Devices' || req.query.path == null)) {
                        folder.state.opened = true;
                    }
                    // auto open the 'Development Tools' folder if a devtool was selected in the drop down selector
                    if (req.query.devtool != null && (folder.text === 'Development Tools' || folder.text === 'Kits and Boards' || req.query.path == null)) {
                        folder.state.opened = true;
                    }
                    // auto open device/devtool folders if that device/devtool was selected
                    if (folder.text === req.query.device || folder.text === req.query.devtool) {
                        folder.state.opened = true;
                    }
                    setImmediate(callback);
                },
                /**
                 Rules for auto selecting a folder (e.g. to show most relevant overview)
                 */
                /*
                    function (callback) {
                    if (folder.text === req.query.device || folder.text === req.query.devtool || folder.text === req.query.search) {
                        folder.state.selected = true;
                    }
                    setImmediate(callback);
                },
                */
                /**
                 * Handle overviews
                 * first check if there's a overview resource
                 * if not, see if it is a device and use the description from the device db as the overview (also checks parent devices until a description os
                 *
                 * Overview properties for folders:
                 *  overviewLink
                 *  overviewImage
                 *  overviewDescription
                 *  icon
                 */
                    function (callback) {
                    var found = false;
                    // first check if there's a custom overview resource
                    for (var i = 0; i < data.folderOverviews.length; i++) {
                        var overviewResource = data.folderOverviews[i];
                        if (overviewResource.name === folder.text) {
                            if (found === false) {
                                // if there are multiple overview records, retain the first one found
                                folder.overviewLink = overviewResource.link;
                                if (folder.overviewLink) {
                                    // Temporary fix for older browsers with difficulties handling win style paths in
                                    // links
                                    folder.overviewLink = folder.overviewLink.replace(/\\/g, '/');
                                }
                                folder.overviewImage = overviewResource.image;
                                folder.overviewDescription = overviewResource.description;
                                folder.icon = overviewResource.icon;
                                if (overviewResource.resourceType === 'packageOverview') {
                                    folder.downloadLink = overviewResource.downloadLink;
                                    folder.makeofflineLink = overviewResource.makeofflineLink;
                                    // TODO folder.removeofflineLink = overviewResource.removeofflineLink;
                                }
                            } else {
                                // if there are multiple overviewContents for a folder, merge them
                                //folder.overviewDescription += '<br><br>' + overviewResource.description;
                            }
                            found = true;
                        }
                    }
                    // if not, see if it is a device and use the description from the device db as the overview
                    if (found === false) {
                        exports.findDeviceWithOverview(dbDevices, folder.text, function (deviceRecord) {
                            if (deviceRecord != null) {
                                folder.overviewDescription = deviceRecord.description;
                                folder.overviewImage = deviceRecord.image;
                                // [ REX-1061
                                if(deviceRecord.descriptionLocation) {
                                    folder.overviewLink = deviceRecord.descriptionLocation;
                                }
                                // ]
                                callback();
                            } else {
                                // if not, see if it is a devtool and use the description from the devtool db as the overview
                                dbDevtools.findOne({name: folder.text}, function (err, devtoolRecord) {
                                    if (devtoolRecord != null) {
                                        folder.overviewDescription = devtoolRecord.description;
                                        folder.overviewImage = devtoolRecord.image;
                                        // [ REX-1061
                                        if(devtoolRecord.descriptionLocation) {
                                            folder.overviewLink = devtoolRecord.descriptionLocation;
                                        }
                                        // ]
                                    }
                                    callback();
                                });
                            }
                        });
                    } else {
                        setImmediate(callback);
                    }
                },
                // add other package fields from the packageOverview
                function(callback) {
                    dbOverviews.findOne({resourceType: 'packageOverview', packageUId: folder.packageUId}, function (err, packageOverview) {
                        if (packageOverview != null) {
                            folder.packageOrder = packageOverview.packageOrder;
                        } else {
                            err = 'packageOverview is null';
                        }
                        callback(err);
                    });
                }
            ], function () {
                callback(); // to async.each
            });
        }, function () {
            // sort folders
            sortStable.inplace(data.folders, orderComparator);
            setImmediate(callback);
        });
    }
};

exports.dumpImportablesForTesting = function (dbDevtools, dbResources, req_query, callback) {
    var normalizedQueries = exports.makeNormalizedQueries(req_query);
    normalizedQueries.resourceQuery.$and.push({'resourceType': {$in: ['project.ccs', 'projectSpec', 'project.energia', 'file.importable', 'folder.importable']}});
    dbResources.findNoDeepCopy(normalizedQueries.resourceQuery, function (err, queryResultsReadOnly) {
        if (err) {
            var errMsg = 'Resource query error: ' + JSON.stringify(err);
            logger.error(errMsg);
            callback(errMsg);
        } else {
            var results = [];
            async.each(queryResultsReadOnly, function (queryResultReadOnly, callback) {
                var result = {};
                results.push(result);
                result.location = queryResultReadOnly.link;
                result.resourceType = queryResultReadOnly.resourceType;
                result.createProjectCCS = queryResultReadOnly._createProjectCCS;
                result.importProjectCCS = queryResultReadOnly._importProjectCCS;
                result.devicesVariants = queryResultReadOnly.devicesVariants;
                result.packageUId = queryResultReadOnly.packageUId;

                // assemble all energiaBoards
                if (queryResultReadOnly.devtools != null) {
                    async.each(queryResultReadOnly.devtools, function (devtool, callback) {
                        dbDevtools.findOne({name: devtool}, function (err, devtool) {
                            if (devtool != null) {
                                if (devtool.energiaBoards != null) {
                                    if (result.energiaBoards == null) {
                                        result.energiaBoards = [];
                                    }
                                    result.energiaBoards = result.energiaBoards.concat(devtool.energiaBoards);
                                }
                            } else {
                                err = 'devtool is null';
                            }
                            callback(err);
                        });
                    }, (err) => setImmediate(callback, err));
                } else {
                    setImmediate(callback);
                }
            }, function (err) {
                callback(err, results);
            });
        }
    });
};


/**
 * to avoid dangling source files w/o parents when doing searches
 * TODO: only do for searches; cache results in the searchCache
 * TODO: does not work for manually added 'dependencies', i.e. as a record in the metadata instead of dependency file
 *
 * @param resourcesReadOnly
 * @param dbResources
 * @param callback
 */
exports.getMissingParentsForIncludes = function(resourcesReadOnly, dbResources, callback) {
    var foundParentIDs = {};
    var parentRecords = [];

    for (var i = 0; i < resourcesReadOnly.length; i++) {
        var resourceReadOnly = resourcesReadOnly[i];
        if (resourceReadOnly.hasIncludes === true) {
            foundParentIDs[resourceReadOnly._id] = true;
        } else if (resourceReadOnly.parentID != null && foundParentIDs[resourceReadOnly.parentID] == null) {
            foundParentIDs[resourceReadOnly.parentID] = false;
        }
    }

    async.eachSeries(Object.keys(foundParentIDs), function (id, callback) {
        if (foundParentIDs[id] === false) {
            dbResources.findOne({_id: id}, function (err, parentRecord) {
                if (err) {
                    var errMsg = 'Resource query error: ' + JSON.stringify(err);
                    logger.error(errMsg);
                } else if (parentRecord != null) {
                    parentRecords.push(parentRecord);
                }
                callback(err);
            });
        } else {
            setImmediate(callback);
        }
    }, function () {
        setImmediate(callback, parentRecords);
    });
};

/**
 * Detect the device variant and devtool on a best effort basis from
 *  - the single device variant (or devtool) listed in the resource record, or
 *  - device (or devtool) typically taken from a req.query (note that this may not be a variant but could be a device group or family), or
 *  - path from a req.query (i.e. the resource tree path)
 *  - the devtool-to-device mapping field in the devtool record
 *
 *  if no exact match can be found take, a list of candidates is returned (narrowed down as much as possible)
 *
 * TODO: unit test
 *
 * @param dbDevices
 * @param dbDevtools
 * @param resource: may be null
 * @param deviceName: may be null (typically from the req.query)
 * @param devtoolName: may be null (typically from the req.query)
 * @param path: may be null
 * @param callback(deviceVariantExact, deviceVariantCandidateNames, deviceFamily, devtoolExact, devtoolCandidatNames):
 *      deviceVariantExact {Object}: set if an exact device variant could be determined
 *      deviceVariantCandidateNames {Array of Strings}: if no exact device variant could be determined, it contains a list of candidates
 *      deviceFamily {String}: root ancestor for either deviceVariantExact or the first name in deviceVariantCandidateNames
 *      devtoolExact {Object}: set if an exact devtool could be determined
 *      devtoolCandidateNames {Array of Strings}: if no exact devtool could be determined, it contains a list of candidates
 */
exports.detectDeviceVariantAndDevtool = function(dbDevices, dbDevtools, resource, deviceName, devtoolName, path, callback) {
    var deviceVariantExact = null;
    var deviceVariantCandidatesNames = null;
    var deviceFamily = null;
    var devtoolExact = null;
    var devtoolCandidateNames = null;
    if (resource != null) {
        // packageUId = resource.packageUId; Metadata 3.0: always DON'T CARE
    } else {
        // leave undefined to indicate DON'T CARE in the queries
    }

    // ordering: do more reliable detection methods first (however the best-guess variant is possibly more specific
    // if we take it from the devtool-to-devices mapping, which is done last, rather than the devices list in the resource)
    async.series([
        function(callback) {
            // detect device variant: if there's only one device variant assigned to this resource, use that
            if (deviceVariantExact != null || resource == null || resource.devicesVariants == null) {
                return setImmediate(callback);
            }
            if (resource.devicesVariants.length === 1) {
                devicesBuilder.isDeviceVariant(dbDevices, resource.devicesVariants[0], function (err, bool, device) {
                    if (bool === true) {
                        deviceVariantExact = device;
                    }
                    callback();
                });
            } else if (resource.devicesVariants.length > 1) {
                deviceVariantCandidatesNames = resource.devicesVariants;
                setImmediate(callback);
            } else {
                setImmediate(callback);
            }
        },
        // detect devtool: if there's only one devtool assigned to this resource, use that
        function(callback) {
            if (devtoolExact != null || resource == null || resource.devtools == null) {
                return setImmediate(callback);
            }
            if (resource.devtools.length === 1) {
                dbDevtools.findOne({name: resource.devtools[0]}, function(err, theDevtool) {
                    devtoolExact = theDevtool;
                    callback();
                });
            } else if (resource.devtools.length > 1) {
                devtoolCandidateNames = resource.devtools;
                setImmediate(callback);
            } else {
                setImmediate(callback);
            }
        },
        // detect device variant: from the 'device' in the query
        function(callback) {
            if (deviceVariantExact != null || deviceName == null) {
                return setImmediate(callback);
            }
            devicesBuilder.isDeviceVariant(dbDevices, deviceName, function (err, bool, device) {
                if (bool === true) {
                    deviceVariantExact = device;
                }
                callback();
            });
        },
        // detect devtool: from the 'devtool' in the query
        function(callback) {
            if (devtoolExact != null || devtoolName == null) {
                return setImmediate(callback);
            }
            dbDevtools.findOne({name: devtoolName}, function (err, theDevtool) {
                devtoolExact = theDevtool;
                callback();
            });
        },
        // detect device variant: from the 'path' in the query
        function(callback) {
            if (deviceVariantExact != null || path == null) {
                return setImmediate(callback);
            }
            var pathArray = path.split('/');
            // check each path element to see whether it's a device variant name
            async.detect(pathArray, function (pathElement, callback) {
                devicesBuilder.isDeviceVariant(dbDevices, pathElement, function (err, bool, device) {
                    if (bool === true) {
                        deviceVariantExact = device;
                        callback(err, true);
                    } else {
                        callback(err, false);
                    }
                });
            }, (err) => setImmediate(callback, err));
        },
        // detect devtool: from the 'path' in the query
        function(callback) {
            if (devtoolExact != null || path == null) {
                return setImmediate(callback);
            }
            var pathArray = path.split('/');
            // check each path element to see whether it's a devtool name
            async.detect(pathArray, function (pathElement, callback) {
                dbDevtools.findOne({name: pathElement}, function (err, theDevtool) {
                    if (theDevtool != null) {
                        devtoolExact = theDevtool;
                        callback(err, true);
                    } else {
                        callback(err, false);
                    }
                });
            }, (err) => setImmediate(callback, err));
        },
        // detect device variant: through devtool-to-devices mapping
        function(callback) {
            if (deviceVariantExact != null || devtoolExact == null || devtoolExact.devices == null) {
                return setImmediate(callback);
            }
            if (devtoolExact.devices.length === 1) {
                devicesBuilder.isDeviceVariant(dbDevices, devtoolExact.devices[0], function (err, bool, device) {
                    if (bool === true) {
                        deviceVariantExact = device;
                    }
                    callback();
                });
            } else if (devtoolExact.devices.length > 1) {
                // only use these candidates if this is a more narrowed down list than we already have
                if (deviceVariantCandidatesNames == null || (deviceVariantCandidatesNames != null &&
                    devtoolExact.devices.length < deviceVariantCandidatesNames.length)) {
                    deviceVariantCandidatesNames = devtoolExact.devices;
                }
                setImmediate(callback);
            } else {
                setImmediate(callback);
            }
        },
        // detect devtool: through devtool-to-devices mapping
        function(callback) {
            if (devtoolExact != null || deviceVariantExact == null) { return setImmediate(callback); }
            dbDevtools.find({devices: deviceVariantExact}, function(err, theDevtools) {
                if (theDevtools.length === 1) {
                    devtoolExact = theDevtools[0];
                } else if (theDevtools.length > 1) {
                    // only use these candidates if this is a more narrowed down list than we already have
                    if (devtoolCandidateNames == null || (devtoolCandidateNames != null && theDevtools.length < devtoolCandidateNames.length)) {
                        devtoolCandidateNames = [];
                        for (var i = 0; i < theDevtools.length; i++) {
                            devtoolCandidateNames.push(theDevtools[i].name);
                        }
                    }
                }
                callback();
            });
        }
    ], function(err) {
        // determine device family
        if (deviceVariantExact != null && deviceVariantExact.ancestors != null) {
            deviceFamily = deviceVariantExact.ancestors[0];
            setImmediate(cb);
        } else if (deviceVariantCandidatesNames != null && deviceVariantCandidatesNames[0] != null) {
            dbDevices.findOne({name: deviceVariantCandidatesNames[0]}, function(err, device) {
                if (device != null && device.ancestors != null) {
                    deviceFamily = device.ancestors[0];
                }
                cb();
            });
        } else {
            setImmediate(cb);
        }
        function cb() {
            callback(deviceVariantExact, deviceVariantCandidatesNames, deviceFamily, devtoolExact, devtoolCandidateNames);
        }
    });
};

function deleteUnwantedProperties(arr) {
    for (var i = 0; i < arr.length; i++) {
        var obj = arr[i];
        delete obj.fullPaths;
        delete obj._fullPathsCpy;
        delete obj.categories;
        delete obj.comment;
        delete obj.devices;
        delete obj.packageName;
        //delete obj.tags;
        delete obj.keep;
        delete obj.linkForDownload;
        delete obj.root0;
        delete obj.doNotCount;
        delete obj.order;
        delete obj._childFolderNames;
        delete obj.numImmediateChildren;
        //delete record._id;
    }
}

/**
 * for keyword search to trim number of fullPaths
 * the score is the last element in a fullPath element array
 * @param a
 * @param b
 * @returns {number}
 */
function sortFullPathsDec(a, b) {
    var aScore = a[a.length - 1];
    var bScore = b[b.length - 1];
    return bScore - aScore;
}

/**
 * for record and folder ordering (numeric increasing based on 'order' property)
 * @param a
 * @param b
 * @returns {number}
 */
function orderComparator(a, b) {
    var packageOrderDiff = 0;
    var recordOrFolderOrderDiff = 0;
    if (a.packageOrder != null && b.packageOrder != null) {
        packageOrderDiff = a.packageOrder - b.packageOrder;
    }
    if (packageOrderDiff === 0) {
        if (a.order != null && b.order != null) {
            recordOrFolderOrderDiff = a.order - b.order;
        }
        return recordOrFolderOrderDiff;
    } else {
        return packageOrderDiff;
    }
}

/**
 * Post process query results - only use this function for non-async processing (to keep sync and async processing code cleanly separated)
 *
 * Operates in two different modes:
 *   1) regular browsing query
 *   2) download, makeoffline or removeoffline: don't create folders but keep every record
 *
 * @param queryResultReadOnly
 * @param query
 * @param reqRoute: only needed for regular browsing query
 * @param reqUrl: only needed for regular browsing query
 * @returns {Object} with arrays of data items to return to client: resources, folders and overview resources for the folders
 */
exports.processResultsSync = function(queryResultReadOnly, fullPathFilter, query, reqRoute, reqUrl) {

    // some db's return cashed result object, i.e. we shouldn't be modifying it otherwise next time
    // will get the already modified version back!
    // 4/22/15: remove for now since rexdb doesn't cache. Big performance boost of ~33%.
    //var result = JSON.parse(JSON.stringify(queryResult)); // deep copy

    // BUT, AND THIS IS IMPORTANT: queryResult may now be re-used since it could be cached in the searchCache;
    // rexdb always returns a deepcopy (to protect the data in the db) but the cache does not.
    // This means we have to selectively deepcopy and/or initialize properties that we need to modify.

    var folderNames = [];
    var recordReadOnly;
    var _fullPathsCpy;
    var recordsAux = [];
    var recordAux;

    // returns
    var data = {
        resources: [],
        folders: [],
        folderOverviews: [], // overview resources go through the same processing as regular resources
        totalCount: 0
    };

    for (var i = 0; i < queryResultReadOnly.length; i++) {
        recordReadOnly = queryResultReadOnly[i];
        recordAux = recordsAux[i] = {}; // the modifiable record object
        _fullPathsCpy = deepCopy(recordReadOnly.fullPaths);
        var fullPathCpy;

        // if a maincategory was specified, remove it from the resource's paths
        if ('maincategory' in query) {
            for (var i1 = 0; i1 < _fullPathsCpy.length; i1++) {
                fullPathCpy = _fullPathsCpy[i1];
                var m = fullPathCpy.indexOf(query.maincategory);
                if (m !== -1) {
                    fullPathCpy.splice(m, 1);
                } else {
                    // remove unmatched paths
                    fullPathCpy.splice(0, fullPathCpy.length, 'NO_MATCH');
                }
            }
        }

        // for resource paths with 'Devices': if a device was specified, remove it and all its parents (device family,
        // subfamily, etc) from the resource's path assumption: device path occurs after 'Devices' category element
        if ('device' in query) {
            for (var i2 = 0; i2 < _fullPathsCpy.length; i2++) {
                fullPathCpy = _fullPathsCpy[i2];
                var indexDevices = Math.max(fullPathCpy.indexOf('Devices'), fullPathCpy.indexOf(vars.META_2_1_TOP_CATEGORY.devices.text));
                if (indexDevices !== -1) {
                    var index = fullPathCpy.indexOf(query.device);
                    if (index !== -1) {
                        // remove device and its parents
                        fullPathCpy.splice(indexDevices + 1, index - indexDevices - 1); // TRIAL: '-1' to keep device itself
                    }
                    else {
                        // remove unmatched paths
                        fullPathCpy.splice(0, fullPathCpy.length, 'NO_MATCH');
                    }
                }
            }
        }

        // if a path was specified, remove matching elements from the resource's paths
        if ('path' in query) {
            var queryPath = query.path.split('/');
            for (var i3 = 0; i3 < queryPath.length; i3++) {
                var queryPathElement = queryPath[i3];
                for (var j = 0; j < _fullPathsCpy.length; j++) {
                    fullPathCpy = _fullPathsCpy[j];
                    if (fullPathCpy[0] !== 'NO_MATCH') {
                        if (fullPathCpy[0] === queryPathElement) {
                            fullPathCpy.splice(0, 1);
                        }
                        else {
                            // remove unmatched paths
                            fullPathCpy.splice(0, fullPathCpy.length, 'NO_MATCH');
                        }
                    }
                }
            }
        }

        // fullPath filter
        // to avoid showing the same resource in multiple paths as much as possible, retain only
        // fullPaths that contain specified full path filter terms such as the search and filter text; or if none contains it, retain all.
        if (fullPathFilter != null && fullPathFilter.length > 0) {
            for (var i7 = 0; i7 < _fullPathsCpy.length; i7++) {
                fullPathCpy = _fullPathsCpy[i7];
                var score = 0;
                for (var j1 = 0; j1 < fullPathCpy.length; j1++) {
                    var fullPathElement = fullPathCpy[j1].toLowerCase();
                    for (var j2 = 0; j2 < fullPathFilter.length; j2++) {
                        if (fullPathElement.indexOf(fullPathFilter[j2].toLowerCase()) !== -1) {
                            score++;
                        }
                    }
                }
                fullPathCpy.push(score);
            }
            _fullPathsCpy.sort(sortFullPathsDec);
            var topScore = _fullPathsCpy[0].pop();
            for (var i8 = 1; i8 < _fullPathsCpy.length; i8++) {
                var fullPath1 = _fullPathsCpy[i8];
                var score1 = fullPath1.pop();
                // remove non-top scoring paths
                if (score1 !== topScore) {
                    fullPath1.splice(0, fullPath1.length, 'NO_MATCH');
                }
            }
        }

        // if download/makeoffline, don't create folders but keep each record (records will NOT be deep copied and NOT merged with aux)
        if (query.download === 'true' || query.makeoffline === 'true' || query.removeoffline === 'true') {
            // download or makeoffline query
            for (var i6 = 0; i6 < _fullPathsCpy.length; i6++) {
                fullPathCpy = _fullPathsCpy[i6];
                // mark resource records that matched device, category and path as 'keep'
                if (fullPathCpy.length === 0 || fullPathCpy[0] !== 'NO_MATCH') {
                    recordAux.keep = true;
                    break;
                }
            }
        } else {
            // regular browsing query (records will be DEEP COPIED and merged with aux)
            for (var i4 = 0; i4 < _fullPathsCpy.length; i4++) {
                fullPathCpy = _fullPathsCpy[i4];
                var downloadLink;
                var makeofflineLink;
                var removeofflineLink;
                // mark resource records that matched device, category and path as 'keep'
                if (fullPathCpy.length === 0) {
                    recordAux.keep = true;
                    data.totalCount += 1;
                    if (recordReadOnly.linkType !== 'external' && recordReadOnly.linkType !== 'file.executable' && recordReadOnly.linkType !== 'web.app') {
                        downloadLink = reqRoute.path.slice(1) + '?id=' + recordReadOnly._id; // slice: remove leading '/' to make it relative
                        if (query.path != null) {
                            downloadLink += '&path=' + query.path;
                        }
                        recordAux.downloadLink = downloadLink + '&download=true';
                        recordAux.makeofflineLink = downloadLink + '&makeoffline=true';
                        recordAux.removeofflineLink = downloadLink + '&removeoffline=true';
                        if (recordReadOnly.resourceType === 'packageOverview' || recordReadOnly.allowPartialDownload === false) {
                            recordAux.downloadLink = 'api/bundle?vid=' + recordReadOnly.packageUId + '&download=true';
                            recordAux.makeofflineLink = 'api/bundles?vids=' + recordReadOnly.packageUId;
                            // TODO recordAux.removeofflineLink = 'api/bundles?vid=' + recordReadOnly.packageUId + '&remove=true';
                        }
                    }
                    break;
                }

                // create a folder for records that matched but are one level down in the path
                // but don't create a folder solely based on an overview/package/component resource
                if (fullPathCpy[0] !== 'NO_MATCH' && recordReadOnly.resourceType !== 'overview' &&
                    recordReadOnly.resourceType !== 'packageOverview') {
                    var folderIndex = folderNames.indexOf(fullPathCpy[0]);
                    if (folderIndex === -1) {
                        // create a new folder
                        logger.tracefinest('Creating new folder: ' + fullPathCpy[0]);
                        folderNames.push(fullPathCpy[0]);
                        folderIndex = folderNames.length - 1;
                        // construct download link
                        downloadLink = reqRoute.path.slice(1) + '?'; // remove leading '/' to make it relative
                        for (var key in query) {
                            if (query.hasOwnProperty(key)) {
                                if (key !== 'path') {
                                    downloadLink += (key + '=' + query[key]) + '&';
                                }
                            }
                        }
                        if ('path' in query) {
                            downloadLink += ('path=' + query.path + '/' + fullPathCpy[0] + '&');
                        } else {
                            downloadLink += ('path=' + fullPathCpy[0] + '&');
                        }
                        makeofflineLink = downloadLink + 'makeoffline=true';
                        removeofflineLink = downloadLink + 'removeoffline=true';
                        downloadLink += 'download=true';
                        if (recordReadOnly.allowPartialDownload === false) {
                            downloadLink = 'api/bundle?vid=' + recordReadOnly.packageUId + '&download=true';
                            makeofflineLink = 'api/bundles?vids=' + recordReadOnly.packageUId;
                            // TODO removeofflineLink = 'api/bundles?vid=' + recordReadOnly.packageUId + '&remove=true';
                        }
                        // note: for jstree using 'text' instead of 'name' and including 'children': true
                        // numChildren is used for UI only
                        var newFolder = {
                            text: fullPathCpy[0],
                            type: 'folder',
                            numChildren: 0, // used by UI only
                            numChildrenLocal: 0,
                            children: true,
                            allowPartialDownload: recordReadOnly.allowPartialDownload,
                            _downloadLink: downloadLink, // hide download link until we find a non-external resource in the folder
                            _makeofflineLink: makeofflineLink, // hide makeoffline link until we find a non-external resource in the folder
                            _removeofflineLink: removeofflineLink,
                            state: {opened: false},
                            order: recordReadOnly.order,
                            package: recordReadOnly.package, // needed to determine packageOrder later
                            packageUId: recordReadOnly.packageUId,
                            _childFolderNames: [],
                            numImmediateChildren: 0,
                            url: reqUrl // TODO: temp
                        };
                        // [ Metadata_2.1 : disable download for top nodes
                        // TODO: Need a way to handle other nodes, determine which node is not downloadable?
                        if(newFolder.text === vars.META_2_1_TOP_CATEGORY.software.text || newFolder.text === vars.META_2_1_TOP_CATEGORY.devices.text || newFolder.text === vars.META_2_1_TOP_CATEGORY.devtools.text) {
                            delete newFolder._downloadLink;
                            delete newFolder._makeofflineLink;
                            delete newFolder._removeofflineLink;
                            delete newFolder.package;
                            delete newFolder.packageUId;
                        }
                        // ]
                        data.folders.push(newFolder);
                    }
                    // don't count includedFiles in the resources count for the UI
                    if (recordReadOnly.doNotCount !== true) {
                        data.folders[folderIndex].numChildren += 1;
                    }

                    // for now don't download or make offline any external resources
                    if (recordReadOnly.linkType === 'local') {
                        data.folders[folderIndex].numChildrenLocal += 1;
                    }

                    // lowest record order in a folder determines folder's order
                    if (recordReadOnly.order < data.folders[folderIndex].order) {
                        data.folders[folderIndex].order = recordReadOnly.order;
                    }

                    // TODO: we don't support multiple licenses currently, so take the first one we encounter
                    if (recordReadOnly.license != null && data.folders[folderIndex].license == null) {
                        data.folders[folderIndex].license = recordReadOnly.license;
                    }

                    if (recordReadOnly.linkType !== 'external' && data.folders[folderIndex].downloadLink == null) {
                        data.folders[folderIndex].downloadLink = data.folders[folderIndex]._downloadLink;
                        data.folders[folderIndex].makeofflineLink = data.folders[folderIndex]._makeofflineLink;
                        data.folders[folderIndex].removeofflineLink = data.folders[folderIndex]._removeofflineLink;
                        delete data.folders[folderIndex]._downloadLink;
                        delete data.folders[folderIndex]._makeofflineLink;
                        delete data.folders[folderIndex]._removeofflineLink;
                    }

                    data.totalCount += 1; // include everything, used to determine to cache large queries (obsolete)

                    // determine number of immediate child nodes
                    if (fullPathCpy[1] == null) {
                        data.folders[folderIndex].numImmediateChildren += 1; // child leaf
                    } else if (fullPathCpy[1] != null && fullPathCpy[1] !== 'NO_MATCH') {
                        var childFolderIndex = data.folders[folderIndex]._childFolderNames.indexOf(fullPathCpy[1]);
                        if (childFolderIndex === -1) {
                            data.folders[folderIndex]._childFolderNames.push(fullPathCpy[1]);
                            data.folders[folderIndex].numImmediateChildren += 1; // child folder
                        }
                    }
                }
            }
        }
    } // for result

    // switch 'Devices' and 'Development Tools' folder order if required
    var devicesFolderInd = folderNames.indexOf('Devices');
    var devtoolsFolderInd = folderNames.indexOf('Development Tools');
    if (devicesFolderInd !== -1 && devtoolsFolderInd !== -1) {
        if (query.devtool != null && data.folders[devtoolsFolderInd].order > data.folders[devicesFolderInd].order ||
            query.devices != null && data.folders[devtoolsFolderInd].order < data.folders[devicesFolderInd].order) {
            var tmp = data.folders[devtoolsFolderInd].order;
            data.folders[devtoolsFolderInd].order = data.folders[devicesFolderInd].order;
            data.folders[devicesFolderInd].order = tmp;
        }
    }

    // remove all resource records that are not marked as 'keep'
    for (var i5 = 0; i5 < queryResultReadOnly.length; i5++) {
        recordReadOnly = queryResultReadOnly[i5];
        recordAux = recordsAux[i5];
        if (recordAux.keep === true) {
            delete recordAux.keep;
            if (query.download !== 'true' && query.makeoffline !== 'true' && query.removeoffline !== 'true') {
                // browsing request (records are now DEEP COPIED and merged with aux)
                var recordCpy = _assign(recordAux, deepCopy(recordReadOnly));
                if (recordReadOnly.resourceType === 'overview' || recordReadOnly.resourceType === 'packageOverview') {
                    data.folderOverviews.push(recordCpy);
                } else {
                    // add some stuff for the browser client
                    if (recordCpy.linkType === 'external') {
                        recordCpy.type = 'weblink';
                    } else {
                        recordCpy.type = 'resource';
                    }
                    recordCpy.text = recordCpy.name; // for easier integration with jstree on client
                    recordCpy.url = reqUrl; // TODO: temp
                    data.resources.push(recordCpy);
                }
            } else {
                // non-browsing request (records are NOT deep copied and NOT merged with aux)
                if (recordReadOnly.resourceType === 'overview' || recordReadOnly.resourceType === 'packageOverview') {
                    data.folderOverviews.push(recordReadOnly);
                } else {
                    data.resources.push(recordReadOnly);
                }
            }
        }
    }

    return data;
};

/**
 * -- ES6 shim --
 * used to copy the values of all enumerable own properties from one or more source objects to a target object.
 * It will return the target object.
 *
 * _assign(target, ...sources)
 */
function _assign(target) {
    if (target == null) {
        throw new TypeError('Cannot convert undefined or null to object');
    }
    target = Object(target);
    for (var index = 1; index < arguments.length; index++) {
        var source = arguments[index];
        if (source != null) {
            for (var key in source) {
                if (Object.prototype.hasOwnProperty.call(source, key)) {
                    target[key] = source[key];
                }
            }
        }
    }
    return target;
}

/**
 * Recursively going up the device hierarchy, find the first device has a description or image
 *
 * @param dbDevices
 * @param deviceName
 * @param callback(deviceRecord) - the found device record
 */
exports.findDeviceWithOverview = function(dbDevices, deviceName, callback) {
    dbDevices.findOne({name: deviceName}, function(err, deviceRecord) {
        if (err) {
            logger.error('Query error: ' + JSON.stringify(err));
            callback(err);
            return;
        }
        if (deviceRecord === null) {
            callback(null);
            return;
        }

        if (deviceRecord.description != null || deviceRecord.image != null) {
            callback(deviceRecord);
        } else if (deviceRecord.parent != null) {
            exports.findDeviceWithOverview(dbDevices, deviceRecord.parent, callback);
        } else {
            callback(null);
        }
    });
};

function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}
