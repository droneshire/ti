/**
 * analytics - requires session tracking to work
 *
 * osohm, 12/8/2014
 *
 *
 * Data format for cloud analytics:
 * action:
 *      tirexNewVisitor
 *          visitor
 *          ip
 *      tirexVisitorSession
 *          visitor
 *          ip
 *      tirexSelection
 *          visitor
 *          ip
 *          deviceFamily ('unknown' if not available)
 *          device (if device selection)
 *          devtool (if devtool selection)
 *      tirexSearch
 *          visitor
 *          ip
 *          searchTerm
 *      tirexView
 *          visitor
 *          ip
 *          deviceFamily (if a resource is applicable to multiple devices and the specific device cannot be inferred
 *                       from the device/devtool in the selection or category path, only the device family may be available
 *                       which will be looked up based on the first device in the 'deviceVariants' resource field or the 'devices' field in the devtool record;
 *						 if there's insufficient metadata to determine the family it will be set to 'unknown')
 *          device (if not available it will be set to deviceFamily)
 *          devtool (if not available it will be set to 'unknown')
 *          package: 'packagename @ packageversion' (TODO)
 *          resourceName
 *          resourceCategoryPath
 *          resourceLocation
 *      tirexImport
 *          visitor
 *          ip
 *          deviceFamily (see notes above)
 *          device (if not available it will be set to deviceFamily)
 *          devtool (if not available it will be set to 'unknown')
 *          package: 'packagename @ packageversion' (TODO)
 *          resourceName
 *          resourceCategoryPath
 *          resourceLocation
 *      tirexDownloadResource
 *          visitor
 *          ip
 *          deviceFamily (see notes above)
 *          device (if not available it will be set to deviceFamily)
 *          devtool (if not available it will be set to 'unknown')
 *          resourceName
 *          resourceLocation
 *          package: 'packagename @ packageversion' (TODO)
 *          resourceCategoryPath
 *      tirexDownloadFolder
 *          visitor
 *          ip
 *          deviceFamily (see notes above with one exception: if device cannot be determined from selection or tree path
 *                        no resources will be inspected to get the device, instead the field will be set to 'unknown';
 *                        this could mean that the downloaded folder spans multiple devices and/or device families, or
 *                        there's insufficient metadata - but we don't known which it is since we didn't probe further)
 *                        TODO: possible future enhancement: inspect all downloaded resources and list all families; downsides: not easy to implement and slows down downloading
 *          device (if not available it will be set to deviceFamily)
 *          devtool (if not available it will be set to 'unknown')
 *          package: 'unknown' (download may span multiple packages) (TODO)
 *          resourceCategoryPath
 *
 *
 * Notes on the cookie scheme:
 *
 *   - two cookies are used: 30 min session cookie (ta30m) and 2 year visitor cookie (ta2y) (see app.js)
 *   - ta30m is managed by the Express session middleware. However, the provided session store is not used
 *     since it's not updated atomically, i.e. when we update it here, the next req may already be in node's pipe
 *     and looked up by the session middleware. This means the next req still may have the old value. Instead
 *     we use our own sessionStore object. To prevent it from leaking memory it is cleared every 24 hours (when
 *     the daily analytics data is saved to file).
 *   - ta2y is set here and is not managed by the Express session middleware (since it supports managing one cookie only).
 *     However, as with the session store there was an atomicity issue. Setting the cookie did not happen immediately
 *     and the next few req's (~ 4) still came in without the cookie each time incrementing the visitor count. Somehow
 *     the Express session middleware does not have this issue (still not sure how it avoids it). This means we can
 *     use it to gate the ta2y and use the sessionStore to check for new visitors rather the cookie itself.
 *   - Also to prevent clients with blocked cookies from incrementing visitor count with every request, we only
 *     start counting stats when a 2nd request for a given session ID was received. This means that the cookie was
 *     accepted by the client.
 */

'use strict';

var logger = require('./logger')();
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');
var exec = require('child_process').exec;
var http = require('http');
var async = require('async');

var query = require('./query');

module.exports = Analytics; // object that's returned by a require call

function Stats(datestring) {
    this.date = datestring;

    this.tables = {
        newVisitors:  {},   // hash: visitor ID, 1
        visitorSessions: {},// hash: visitor ID, number of sessions (new and returning visitors)
        visitorActivity: {},// hash: visitor ID, number of requests (new and returning visitors)
        uniqueIPs:  {},     // hash: IP, number of requests
        referers: {},
        pageViews: {},
        // queries:
        selections: {},     // hash: name of device or devtool selected, number of queries (only queries with device or devtool and no 'path' and 'search')
        searches: {}, // hash: search keyword, number of queries (only queries with 'search' and no 'path')
        navigations: {},    // hash: 'total', number of queries (not selections and not searchKeywords, e.g. user and auto navigation)
        // content requests:
        views: {},          // hash: package + resource name, number of content requests
        downloads: {},      // hash: package + resource name, number of content requests
        imports: {}        // hash: package + resource name, number of content requests
    };

    this.tableKeysSorted = {}; // not saved to file, generated on retrieval only: contains array objects with the same name as the tables with keys sorted by value (i.e. provides top N unique IPs, etc) - necessary since javascript object properties are unordered
}

var analyticsDir;
var stats;
var statsOverall;
var overallFile;
var sessionStore = {};
var backupFileExt = '.backup.json';

// for contributing tirex analytics to overall cloud analytics
var cloudHost;
var cloudPort;
var sendToCloud;
var dbDevices;
var dbDevtools;

// for testing only
var testing = false;
var testDay = 10;
var testLastTime = Date.now();

/**
 * @constructor
 */
function Analytics() {}

/**
 * Set the variables for the host and port for sending metrics data
 * Also check whether we are running locally or not
 */
Analytics.setUpCloud = function(seaportHostIP, seaportPort, myRole) {
    cloudHost = seaportHostIP;
    cloudPort = seaportPort;
    if (myRole === '') {
        sendToCloud = false;
    } else {
        sendToCloud = true;
    }
};

/**
 * Express middleware function
 */
Analytics.log = function(dir, dbResources, _dbDevices, _dbDevtools) {
    analyticsDir = dir;
    dbDevices = _dbDevices;
    dbDevtools = _dbDevtools;

    if (fs.existsSync(analyticsDir) === false) {
        mkdirp.sync(analyticsDir);
    }

    var date = new Date();

    // save stats every 1 min so that we can recover in case the server goes down
    // note: we don't want to recover a backup file from the previous day
    // note: daily stats is saved with the next update after midnight, i.e. if server goes down before midnight and comes
    //       up only after midnight, the previous day's stats won't be recovered (could be done but more effort...)
    var backupFile = makeBackupFilename();
    if (fs.existsSync(backupFile) === true) {
        try {
            stats = JSON.parse(fs.readFileSync(backupFile, 'utf8'));
        } catch (err) {
            stats = null;
            logger.error('Error loading analytics backup file: ' + JSON.stringify(err));
        }
    }
    if (stats == null) {
        stats = new Stats(date.toDateString());
    }
    setInterval(function() {
        fs.writeFile(makeBackupFilename(), JSON.stringify(stats));
    }, 1*60*1000 /*1 min*/);
    function makeBackupFilename() {
        var date = new Date();
        return path.join(analyticsDir, date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate() + backupFileExt);
    }

    overallFile = path.join(analyticsDir, 'overall.json');
    if (fs.existsSync(overallFile) === true) {
        try {
            statsOverall = JSON.parse(fs.readFileSync(overallFile, 'utf8'));
        } catch (err) {
            logger.error('Error loading analytics file overall.json: ' + JSON.stringify(err));
        }
    } else {
        statsOverall = new Stats(date.toDateString());
    }

    return function(req, res, next) {
        // only count /api requests (to reduce traffic here and eliminate many irrelevant requests)
        var path = req.path.split('/');
        var cloudData = {};
        var session;

        // used if inc is called form outside this module such as import to gate counting
        req.tirexAnalyticsCount = true;

        if (req.headers['user-agent'] === 'TI_ALIVE_TEST') {
            req.tirexAnalyticsCount = false;
            next();
            return;
        }

        // referer may only be set in the first request
        if (req.headers.referer && req.headers.referer.indexOf(req.headers.host) === -1) { // req from outside
            Analytics._inc('referers', req.headers.referer); // don't need to send it to cloud analytics since it already extracts referer itself
        }

        if (path[1] !== 'api') {
            req.tirexAnalyticsCount = false;
            next();
            return;
        }

        // receive proxy server analytics state via browser and cache in a tirex browser session cookie (i.e. lives until browser exit)
        // (previously the state was cached in the 30 min cookie and we would lose it on expiry)
        // two caveats: (1) ideally the storeanalyticsstate API should be the first API called for a new session and be called
        // synchronous from the browser; if this is not the case tirex logs may be sent without the proxy server analytics state until
        // it is received AND the cookie was set. (2) since the state is cached it may go stale (e.g. if CCS user logs out, tirex would
        // still send logs with the previous user id) TODO: proxy server to put analytics state in a cookie and agree on name
        if (sendToCloud && path[2] === 'storeanalyticstate') {
            var body = '';
            req.on('data',function(chunk) {
                body += chunk;
                //do not want someone to take down the server with this by sending a very large request causing it to be OOM
                //1e6 == 1 * Math.pow(10,6) ~~ 1MB really shouldn't be that high anyway
                if (body.length > 1e6 ) {
                    req.connection.destroy();
                }
            });
            req.on('end', function() {
                if (body !== '') {
                    var analyticsState;
                    try {
                        analyticsState = JSON.parse(body);
                        res.cookie('tas', analyticsState, {httpOnly: true, signed: true});
                    } catch(err) {
                        logger.warn('storeanalyticstate failed');
                    }
                }
                res.end();
            });
            // no next() since we'll be sending a res.end()
            return;
        }

        // Establish the visitor session
        if (sessionStore[req.sessionID] == null) {
            // ignore the very first request to help exclude visitors that block cookies, but remember the referer
            session = sessionStore[req.sessionID] = {};
            req.tirexAnalyticsCount = false;
            next();
            return;
        }
        // we got the same session ID again, now we know client accepts cookies and we can safely do analytics...
        session = sessionStore[req.sessionID];  // hold on to this session - sessionStore may get cleared the next day in _inc
                                                // DO NOT refer to sessionStore directly thereafter since it may be cleared by _inc!
                                                // TODO: manage this better
        if (session.visitorId == null) {
            // new session
            // get visitorId from cookie - assign new one if new visitor to the site
            var visitorCookie = req.signedCookies.ta2y;
            if (visitorCookie == null) {
                // new visitor: set a new cookie
                session.visitorId = 'Visitor ' + statsOverall.tables.newVisitors['#total']; // use total instead of length since in the past some IDs were re-used
                res.cookie('ta2y', { visitorId: session.visitorId, firstVisit: new Date().toString() }, { maxAge: 1000*60*60*24*365*2 /* 2 years */,
                    httpOnly: true, signed: true });
                Analytics._inc('newVisitors', session.visitorId);
                Analytics._sendToCloudMetrics('tirexNewVisitor', {}, session.visitorId, null, req);
            } else {
                session.visitorId = visitorCookie.visitorId;
            }
            Analytics._inc('visitorSessions', session.visitorId);
            Analytics._sendToCloudMetrics('tirexVisitorSession', {}, session.visitorId, null, req);
        }

        // non session unique page views:
        // api/analytics/sendPageView?analyticsDevice=[selected_device]&analyticsDevtool=[selected_devtool]&analyticsPath=[tree/node/path]
        //   &analyticsName=[name_of_the_leaf_node]
        if (path[2] === 'analytics' && path[3] === 'sendPageView') {
            logger.trace('analytics/sendPageView: ' + req.url);
            fillDeviceDevtoolAndFamily(cloudData, dbDevices, dbDevtools, null, req.query.analyticsDevice, req.query.analyticsDevtool,
                req.query.analyticsPath + '/' + req.query.analyticsName, function() { // append name to path for the purpose of dev* detection from the path
                    Analytics._inc('pageViews', req.query.analyticsName);
                    cloudData.name = req.query.analyticsName;
                    Analytics._sendToCloudMetrics('tirexPageView', cloudData, session.visitorId, null, req);
                    res.end();
                });
            return;
        }

        Analytics._inc('visitorActivity', session.visitorId);

        if (req.ip !== 'undefined') { // suppress 'undefined'
            Analytics._inc('uniqueIPs', req.ip);
        }

        // ignore already visited URLs by a visitor - this makes all counts unique to a visitor session,
        // i.e. only if visitor is inactive for the cookie's maxAge time will another count be registered for
        // a new request with the same URL for the same visitor (based on Google Analytics' methodology)
        if (session.urlsVisited == null) {
            session.urlsVisited = {};
        }
        if (session.urlsVisited[req.url] === true) {
            req.tirexAnalyticsCount = false;
            next();
            return;
        } else {
            req.tirexAnalyticsCount = true;
            session.urlsVisited[req.url] = true;
        }
        // count: selections, searches, downloads, imports, views
        if (req.query.device != null && req.query.search == null && req.query.path == null) {
            if (req.query.device !== 'undefined') { // suppress 'undefined'
                fillDeviceDevtoolAndFamily(cloudData, dbDevices, dbDevtools, null, req.query.device, null, null, function() {
                    Analytics._sendToCloudMetrics('tirexSelection', cloudData, session.visitorId, null, req);
                    Analytics._inc('selections', req.query.device);
                    next();
                });
            } else {
                next();
            }
        }
        else if (req.query.devtool != null && req.query.search == null && req.query.path == null) {
            if (req.query.devtool !== 'undefined') { // suppress 'undefined'
                fillDeviceDevtoolAndFamily(cloudData, dbDevices, dbDevtools, null, null, req.query.devtool, null, function() {
                    cloudData.devtool = req.query.devtool;
                    Analytics._sendToCloudMetrics('tirexSelection', cloudData, session.visitorId, null, req);
                    Analytics._inc('selections', req.query.devtool);
                    next();
                });
            } else {
                next();
            }
        }
        else if (req.query.search != null && req.query.path == null) {
            fillDeviceDevtoolAndFamily(cloudData, dbDevices, dbDevtools, null, req.query.device, req.query.devtool, null, function() {
                cloudData.searchTerm = req.query.search;
                Analytics._sendToCloudMetrics('tirexSearch', cloudData, session.visitorId, null, req);
                Analytics._inc('searches', req.query.search);
                next();
            });
        }
        else if (req.query.download === 'true') {
            if (req.query.path != null) {
                // TODO: refactor: not calling fillDeviceDevtoolAndFamily() here because it's called inside _sendToCloudMetrics; this is confusing since above it is called
                Analytics._sendToCloudMetrics('tirexDownloadFolder', cloudData, session.visitorId, null, req);
                Analytics._inc('downloads', req.query.path);
                next();
            } else if (req.query.id != null) {
                dbResources.findOne({'_id': req.query.id}, function(err, resource) {
                    // TODO: refactor: not calling fillDeviceDevtoolAndFamily() here because it's called inside _sendToCloudMetrics; this is confusing since above it is called
                    if (resource != null) {
                        Analytics._sendToCloudMetrics('tirexDownloadResource', cloudData, session.visitorId, resource, req);
                        Analytics._inc('downloads', resource.name);
                    }
                    next();
                });
            } else {
                next();
            }
        }
        else {
            next();
        }

        // imports: inc() called in GET handling for import (to avoid looking up the resource record again)
        // views: inc() called in GET handling for views ('linkTo') (to avoid looking up the resource record again)
    };
};

function fillDeviceDevtoolAndFamily(cloudData, dbDevices, dbDevtools, resource, device, devtool, path, callback) {
    query.detectDeviceVariantAndDevtool(dbDevices, dbDevtools, resource, device, devtool, path,
        function (deviceVariantExact, deviceVariantCandidates, deviceFamily, devtoolExaxt, devtoolCandidates) {
            if (cloudData.deviceFamily == null) {
                cloudData.deviceFamily = (deviceFamily != null) ? deviceFamily : 'unknown';
            }
            if (cloudData.devtool == null) {
                cloudData.devtool = (devtoolExaxt != null) ? devtoolExaxt.name : 'unknown';
            }
            if (cloudData.device == null) {
                if (deviceVariantExact != null) {
                    cloudData.device = deviceVariantExact.name;
                } else {
                    cloudData.device = cloudData.deviceFamily;
                }
            }
            callback();
        });
}


Analytics.sendToCloudMetrics = function(actionId, resource, req) {
    // need test sessionStore since it may have been cleared by inc()
    if (req.tirexAnalyticsCount === false || sessionStore[req.sessionID] == null) { // same as in inc()
        return;
    }
    Analytics._sendToCloudMetrics(actionId, {}, sessionStore[req.sessionID].visitorId, resource, req);
};

Analytics._sendToCloudMetrics = function(actionId, cloudData, visitorId, resource, req) {
    if (!sendToCloud) {
        return;
    }

    async.series([
            // add analytics data
            function(callback) {
                // add in common fields
                cloudData.visitorId = visitorId;
                cloudData.ip = req.ip;

                // add in fields for resource based actions (view, import, download)
                // resource name, location:
                if (resource != null) {
                    cloudData.resourceName = resource.name;
                    cloudData.resourceLocation = resource.link;
                    cloudData.package = resource.package;
                    cloudData.packageVersion = resource.packageVersion;
                }
                // capture devtool, device, deviceFamily, resourceCategorypath:
                var path;
                if (actionId === 'tirexDownloadFolder') {
                    path = req.query.path;  // includes the name of the folder itself which is what we want for folder downloads
                } else {
                    path = req.query.analyticsPath;
                }
                if (resource != null || req.query.analyticsDevice != null || req.query.analyticsDevtools != null || path != null) {
                    cloudData.categoryPath = (path != null) ? path : 'unknown';
                    fillDeviceDevtoolAndFamily(cloudData, dbDevices, dbDevtools, resource, req.query.analyticsDevice,
                        req.query.analyticsDevtools, path, callback);
                } else {
                    setImmediate(callback);
                }
            }],
        // send analytics data
        function() {
            var postdata = {
                action: actionId,
                data: cloudData
            };
            // if proxy analytics state available merged it in, if not send without
            var analyticsState = req.signedCookies.tas;
            if (analyticsState != null) {
                for (var prop in analyticsState) {
                    if (analyticsState.hasOwnProperty(prop)) {
                        postdata[prop] = analyticsState[prop];
                    }
                }
            }
            postdata = JSON.stringify(postdata);
            logger.trace('analytics: ' + postdata);
            var options = {
                hostname: cloudHost,
                port: cloudPort,
                path: '/analytics',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': postdata.length
                }
            };
            var reqPost = http.request(options, function (res) {
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                    logger.trace('Response for POST analytics state: ' + chunk);
                });
            });
            reqPost.on('error', function (e) {
                logger.error('error sending analytics data to TI Cloud Metrics' + JSON.stringify(e));
            });
            reqPost.write(postdata);
            reqPost.end();
        });
};

/**
 * Get current stats
 *
 */
Analytics.getToday = function() {
    return stats;
};

/**
 * Get daily stats from past n months (most recent day first)
 *
 */
Analytics.getPastMonths = function(n) {
    var statsDaily = [];
    var d = 0;
    for (var i = n; i >= 0; i--) {
        try {
            var date = new Date();
            date.setMonth(date.getMonth() - i);
            var file = date.getFullYear() + '-' + (date.getMonth() + 1) + '.json';
            var buf = fs.readFileSync(path.join(analyticsDir, file), 'utf8');
            var arr = buf.split('\n');
            for (var j = 0; j < arr.length; j++) {
                if (arr[j] !== '') {
                    statsDaily[d++] = JSON.parse(arr[j]);
                }
            }
        } catch (err) {
            if (i !== 0) {
                logger.trace('Error getting analytics data: ' + JSON.stringify(err));
            } else {
                // i=0, i.e. current month: if we're at the 1st there may not be a logfile yet...
            }
        }
    }

    // add current day
    statsDaily[d] = stats;

    Analytics._makeTableKeysSorted(statsDaily);

    statsDaily.reverse();

    return statsDaily;
};

/**
 * Get overall stats
 *
 */
Analytics.getOverall = function() {
    Analytics._makeTableKeysSorted([statsOverall]);
    return statsOverall;
};

/**
 * Sort keys of hash tables into tableKeysSorted arrays (since javascript properies are unordered).
 * E.g. IP addresses in tables.uniqueIPs will be sorted by number their number of occurrences and put into
 * tableKeysSorted.uniqueIPs
 *
 */
Analytics._makeTableKeysSorted = function(statsDaily) {
    for (var i = 0; i < statsDaily.length; i++) {
        var stats = statsDaily[i];
        for (var tableName in stats.tables) {
            if (stats.tables.hasOwnProperty(tableName)) {
                var table = stats.tables[tableName];
                stats.tableKeysSorted[tableName] = Object.keys(table).sort(decreasing);
                stats.tableKeysSorted[tableName].splice(0,1); // splice removes the '#total' key
            }
        }
    }

    function decreasing(a,b) {
        return table[b]-table[a];
    }
};


/**
 * Increment analytics key by 1 - use when calling from outside to ensure already visited URLS are not counted
 *
 * Puts stats into daily buckets saved to monthly files
 *
 * @param type
 * @param key
 */
Analytics.inc = function(type, key, req) {
    if (req.tirexAnalyticsCount === false || sessionStore[req.sessionID] == null) { // same as in sendToCloudMetrics()
        return;
    }

    Analytics._inc(type, key);
};

/**
 * Increment analytics key by 1
 *
 * Puts stats into daily buckets saved to monthly files
 *
 * @param type
 * @param key
 * @private
 */
Analytics._inc = function(type, key) {
    var date;
    if (testing === true) {
        var time = Date.now();
        if (time - testLastTime > 3000) {
            testDay++;
            testLastTime = time;
        }
        date = new Date(2014, 10, testDay);
    } else {
        date = new Date();
    }

    if (date.toDateString() !== stats.date) {
        // new day - first save previous day to file
        var statsDate = new Date(stats.date);
        var file = statsDate.getFullYear() + '-' + (statsDate.getMonth() + 1) + '.json';
        try {
            fs.appendFileSync(path.join(analyticsDir, file), JSON.stringify(stats) + '\n');
            fs.writeFileSync(overallFile, JSON.stringify(statsOverall));
        } catch (err) {
            logger.error('Error saving analytics: ' + JSON.stringify(err));
        }
        // finally create new stats obj
        stats = new Stats(date.toDateString());
        // clear session store to prevent leaking memory...
        // TODO: this could artificially split sessions - not a huge problem but ideally should scrub sessions from
        // store that were inactive for at least 30 mins, i.e. session cookie maxAge
        sessionStore = {};
        // backup file no longer needed
        exec('rm ' + path.join(analyticsDir, '*' + backupFileExt), function (error, stdout, stderr) {
            if (error) {
                logger.trace('Error deleting backup file: ' + JSON.stringify(error));
            }
        });

    }

    // update daily stats
    if (stats.tables[type] == null) {
        stats.tables[type] = {};
    }
    if (stats.tables[type]['#total'] == null) {
        stats.tables[type]['#total'] = 0;
    }
    stats.tables[type]['#total']++;

    if (stats.tables[type][key] == null) {
        stats.tables[type][key] = 0;
    }
    stats.tables[type][key]++ ;

    // now do the same for the overall stats
    if (statsOverall.tables[type] == null) {
        statsOverall.tables[type] = {};
    }
    if (statsOverall.tables[type]['#total'] == null) {
        statsOverall.tables[type]['#total'] = 0;
    }
    statsOverall.tables[type]['#total']++;

    if (statsOverall.tables[type][key] == null) {
        statsOverall.tables[type][key] = 0;
    }
    statsOverall.tables[type][key]++ ;
};


