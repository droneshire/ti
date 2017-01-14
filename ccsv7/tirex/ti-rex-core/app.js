/**
 * TIREX Server
 */

'use strict';
require('rootpath')();

// no tirex module that make use of logger here; move their require after logger is initialized
const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs-extra');
const async = require('async');
const mkdirp = require('mkdirp'); process.umask(0); // needed so that we can set 0777 permissions, see https://github.com/substack/node-mkdirp/issues/38
const rimraf = require('rimraf');
const sortStable = require('stable'); // Array.sort is not 'stable' (i.e. equal comparisons may be re-ordered)
const ti_util = require('ti_util');
const seaport = require('seaport');
const child_process = require('child_process');
const semver = require('semver');
const urlParser = require('url');

let request; // needs vars.HTTP_PROXY

const util = require('./scripts/util');

const processManager = new util.ProcessManager();

// Invocation: node app.js <path/to/dinfra.js> <path/to/dconfig> <path/to/tirex-config>
//   - desktop server: cd ti-rex-core; node app.js dinfra-desktop/dinfra.js config/dconfig_localserver.json config/app_localserver.json
//   - e.g. remote server in dev-env:  node app.js <path/to/dinfra.js> config/dconfig/mysql-auser.json config/app_remoteserver.json
var dinfra = require(process.argv[2]);
var dconfig = require(process.argv[3]);

// read the default tirex config and override it with the passed in config
var config = require('config/app_default.json');
var overrideConfigFile = process.argv[4];
if (fs.existsSync(overrideConfigFile)) {
    var overrideConfig = require(overrideConfigFile);
    for (var overrideProp in overrideConfig) {
        if (overrideConfig.hasOwnProperty(overrideProp)) {
            config[overrideProp] = overrideConfig[overrideProp];
        }
    }
    for (var prop in config) {
        // note: below path disassemble & reassemble codes won't work for network address, ex: http://
        if (config.hasOwnProperty(prop) && ti_util.isString(config[prop]) && config[prop] !== '') {
            if(config[prop].indexOf('http') === 0) {
                // not a file path, use as-is
                continue;
            }
            var p = path.normalize(config[prop]).split(path.sep);
            // resolve '~' (linux and win) to user home dir
            if (p[0] === '~') {
                p[0] = ti_util.getUserHome();
            } else if (p[0] === '') {
                p[0] = '/';
            }
            // resolve environment variables
            for (var i = 0; i < p.length; i++) {
                if (p[i][0] === '$') {
                    var evar = p[i].substr(1);
                    if (process.env[evar]) {
                        p[i] = process.env[evar];
                    }
                }
            }
            // re-assemble path
            config[prop] = path.join.apply(path, p);
        }
    }
} else {
    console.error('Error: config file not found: ' + overrideConfigFile);
    process.exit(1);
}
// process config overrides from cmd line, e.g. --refreshDB=true
// James: might want to consider using yargs for parsing arguments
for (var o = 5; o < process.argv.length; o++) {
    if (process.argv[o].slice(0, 2) === '--') {
        var or = process.argv[o].slice(2).split('=');
        config[or[0]] = or[1];
    }
}

// default mode is 'remoteserver'
if (config.mode == null) {
    config.mode = 'remoteserver';
}

// configure dinfra and dinfra logging
var logger = dinfra.logger('tirex');
require('./lib/logger')(logger);
dinfra.dlog.console(); // duplicate all messages to console; set already when using dcontrol run
if (dconfig.logging && dconfig.logging['base-path']) {
    dconfig.logging.indent = 4;
    dconfig.logging['loose'] = true;
    dconfig.logging['base-path'] = path.join(ti_util.getUserHome(), dconfig.logging['base-path']);
    if (fs.existsSync(dconfig.logging['base-path']) === false) {
        console.log('Creating dinfra logs dir: ' + dconfig.logging['base-path']);
        mkdirp.sync(dconfig.logging['base-path'], '0777'); // when we install as root, run as user
    }
}
dinfra.configure(dconfig, function (e) {
    if (e != null) {
        logger.error('configure', e);
        return;
    }
    initApp(config.myHttpPort, function () {
        registerPort(function() {});
    });
});

function registerPort(callback) {
    var ports = null;
    var params = {
        type: 'application',
        protocol: 'http',
        port: parseInt(config.myHttpPort),
        role : config.myRole,
        host : dinfra.address
    };
    if (dconfig.registerService) {
        var serviceName = dconfig.origin.serviceName; // always "<scope>/<service>"
        var serviceVersion = '1.0.1';
        dinfra.registerService(serviceName, serviceVersion, params).
            on('registered', function () {
                logger.info('Regisetered with dinfra.services.');
                callback(config.myHttpPort);
            }).
            on('deregistered', function () {
                logger.info("Deregistered from dinfra.services");
            });
    } else if (config.seaportHostIP != null && config.seaportPort != null && config.myRole != null && config.myRole !== '') {
        ports = seaport.connect(config.seaportHostIP, parseInt(config.seaportPort));
        logger.info('Connected to seaport ' + config.seaportHostIP + ':' + config.seaportPort);
        var myHttpPort = ports.register(config.myRole, params).toString();
        ports.on('close', onClose);
        logger.info('Registered with seaport, port: ' + myHttpPort);
        setImmediate(function() {
            callback(myHttpPort);
        });
    } else {
        setImmediate(function() {
            callback(config.myHttpPort);
        });
    }
    function onClose() {
        var msg = 'Disconnected from seaport.';
        console.log(msg);
        logger.info(msg);
        setTimeout(reconnect, 5000); // ms
    }
    function reconnect() {
        ports = seaport.connect(config.seaportHostIP, parseInt(config.seaportPort));
        params.port = myHttpPort;
        ports.register(config.myRole, params);
        ports.on('close', onClose);
        var msg = 'Reregistered with seaport, port: ' + myHttpPort;
        console.log(msg);
        logger.info(msg);
    }
}

function initApp(myHttpPort, callback) {
    dinfra.uncaught(true);
    logger.setPriority(dinfra.dlog.PRIORITY.INFO);

    process.on('exit', function(code) {
        console.log('About to exit with code: ', code);
        logger.info('About to exit with code: ' + code);
    });

    // the remainder of the dinfra stuff is for cloud landscape deployment only
    //  - for desktop dconfig.paths should be set to {};
    //  - for standalone or debug remote server dconfig.paths can also be set to {} to be able to use abs. paths in the tirex config
    // prefix our paths based on dinfra
    if (config.mode === 'remoteserver') {
        if (dinfra.paths != null) {
            if (dinfra.paths.data != null) {
                config.contentPath = path.join(dinfra.paths.data, config.contentPath);
                config.dbPath = path.join(dinfra.paths.data, config.dbPath);
                config.analyticsDir = path.join(dinfra.paths.data, config.analyticsDir);
            }
            if (dinfra.paths.defaultCode != null) {
                config.downloadsCache = path.join(dinfra.paths.defaultCode, config.downloadsCache);
            }
        }
        config.ccsCloudUrl = dinfra.landscape;
        if (config.dcontrol != null) { // the section patched in by dcontrol in front ouf the tirex config properties
            config.seaportHostIP = config.dcontrol.legacy.seaport.address;
            config.seaportPort = config.dcontrol.legacy.seaport.port;
        }
    }

    // --install: create CCS desktop content discovery file and exit
    // REX-894 & 1026 : ~user/ti/CCSExternalReferences/TIREX_2 doesn't apply to multiple or switched user
    //     Temp workaround before better CCS interaction mechanism established: create the file if not exists
    if (config.mode === 'localserver') {
        // check folder
        var ccsExtRefDir = path.join(ti_util.getUserHome(), 'ti/CCSExternalReferences');
        if (fs.existsSync(ccsExtRefDir) === false) {
            // create the folder
            mkdirp.sync(ccsExtRefDir, '0777');
        }
        var tirex_2_file = path.join(ccsExtRefDir, 'TIRex_2');
        // Check file existence and 'install'
        if ('install' in config || fs.existsSync(tirex_2_file) === false) {
            // Create/overwrite the file during install time or if it doesn't exist
            logger.info('INSTALL MODE: Creating ' + tirex_2_file);
            // prepare file contents
            var searchBase = 'searchpath=' + config.contentPath;
            var body =
                'ti-rex-content=' + config.contentPath + '\n' +
                'ti-products[TI_PRODUCTS_DIR]=' + config.contentPath + '\n' +
                // product specific folder if needed,
                //   ex: path.join(searchBase, 'mspware') + '\n' +
                path.join(searchBase) + '\n';   // root path, tirex-content

            // write
            fs.writeFileSync(tirex_2_file, body);
        }
        if ('install' in config) {
            // exit
            process.exit(0);
        }
    }

    var startUpMessage = '-----TI-REX started at ' + new Date().toString();
    console.log(startUpMessage);
    console.error(startUpMessage);
    logger.info(startUpMessage);

    // support for basic authentication (needed for external server)
    var development = process.env.NODE_ENV === 'development';
    if (development) {
        try {
            var userid = new RegExp(process.env.BASIC_AUTH_USERID.toLowerCase());
            var password = new RegExp(process.env.BASIC_AUTH_PASSWORD.toLowerCase());
            express.basicAuth(function (user, pass) {
                return userid.test(user.toLowerCase()) && password.test(pass.toLowerCase());
            }, 'Development authentication is required!');
        } catch (e) {
            logger.error('Invalid BasicAuth credential! ' +
                'Please set \'BASIC_AUTH_USERID\' and \'BASIC_AUTH_PASSWORD\' environment variables and restart server.'
            );
        }
    }

    var app = express();

    dinfra.registerStatusResponder('TIREX', '2.0').withDefaultChecks().withExpressHandler(app, '/status/');

    // --- TIREX modules ---
    // setup the common vars before loading all other modules; to access them in a module simply add the require call
    var vars = require('lib/vars');
    vars(config);
    // now require all the other modules

    request = require('request').defaults({forever: true}); //.defaults({proxy: vars.HTTP_PROXY});

    // James: must be a nicer way of doing this
    const state = require('lib/state');
    const rexdb = require('rexdb/lib/rexdb');
    const rexdb_split = require('rexdb/lib/rexdb-split');
    const query = require('lib/query');
    const download = require('lib/download');
    const localserver = require('lib/localserver');
    const lsBundles = require('lib/localserver/bundles');
    const analytics = require('lib/analytics');
    const jsonstream = require('lib/jsonstream');
    const refresh = require('lib/refresh');
    const logging = require('lib/logging');
    const pathHelpers = require('./lib/path-helpers');
    
    var serverState = state.ServerState;
    // include version in serverState
    serverState.version = require('package.json').version;
    logger.info('Version: ' + serverState.version);
    //
    serverState.updateServerStatus(state.ServerStatus.INITIALIZING, config);
    
    // delete DBs and/or content folders if requested
    if (config.deleteContent) {
        logger.info('DELETING content dir');
        rimraf.sync(config.contentPath);
    }
    if (config.deleteDb) {
        logger.info('DELETING db dir');
        rimraf.sync(config.dbPath);
        logger.info('DELETING downloads dir');
        rimraf.sync(config.downloadsCache);
    }

    // create any missing dirs
    vars.createDirs();

    if (config.mode === 'remoteserver') {
        analytics.setUpCloud(config.seaportHostIP, 8000, config.myRole);
    }

    var dbReady = false;
    var dbDevices = new rexdb(path.join(vars.DB_BASE_PATH, 'devices.db'));
    var dbDevtools = new rexdb(path.join(vars.DB_BASE_PATH, 'devtools.db'));
    var dbResources = new rexdb(path.join(vars.DB_BASE_PATH, 'resources.db'));
    var dbOverviews = new rexdb(path.join(vars.DB_BASE_PATH, 'overviews.db'));
    var dbPureBundles = new rexdb(path.join(vars.DB_BASE_PATH, 'bundles.db'));
    var dbDownloads = new rexdb(path.join(vars.DB_BASE_PATH, 'downloads.db'));

    // [ TIREX_3.0, Metadata_2.1

    // ----- override save() to add some preparation for hidden H/W packages, for performance purposes
    //       new varaiables for dbOverviews: hwPackages, hwPackagesID, hwPackagesIDString
    dbOverviews.originalSave = dbOverviews.save;
    dbOverviews.save = function(callback) {
        // TODO ... developing ...
        this.originalSave( (err) => {
            this._cacheHWSWPacakges( function(err2) {
                // ignore error from this operation (err2)
                callback(err);
            });

        });
    };

    // ----- dbOverviews private utility function to remember hidden H/W package names
    dbOverviews._cacheHWSWPacakges = function(callback) {
        var queryHW = {resourceType: 'packageOverview', type: {$in:[vars.META_2_1_TOP_CATEGORY.devices.id, vars.META_2_1_TOP_CATEGORY.devtools.id]}};
        var querySW = {resourceType: 'packageOverview', type: {$in:[vars.META_2_1_TOP_CATEGORY.software.id]}};

        this.find(queryHW, (err, packages) => {   // use ES6 arrow operator
            let packagesHW = packages;
            // async operation
            if(!err) {
                this.find(querySW, (err, packages) => {
                    if(!err) {
                        let packagesSW = packages;
                        _update(this, packagesHW, packagesSW);
                        callback(err);
                    }
                    else {
                        callback(err);
                    }
                });
            }
            else {
                callback(err);
            }
        });
        function _update(db, packagesHW, packagesSW) { // private local
            delete db.hwPackages;
            delete db.hwPackagesID;
            delete db.hwPackagesIDString;
            if(packagesHW.length > 0) {
                db.hwPackages = packagesHW;
                db.hwPackagesID = [];
                db.hwPackagesIDString = '';    // pppp__vvvv::pppp__vvvv::pppp_vvvv
                for (let pi = 0; pi < packagesHW.length; pi++) {
                    db.hwPackagesID.push(packagesHW[pi].packageUId);
                    db.hwPackagesIDString += packagesHW[pi].packageUId;
                    if (pi !== packagesHW.length-1) {
                        db.hwPackagesIDString += vars.PACKAGE_LIST_DELIMITER;
                    }
                }
            }
            delete db.swPackages;
            delete db.swPackagesID;
            delete db.swPackagesIDString;
            if(packagesSW.length > 0) {
                db.swPackages = packagesSW;
                db.swPackagesID = [];
                db.swPackagesIDString = '';    // pppp__vvvv::pppp__vvvv::pppp_vvvv
                for (let pi = 0; pi < packagesSW.length; pi++) {
                    db.swPackagesID.push(packagesSW[pi].packageUId);
                    db.swPackagesIDString += packagesSW[pi].packageUId;
                    if (pi !== packagesSW.length-1) {
                        db.swPackagesIDString += vars.PACKAGE_LIST_DELIMITER;
                    }
                }
            }
        }
    };

    // ----- dbOverviews utility function to append hidden H/W package string to query.package
    dbOverviews.appendPackagesString = function(pkgString) {
        if(this.hwPackagesIDString == null) {
            return pkgString;
        }
        if(pkgString == null) {
            pkgString = '';
        }
        if (pkgString.length !== 0) {
            pkgString += vars.PACKAGE_LIST_DELIMITER;
        }
        pkgString += this.hwPackagesIDString;
        return pkgString;
    };
    // ----- dbOverviews utility function to apply filter by restriction to the package string
    dbOverviews.applyPackageRestrictions = function(pkgString, restriction) {
        // split
        let inPkgUIds = pkgString.split(vars.PACKAGE_LIST_DELIMITER);
        // filter
        let outPkgUIds = inPkgUIds.filter( (pid) => {
            if (this.swPackages) {
                for (let j = 0; j < this.swPackages.length; j++) {
                    let swPackage = this.swPackages[j];
                    if (swPackage.packageUId === pid) {
                        if (swPackage.restrictions && swPackage.restrictions.indexOf(restriction) >= 0) {
                            return false;
                        }
                        break;
                    }
                }
            }
            return true;
        });
        // reconstruct
        let outString = '';
        for( let j=0; j<outPkgUIds.length; j++) {
            if (j !== 0) {
                outString += vars.PACKAGE_LIST_DELIMITER;
            }
            outString += outPkgUIds[j];
        }
        return outString;
    };
    // ----- dbOverviews utility function to find package by UID "synchronously", intended for frequent short operations
    dbOverviews._findSWPackageByUid = function(pid) {
        if (this.swPackages) {
            for (let j = 0; j < this.swPackages.length; j++) {
                let swPackage = this.swPackages[j];
                if (swPackage.packageUId === pid) {
                    return swPackage;
                }
            }
        }
        return null;
    };

    dbOverviews._cacheHWSWPacakges( (err) => {});  // call once at startup

    // ----- utility function to check request
    // TODO - define what to check and what to return
    function checkUserAgent (req) {
        if (config.mode === 'remoteserver') {
            // read
            if (req.headers['user-agent'] != null) {
                delete serverState.rejected;
                // Desktop server example: 'TirexServer/2.0.0 ....'
                // Extract version
                //     regex: 'TirexServer/((\d+)?[\w\.]+)
                var ua = req.headers['user-agent'];
                var sid = 'TirexServer/';
                var idx = ua.indexOf(sid);
                if (idx >= 0) {
                    // a valid client server
                    var clientVer = ua.slice(idx+sid.length);
                    idx = clientVer.indexOf(' ');
                    if (idx > 0) {
                        clientVer = clientVer.slice(0, idx);
                    }
                    if (semver.valid(clientVer)) {
                        // check
                        // TODO : do version & other compatibility checking,  below is just an example to start with ...
                        // if not compatible then set the field 'serverstate.rejected' with a message
                        //   ex: serverstate.rejected = ' ... incompatible client ... please update your CCS ...';
                        var semverClient = semver.parse(clientVer);
                        var semverThis   = semver.parse(serverState.version);

                        var msgMain = 'Incompatible version! ';
                        // Case 1: Generation-1 desktop server
                        if (semverClient[1] !== semverThis[1]) { /// major version not matched
                            serverState.rejected = msgMain + 'Please upgrade to ...';    //
                        }
                    }
                }
            }
        }
    }
    // ]

    if (config.mode === 'remoteserver') {
        dbResources = new rexdb_split(path.join(vars.DB_BASE_PATH, 'resources.db'));
        dbResources.useAll(function() {
            dbOverviews._cacheHWSWPacakges(function() {
                dbReady = true;
            });
        });
    } else if (config.mode === 'localserver') {
        dbResources = new rexdb_split(path.join(vars.DB_BASE_PATH, 'resources.db'));
        var packagesToUse = [];
        var userConfig;
        try {
            userConfig = JSON.parse(fs.readFileSync(config.userConfigPath + '/user-config.json'));
        }
        catch (err) {
            // ignore
        }
        if (userConfig != null && userConfig.actualLink != null && userConfig.actualLink !== '') {
            packagesToUse = userConfig.actualLink.split(vars.BUNDLE_LIST_DELIMITER);
        }
        // [ Metadata_2.1 : update dbResources (rexdb-split) with hidden packages before calling use(...)
        dbResources.useHidden(dbOverviews.hwPackagesID);
        // ]
        dbResources.use(packagesToUse, function() {
            dbOverviews._cacheHWSWPacakges(function() {
                dbReady = true;
            });
        });
    }

    var dbs = {
        dbDevices: dbDevices,
        dbDevtools: dbDevtools,
        dbResources: dbResources,
        dbOverviews: dbOverviews,
        dbPureBundles: dbPureBundles,
        dbDownloads: dbDownloads
    };


    // To prepare rex bellow

    const loggerManager = new logging.LoggerManager(logger);
    let stagingManager, handoffManager;
    if (config.subMode === 'stagingserver') {
        const StagingManager = require('lib/staging-manager');
        stagingManager = new StagingManager();
    }
    else if (config.subMode === 'handoffserver')  {
        const HandoffManager = require('lib/handoff-manager');
        handoffManager = new HandoffManager();
    }

    const rex = {
        refreshManager: new refresh.RefreshManager({dbs}),
        stagingManager,
        handoffManager,
        log: new logging.Log({
            userLogger: loggerManager.createLogger('rexUser'),
            debugLogger:loggerManager.createLogger('rexDebug')
        }),
        loggerManager
    };

    app.set('port', myHttpPort);
    app.enable('trust proxy'); // tell express we're sitting behind the seaport proxy (needed by analytics to get clients' IP addresses)
    app.set('views', path.join(__dirname, 'views'));
    app.set('view engine', 'ejs');

    app.use(express.favicon());
    //app.use(express.logger('dev'));
    app.use(express.json({limit: '10mb'}));
    app.use(express.bodyParser({limit: '10mb'}));
    app.use(express.urlencoded());
    app.use(express.methodOverride());
    app.use(express.cookieParser('3gJX9uaOXjFg2NLwf6MC'));
    /* 30 min sessions for analytics (same length as Google Analytics sessions) */
    app.use(express.session({
        key: 'ta30m',
        proxy: true,
        cookie: {path: '/', maxAge: 30 * 60 * 1000},
        secret: '3gJX9uaOXjFg2NLwf6MC'
    }));
    app.use(block());
    function block() {
        return function(req, res, next) {
            if (dbReady === false) {
                res.send(503, 'TIREX is temporarily unavailable while database initialization is in progress. Please try again later.');
            }
            else if (rex.refreshManager.isRefreshing()) {
                res.send(503, 'TIREX is temporarily unavailable while a database refresh is in progress. Please try again later.');
            } else {
                next();
            }
        };
    }
    app.use(analytics.log(path.join(config.analyticsDir, 'analytics'), dbResources, dbDevices, dbDevtools));
    app.use(app.router);
    //<<< osohm: see http://stackoverflow.com/questions/22285659/first-nodejs-app-it-is-saying-to-update-your-less-middleware-usage
    //app.use(require('less-middleware')({ src: path.join(__dirname, 'public') }));
    //app.use(require('less-middleware')(path.join(__dirname, 'public')));
    //>>>
    // app.use(express.logger());
    //app.use('/content', express.static(path.resolve(vars.CONTENT_BASE_PATH)));
    app.use(express.static(path.join(vars.projectRoot, 'public')));
    app.use('/scripts', express.static(path.join(
        // should move everything to node_modules
        vars.projectRoot, '3rd_party', 'shared', 'front_end_modules') +
                                       path.sep));
    app.use('/scripts2', express.static(
        path.join(vars.projectRoot, 'node_modules') + path.sep));

    app.use('/zips', express.static(
        path.join(vars.CONTENT_BASE_PATH, 'zips') + path.sep));

    // development only
    if ('development' === app.get('env')) {
        app.use(express.errorHandler());
    }

    // [ Bruce
    /*
      if (config.mode === 'localserver') {
      localserver.makeofflineDevicesAndDevtools(null, null, dbDevices, dbDevtools);
      }
    */
    var desktopServer;
    if (config.mode === 'localserver') {
        desktopServer = new localserver();
        desktopServer.init(vars, dbs, myHttpPort, function (connected) {
            if (connected === true) {
		serverState.updateConnectionState(state.ConnectionState.CONNECTED, config);
                serverState.useRemoteContent = true;
            }
            else {
                // not connected to remote server
		serverState.updateConnectionState(state.ConnectionState.OFFLINE, config);
                serverState.useRemoteContent = false;
            }
        });
    }
    function testRemoteServer(callback) {
        if (config.mode !== 'localserver') {
            serverState.useRemoteContent = false; // disable remote access
            callback(serverState.connectionState);
        }
        else {
            desktopServer.testRemoteConnection(function (connected) {
                if (connected) {
		    serverState.updateConnectionState(
			state.ConnectionState.CONNECTED, config);
                }
                else {
                    // not connected to remote server
		    serverState.updateConnectionState(
			state.ConnectionState.OFFLINE, config);
                    serverState.useRemoteContent = false; // disable remote access
                }
                callback(serverState.connectionState);
            });
        }
    }

    // ]


    // API : /content static file serving; if file doesn't exist locally, pipe it from remoteserver
    app.use('/content', function (req, res) {
        if(req.url == null || req.url === '/') {
            res.send(404);
            return;
        }
        // [ REX-1070: just keep the document path, not the query
        let urlParts = urlParser.parse(req.url, true);
        if (urlParts.search && urlParts.search !== '') {
            req.url = urlParts.pathname;
        }
        // ]
        var filepath = vars.CONTENT_BASE_PATH + decodeURIComponent(req.url);

        if (config.mode === 'localserver') {
            filepath = desktopServer.translateContentPath(req.url);
        }

        let alreadyResSend = false;

        fs.exists(filepath, function (exists) {
            if (exists) {
                if (req.headers.origin != null) {
                    // echos the origin domain which effectively allows ALL domains access
                    // needed because request may come from a tirex server on a user's desktop (see below)
                    res.set({'Access-Control-Allow-Origin': req.headers.origin});
                }
                if (filepath.indexOf('.svg') > -1) {
                    res.setHeader('content-type', 'image/svg+xml');
                }
                fs.createReadStream(filepath)
                    .on('error', handleStreamError)
                    .pipe(res)
                    .on('error', handleStreamError);
            } else if (config.mode === 'localserver' && serverState.useRemoteContent === true) {
                if (filepath.indexOf('.svg') > -1) {
                    res.setHeader('content-type', 'image/svg+xml');
                }
                request.get({url:vars.REMOTESERVER_BASEURL + req.originalUrl, headers:{'user-agent': desktopServer.userAgent}}) // inclide user-agent
                    .on('error', handleStreamError)
                    .pipe(res)
                    .on('error', handleStreamError);
            } else {
                res.send(404);
            }
        });

        function handleStreamError(err) {
            logger.error('/content stream error:' + JSON.stringify(err));
            if (!alreadyResSend) {
                alreadyResSend = true;
                res.send(404); // pipe not closed automatically on error
            }
        }
    });

    // API : /components static file forwarding from cloud web components server
    app.use('/components', function (req, res) {
        let alreadyResSend = false;
        if (config.mode === 'remoteserver' ||  // will only happen if tirex runs as a standalone remote server
            (config.mode === 'localserver' && serverState.useRemoteContent === true) &&
            vars.WEBCOMPONENTSSERVER_BASEURL != null) {
            // [ REX-843 - temporary block flash tools until supported
            if(config.mode === 'localserver' && (req.url.indexOf('ti-widget-flashtool') >= 0 || req.url.indexOf('ti-core-backplane') >= 0)) {
                res.send(404);
                return;
            }
            // ]
            request.get(vars.WEBCOMPONENTSSERVER_BASEURL + req.url)
                .on('error', handleStreamError)
                .pipe(res)
                .on('error', handleStreamError);
        } else {
            res.send(404);
        }

        function handleStreamError(err) {
            logger.error('/content stream error:' + JSON.stringify(err));
            if (!alreadyResSend) {
                alreadyResSend = true;
                res.send(404); // pipe not closed automatically on error
            }
        }
    });

    app.get('/loading', function(req, res) {
	res.redirect('/loading.html');
    });

    app.post('/stage', function(req, res) {
        if (config.subMode !== 'stagingserver' ||
            config.mode !== 'remoteserver') {
            logger.info('recived stage request on a non-stagingserver');
            res.send(400);
            return;
        }
        rex.stagingManager.uploadPackage(
            req.body, rex, (err, body={}) => {
                if (err) {
                    logger.error(err);
                    return;
                }
                vars.handoffServerURLs.map((url) => {
                    request.post({
                        url,
                        json: true,
                        headers: {
                            'content-type': 'application/json',
                        },
                        body
                    }).on('response', (response) => {
                        if (response.statusCode !== 200) {
                            logger.error(`got status code ${response.statusCode} doing a handoff request to ${url} with body ${body}`);
                        }
                    }).on('error', (err) => {
                        logger.error(`got err ${err} doing a handoff request to ${url} with body ${body}`);
                    });
                });
            });
        res.end();
    });

    app.post('/handoff', (req, res) => {
        if (config.subMode !== 'handoffserver' ||
            config.mode !== 'remoteserver') {
            logger.info('revived handoff request on a non-handoff');
            res.send(400);
            return;
        }
        const args = req.body;
        args['log'] = rex.log;
        rex.handoffManager.handoffPackage(args, (err) => {
            if (err) {
                logger.error(err);
                return;
            }
            rex.refreshManager.refreshDatabase({
                log: rex.log
            });
        });
        res.end();
    });

    // API : GET => analytics
    var adminAuth = express.basicAuth('tirex', 'jurassic');
    app.get('/analytics', adminAuth, function (req, res) {
        var stats = analytics.getPastMonths(2);
        var statsOverall = analytics.getOverall();
        res.render('analytics.ejs', {stats: stats, statsOverall: statsOverall}); // note: Array.reverse() appears to be corrupting arrays in ejs
    });

    // API : GET => analytics1
    app.get('/analytics1', adminAuth, function (req, res) {
        var stats = analytics.getPastMonths(2);
        var statsOverall = analytics.getOverall();
        res.render('analytics_mohit.ejs', {stats: stats, statsOverall: statsOverall}); // note: Array.reverse() appears to be corrupting arrays in ejs
    });


    /**
     * API : GET => get serverstate
     *
     */
    app.get('/api/serverstate', function (req, res) {
        var serverstate = serverState;
        serverstate.serverMode = config.mode;
        // [ TIREX_3.0 - pre-process checking
        checkUserAgent(req);
        // ]
        res.send(serverstate);
    });

    /**
     * API : POST => set serverstate
     *
     * Update server states that are not read-only
     *
     */
    app.post('/api/serverstate', function (req, res) {
        if (req.body.useRemoteContent != null) {
            console.log('setting to ' , req.body.useRemoteContent);
            if (config.mode === 'localserver' && req.body.useRemoteContent) {
                // test the connection before switching
                testRemoteServer(function (connectionState) {
                    if (connectionState === state.ConnectionState.CONNECTED) {
                        // ok
                        serverState.useRemoteContent = req.body.useRemoteContent;
                        serverState.updateConnectionState(
                            serverState.useRemoteContent ?
                                state.ConnectionState.CONNECTED :
                                state.ConnectionState.OFFLINE,
                            config);
                    }
                    else {
                        // failed, use remote content not allowed
                        serverState.useRemoteContent = false;
                    }
                    res.end();
                });
            }
            else {
                serverState.useRemoteContent = req.body.useRemoteContent;
		serverState.updateConnectionState(
		    serverState.useRemoteContent ?
			state.ConnectionState.CONNECTED :
			state.ConnectionState.OFFLINE,
		    config);
                res.end();
            }
        }
        else {
            res.end();
        }
    });

    /**
     * API : GET => get resources
     *
     *  query parameters:
     *      device: a device name
     *      devtool: a devtool name
     *      path: a tree path (based on results of previous calls)
     *      download: if 'true' this is a download request (see response below)
     *      makeoffline: if 'true' this is a makeoffline request (see response below)
     *      progressId: generated by the client if download=true or makeoffline=true
     *      dumpImportables: if 'true' send json with all importable projects and source files (for testing)
     *      language
     *      ide
     *      tags
     *
     *  response:
     *      browsing mode: JSON with folders and resources that are directly (i.e. no subfolder recursion) in the specified path
     *      download mode: A URL to api/download where the client can pick up the zip archive: {link: 'api/download/...'},
     *      makeoffline mode: JSON with unprocessed resource records from the DB for all hits: {resources: [...], overviews: [...]}
     */
    app.get('/api/resources', function (req, res) {
        if (req.query.download === 'true') {
            // 'Acknowledge' to browser and continue; browser will poll via api/downloadprogress to get progress and eventially the result when done
            res.send(202);
            download.downloadAssets(dbResources, dbOverviews, dbPureBundles, dbDownloads, req.query.progressId, req, res);
        } else if (req.query.makeoffline === 'true') {
            if (config.mode === 'remoteserver') {
                // sends resource and overview records; client is then expected to send back a list of files needed for download using api/archivefiles
                query.makeofflineOrDownloadQuery(dbResources, dbOverviews, dbPureBundles, req.query, function (err, result) {
                    sendStream(err, result); // stream possibly very large arrays to reduce memory pressure caused by stringify entire data at once
                });
            } else if (config.mode === 'localserver') {
                desktopServer.makeofflineResources(req, res);
            }
        } else if (req.query.removeoffline === 'true') {
            if (config.mode === 'localserver') {
                desktopServer.removeofflineResources(req, res);
            }
        } else if (req.query.dumpImportables === 'true') {
            query.dumpImportablesForTesting(dbDevtools, dbResources, req.query, function(err, result) {
                sendStream(err, {result: result});
            });
        } else {
            // [ Metadata_2.1 : append hidden H/W pacakges in the query
            if(dbOverviews.appendPackagesString) {
                req.query.package = dbOverviews.appendPackagesString(req.query.package);
            }
            // ]
            // [ REX-1052
            if (config.mode === 'remoteserver' && isUseragentTirex(req) === false) {
                // Cloud client, apply restriction
                if(dbOverviews.applyPackageRestrictions) {
                    req.query.package = dbOverviews.applyPackageRestrictions(req.query.package, vars.METADATA_PKG_DOWNLOAD_ONLY);
                }
            }
            // ]
            // just regular browsing
            if (config.mode === 'remoteserver') {
                query.doQuery(dbResources, dbOverviews, dbDevices, dbDevtools, dbDownloads, req, res, function (err, result) {
                    send(err, result);
                });
            } else if (config.mode === 'localserver') {
                desktopServer.doQuery(req, res, function (err, result) {
                    send(err, result);
                });
            }
        }

        function send(errMsg, result) {
            if (!errMsg) {
                res.send(result);
            } else {
                sendError(errMsg);
            }
        }
        function sendStream(errMsg, result) {
            if (!errMsg) {
                var js = new jsonstream(result);
                js.pipe(res);
            } else {
                sendError(errMsg);
            }
        }
        function sendError(errMsg) {
            logger.error(req.originalUrl + ':' + errMsg);
            res.send(500, errMsg);
        }
    });

    /**
     * API : GET => get a bundle
     *
     *  query:
     *      vid: <id>[__version]  - version is optional
     *      download: if 'true' this is a download request (see response below)
     *      makeoffline: if 'true' this is a makeoffline request (see response below)
     *      progressId: generated by the client if download=true
     *
     *  response:
     *      regular mode: just the bundle record itself
     *      download mode: A URL to api/download where the client can pick up the zip archive: {link: 'api/download/...'},
     *      makeoffline mode: JSON with unprocessed resource records from the DB for all hits: {resources: [...], overviews: [...]}
     */
    app.get('/api/bundle', function (req, res) {
        var id = req.query.vid.split(vars.BUNDLE_ID_VERSION_DELIMITER)[0];
        var version = req.query.vid.split(vars.BUNDLE_ID_VERSION_DELIMITER)[1]; // version may be null
        query.findBundle(id, version, dbOverviews, dbPureBundles, dbResources, function (err, bundle) {
            if (err || bundle == null) {
                var errMsg = 'Bundle ' + req.query.vid + ' not found:' + JSON.stringify(err);
                logger.error(req.originalUrl + ':' + errMsg);
                res.send(500, errMsg);
                return;
            }
            if (req.query.download === 'true') {
                // 'Acknowledge' to browser and continue; browser will poll via api/downloadprogress to get progress and eventually the result when done
                res.send(202);
                // TODO: creating a file list from resources is not done at the moment:
                // download.downloadAssets(dbResources, dbOverviews, dbDownloads, req.query.progressId, req, res);
                download.archiveFiles(bundle.includedFilesForDownload, dbDownloads, req.query.progressId, req.query.os, true);
            } else if (req.query.makeoffline === 'true') {
                if (config.mode === 'remoteserver') {
                    // 'Acknowledge' to browser and continue; browser will poll via api/downloadprogress to get progress and eventually the result when done
                    res.send(202);
                    download.archiveMetadata(bundle.includedResources, dbResources, dbOverviews, dbPureBundles, dbDownloads, req.query.progressId);
                } else {
                    res.send(500, 'API supported by remoteserver only. Use /api/bundles instead.');
                }
            } else {
                // regular mode: just the bundle record itself
                send(null, bundle);
            }
        });

        function send(errMsg, result) {
            if (!errMsg) {
                res.send(result);
            } else {
                sendError(errMsg);
            }
        }
        function sendStream(errMsg, result) {
            if (!errMsg) {
                var js = new jsonstream(result);
                js.pipe(res);
            } else {
                sendError(errMsg);
            }
        }
        function sendError(errMsg) {
            logger.error(req.originalUrl + ':' + errMsg);
            res.send(500, errMsg);
        }
    });

    /**
     * LOCALSERVER ONLY
     *
     * API : GET => get multiple bundles
     *
     *  query:
     *      vids: <id1>[__version1]::<id2>[__version2]::...
     *      progressId: generated by the client
     *
     *  response:
     */
    app.get('/api/bundles', function (req, res) {
        if (config.mode === 'localserver') {
            // 'Acknowledge' to browser and continue; browser will poll via api/downloadprogress to get progress and eventually the result when done
            res.send(202);
            lsBundles.makeOfflineBundles(req.query.vids, req.query.progressId, dbDevices, dbDevtools, dbOverviews, dbResources, dbPureBundles);
        } else {
            res.send(500, 'API supported by localserver only. Use /api/bundle instead.');
        }
    });

    /**
     * LOCALSERVER ONLY
     *
     * API : GET => choose package DBs to load into memory
     *
     *  query:
     *      packages: <id1>[__version1]::<id2>[__version2]::...
     *
     *  response: -
     */
    app.get('/api/use', function (req, res) {
        if (config.mode === 'localserver') {
            var packagesToUse = [];
            if (req.query != null && req.query.packages != null && req.query.packages !== '') {
                packagesToUse = req.query.packages.split(vars.BUNDLE_LIST_DELIMITER);
            }
            // Metadata_2.1 : assuming dbResources (rexdb-split) has been updated with hidden packages
            dbResources.use(packagesToUse, function() {
                res.send(200);
            });
        } else {
            res.send(500, 'API supported by localserver only.');
        }
    });

    /**
     * Req body is array of file paths to be zipped up.
     * Intended for Make Available Offline. Uses the same async queue as the regular download
     *
     *  body:
     *      array of file paths
     *  query parameters:
     *      progressId: generated by the client
     *
     *  response:
     *      A URL to api/download where the client can pick up the zip archive: {link: 'api/download/...'},
     */
    app.post('/api/archivefiles', function (req, res) {
        // 'Acknowledge' to client and continue; browser will poll via api/downloadprogress to get progress and eventially the result when done
        res.send(202);
        download.archiveFiles(req.body, dbDownloads, req.query.progressId, vars.HOST, false);
    });


    /**
     * API : GET => download
     *  The URL for this API is generated by the server and sent to client when the download file is ready. The client then
     *  has a chance to cancel the download. If not cancelled, client calls this API which initiates the file download.
     *
     *  query parameters:
     *      source
     *      file
     *      clientfile
     *
     */
    app.get('/api/download', function (req, res) {
        var file;
        if (req.query.source === 'cache') { // zip file (always cached)
            file = path.join(vars.DOWNLOADS_BASE_PATH, req.query.file);
        } else if (req.query.source === 'content') { // single file, unzipped
            file = path.join(vars.CONTENT_BASE_PATH, req.query.file);
        } else if (req.query.source === 'local') { // e.g. NothingToDownload.txt
            file = req.query.file;
        } else {
            res.send(500, 'Illegal source: ' + req.query.source);
            return;
        }
        res.download(file, req.query.clientfile, function (err) {
            if (err) {
                // handle error, keep in mind the response may be partially-sent so check res.headersSent
                logger.error('Error downloading: ' + JSON.stringify(err));
                res.send(500, 'Error downloading: ' + JSON.stringify(err));
            }
        });
    });

    /**
     * API: GET => downloadprogress (returns progress in percent)
     *
     * TODO: use ProgressInfo from progress.js as /api/bundlesprogress
     *
     * params:
     *  id: the progress id (that was initially provided by the client as part of the download resource query)
     */
    app.get('/api/downloadprogress/:id', function (req, res) {
        var total = 0;
        var worked = 0;

        // [ Bruce
        if (config.mode === 'localserver') {
            var _offlineProgressInfo = desktopServer.getOfflineProgressInfo(req.params.id);
            if (_offlineProgressInfo) {
                // doing makeOffline
                desktopServer.getOfflineProgress(_offlineProgressInfo, function (result) {
                    if (result.progress === null || result.task === '') {
                        // done
                        if(_offlineProgressInfo.error != null) {
                            res.send(200, {result: _offlineProgressInfo.result, done: true, error: _offlineProgressInfo.error});
                        }
                        else {
                            res.send(200, {result: _offlineProgressInfo.result, done: true});
                        }
                    }
                    else {
                        res.send(206, {progress: result.progress, message: result.task});
                    }
                });
                return;
            }
        }
        // ]

        var downloadQueueProgress_clone = download.downloadQueueProgress.concat(); // make shallow copy since array is modified in the result callback (don't make deep copy otherwise indexOf() will fail...)
        async.detectSeries(downloadQueueProgress_clone, (progressInfo, callback) => {
            // estimate progress by assuming each record will cause one corresponding line in the zipListFile and zipLogFile
            // (this is obviously not true if a record points to a filesystem folder)
            // takes queue position into account by summing up total and worked of all downloads that are ahead of the requested download
            total += progressInfo.totalToZip * 2;
            if (progressInfo.active === true) {
                getLineCount(progressInfo.zipListFile, function (lineCountOfList) {
                    getLineCount(progressInfo.zipLogFile, function (lineCountOfLog) {
                        worked += lineCountOfList + lineCountOfLog;
                        if (progressInfo.id === req.params.id) {
                            callback(null, true); // break out of the loop
                        } else {
                            callback(null);
                        }
                    });

                });
            }
            else if (progressInfo.id === req.params.id) {
                setImmediate(callback, null, true);
            } else {
                setImmediate(callback, null);
            }
        }, function (err, progressInfo) {
            if (progressInfo == null) {
                var errMsg = 'progressInfo is null - aborting download operation';
                logger.error(errMsg);
                res.send(500, errMsg); // TODO: browser to listen to 500, abort and report an error to user
                return;
            }
            var progress = Math.floor(100 * worked / total);
            // cap at some % below 100 since the number of lines could be more than the number of records...
            if (progress >= 100) {
                progress = 99;
            }

            if (progress >= 99) {
                progressInfo.message = 'Finishing Download';
            }

            if (progressInfo.done === true) {
                res.send(200, {result: progressInfo.result, done: true});
                download.downloadQueueProgress.splice(download.downloadQueueProgress.indexOf(progressInfo), 1); // remove
                logger.info('finished processing download: progressId=' + progressInfo.id);
            } else {
                res.send(206, {progress: progress, message: progressInfo.message});
            }
        });

        function getLineCount(filename, callback) {
            var lineCount = 0;
            try {
                fs.createReadStream(filename)
                    .on('data', function (chunk) {
                        for (var c = 0; c < chunk.length; c++) {
                            if (chunk[c] === 10) { // '\n'
                                lineCount++;
                            }
                        }
                    })
                    .on('end', function () {
                        callback(lineCount);
                    })
                    .on('error', function () {
                        callback(0);
                    });
            } catch (err) {
                callback(0);
            }
        }
    });

    /**
     * LOCALSERVER ONLY
     *
     * API: GET => bundlesprogress (returns progress in percent)
     *
     * params:
     *  id: the progress id (that was initially provided by the client as part of the api/bundles request)
     */
    app.get('/api/bundlesprogress/:id', function (req, res) {
        if (config.mode === 'localserver') {
            var progressInfo = lsBundles.bundlesProgressInfos[req.params.id];

            if (progressInfo == null) {
                var errMsg = 'progressInfo is null - aborting operation';
                logger.error(errMsg);
                res.send(500, errMsg); // TODO: browser to listen to 500, abort and report an error to user
                return;
            }
            if (req.query.cancel === 'true') {
                progressInfo.cancel = true;
                res.send(200);
                return;
            }
            if (progressInfo.done === true) {
                //res.send(200, {result: progressInfo.result, done: true});
                //delete lsBundles.bundlesProgressInfos[req.params.id];
                if (progressInfo.error != null) {
                    logger.error('finished progressId=' + req.params.id + ' with error: ' + progressInfo.error);
                    res.send(200, {result: progressInfo.result, done: true, error: progressInfo.error});
                } else {
                    logger.info('finished progressId=' + req.params.id);
                    res.send(200, {result: progressInfo.result, done: true});
                }
                delete lsBundles.bundlesProgressInfos[req.params.id];
            } else {
                res.send(206, {progress: progressInfo.getProgressPercent(), message: progressInfo.message, canCancel: progressInfo.canCancel});
            }
        } else {
            res.send(500, 'API supported by localserver only.');
        }
    });

    /**
     * LOCALSERVER ONLY
     *
     * API: GET => force exit of node process
     */
    if (config.mode === 'localserver') {
        app.get('/api/exit', function (req, res) {
            process.exit();
        });
    }

    /**
     * API: GET => has visited (returns true if this is the first time
     * this get request was issues since the local server started).
     *
     * Note: this is a temp workaround for differentiating between
     * user page refreshes and internal (i.e on click) refreshes
     */
    var hasVisited = false;
    app.get('/api/hasVisited', function(req, res) {
        if (config.mode === 'localserver') {
            res.send(200, {hasVisited: hasVisited});
            hasVisited = true;
        }
        else {
            res.send(500, 'API supported by localserver only.');
        }
    });

    app.get('/api/isTirexContent/:path', function (req, res) {
        let filePath = req.params.path;
        let tirex_content_base = vars.CONTENT_BASE_PATH;

        if(vars.HOST === 'win32') {
            filePath = filePath.toLowerCase();
            tirex_content_base = tirex_content_base.toLowerCase();
        }
        res.send(200, (pathHelpers.normalize(filePath)
        .indexOf(pathHelpers.normalize(tirex_content_base)) === 0));
    });

    /**
     * API: GET => progress (auto re-directs to the right progress API, downloadprogress or bundlesprogress
     * TODO: downloadprogress and bundlesprogress should merge into one single API
     *
     * params:
     *  id: the progress id (that was initially provided by the client as part of the api request)
     */
    app.get('/api/progress/:id', function (req, res) {
        var targetApi;
        if (lsBundles.bundlesProgressInfos[req.params.id] != null) {
            targetApi = req.originalUrl.replace('api/progress/', 'api/bundlesprogress/');
        } else {
            targetApi = req.originalUrl.replace('api/progress/', 'api/downloadprogress/');
        }
        if (config.myRole !== null && config.myRole !== '') {
            res.redirect(config.myRole + '/' + targetApi);
        } else {
            res.redirect(targetApi);
        }
    });

    /**
     * API: GET => runOffline (run the executable resource).
     * Note: currently the resource must be offline before calling
     * the route (James: should we handle making it offline in the backend?)
     *
     * params:
     *  id: the resource id
     */
    app.get('/api/runOffline/:id', function(req, res) {
        res.set({'Access-Control-Allow-Origin': req.headers.origin});
        if (config.mode === 'localserver') {
            dbResources.findOne({'_id': req.params.id}, function (err, resource)  {
                if (err || resource == null) {
                    logger.error('Failed to get node for resource');
                    logger.error(err);
                    res.send(500, err);
                }
                else {
                    const filepath = desktopServer.translateContentPath(resource.link);
                    let error = null;
                    try {
                        child_process.spawn(filepath);
                    }
                    catch(err) {
                        error = err;
                    }
                    finally {
                        if (error) {
                            logger.error('Failed to execute file');
                            logger.error(error);
                            res.send(500, error);
                        }
                        else {
                            res.end();
                        }
                    }
                }
            });
        }
        else {
            // James: 406 => 'not acceptable' - does this make sense ?
            logger.error('Trying to run executable without local server');
            res.send(406);
        }
    });

    app.get('/api/runOffline', (req, res) => {
        if (config.mode === 'localserver') {
            const filepath = desktopServer.translateContentPath(req.query.location.replace('/content',''));
            const child = child_process.spawn(filepath);
            //processManager.addProcess({child, out: process.out});
            return res.send(200);
        }
        else {
            return res.send(400);
        }
    });

    //API : GET => linkTo resource (mainly so that we can track it better for analytics)
    app.get('/api/linkTo/:id', function (req, res) {
        dbResources.findOne({'_id': req.params.id}, function (err, resource) {
            if (resource != null) {
                analytics.inc('views', resource.link, req);
                analytics.sendToCloudMetrics('tirexView', resource, req);
                // echos the origin domain which effectively allows ALL domains access
                // needed because request may come from a tirex server on a user's desktop (see below)
                res.set({'Access-Control-Allow-Origin': req.headers.origin});
                if (resource.linkType === 'local') {
                    // Temporary fix for older browsers with difficulties handling win style paths in links
                    resource.link = resource.link.replace(/\\/g, '/');
                    if (config.myRole !== null && config.myRole !== '') {
                        res.redirect(config.myRole + '/content/' + resource.link);
                    } else {
                        res.redirect('content/' + resource.link);
                    }
                } else {
                    res.redirect(resource.link);
                }
            } else if (config.mode === 'localserver' && serverState.useRemoteContent === true) {
                res.redirect(vars.REMOTESERVER_BASEURL + req.originalUrl);
                //request.get({url:vars.REMOTESERVER_BASEURL + req.originalUrl, headers:{'user-agent': desktopServer.userAgent}}, function (err1, res1, body) {
                //    res.send(res1.statusCode, res1.body);
                //});
            } else {
                var msg = 'Resource not found: ' + req.originalUrl;
                logger.error(msg);
                res.send(404, vars.RESOURCE_OT_FOUND_MSG);
            }
        });
    });

    //API : GET => import project (projects and projectspecs) (mainly so that we can track it for analytics)
    app.get('/api/importProject/:id', function (req, res) {
        dbResources.findOne({'_id': req.params.id}, function (err, resource) {
            if (resource == null) {
                var msg = 'Resource not found: ' + req.originalUrl;
                logger.error(msg);
                res.send(404, vars.RESOURCE_OT_FOUND_MSG);
                return;
            }
            analytics.inc('imports', resource.link, req);
            analytics.sendToCloudMetrics('tirexImport', resource, req);
            var importProjectAPI = '//' + vars.CCS_CLOUD_URL + resource._importProjectCCS;

            res.set({'Access-Control-Allow-Origin': req.headers.origin});

            // optional connection type
            if (req.query.connection != null) {
                importProjectAPI += '&connection=' + req.query.connection;
            }

            if (config.mode === 'localserver') {
                //var re = new RegExp( ".*/ide/api/ccsserver/", 'g');
                //importProjectAPI = importProjectAPI.replace(re, "http://localhost:" + config.ccs_port + "/");
                importProjectAPI = desktopServer.translateProjectAPI(importProjectAPI);
            }

            if (config.mode === 'localserver') {
                // workaround for Mac: redirect to CCS port not working for unknown reason
                request.get(importProjectAPI, function (err, res1, body) {
                    logger.error(JSON.stringify(err));
                    // logger.info(JSON.stringify(res1));
                    // logger.info(JSON.stringify(body));
                    if(res1 == null){
                        res.send(500, '<pre>Error: CCS server not responding.</pre>');
                    }else{
                        res.send(res1.statusCode, res1.body);
                    }
                });
            } else {
                res.redirect(importProjectAPI);
            }
        });
    });

    // API : GET => import project - with path (intended for custom pages - EXTERNALLY PUBLISHED API)
    // works for projects and projectspecs
    // usage: api/importProject?path=the/path/to/the/project&package=nameofthepackage (the path is relative to package folder)
    app.get('/api/importProject', function (req, res) {
        // TODO ??? versioned package ???
        dbOverviews.findOne({resourceType: 'packageOverview', package: req.query.package}, function (err, packageOverview) {
            if (packageOverview == null) {
                var msg = 'Resource not found: ' + req.originalUrl;
                logger.error(msg);
                res.send(404, vars.RESOURCE_OT_FOUND_MSG);
                return;
            }
            var location = path.join(vars.CCS_CLOUD_IMPORT_PATH, packageOverview.packagePath, req.query.path);
            analytics.inc('imports', location, req);
            analytics.sendToCloudMetrics('tirexImport', {location: location}, req);

            if (config.mode === 'localserver') {
                // workaround for Mac: redirect to CCS port not working for unknown reason
                request.get('//' + vars.CCS_CLOUD_URL + vars.CCS_IMPORT_PROJECT_API + '?location=' + location, function (err, res1, body) {
                    logger.error(JSON.stringify(err));
                    //logger.info(JSON.stringify(res));
                    //logger.info(JSON.stringify(body));

                    if(res1 == null){
                        res.send(500, '<pre>Reason: CCS server not responding.</pre>');
                    }else{
                        res.send(res1.statusCode, res1.body);
                    }
                });
            } else {
                res.redirect('//' + vars.CCS_CLOUD_URL + vars.CCS_IMPORT_PROJECT_API + '?location=' + location);
            }
        });
    });

    //API : GET => import with core/device or board id (Energia sketch, projectspecs with regex)
    app.get('/api/importProject/:id/:targetId', function (req, res) {
        dbResources.findOne({'_id': req.params.id}, function (err, resource) {
            if (resource == null) {
                var msg = 'Resource not found: ' + req.originalUrl;
                logger.error(msg);
                res.send(404, vars.RESOURCE_OT_FOUND_MSG);
                return;
            }
            analytics.inc('imports', resource.link, req);
            analytics.sendToCloudMetrics('tirexImport', resource, req);
            var re = new RegExp(vars.TARGET_ID_PLACEHOLDER, 'g');
            var importProjectAPI = '//' + vars.CCS_CLOUD_URL + resource._importProjectCCS.replace(re, req.params.targetId);
            // optional connection type
            if (req.query.connection != null) {
                importProjectAPI += '&connection=' + req.query.connection;
            }

            if (config.mode === 'localserver') {
                //re = new RegExp( ".*/ide/api/ccsserver/", 'g');
                //importProjectAPI = importProjectAPI.replace(re, "http://localhost:" + config.ccs_port + "/");
                importProjectAPI = desktopServer.translateProjectAPI(importProjectAPI);
            }

            if (config.mode === 'localserver') {
                // workaround for Mac: redirect to CCS port not working for unknown reason
                request.get(importProjectAPI, function (err, res1, body) {
                    logger.error(JSON.stringify(err));
                    //logger.info(JSON.stringify(res));
                    //logger.info(JSON.stringify(body));
                    if (res1 == null){
                        res.send(500, '<pre>Reason: CCS server not responding.</pre>');
                    } else {
                        res.send(res1.statusCode, res1.body);
                    }
                });
            } else {
                res.redirect(importProjectAPI);
            }
        });
    });

    // API : GET => create and import project (file.importable, folder.importable)
    app.get('/api/createProject/:id/:targetId', function (req, res) {
        dbResources.findOne({'_id': req.params.id}, function (err, resource) {
            if (resource == null) {
                var msg = 'Resource not found: ' + req.originalUrl;
                logger.error(msg);
                res.send(404, vars.RESOURCE_OT_FOUND_MSG);
                return;
            }
            analytics.inc('imports', resource.link, req);
            analytics.sendToCloudMetrics('tirexImport', resource, req); // TODO: use targetId to determine device
            var re = new RegExp(vars.TARGET_ID_PLACEHOLDER, 'g');
            var createProjectAPI = '//' + vars.CCS_CLOUD_URL + resource._createProjectCCS.replace(re, req.params.targetId);

            if (config.mode === 'localserver') {
                //re = new RegExp( "/ide/api/ccsserver/", 'g');
                //createProjectAPI = createProjectAPI.replace(re, "http://localhost:" + config.ccs_port + "/");
                createProjectAPI = desktopServer.translateProjectAPI(createProjectAPI);
            }
            if (config.mode === 'localserver') {
                // workaround for Mac: redirect to CCS port not working for unknown reason
                request.get(createProjectAPI, function (err, res1, body) {
                    logger.error(JSON.stringify(err));
                    // logger.info(JSON.stringify(res1));
                    // logger.info(JSON.stringify(body));
                    if(res1 == null){
                        res.send(500, '<pre>Reason: CCS server not responding.</pre>');
                    }else{
                        res.send(res1.statusCode, res1.body);
                    }
                });
            } else {
                res.redirect(createProjectAPI);
            }

        });
    });

    // [ CCSIDE-2956
    // General API: redirect to CCS, the API subpath should be matched with CCS spec
    // Intended for CCS project server initially:
    //   createProject(), importProject(), buildProject(), debugProject(), importSketch()
    /*
     * - client responsible for constructing resource's full path
     *   - use 'location.pathnsme' to get the HTML page location
     *     - Ex: '/content/msp432_sdk_1_00_00_00/examples/index.html'
     *   - locate the target file (ex: ./example1/test.projectspec)
     *     - Ex: '/content/msp432_sdk_1_00_00_00/examples/example1/test.projectspec'
     *   - construct CCS call
     *     - '/api/ccs/importProject?location=/content/msp432_sdk_1_00_00_00/examples/example1/test.projectspec&...'
     * - server
     *   - resolve the content path, example:
     *     - from: '/importProject?location=/content/msp432_sdk_1_00_00_00/examples/example1/test.projectspec&...'
     *     - to" '/importProject?location=c:/ti/tirex-content/msp432_sdk_1_00_00_00/examples/example1/test.projectspec&...'
     *   - redirect to CCS server
     *     - 'http://localhost:1234/importProject?location=c:/ti/tirex-content/msp432_sdk_1_00_00_00/examples/example1/test.projectspec&...'
     * - Limitations
     *     - Client cannot use 'content' in their file paths.
     */
    app.use('/api/ccs', function (req, res) {
        // resolve content path
        // TODO: If user has its own subpath 'content', how to identify it and prevent replacement?
        //
        // redirect
        if (config.mode === 'remoteserver') {
            let reContent = new RegExp('/content/', 'g');
            let newUrl = decodeURIComponent(req.url).replace(reContent, vars.CONTENT_BASE_PATH+'/');
            newUrl = '//' + vars.CCS_CLOUD_URL + vars.CCS_CLOUD_API_BASE + newUrl;
            res.redirect(newUrl);
        }
        else if (config.mode === 'localserver') {
            desktopServer.ccsAdapter.redirectAPI(null, null, req, res);
        }
        else {
            res.send(404);
        }
    });
    // ]

    //API : GET => create and import project
    //app.get('/api/createProject/:id/:deviceVariant', function (req, res) {
    //    dbResources.findOne({'_id': req.params.id}, function (err, result) {
    //        var re = new RegExp(vars.TARGET_ID_PLACEHOLDER, 'g');
    //        var createProjectAPI = result._createProjectCCS.replace(re, req.params.deviceVariant);
    //        var importProjectAPI = result._importProjectCCS.replace(re, req.params.deviceVariant);
    //
    //        var protocol;
    //        var options;
    //        var responseData = '';
    //        if (process.env.USE_LOADBALANCER_SSL_TERMINATION === 'true') {
    //            // for dev.ti.com
    //            protocol = http;
    //            options = {host: config.seaportHostIP, path: createProjectAPI, port: 4430};
    //            logger.trace('create project call options: http: ' + JSON.stringify(options));
    //        } else {
    //            protocol = https;
    //            options = {host: config.seaportHostIP, path: createProjectAPI, rejectUnauthorized: false};
    //            logger.trace('create project call options: https: ' + JSON.stringify(options));
    //        }
    //        protocol.get(options, function (ccsRes) {
    //            ccsRes.on('data', function (data) {
    //                logger.trace('create project: data: status code: ' + ccsRes.statusCode);
    //                logger.trace('create project: data: response' + data.toString());
    //                responseData += data.toString();
    //            });
    //            ccsRes.on('end', function () {
    //                logger.trace('create project: end: status code: ' + ccsRes.statusCode);
    //                logger.trace('create project: end: response' + responseData);
    //                if (ccsRes.statusCode === 200) {
    //                    logger.trace('create project: end: redirecting to: ' + importProjectAPI);
    //                    if (result.resourceType === 'folder.importable') {
    //                        var cmd = 'cp ' + result.link + '/* ' + result.generatedProjectLocation.replace(re, req.params.deviceVariant);
    //                        exec(cmd, {'cwd': vars.CONTENT_BASE_PATH}, function (error, stdout, stderr) {
    //                            if (error !== null) {
    //                                logger.error('error creating project: ' + cmd);
    //                                logger.error('error creating project: ' + error);
    //                            } else {
    //                                res.redirect(importProjectAPI);
    //                            }
    //                        });
    //                    } else {
    //                        res.redirect(importProjectAPI);
    //                    }
    //                } else if (ccsRes.statusCode === 500) {
    //                    logger.trace('create project: end: redirecting to: ' + importProjectAPI);
    //                    res.redirect(importProjectAPI); // project already exists
    //                } else {
    //                    res.send(ccsRes.statusCode, responseData);
    //                }
    //            });
    //        }).on('error', function (e) {
    //            logger.error('create project: error' + e.message);
    //            res.send('Error calling ' + JSON.stringify(options) + ': ' + e.message);
    //        });
    //        analytics.inc('imports', result.link, req);
    //    });
    //});

    //API : GET => full device DB
    app.get('/api/devices', function (req, res) {
        dbDevices.find({}, function (err, result) {
            res.send(result);
        });
    });

    //API : GET => full devtool DB
    app.get('/api/devtools', function (req, res) {
        dbDevtools.find({}, function (err, result) {
            res.send(result);
        });
    });

    //API : GET => /devices/families
    app.get('/api/devices/families', function (req, res) {
        dbDevices.find({'parent': null}, function (err, result) {
            deleteUnwantedProperties(result);
            res.send(result);
        });
    });

    //API : GET => device record
    app.get('/api/devices/:name', function (req, res) {
        dbDevices.find({'name': req.params.name}, function (err, result) {
            deleteUnwantedProperties([result]);
            res.send(result);
        });
    });

    //API : GET => subfamilies
    app.get('/api/devices/:family/subfamilies', function (req, res) {
        // TODO: verify that a :family is a root item
        dbDevices.find({'parent': req.params.family}, function (err, result) {
            deleteUnwantedProperties(result);
            res.send(result);
        });
    });

    //API : GET => variants
    app.get('/api/devices/:subfamily/variants', function (req, res) {
        // TODO: verify that a :subfamily is a 2nd level item
        dbDevices.find({'parent': req.params.subfamily}, function (err, result) {
            deleteUnwantedProperties(result);
            res.send(result);
        });
    });

    //API : GET => all variants and devtools
    app.get('/api/devicesanddevtools', function (req, res) {
        if (config.mode === 'remoteserver' || (config.mode === 'localserver' && serverState.useRemoteContent === false)) {
            var find = {children: null};
            dbDevices.find(find, function (err, variants) {
                delete find.children;
                dbDevtools.find(find, function (err, devtools) {
                    deleteUnwantedProperties(variants);
                    deleteUnwantedProperties(devtools);
                    sortStable.inplace(variants, function (a, b) {
                        return String(a.name).localeCompare(b.name);
                    });
                    sortStable.inplace(devtools, function (a, b) {
                        return String(a.name).localeCompare(b.name);
                    });
                    // remvoe duplicates from (sorted)variants and devtools
                    for(var i =1; i< devtools.length; i++){
                        if(devtools[i -1].name === devtools[i].name){
                            devtools.splice(i,1);
                            i--;
                        }
                    }
                    for(var j =1; j< variants.length; j++){
                        if(variants[j -1].name === variants[j].name){
                            variants.splice(j,1);
                            j--;
                        }
                    }
                    devtools = devtools.filter((devtool) => {
                        return devtool.type === 'board';
                    });
                    res.send({devices: variants, devtools});
                });
            });
        } else if (config.mode === 'localserver' && serverState.useRemoteContent === true) {
            request.get({url:vars.REMOTESERVER_BASEURL + req.originalUrl, headers:{'user-agent': desktopServer.userAgent}})
                .on('error', (err) => {
                    logger.error(err);
                })
                .pipe(res);  // inclide user-agent
        }
    });

    //API : GET => all packages
    app.get('/api/packages', function (req, res) {
        var resultPackages = [];
        /*
          if (config.mode === 'remoteserver' || (config.mode === 'localserver' && state.useRemoteContent === false)) {
          dbOverviews.find({resourceType: 'packageOverview'}, function (err, packages) {
          res.send(packages);
          });
          } else if (config.mode === 'localserver' && state.useRemoteContent === true) {
          request.get(vars.REMOTESERVER_BASEURL + req.originalUrl).pipe(res);
          }
        */
        if (config.mode === 'remoteserver') {
            // [ Metadata_2.1 : return software packages only
            //dbOverviews.find({resourceType: 'packageOverview'}, function (err, packages) {
            dbOverviews.find({resourceType: 'packageOverview', type: 'software'}, function (err, packages) {
                // ]
                // [ REX-1052
                //res.send(packages);
                if (isUseragentTirex(req)) {
                    // from desktop server, return everything
                    resultPackages = packages;
                }
                else {
                    // from cloud client, remove desktop import only items
                    resultPackages = packages.filter(_filterPackageImportOnly);
                }
                res.send(resultPackages);
                // ]
            });
        } else { // config.mode === 'localserver')
            if (req.query.scan != null) {
                // initiate a scanning
                // Deprecate: use Post /localpkg/scan instead
                desktopServer.packageImporter.scan(function (result) {
                    res.send(desktopServer.packageImporter.getNewPackages());
                });
            }
            else if (req.query.discovered != null) {
                // get a list of discovered packages available for import
                res.send(desktopServer.packageImporter.getNewPackages());
            }
            else if (req.query.importAll != null) {
                // import all newly discovered packages
                // Deprecate: use Post /localpkg/importAll instead
                desktopServer.packageImporter.importAll(req.query.progressId);
                res.send(202);
            }
            else {
                if (serverState.useRemoteContent === true) {
                    //request.get(vars.REMOTESERVER_BASEURL + req.originalUrl).pipe(res);
                    request.get({url:vars.REMOTESERVER_BASEURL + req.originalUrl, headers:{'user-agent': desktopServer.userAgent}}, function (err1, res1, body) {
                        dbOverviews.find({resourceType: 'packageOverview', type: 'software'}, function (err, packages) {
                            var onlinePackages;
                            if(err1 != null || res1 == null){
                                res.send(packages);
                                return;
                            }

                            if (res1.statusCode === 200 && body != null) {
                                onlinePackages = JSON.parse(body);
                            } else {
                                res.send(packages);
                                return;
                            }

                            var offlinePackages = packages;
                            for (var i = 0; i < onlinePackages.length; i++) {
                                for (var j = 0; j < offlinePackages.length; j++) {
                                    if (onlinePackages[i].packageUId === offlinePackages[j].packageUId) {
                                        onlinePackages[i] = offlinePackages[j];
                                    }
                                }
                            }
                            // [ REX-1052
                            //res.send(onlinePackages);
                            // filter out 'importOnly' packages from remote list
                            resultPackages = onlinePackages.filter(_filterPackageImportOnly);
                            res.send(resultPackages);
                            // ]
                        });
                    });
                }
                else {
                    dbOverviews.find({resourceType: 'packageOverview', type: 'software'}, function (err, packages) {
                        res.send(packages);
                    });
                }
            }
        }
        // [ REX-1052
        function _filterPackageImportOnly(pkg) {
            // TODO - to be implemented
            if(pkg.local === 'full') {
                return true;
            }
            if(pkg.restrictions && pkg.restrictions.indexOf(vars.METADATA_PKG_IMPORT_ONLY) >= 0) {
                return false;
            }
            return true;
        }
        // ]
    });
    // [ REX-1052
    // Utility function to check if request is originated from TIREX server
    function isUseragentTirex(req) {
        return (req.headers['user-agent'] != null && req.headers['user-agent'].indexOf('TirexServer/')>=0);
    }
    // ]

    // [ TODO Bruce: local package importer APIs
    app.get('/localpkg', function (req, res) {
        if (config.mode !== 'localserver') {
            res.send(404);
            return;
        }
        if (req.query.discovered != null) {
            // get a list of discovered packages available for import
            res.send({
                added: desktopServer.packageImporter.getNewPackages(),
                removed: desktopServer.packageImporter.listPR
            });
            return;
        }
        if (req.query.searchpath != null) {
            // get a list of discovered packages available for import
            res.send(desktopServer.packageImporter.getSearchPaths());
            return;
        }
        res.send(404);
    });
    app.post('/localpkg/scan', function (req, res) {
        if (config.mode !== 'localserver') {
            res.send(404);
            return;
        }
        desktopServer.packageImporter.scan(function (result) {
            //res.send(desktopServer.packageImporter.getNewPackages());
            res.send(result);
        });
    });
    app.post('/localpkg/importAll', function (req, res) {
        if (config.mode !== 'localserver') {
            res.send(404);
            return;
        }
        desktopServer.packageImporter.importAll(req.query.progressId);
        res.send(202);
    });
    app.post('/localpkg/import', function (req, res) {
        if (config.mode !== 'localserver') {
            res.send(404);
            return;
        }
        var packageHeaders = [];
        if (Array.isArray(req.body.p)) {
            packageHeaders = req.body.p;
        } else {
            packageHeaders = [req.body.p];
        }
        desktopServer.packageImporter.import(packageHeaders, req.query.progressId);
        res.send(202);
    });
    app.put('/localpkg/addPath', function (req, res) {
        if (config.mode !== 'localserver') {
            res.send(404);
            return;
        }
        if (req.body.searchpath) {
            desktopServer.packageImporter.addSearchPath(req.body.searchpath, true);
        }
        res.send(200);
    });
    app.put('/localpkg/removePath', function (req, res) {
        if (config.mode !== 'localserver') {
            res.send(404);
            return;
        }
        if (req.body.searchpath) {
            desktopServer.packageImporter.removeSearchPath(req.body.searchpath, true);
        }
        res.send(200);
    });
    app.post('/ide/rediscoverProducts', function (req, res) {
        if (config.mode !== 'localserver') {
            res.send(404);
            return;
        }
        desktopServer.ccsAdapter.notifyRefUpdate();
        res.send(200);
    });
    /*

     */
    if (config.mode === 'localserver') {
        // Ex: http://localhost:3001/ide/clearEvent?name=productsChanged
        app.get('/ide/clearEvent', function (req, res) {
            desktopServer.ccsAdapter.onClearEvent(req, res);
        });
         // Ex: http://localhost:3001/ccsEvent?name=productsChanged
        app.get('/ccsEvent', function (req, res) {
            desktopServer.ccsAdapter.onEvent(req, res);
        });
    }
    /*
      app.post('/debuglog', function (req, res) {
      if (config.mode !== 'localserver') {
      res.send(404);
      return;
      }
      res.send(200);
      console.log('client log: '+req.body.msg);
      });
    */
    // ]

    ///* Temporary workaround for showing unsecure pdfs inside https */
    //var request = require('request');
    //var urlParser = require('url');
    //app.get('/api/resolve', function(req, res, next) {
    //    var urlParts = urlParser.parse(req.url, true);
    //
    //	/* pegah - calling the api from https server results in missing second slash in http:// and failure of the api */
    //	var myUrl = urlParts.query.source;
    //	if (myUrl.indexOf('http://') == -1) {
    //		myUrl = 'http://' + myUrl.substr(6);
    //	}
    //
    //    request({
    //        uri: myUrl
    //    }, function(err, res2, body) {
    //        var startTag = 'HTTP-EQUIV="Refresh" CONTENT="1; URL=';
    //        var start = body.indexOf(startTag);
    //        var end = body.indexOf('>', start);
    //        var url = body.substring(start+startTag.length, end-1);
    //
    //        var rem = request({
    //            //uri: 'http://www.ti.com/lit/ug/slau318e/slau318e.pdf',
    //            uri: url
    //        });
    //
    //        rem.on('data', function(chunk) {
    //            res.write(chunk);
    //        });
    //
    //        rem.on('end', function() {
    //            res.end();
    //        });
    //    });
    //});

    function deleteUnwantedProperties(records) {
        for (var i = 0; i < records.length; i++) {
            var item = records[i];
            delete item.parent;
            delete item.ancestors;
            delete item.children;
            delete item._id;
        }
    }

    //API : GET => refresh database
    if (config.allowRefreshFromWeb === 'true') {
        app.get('/api/refresh', adminAuth, function (req, res) {
            res.writeHead(200, {
                'Content-Type': 'text/html',
                'Connection': 'Transfer-Encoding',
                'Cache-control': 'no-cache'
            });

            const log = new logging.Log({
                userLogger: rex.loggerManager.createLogger('refreshUser'),
                debugLogger: rex.loggerManager.createLogger('refreshDebug')
            });

            log.userLogger.on('data', (message) => {
                const {data, type, tags} = JSON.parse(message.toString());
                const typeColors = {
                    'info': '#FCD116', // yellow
                    'warning': 'orange',
                    'error': 'red'
                };

                const msg = `<b style="color: ${typeColors[type] || "black"}">[${type.toUpperCase()}] </b> <p style="display:inline">${data} </p><br>`;
                res.write(msg);
            });

            if (!req.query.p) {
                res.send('Usage: <br> ' +
                         'api/refresh?p=all - refresh all packages listed in default.json <br> ' +
                         'api/refresh?p=[packagename1]&p=[packagename2]... - refesh specified packages only <br>' +
                         'Refresh Package can only be used if Refresh All was invoked at least once before AND there are: <br>' +
                         '  - no changes to devices.tirex.json and devtools.tirex.json <br>' +
                         '  - no changes to rootCategory in the package header <br>');
            }
            else if (req.query.p === 'all') {
                rex.refreshManager.refreshDatabase(
                    {log}, (err) => {
                        log.closeLoggers();
                        res.end();
                    });
            }
            else {
                rex.refreshManager.refreshDatabase(
                    {log,
                     packageNames: (Array.isArray(req.query.p) ?
                                    req.query.p : [req.query.p]),
                     refreshAll: false,
                     clearAllData: false}, (err) => {
                         log.closeLoggers();
                         res.end();
                     });
            }
        });
    }

    let lastRefreshTime;

    app.post('/api/setLastRefreshTime', function (req, res) {
        lastRefreshTime = req.body.date;
        res.end();
    });

    app.get('/api/getLastRefreshTime', function (req, res) {
        res.send(lastRefreshTime);
    });

    // same as api/refresh for now, may be expanded to support multiple tasks aside from refresh
    /*
      app.get('/api/admin', function (req, res) {
      //var fs = require('fs');
      //var logDir = '/home/auser/git-repos/ti-rex-content/db/auser-vm/logs/';

      //req.query.packages is an array of the selected packages

      //req.query.tasks is an bool array of the selected tasks
      //eg. if the tasks are refresh, task2, task3, and task4
      //    and req.query.tasks == [true, false, true, false]
      //    then the user wants to run refresh and task3
      if (req.query.p === 'all') {
      refreshDatabaseAll(req, res);
      } else {
      var packageNames = [];
      if (Array.isArray(req.query.p)) {
      packageNames = req.query.p;
      } else {
      packageNames = [req.query.p];
      }

      refreshDatabase(req, res, packageNames, false, false);
      }

      // if (req.query.tasks[0] == 't') { // if req.query.tasks[0] == true
      //     console.log('refreshing');
      //     fs.watchFile(logDir+'dbBuilder_macros.log', function(curr, prev)
      //     {
      //         streamLog(logDir+'dbBuilder_macros.log');
      //     });
      //     fs.watchFile(logDir+'dbBuilder_devices.log', function(curr, prev)
      //     {
      //         streamLog(logDir+'dbBuilder_devices.log');
      //     });
      //     fs.watchFile(logDir+'dbBuilder_devtools.log', function(curr, prev)
      //     {
      //         streamLog(logDir+'dbBuilder_devtools.log');
      //     });
      //     fs.watchFile(logDir+'dbBuilder_resources.log', function(curr, prev)
      //     {
      //         streamLog(logDir+'dbBuilder_resources.log');
      //     });
      //     console.log("TEST2");
      //     //res.write("data: Done\n\n");
      // }
      // function streamLog(logfile) {
      //     var stream = fs.createReadStream(logfile);
      //     stream.on('data', function (data) {
      //         var htmlData;
      //         htmlData = data.toString();
      //         htmlData = htmlData.replace(/\r?\n|\r/g, "<br/>");
      //         res.write("data: "+htmlData+"\n\n");
      //         //res.writeHead(200, {"Last-Event-ID":"end"});
      //     });
      //     stream.on('end', function (data) {
      //         //console.log("TEST1");
      //         //res.write('data: ' + JSON.stringify({ msg : "end" }) + '\n\n');
      //     });
      // }
      });
    */

    app.get('/sitemap_index.xml', function (req, res) {
        var file = path.join(vars.SITEMAP_PATH, 'sitemap_index.xml');
        if (fs.existsSync(file) === true) {
            res.sendfile(file);
        } else {
            res.send(404, 'Not found.');
        }
    });

    app.get('/sitemap.xml/:id', function (req, res) {
        var file = path.join(vars.SITEMAP_PATH, 'sitemap' + req.params.id + '.xml');
        if (fs.existsSync(file) === true) {
            res.sendfile(file);
        } else {
            res.send(404, 'Not found.');
        }
    });

    /**
     * sitemap for Google
     * sitemaps with more than 50,000 entires need to be split up
     */
    function createSitemap(dbResources) {
        logger.info('Preparing new sitemap.xml');
        var numUrls = 0;
        var fileCounter = -1;
        var fileStrings = [];
        var fileHeader = '<?xml version="1.0" encoding="UTF-8"?>\r\n' +
            '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\r\n';
        dbResources.find({}, function (err, resources) {
            if (err == null) {
                for (var i = 0; i < resources.length; i++) {
                    for (var j = 0; j < resources[i].fullPaths.length; j++) {
                        if (numUrls === 0) {
                            fileStrings[++fileCounter] = fileHeader;
                        }
                        var link = resources[i].fullPaths[j].join('/') + '/' + resources[i].name;
                        var url = 'http://dev.ti.com/#/?link=' + encodeURIComponent(link);
                        fileStrings[fileCounter] += '<url><loc>' + url + '</loc></url>\r\n';
                        numUrls++;
                        if (numUrls === 50000) {
                            fileStrings[fileCounter] += '</urlset>';
                            numUrls = 0;
                        }
                    }
                }
                if (numUrls > 0) {
                    fileStrings[fileCounter] += '</urlset>';
                }

                var indexFile = '<?xml version="1.0" encoding="UTF-8"?>\r\n' +
                    '<sitemapindex xmlns="http://www.google.com/schemas/sitemap/0.84">\r\n';
                var index = -1;
                async.eachSeries(fileStrings, function (fileString, callback) {
                    index++;
                    fs.writeFile(path.join(vars.SITEMAP_PATH, 'sitemap' + index + '.xml'), fileString, function (err) {
                        if (err) {
                            logger.error('An error occured with writing the sitemap.xml: ' + JSON.stringify(err));
                        } else {
                            logger.info('Sitemap written successfully!');
                            indexFile += '<sitemap>\r\n' +
                                '<loc>http://dev.ti.com/tirex/sitemap.xml/' + index + '</loc>\r\n' +
                                '</sitemap>\r\n';
                        }
                        callback(err);
                    });
                }, function (err) {
                    if (!err) {
                        indexFile += '</sitemapindex>';
                        fs.writeFile(path.join(vars.SITEMAP_PATH, './sitemap_index.xml'), indexFile, function (err) {
                            if (err) {
                                logger.error('an error occured with writing the sitemap index file: ' + JSON.stringify(err));
                            } else {
                                logger.info('Sitemap index written successfully');
                            }
                        });
                    }
                });
            }
        });
    }

    function deepCopy(obj) {
        return JSON.parse(JSON.stringify(obj));
    }

    let configQueue;
    if (config.mode === 'localserver') {
        configQueue = async.queue(({req, res}, callback) => {
            const configFile = path.join(config.userConfigPath, '/user-config.json');
            const newConfig = req.body;
            fs.readJson(configFile, (err, json) => {
                const oldConfig = err ? {} : json;
                const mergedConfig = oldConfig;
                Object.keys(newConfig).map((key) => {
                    mergedConfig[key] = newConfig[key];
                });
                fs.writeJson(configFile, mergedConfig, (err) => {
                    if (err) {
                        console.log('There has been an error saving your configuration data.');
                        console.log(err.message);
                        res.send(500);
                        callback(err);
                        return;
                    }
                    console.log('User configuration saved successfully.');
                    res.send(200);
                    callback();
                });
            });
        });
    }

    /**
     *  Gets User Configuration File
     *  Reads the user configurations and returns the results. If error, file is not found.
     *
     * @param req
     * @param res
     */
    app.get('/userconfig', function (req, res) {
        async.waterfall([(callback) => {
            fs.readJson(config.userConfigPath + '/user-config.json', callback);
        }], (err, result) => {
            if (err) {
                console.log(err);
                res.send(404, err);
                return;
            }
            res.send(result);
        });
    });
    
    /**
     *  Creates/Updates User Configuration File
     *  Sets the list of fields for user configuration JSON file.
     *  Packages: user seen packages
     *  DisplayNumChildren: whether the user wants resource number to be shown in tree
     *  actualLink for the api/use call
     *  remotePackages for the package difference badge
     *  URL: user saved filter URL
     *
     * @param req
     * @param res
     */
    app.post('/userconfig/create', function (req, res) {
        if (config.mode === 'localserver') {
            // queue updates (to avoid concurrent RAWs)
            configQueue.push({req, res}, ()=>{});
        }
    });

    app.get('/runexec', function (req, res) {
        exec(req.body.path, function (error, stdout, stderr) {
            logger.error('error running exec: ' + error);
        });
        res.send(200);
    });

    var _httpserver = http.createServer(app).listen(app.get('port'), function () {
        logger.info('Express server listening on port ' +
                    _httpserver.address().port);
        serverState.updateServerStatus(state.ServerStatus.UP, config);
        if (config.refreshDB === 'true') {
            rex.refreshManager.refreshDatabase(
                {log: rex.log},
                callback);
        }
        else {
            callback();
        }
    });
}
