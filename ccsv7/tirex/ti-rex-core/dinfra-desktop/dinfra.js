// Copyright (C) 2015-2016 Texas Instruments Incorporated - http://www.ti.com/
/**
 * Cloud infrastructure abstraction layer.
 * @module dinfra
 */
const Q = require('q'); // promise library
const stream = require('stream');
const crypto = require('crypto');
const http = require('http');
const npath = require('path');
const url = require('url');
const os = require('os');
const fs = require('fs');
const util = require('util');
const dschema = require('./dschema');
const denum = require('./denum');
const dhtml = require('./dhtml');
const djson = require('./djson');
const dlog = require('./dlog');
const dfile = require('./dfile');
const dresource = require('./dresource');
const pkgjson = require('./package.json');

exports.version = pkgjson.version;
exports.variant = pkgjson.variant;

const EventEmitter = require('events').EventEmitter; // note diff to node5+
var config = null;
var uncaught = false; // handle uncaught exceptions
const tablePrefix = "dinfra_";
var landscapeConnector = null;
var resourceManager = null;
var encryptManager = null;
var writableGroup = null;
var readOnly = true; // means don't perform maint, don't log, no modify
var readableGroup = null;
var warehouseGroup = null;
var logger = dlog.logger("dinfra"); // replace this during non-legacy config
var retryManager = null;
var origin = null;
var cloud = false; // when cloud, more services are available
var address = null;
var shutdownExitCode = 0;
const shutdownJobs = [];

function Configure(callback) {
    this.callback = callback;
    this.errors = [];
    this.conn = null;
    this.upgrade = null;
}

Configure.prototype.openPrivate = function () {
    var self = this;

    if (!cloud) {
        this.configureLogsPrivate();
    }
    else if (readOnly) {
        /**
         * This will configure logs without writability, which
         * means logs won't flush, but we can still follow logs.
         * Enabled with dconfig["read-only"] (cf. ddestroy.js).
         */

        this.configureLogsPrivate();
    }
    else {
        writableGroup.openConnection(function (error, conn) {
                if (error != null) {
                    self.closePrivate(error);
                }
                else {
                    self.conn = conn;
                    self.configureInitialSchemaPrivate();
                }
            });
    }
}

Configure.prototype.closePrivate = function (error) {
    var self = this;

    if (error != null) {
        if (error instanceof Function) {
            throw new Error("invalid call to close private: " +
                "error is function");
        }

        this.errors.push(error);
    }

    if (this.upgrade != null) {
        this.upgrade.close(function (error) {
                self.upgrade = null;
                self.closePrivate(error);
            });
    }
    else if (this.errors.length > 0) {
        this.callback(this.errors);
    }
    else {
        exports.addShutdownJob(function() {
                if (retryManager != null) {
                    retryManager.flush();
                }

                dlog.flush(0, function() {
                        exports.shutdown();
                    });
            });

        this.callback(null); // we're good
    }
}

Configure.prototype.configureLogsPrivate = function () {
    var self = this;

    dlog.configure(logger, config.logging, origin, tablePrefix + "log",
                exports.writableGroup, // may actually be null ...
                readableGroup, function (error) {
            self.closePrivate(error);
        });
}

Configure.prototype.configureMaintainSessionsOptsPrivate = function () {
    var self = this;

    /*
        Attempt to upgrade the session opts schema.
    */
    writableGroup.maintainSchema(self.upgrade.conn,
        require('./dservice').sessionsOptsTablePrefix,
        writableGroup.getJSONSchema(), true, // upgrade!!!
        function (error, warnings) {
            // can ignore warnings in this phase
            if (error != null) { // neither undefined nor null
                self.closePrivate(error);
            }
            else {
                self.configureMaintainRSchemaPrivate();
            }
        });
}

Configure.prototype.configureMaintainServicesOptsPrivate = function () {
    var self = this;

    /*
        Attempt to upgrade the services opts schema.
    */
    writableGroup.maintainSchema(self.upgrade.conn,
        require('./dservice').servicesOptsTablePrefix,
        writableGroup.getJSONSchema(), true, // upgrade!!!
        function (error, warnings) {
            // can ignore warnings in this phase
            if (error != null) { // neither undefined nor null
                self.closePrivate(error);
            }
            else {
                self.configureMaintainSessionsOptsPrivate();
            }
        });
}

Configure.prototype.configureMaintainSessionsSchemaPrivate = function () {
    var self = this;

    /*
        Attempt to upgrade the infrastructure schema:
        this time its not just an initialize.
    */
    self.upgrade.upgrade("session", require('./dsessions_schema.json'),
        function (error, warnings) {
            // can ignore warnings in this phase
            if (error != null) { // neither undefined nor null
                self.closePrivate(error);
            }
            else {
                self.configureMaintainServicesOptsPrivate();
            }
        });
}

Configure.prototype.configureMaintainServicesSchemaPrivate = function () {
    var self = this;

    /*
        Attempt to upgrade the infrastructure schema:
        this time its not just an initialize.
    */
    self.upgrade.upgrade("service", require('./dservices_schema.json'),
        function (error, warnings) {
            // can ignore warnings in this phase
            if (error != null) { // neither undefined nor null
                self.closePrivate(error);
            }
            else {
                self.configureMaintainSessionsSchemaPrivate();
            }
        });
}

Configure.prototype.configureMaintainSchemaPrivate = function () {
    var self = this;

    /*
        Attempt to upgrade the infrastructure schema:
        this time its not just an initialize.
    */
    self.upgrade.upgrade("", require('./dinfra_schema.json'),
        function (error, warnings) {
            // can ignore warnings in this phase
            if (error != null) { // neither undefined nor null
                self.closePrivate(error);
            }
            else {
                self.configureMaintainServicesSchemaPrivate();
            }
        });
}

Configure.prototype.configureMaintainEncryptPrivate = function () {
    var self = this;

    if (encryptManager == null) {
        self.maintainProfilesPrivate();
    }
    else {
        encryptManager.configure(this.conn, this.upgrade, function (error) {
                if (error != null) {
                    self.closePrivate(error);
                }
                else {
                    self.maintainProfilesPrivate();
                }
            });
    }
}

Configure.prototype.configureMaintainRSchemaJSONPrivate = function () {
    var self = this;

    /*
        Attempt to upgrade the resource storage schema.
    */
    writableGroup.maintainSchema(self.upgrade.conn,
        dresource.resourceMetaTablePrefix,
        writableGroup.getJSONSchema(), true, // upgrade!!!
        function (error, warnings) {
            // can ignore warnings in this phase
            if (error != null) { // neither undefined nor null
                self.closePrivate(error);
            }
            else {
                self.configureMaintainEncryptPrivate();
            }
        });
}

Configure.prototype.configureMaintainRSchemaPrivate = function () {
    var self = this;

    /*
        Attempt to upgrade the resource storage schema.
    */
    self.upgrade.upgrade("resource", resourceManager.getResourceSchema(),
        function (error, warnings) {
            // can ignore warnings in this phase
            if (error != null) { // neither undefined nor null
                self.closePrivate(error);
            }
            else {
                self.configureMaintainRSchemaJSONPrivate();
            }
        });
}

Configure.prototype.configureUpgradedSchemaPrivate = function () {
    var self = this;

    exports.openSchemaUpgrade(logger.service, tablePrefix,
        function (error, upgrade) {
            if (error != null) {
                self.closePrivate(error);
            }
            else {
                self.upgrade = upgrade;

                self.configureMaintainSchemaPrivate();
            }
        });
}

Configure.prototype.configureInitialSchemaPrivate = function () {
    var self = this;

    /*
        Ensure that at least some schema exists on
        launch - this creates enough schema to
        perform leases, which we need next ...
    */
    writableGroup.maintainSchema(this.conn, tablePrefix,
        require('./dinfra_schema.json'), false,
        function (error, warnings) {
            // can ignore warnings in this phase
            if (error != null) { // neither undefined nor null
                self.closePrivate(error);
            }
            else {
                self.configureUpgradedSchemaPrivate();
            }
        });
}

/**
 * Maintain the legacy application schema.
 */
Configure.prototype.maintainApplicationsPrivate = function () {
    var self = this;

    writableGroup.maintainSchema(this.conn, "",
        require('./applications_schema.json'), true,
        function (error, warnings) {
            // can ignore warnings in this phase
            if (error != null) { // neither undefined nor null
                self.closePrivate(error);
            }
            else {
                self.configureLogsPrivate();
            }
        });
}

Configure.prototype.maintainProfilesPrivate = function () {
    var self = this;

    /**
     * Note this JUST deals with a JSON schema - there is no
     * actual dinfra_schema table entry for it.
     */
    writableGroup.maintainSchema(this.upgrade.connection(),
        tablePrefix + "profile",
        writableGroup.getJSONSchema(), true, // upgrade!!!
        function (error, warnings) {
            for (var i = 0; i < warnings.length; i++) {
                logger.vwarning(warnings[i]);
            }

            if (error != null) {
                self.closePrivate(error);
            }
            else {
                self.maintainApplicationsPrivate();
            }
        });
}

function discoverAddress() {
    var ifaces = os.networkInterfaces();
    var chosen = null;

    for (var ifname in ifaces) {
        var iflist = ifaces[ifname];

        for (var ifindex = 0; ifindex < iflist.length; ifindex++) {
            var iface = iflist[ifindex];

            if ((iface.family != null) && (iface.family != "IPv4"))  {
                // ignore
            }
            else if (iface.internal) {
                // ignore
            }
            else if (chosen == null) {
                chosen = iface; // choose only
            }
            else {
                // for now, just ignore, but log it so we know
                logger.info("multiple candidate address ignored",
                    ifname, chosen);
            }
        }
    }

    var address;

    if (chosen == null) {
        address = "127.0.0.1";
    }
    else {
        address = chosen.address;
    }

    return (address);
}

function configure(aConfig, callback) {
    if (callback === undefined) { // do not match null
        return (Q.nfcall(configure, aConfig)); // shortcut to Q
    }

    config = aConfig;

    if (config.uncaught == true) {
        exports.uncaught(true);
    }

    if (config.origin.cluster == "none") {
        cloud = false;
    }
    else {
        cloud = true;
    }

    if (config.origin.serviceName != null) {
        /*
            We have a default service name -- this usually means we were
            invoked by dcontrol, or something using a generated config.
            In this case, we prepend the service name to the
            default log messages.
        */
        
        logger = dlog.logger(config.origin.serviceName + "/dinfra");
    }

    origin = config.origin.landscape + "/" +
        config.origin.cluster + "/" +
        config.origin.instance;
    address = config.address;

    if (address == null) {
        address = discoverAddress();
    }

    exports.address = address;
    exports.origin = origin;
    exports.landscape = config.origin.landscape;
    exports.cluster = config.origin.cluster;
    exports.instance = config.origin.instance;

    if (config.paths == null) {
        logger.notice("dinfra dconfig.paths is missing: " +
            "may need to update dcontrol, or, if " +
            "a manual configuration, update it for proper operation");
    }

    /**
     * This should contain several paths for use in 
     * determining where things are on the target.
     * Note that these can be specific to a scope or cluster,
     * so don't depend on them being the same for different
     * services.  Typical values:
     * "base" - the location of the target installation (often home)
     * "data" - the location of persistent storage (ccs-cloud-storage)
     * "temp" - the location of temporary storage (ccs-cloud-storage-temp)
     * "defaultCode" - the location of the *default* scope code directory
     * (similar to ~/ccs-cloud or ~/ccs-cloud.local in many installations).
     * These paths should be fully expanded values with a leading slash.
     */
    exports.paths = config.paths;

    /*
        Any of these signals will start the shutdown process,
        with an exit code of 1 to indicate termination.  Typically,
        this will cause the logger to be flushed as the last
        shutdown activity, assuming shutdown completes gracefully.
        The idea behind this is that all log messages get persisted
        to the database/file, if either are present - this is important,
        because log messages are spooled internally in the node process,
        and a straight process.exit will cause those to be lost.
    */
    for (var sig in {
                "SIGHUP": true,
                "SIGINT": true,
                "SIGQUIT": true,
                "SIGABRT": true,
                "SIGTERM": true
            }) {
        process.on(sig, function () {
            exports.shutdown(1);
        });
    }

    var opts = config.databases;

    readOnly = (config["read-only"] == true);

    if (opts != null) {
        var defaults = opts.defaults;
        var primary = opts.primary;
        var secondary = opts.secondary;
        var tertiary = opts.tertiary;
        var warehouse = opts.warehouse;

        landscapeConnector = dschema.newLandscapeConnector(
            opts.defaults, dlog.logger('landscape-storage'));

        exports.addShutdownJob(function () {
                landscapeConnector.close(exports.shutdown);
            });

        // set up writable group as: primary, then secondary.
        writableGroup = landscapeConnector.
            defineGroup(dschema.ACCESS.WRITABLE, defaults);

        if (primary == null) { // either undefined or null
            if (!cloud) {
                primary = {};
            }
            else {
                throw new Error("no primary specified in ", opts);
            }
        }

        writableGroup.addCandidate('primary', primary);

        // set up readable group as: tertiary, primary, then secondary.
        readableGroup = landscapeConnector.
                defineGroup(dschema.ACCESS.READABLE, defaults);

        exports.readableGroupProtected = readableGroup;

        if (tertiary != null) {
            readableGroup.addCandidate('tertiary', tertiary);
        }

        readableGroup.addCandidate('primary', primary);

        if (secondary != null) {
            readableGroup.addCandidate('secondary', secondary);
        }

        // set up warehouse group as: just nearby warehouse db
        warehouseGroup = landscapeConnector.
                defineGroup(dschema.ACCESS.WAREHOUSE, defaults);

        if (warehouse == null) {
            if (!cloud) {
                // ignore
            }
            else {
                throw new Error("no warehouse specified");
            }
        }
        else {
            warehouseGroup.addCandidate('warehouse', warehouse);
        }

        retryManager = writableGroup.newRetryManager(
            logger, dlog.PRIORITY.NOTICE, dlog.PRIORITY.WARNING);

        if (!cloud) {
            // no encrypt manager,
            // no service registration
            // no dlog_query
            exports.registerService = function () {
                    throw new denum.UnsupportedError();
                };
            exports.queryServices = function () {
                    throw new denum.UnsupportedError();
                };
            exports.querySessions = function () {
                    throw new denum.UnsupportedError();
                };
            exports.getServicesCache = function () {
                    throw new denum.UnsupportedError();
                };
            exports.dlog.query = undefined;
        }
        else {
            exports.registerService = require('./dservice').registerService;
            exports.queryServices = require('./dservice').queryServices;
            exports.querySessions = require('./dservice').querySessions;
            exports.getServicesCache = require('./dservice').getServicesCache;

            encryptManager = require('./dencrypt').
                newEncryptManager(logger, writableGroup);

            dlog.query = require('./dlog_query').query;
            dlog.dtail = require('./dlog_query').dtail;
        }

        if (readOnly) {
            // @todo really should be protected?
            exports.writableGroup = null;
        }
        else {
            // @todo really should be protected?
            exports.writableGroup = writableGroup;
        }

        // @todo really should be protected?
        exports.readableGroup = readableGroup;
        // @todo really should be protected?
        exports.warehouseGroup = warehouseGroup;

        var dresource_type;

        if (opts.defaults.type == "mysql") {
            dresource_type = "sql";
        }
        else if (opts.defaults.type == "file") {
            dresource_type = "file";
        }
        else {
            throw new denum.UnsupportedError();
        }

        resourceManager = dresource.newResourceManager(logger,
            exports.writableGroup, readableGroup,
            retryManager,
            encryptManager,
            {
                type: dresource_type,
            });

        exports.hasResourceVersionSupport = resourceManager.supportsVersions;

        new Configure(callback).openPrivate();
    }
    else {
        var dschemaPresent = false;

        try {
            require.resolve("./dschema_mysql");

            dschemaPresent = true;
        }
        catch (e) {
            // always OK
        }

        if (dschemaPresent) {
            log.warning("database support available, " +
                "but no database configured");
        }

        dlog.configure(logger, config.logging, origin, null,
                    null, null, function (error) {
                exports.addShutdownJob(function() {
                        dlog.flush(0, function() {
                                exports.shutdown();
                            });
                    });

                if (callback != null) {
                    callback(error);
                }
            });
    }
}


/**
 * Configures dinfra from the landscape infrastructure JSON file.
 * This file should be used only for configuring the infrastructure:
 * applications are configured separately by the deployment, since
 * they may differ for different release versions or multivariate
 * option sets.  Call configure(config, callback).  If the configuration
 * is successful, then it will have initialized its schema, started
 * database logging and flushed all pending log messages.  Then it will
 * call callback(error) in the usual way.
 */
exports.configure = configure;
/**
 * Opens a writable connection and notifies of it via the callback.
 * This returns undefined.  The resulting connection must be
 * closed with close(callable) to return it to the pool.  Writable
 * connections are by default in REPEATABLE_READ transaction isolation
 * mode, but are set up to autocommit (see openWritableTX below).
 */
exports.openWritableDB = function (callback) {
        if (readOnly) {
            throw new Error("illegal state - read only config");
        }

        return (writableGroup.openConnection(callback));
    };

/**
 * This should not be called from regular code - it destroys entire
 * databases.  Primarily used in development and testing.
 * tablePrefix - use '' for all tables, or just destroy some subset
 * files - list of files to load
 * callback(error, tables[], files[]) - called with tables found/destroyed
 * and files loaded.
 */
exports.resetDB = function (tablePrefix, files, callback) {
        var events = new EventEmitter();

        if (callback) {
            var tables = [];

            events.on('error', callback).
                on('table', function (table) { tables.push(table); }).
                on('file', function (file) { tables.push(file); }).
                on('end', function () { callback(null, tables, files); });
        }

        writableGroup.openConnection(function (error, conn) {
                if (error != null) {
                    events.emit('error', error);
                }
                else {
                    function perFile(conn, index) {
                        if ((files == null) || (index == files.length)) {
                            conn.close(function (error) {
                                    if (error != null) {
                                        events.emit('error', error);
                                    }
                                    else {
                                        events.emit('end');
                                    }
                                });
                        }
                        else {
                            throw new Error();
                        }
                    }

                    writableGroup.destroySchema(conn, tablePrefix,
                                function (error, tables) {
                            if (error != null) {
                                events.emit('error', error);

                                conn.close(function (error) {
                                        if (error != null) {
                                            events.emit('error', error);
                                        }
                                    });
                            }
                            else {
                                tables.forEach(function (table) {
                                        events.emit('table', table);
                                    });

                                perFile(conn, 0);
                            }
                        });
                }
            });

        return (events);
    };

/**
 * This should not be called from regular code - it destroys entire
 * databases.  Primarily used in development and testing.
 * tablePrefix - use '' for all tables, or just destroy some subset
 * callback(error, tables[]) - called with tables found/destroyed
 */
exports.destroyDB = function (tablePrefix, callback) {
    return (exports.resetDB(tablePrefix, null, callback));
}

/**
 * Opens a connection, like openWritableDB, except that it is
 * already set up with a transaction started.  The transaction
 * is committed when you call close(callback) and the callback(error)
 * to close will let you know if the transaction was successfully committed
 * or rolled back.  In order to ensure that the transaction rolls back on
 * close rather than commits, call cancel() (no args) on the connection,
 * then call close as usual.  Cancel can be called at any time prior to close.
 * These transactions are performed in REPEATABLE_READ transaction isolation
 * level, which means that any readers accessed with openReadableDB,
 * will see only full commits. 
 */
exports.openWritableTX = function (callback) {
        if (writableGroup == null) {
            throw new Error("illegal state - no writable group configured");
        }

        return (writableGroup.openTransaction(callback));
    };
/**
 * Opens a readable connection and notifies of it via the callback.
 * This returns undefined.  The resulting connection must be
 * closed with close() to return it to the pool.  Readable connections
 * may return data that is a little older than writable
 * connections (seconds).  Readable connections are otherwise
 * configured similarly to writable connections and connect to the
 * same database, albeit at a weaker transaction isolation level.
 */
exports.openReadableDB = function (callback) {
        return (readableGroup.openConnection(callback));
    };
/**
 * Opens a readable connection and notifies of it via the callback.
 * This is similar to a regular readable DB connection, except that
 * is transactional.  This is used in those cases where you query
 * a result set incrementally, or with several selects, and yet want
 * a cohesive view of the data.  The transaction is released on close.
 */
exports.openReadableTX = function (callback) {
        return (readableGroup.openTransaction(callback));
    };
/**
 * Opens a warehouse connection and notifies of it via the callback.
 * This returns undefined.  The resulting connection must be
 * closed with close() to return it to the pool.  Warehouse connections
 * may return data that is a lot older than writable or readable
 * connections (minutes) and typically connect to seperate database
 * isntances/schemas, with very weak, or no transaction isolation.
 */
exports.openWarehouseDB = function (callback) {
        return (warehouseGroup.openConnection(callback));
    };
/**
 * openLease(service, resource, refresh, callback)
 *
 * Acquire a lease on some resource, outside of a transaction.
 * Service is the local name of the component making the
 * request, resource is the resource in question (a URL path),
 * and refresh (optional) specifies the refresh time of the lease
 * in milliseconds.  The lease is returned by callback(error, lease).
 * The lease is not properly started until lease.register(callback) is
 * called, which will periodically call callback(error, lease) to
 * ensure that the lease is still valid.  The callback should then call
 * lease.acknowledge() to register its continuing interest, unless
 * error is set.  If error is set, it usually means that the lease
 * has been forcibly broken and operations should cease.  Always call
 * lease.close(callback) when done with a lease.  Callback is optional
 * on close, but will be called callback(error) when the lease is
 * closed.  Error can occur in this case only when the lease was broken
 * in the interim, or the infrastructure cannot connect to the database.
 */
exports.openLease = function (service, resource, refresh, callback) {
        if (refresh instanceof Function) {
            callback = refresh;
            refresh = undefined;
        }

        if (callback === undefined) {
            return (Q.nfcall(exports.openLease, service, resource,
                    refresh));
        }

        if (!(callback instanceof Function)) {
            throw new Error("illegal argument, need callback function");
        }

        var Lease = require('./dlease').Lease;
        var lease = new Lease(writableGroup,
            exports.logger(service), origin, resource, refresh, callback);

        lease.openPrivate();

        return (undefined);
    };
/**
 * openSchemaUpgrade(service, tablePrefix, callback)
 *
 * Acquires a lease on /schema/ + tablePrefix and allocates a separate
 * writable connection for operating on table schemas relating to that
 * prefix.  callback(error, upgrade) is called to return a SchemaUpgrade
 * object.  The main three methods on that are:
 * connection() returns the connection (no callback required).
 * version() returns the current stored version of the base schema if any.
 * upgrade(infix, schema, callback) calls dschema.maintain() to upgrade
 * the given schema against the tables tablePrefix + infix.  callback(error)
 * is called when upgrade() completes.  upgrade() also updates the 
 * recorded version of the specific infix subschema and records what
 * version it is being upgraded to.  @todo cleanup these version functions.
 */
exports.openSchemaUpgrade = function (service, tablePrefix, callback) {
        if (callback === undefined) {
            return (Q.nfcall(exports.openSchemaUpgrade, service, tablePrefix));
        }

        if (cloud) {
            // get lease first, then build upgrade 
            exports.openLease(service, "/schema/" + tablePrefix, 
                function (error, lease) {
                    if (error != null) {
                        callback(error);
                    }
                    else {
                        new dschema.SchemaUpgrade(writableGroup, lease,
                            service, tablePrefix, callback).
                            openConnPrivate();
                    }
                });
        }
        else {
            // don't need a lease when there is no cloud
            new dschema.SchemaUpgrade(writableGroup, null,
                service, tablePrefix, callback).openConnPrivate();
        }

        return (undefined);
    };
/**
 * This just provides access to the same database logging implementation
 * that dinfra was launched with: this is useful for capturing logs
 * as they occur.
 */
exports.dlog = dlog;
/**
 * Again, just a helpful reference to prevent additional configuration
 * annoyances.
 */
exports.djson = djson;
/**
 * This links to some internal convenience functions that we expose
 * for testing purposes.  Probably best not to use these as a consumer
 * of the API at this stage.
 */
exports.denum = denum;
/**
 * This links to some internal convenience functions that we expose
 * for testing purposes.  Probably best not to use these as a consumer
 * of the API at this stage.
 */
exports.dsearch = require('./dsearch');
/**
 * Returns the logger for the specific named service.  Generally, a
 * logger is used simply as: logger.<level>(<arg>...)
 * where <level> is one of emerg, alert, critical, error, warning,
 * notice, info, debug, fine, finer and finest.  Arguments can
 * be anything that can be passed to JSON.stringify() safely, but
 * also includes special support for Error, so that stacks and
 * frames are carefully recorded in a searchable way.  Logger
 * can be used at any time, even before dinfra has been
 * configured.
 */
exports.logger = function (service, facility) {
        if (service == null) {
            if ((config != null) && (config.origin != null) &&
                    (config.origin.serviceName != null)) {
                service = dconfig.origin.serviceName;
            }
            else {
                throw new RangeError("logger service must be specified");
            }
        }

        return (dlog.logger(service, facility));
    };

/**
 * A shutdown job is called in reverse order of registration when
 * shutdown is called.  Each job needs call shutdown() (with no args) 
 * at the end of its shutdown exercise.  The job function is returned
 * by this to use a handle for any removeShutdownJob().
 */
exports.addShutdownJob = function (job) {
        shutdownJobs.push(job);

        return (job);
    };

/**
 * A shutdown job can be removed after it has been registered.  If
 * a job is registered multiple times, the most recent registration
 * will be removed.  Note that removeShutdownJob() does not need
 * to be called during regular shutdown.  A job will be removed before
 * it is invoked.
 */
exports.removeShutdownJob = function (job) {
        var index = shutdownJobs.lastIndexOf(job);

        if (index >= 0) {
            shutdownJobs.splice(index, 1);
        }

        return (job);
    };

/**
 * Opens a resource by name using the given options.
 *
 * opts {
 *     version: "1.23.5", // to address a specific version (if versioned)
 *     latest: true, // to address the latest version (if versioned)
 *     writable: true, // to open for writing, not just reading
 *     termination: true, // allow opening branch terminations
 *     connection: conn, // use connection, do not transact internally
 *     connection: true, // alloc connection, perform single transaction
 *     create: true, // to create this resource if it is not there
 *     terminate|delete: true, // delete this resource (or terminate a branch)
 *     link: target, // to link to a target by name (need not exist)
 *     encrypt: true, // encrypt this resource (if this is a create)
 *     branch: "1.23", // to branch from a specific version when creating
 *     sparse: rid, // a sparse version based on an internal target id 
 *     nominal: true, // create an immutable new version with old content
 *     meta: { }, // any meta data to provide with the initial create
 *     search: Analyzer.State, // free-text search support for the create
 * }
 */
exports.openResource = function (name, opts, callback) {
        if (callback === undefined) {
            return (Q.nfcall(exports.openResource, name, opts));
        }

        if (opts == null) {
            opts = { };
        }

        var dirHint;

        if ((name.length > 0) &&
                (name.lastIndexOf("/") == (name.length - 1))) {
            name = name.substr(0, name.length - 1);
            dirHint = true;
        }
        else {
            dirHint = false;
        }

        var meta = opts.meta;

        // now make a copy of the options, since we're going to
        // alter it for our own purposes:
        opts = {
                version: opts.version,
                latest: opts.latest,
                writable: opts.writable,
                executable: opts.executable,
                termination: opts.termination,
                connection: opts.connection,
                link: opts.link,
                type: opts.type,
                create: opts.create,
                delete: (opts.delete || opts.terminate),
                encrypt: opts.encrypt,
                branch: opts.branch,
                sparse: opts.sparse,
                nominal: opts.nominal,
                dependent: opts.dependent, // not retryable - used internally
                search: opts.search, // for search support
                meta: { } // an empty meta, since we deal with this differently
            };

        if (opts.version == null) { // either undefined or null
            if (opts.latest == null) { // either undefined or null
                opts.latest = true;
                opts.version = null;
            }
            else if (opts.latest) {
                opts.version = null;
            }
            else {
                throw new Error("no version supplied and not latest");
            }
        }
        else {
            if (opts.latest == null) { // either undefined or null
                opts.latest = false;
            }
            else if (!opts.latest) {
                // all is well
            }
            else {
                throw new Error("latest and version both supplied");
            }
        }

        if (opts.create == null) { // either undefined or null
            if (opts.link != null) {
                opts.create = true; // link is an emplicit create
            }
            else if (opts.nominal) {
                opts.create = true; // nominal is an implicit create
            }
            else if (opts.delete) {
                opts.create = true; // logical delete is an implicit create
            }
            else {
                opts.create = false; // otherwise we're not creating
            }
        }

        if (opts.writable == null) { // either undefined or null
            opts.writable = opts.create; // copy from create state
        }

        if (opts.create) {
            if (!opts.writable) {
                throw new Error("create provided with non-writable");
            }
            else if (opts.type == dresource.RTYPE.LINK) {
                if (opts.link == null) {
                    throw new Error("link type with no link value");
                }
            }
            else if (opts.type != null) {
                // assume its OK if it gets this far
            }
            else if (opts.link) {
                opts.type = dresource.RTYPE.LINK;
            }
            else if (dirHint) {
                opts.type = dresource.RTYPE.DIR;
            }
            else {
                opts.type = dresource.RTYPE.FILE;
            }

            if (opts.type == dresource.RTYPE.LINK) {
                opts.meta.link = opts.link;

                if (opts.sparse) {
                    throw new Error("sparse provided with link");
                }

                if (opts.nominal) {
                    throw new Error("nominal provided with link");
                }

                // do not provide content-type
            }
            else if (opts.type == dresource.RTYPE.FILE) {
                if (opts.sparse) {
                    if (opts.nominal) {
                        throw new Error("sparse + nominal not supported");
                    }
                }
                else if (opts.nominal) {
                    // any other checks?
                }
                else {
                    // any other checks?
                }

                if (opts.meta == null) {
                    opts.meta = { };
                }

                if (opts.meta.headers == null) {
                    opts.meta.headers = { };
                }

                /* we used to to do this, but don't anymore:

                if (opts.meta.headers["content-type"] == null) {
                    // provide a default MIME content type
                    opts.meta.headers["content-type"] =
                        "application/octet-stream";
                }
                */
            }
            else if (opts.type == dresource.RTYPE.DIR) {
                if (opts.sparse) {
                    throw new Error("sparse + dir not supported");
                }

                if (opts.nominal) {
                    throw new Error("nominal + dir not supported");
                }

                // do not provide content-type
            }
            else {
                dresource.RTYPE.ensureValid(opts.type);
            }
        }
        else if (opts.type != null) {
            throw new Error("type provided with non-create opts");
        }
        else if (meta != null) {
            throw new Error("meta provided with non-create opts");
        }
        else {
            // presumeably OK options for a plain open
        }

        if (meta != null) {
            /*
                Don't worry about doing too deep a copy,
                just shallow copy the top level, since that's
                all we'll modify.

                This is technically just an overwrite of our
                calculated results, which is why it comes at the end.
            */

            for (var key in meta) {
                opts.meta[key] = meta[key];
            }
        }

        if (opts.search != null) {
            opts.meta.search = opts.search.asSearchJSONProtected();
        }

        if (resourceManager == null) {
            throw new Error("no resource manager defined: " +
                "you may need to wait for dinfra configure to complete");
        }

        resourceManager.openResource(name, opts, function (error, resource) {
                callback(error, resource);
            });

        return (undefined);
    };

exports.destroyResource = function (name, version, callback) {
        if (callback === undefined) {
            return (Q.nfcall(exports.destroyResource, name, version));
        }

        if (callback === null) {
            callback = function (error) {
                    if (error != null) {
                        logger.error("destroyResource failed", error);
                    }
                    else {
                        // do nothing
                    }
                };
        }

        var filter = null;
        var openOpts = {
                writable: true, // need a writable connection
                create: false, // do not create if it doesn't exist
                termination: true, // open terminations here as well
                connection: true, // allocate a single connection
            };

        if (version instanceof Function) {
            filter = version; // filter function is version
            version = null; // clear version, since its not real
            openOpts.latest = true; // choose latest, then filter
        }
        else {
            openOpts.version = version; // OK if null - choose specific/latest
        }

        exports.openResource(name, openOpts,
            function (error, resource) {
                if (error != null) {
                    callback(error);
                }
                else if (resource == null) {
                    // no such resource
                    callback(null, null);
                }
                else {
                    var versions = [];

                    resource.destroyOnClose = [];

                    if (filter == null) {
                        versions.push(resource.version);
                        resource.destroyOnClose.push(resource.id);
                    }
                    else {
                        for (var rversion in resource.versions) {
                            var record = resource.versions[rversion];

                            if (filter(record.id, resource.name,
                                    rversion)) {
                                versions.push(rversion);
                                resource.destroyOnClose.push(record.id);
                            }
                        }
                    }

                    resource.close(function (error) {
                            callback(error, versions);
                        });
                }
            });
    };

exports.writeResourceArchiveTo = function (writable, pathPrefix, opts) {
        return (resourceManager.
            writeArchiveTo(writable, pathPrefix, opts));
    };

/**
 * This can be used to direct the results of a resource query to an
 * archive of some sort.  Currently supported archives are only the
 * the content-free, meta-data-only json.gz for the non-db-based desktop
 * resource layer, with these options: { format: "file", content: false }.
 */
exports.createResourceArchiveQueryHandler = function (writable, opts) {
        return (resourceManager.
            createArchiveQueryHandler(writable, opts));
    };

/**
 * Exit immediately with a code and a console message.
 */
exports.exit = function (exitCode, reason) {
        if (reason != null) {
            console.log("exit:", exitCode, "reason:", reason);
        }

        process.exit(exitCode);
    };

/**
 * Shut the process down gracefully.  Because of the calling parameters,
 * dinfra.shutdown can be used without wrapping in many situations,
 * since if it is called with an error as the first parameter, it
 * will automatically log the error and begin the shutdown sequence.
 * Similarly, it can be easily used as an 'end' handler, if the end
 * event expects no arguments, or the first parameter is null in the case
 * of no error.
 *
 * @param anExitCode - (optional) 0 for normal, 1 for failure.
 * @param message... - (optional) log message; assume failure without anExitCode
 */
exports.shutdown = function () {
    var anExitCode = arguments[0];
    var argFrom = 0;

    if (arguments.length == 0) {
        anExitCode = 0;
    }
    else if (anExitCode == null) {
        anExitCode = 0;
        argFrom = 1;
    }
    else if (typeof(anExitCode) != "number") {
        anExitCode = 1;
    }
    else {
        argFrom = 1;
    }

    if (argFrom < arguments.length) {
        var args = ["shutdown"];

        while (argFrom < arguments.length) {
            args.push(arguments[argFrom++]);
        }

        if (anExitCode == 0) {
            logger.notice.apply(logger, args);
        }
        else {
            logger.critical.apply(logger, args);
        }
    }

    if (anExitCode > shutdownExitCode) {
        shutdownExitCode = anExitCode;
    }

    if (shutdownJobs.length > 0) {
        // trim the last job added and then invoke it
        var job = shutdownJobs.splice(shutdownJobs.length - 1, 1)[0];

        try {
            job();
        }
        catch (e) {
            logger.error("during shutdown", e);
            exports.shutdown(1);
        }
    }
    else {
        exports.exit(shutdownExitCode, null);
    }
}

/**
 * legacy configuration uses the nominated location of the
 * ccs_cloud/_environment/config dir for bootstrapping database. 
 */
exports.configureLegacy = function (legacyConfigPrefix, legacyLandscape,
            callback) {
        if (callback === undefined) {
            return (Q.nfcall(exports.configureLegacy, legacyConfigPrefix,
                    legacyLandscape));
        }

        var legacyObfusc = require("./legacy-obfusc.json");

        if (legacyLandscape == null) { // either undefined or null
            legacyLandscape = process.env.SITE_NAME;

            if (legacyLandscape == "") {
                legacyLandscape = null;
            }

            if (legacyLandscape == null) { // either undefined or null
                throw new Error("either pass the legacy landscape name or " +
                    "set the SITE_NAME environment variable");
            }

            if (legacyLandscape == "default") {
                throw new Error("to avoid accidentally writing to M0, " +
                    "default is not allowed as a landscape name");
            }
        }

        var legacyConfigPath = legacyConfigPrefix + legacyLandscape + ".json";
        var legacyConfig;

        try {
            require.resolve(legacyConfigPath);
        }
        catch (error) {
            legacyConfigPath = legacyConfigPrefix + "default.json";
        }

        legacyConfig = require(legacyConfigPath);

        if (legacyConfig.database == null) { // either undefined or null
            // do that again, but use default and issue loud and clear warning
            legacyConfig = require(legacyConfigPrefix + "default.json");

            logger.warning("legacy configuration points to M0 database");
        }

        var decipher = function (text, fallback) {
                var result = "";

                if (text == null) {
                    result = fallback;
                }
                else {
                    var cipher = crypto.createDecipher(legacyObfusc.alg,
                        legacyObfusc.key);

                    result += cipher.update(text, legacyObfusc.encoding,
                        legacyObfusc.charset);

                    result += cipher.final(legacyObfusc.charset);
                }

                return (result);
            };
        var osHost = os.hostname();
        var osUser = process.env.USER;
        var legacyDBHost = decipher(legacyConfig.database.host, osHost);
        /*
            Generate the infrastructure configuration from the
            legacy database config, the landscape name and some
            execution environment.
        */
        var config = {
                "origin": {
                    "landscape": legacyLandscape,
                    "cluster": "legacy",
                    "instance": osHost
                },
                "databases": {
                    "defaults": {
                        "type": "mysql",
                        "user": decipher(legacyConfig.database.user,
                            osUser),
                        "password": decipher(legacyConfig.database.password,
                            "password"),
                        "database": decipher(legacyConfig.database.database,
                            "ticloudtools"),
                    },
                    "primary": {
                        "host": legacyDBHost
                    },
                    "secondary": {
                        "host": legacyDBHost
                    },
                    "tertiary": {
                        "host": legacyDBHost
                    },
                    "warehouse": {
                        "host": legacyDBHost
                    }
                }
            };

        function hint(text) {
            var i = 0;
            var l = text.length;
            var r = "";

            while (i < l) {
                if ((i == 0) || (i == l - 1)) {
                    r += text[i];
                }
                else {
                    r += "*";
                }

                i++;
            }

            return (r);
        }

        var moduleName = require.main.filename;
        var workingPath = process.cwd();

        if (moduleName.indexOf(workingPath + "/") == 0) {
            moduleName = moduleName.substr(workingPath.length + 1);
        }

        logger.info("legacy infrastructure",
            {
                directory: workingPath,
                module: moduleName,
                database: {
                    user: config.databases.defaults.user,
                    host: config.databases.primary.host,
                    "password-hint": hint(config.databases.defaults.password),
                    database: config.databases.defaults.database,
                },
            });
                
        configure(config, callback);
    };

/**
 * Generates a legacy configuration stub for use in
 * dinfra testing only - not intended for users.
 */
exports.generateLegacy = function (aConfig) {
        if (aConfig == null) {
            aConfig = config;
        }

        var legacyObfusc = require("./legacy-obfusc.json");

        var encipher = function (text, fallback) {
                var result = "";

                if (text == null) {
                    text = fallback;
                }

                var cipher = crypto.createCipher(legacyObfusc.alg,
                    legacyObfusc.key);

                result += cipher.update(text, legacyObfusc.charset,
                    legacyObfusc.encoding);

                result += cipher.final(legacyObfusc.encoding);

                return (result);
            };
        var osHost = os.hostname();
        var osUser = process.env.USER;

        return ({
                "database": {
                    user: encipher(aConfig.databases.defaults.user, osUser),
                    password: encipher(aConfig.databases.defaults.password,
                        "password"),
                    database: encipher(aConfig.databases.defaults.database,
                        "ticloudtools"),
                    host: encipher(aConfig.databases.primary.host,
                        osHost)
                },
            });
    };

function StatusCheck(responder, name, callback) {
    this.responder = responder;
    this.name = name;
    this.responder.checks.push(this);
    this.callback = callback;
}

StatusCheck.prototype.invokeCheck = function (cached) {
    var self = this;

    this.callback(function (error, json) {
            cached.completeCheck(self, json, error);
        });
}

function StatusCached(responder) {
    this.created = Date.now();
    this.expires = this.created + responder.cacheMS;
    this.json = {
            name: responder.name,
            version: responder.version,
            launched: {
                ms: responder.started,
                date: new Date(responder.started).toISOString()
            },
            generation: {
                ms: this.created,
                date: new Date(this.created).toISOString(),
                delay: null,
            },
            requested: {
                ms: null,
                date: null,
            },
            expires: {
                ms: this.expires,
                date: new Date(this.expires).toISOString(),
            },
            errors: [],
            checks: {}
        };
    this.responder = responder;
    this.waiters = [];
    this.checks = [];
    this.ready = false;

    // shallow clone of checks array
    for (var i = 0; i < responder.checks.length; i++) {
        this.checks.push(responder.checks[i]);
    }
}

StatusCached.prototype.completeCheck = function (check, json, error) {
    var i = this.checks.indexOf(check);

    if (i < 0) {
        var name;

        if (check == null) {
            name = "(undefined)";
        }
        else {
            name = check.name;
        }

        var message;

        if (this.responder.checks.indexOf(check) >= 0) {
            message = "implementation mistake: duplicate check response";
        }
        else {
            message = "implementation mistake: unknown check object";
        }

        this.json.errors.push({
                name: name,
                message: message,
                error: error
            });
    }
    else {
        this.checks.splice(i, 1);
        this.json.checks[check.name] = {
                status: (error != null ? "error" : "stable"),
                content: json,
            };

        if (error != null) { // record separately to error list
            this.json.errors.push({
                    name: check.name,
                    message: "check reported a failure",
                    error: error
                });
        }

        if (this.checks.length == 0) {
            this.ready = true;
            this.json.generation.delay = Date.now() - this.created;
            this.notifyWaiters();
        }
    }
}

StatusCached.prototype.startCheck = function (check) {
    var self = this;

    setImmediate(function () {
            try {
                check.invokeCheck(self);
            }
            catch (e) {
                self.completeCheck(check, null, e);
            }
        });
}

StatusCached.prototype.fillCached = function () {
    for (var i = 0; i < this.checks.length; i++) {
        this.startCheck(this.checks[i]);
    }
}

StatusCached.prototype.notifyWaiters = function () {
    // this is written intentionally to be re-entrant - important
    while (this.waiters.length > 0) {
        this.waiters.splice(0, 1)[0](this);
    }
}

StatusCached.prototype.waitCached = function (waiter) {
    this.waiters.push(waiter);

    if (this.ready) {
        this.notifyWaiters();
    }
}

/**
 * Base class for HTTP-based service adapters.
 */
function ServiceAdapter() {
    this.servers = [];
    /**
     * This tells us where to find support files, such
     * as status.css and so forth: these are needed for
     * consistent branding and presentation.  By default
     * we just use the status responder in its standard
     * location for now and assume that it is at the top-level.
     */
    this.supportLocation = "/status/";
}

ServiceAdapter.prototype.handle = function (request, response, prefix, path) {
    throw new Error("unimplemented handle method: " + path);
}

ServiceAdapter.prototype.getSupportRelative = function (request, path) {
    var result;

    result = npath.join(npath.relative(request.realUrl,
        this.supportLocation), path);

    return (result);
}

ServiceAdapter.prototype.sendHeadElements = function (request, writer, title) {
    writer.
        sendElement("title", {}, title).
        sendUnclosedElement("link", {
            type: "text/css",
            rel: "stylesheet",
            href: this.getSupportRelative(request, "status.css") });
}

ServiceAdapter.prototype.sendBannerElements = function (request, writer,
        title) {
    writer.
        sendElement("div", { class: 'banner' },
            "Texas Instruments").
        sendElement("h1", { class: 'summary' }, title);
}

ServiceAdapter.prototype.sendStandardStart = function (request, writer,
        title) {
    writer.beginElement("html").
        beginElement("head");

    this.sendHeadElements(request, writer, title);

    writer.
        endElement().
        beginElement("body");

    this.sendBannerElements(request, writer, title);
}

ServiceAdapter.prototype.sendStandardFinish = function (request, writer) {
    writer.
            endElement("body").
        endElement("html");
}

ServiceAdapter.prototype.sendRedirect = function (request, response, path,
        code, url) {
    if (code == null) {
        code = 302;
    }

    response.statusCode = code;

    response.statusMessage = "redirecting";

    response.setHeader("Content-Type", "text/html; charset=UTF-8");
    response.setHeader("Location", url);

    try {
        var writer = new dhtml.HTMLWriter(response);
        var title = "Redirect " + code;

        this.sendStandardStart(request, writer, title);

        writer.
            beginElement("div", { class: 'content summary' }).
                sendElement("div", { class: 'path' }, path).
                sendElement("div", { class: 'url' }, url).
            endElement("div");

        this.sendStandardFinish(request, writer);
    }
    catch (e) {
        logger.warning("status responder", {
                message: "during redirect handler",
                path: path,
                error: e
            });
    }
    finally {
        response.end();
    }
}

ServiceAdapter.prototype.sendError = function (request, response, path,
        code, message) {
    if (code == null) {
        code = 500;
    }

    response.statusCode = code;

    if (message != null) {
        response.statusMessage = "unsupported mode";
    }

    response.setHeader("Content-Type", "text/html; charset=UTF-8");

    if (code - code % 100 == 500) {
        logger.warning(message, {
                code: code,
                request: "" + request.url,
                "status-path": path,
            });
    }

    try {
        var writer = new dhtml.HTMLWriter(response);
        var title = "Error " + code;

        this.sendStandardStart(request, writer, title);

        writer.
                beginElement("div", { class: 'content summary' }).
                    sendElement("div", { class: 'path' }, path).
                    sendElement("div", { class: 'message' }, message).
                    sendElement("div", { class: 'application' }, this.name).
                    sendElement("div", { class: 'version' }, this.version).
                endElement("div");

        this.sendStandardFinish(request, writer);
    }
    catch (e) {
        logger.warning("service adapter", {
                message: "during error handler",
                path: path,
                error: e
            });
    }
    finally {
        response.end();
    }
}

ServiceAdapter.prototype.withExpressHandler = function (app, path) {
    var self = this;

    app.use(path, function (request, response, next) {
            var rPath;

            if ((request.originalUrl != null) &&
                    (request.baseUrl != null)) {
                rPath = request.originalUrl.substring(request.baseUrl.length);
                request.realUrl = request.originalUrl;
            }
            else {
                rPath = request.url; // old express 3 - hope it works.
                request.realUrl = path + request.url;
            }

            if (rPath == "") {
                // pathological Express case
                var stepUp = request.originalUrl + "/";
                self.sendRedirect(request, response, rPath, 302, stepUp);
            }
            else if (rPath.indexOf("/") == 0) {
                // we expect it to always begin with a leading slash
                rPath = rPath.substring(1);

                self.handle(request, response, path, rPath);
            }
            else {
                self.sendError(request, response, rPath, 404,
                    "unknown resource");
            }
        });

    return (this);
}

ServiceAdapter.prototype.withServerListener = function (httpServer, path) {
    httpServer.on('request', this.returnServiceHandler(httpServer, path));

    return (this);
}

ServiceAdapter.prototype.returnServiceHandler = function (httpServer, path) {
    var self = this;

    this.servers.push(httpServer);

    return (function (request, response) {
            var urlPath = url.parse(request.url).path;

            request.realUrl = request.url;

            if (urlPath.indexOf(path) == 0) {
                self.handle(request, response, path,
                    urlPath.substring(path.length));
            }
        });
}

/**
 * Strip all segment parameters from each path segment in the path,
 * and store them in params (must be an Object).
 */
ServiceAdapter.prototype.stripParamsPath = function (path, params) {
    var i;

    while ((i = path.indexOf(";")) >= 0) {
        var t = path.indexOf("/", i);
        var n = path.indexOf(";", i + 1);

        if (t < i) {
            if (n < i) {
                n = path.length;
            }
            else {
                // n is valid
            }
        }
        else if (n < i) {
            n = t;
        }
        else if (t < n) {
            n = t;
        }
        else {
            // n is valid
        }

        if (params != null) {
            var param = path.substring(i + 1, n);

            t = param.indexOf("=");

            if (t < 0) {
                value = true;
            }
            else {
                value = param.substring(t + 1);
                param = param.substring(0, t);
            }

            params[param] = value;
        }

        path = path.substring(0, i) + path.substring(n);
    }

    return (path);
}

exports.ServiceAdapter = ServiceAdapter;

util.inherits(StatusResponder, ServiceAdapter);

function StatusResponder(name, version) {
    ServiceAdapter.call(this);

    this.name = name;
    this.version = version;
    this.checks = [];
    this.lastServer = null;
    this.cached = null;
    this.cacheMS = 10e3;
    this.started = Date.now();
    this.statuses = 0;
    this.requests = 0;
    this.hasLogsView = false;
}

function LogResponse(requested, mode, path, request, response, error, logs) {
    this.requested = requested;
    this.mode = mode;
    this.path = path
    this.request = request;
    this.response = response;
    this.index = 0;
    this.inbandError = error;
    this.logs = logs;
    this.writer = null;
    this.context = null;
    this.synthMap = {};
    this.synthArray = [];

    var self = this;

    this.response.setHeader("Content-Type", "application/json");
    /*
        @todo conditional support here for json stringification -
        do not want to serialize stack frames to non-admin users.
    */
    this.writer = new djson.Streamer(this.response, null, {
            strict: true, // no undefineds
            indent: 4 // in case someone wants to look at it
        });
    this.context = this.writer.beginMap(null, this.synthMap);
    this.writer.sendNamedValue(this.context, "error", this.inbandError, false);
    this.writer.sendNamedValue(this.context, "catalog", {
                priority: dlog.PRIORITY.list,
                facility: dlog.FACILITY.list
            }, false);
    this.writer.beginNamed(null, "logs", this.synthArray);
    this.writer.beginList(null, this.synthArray);

    self.writeBatch();
}

LogResponse.prototype.writeBatch = function () {
    var self = this;
    var limit = Math.min(this.index + 256, this.logs.length);

    while (this.index < limit) {
        this.writer.sendValue(null, this.logs[this.index],
            (this.index == this.logs.length)); // is last

        this.index++;
    }

    if (this.index == this.logs.length) {
        this.writer.endList(this.context, this.synthArray, true);
        this.writer.endNamed(this.context, this.synthArray, true);
        this.writer.endMap(null, this.synthMap);
        this.writer.flush(function (error) {
                self.close(error);
            });
    }
    else {
        this.writer.flush(function (error) {
                if (error != null) {
                    self.close(error);
                }
                else {
                    self.writeBatch();
                }
            });
    }
}

LogResponse.prototype.close = function (error) {
    if (error != null) {
        logger.warning("status responder", {
                error: error,
            });
    }

    this.response.end(); // no wait, we're done
}

StatusResponder.prototype.queryLogs = function (requested, mode, path,
        request, response, buffer) {
    var self = this;
    var params;
    var logs = [];

    if (buffer == null) {
        params = { last: 12 };
    }
    else {
        params = JSON.parse(buffer.toString("UTF-8"));
    }

    var query = exports.dlog.query();

    if (params.last != null) {
        query.withLast(1 * params.last);
    }

    if (params.from != null) {
        query.withFromTime(1 * params.from);
    }

    if (params.priorityLimit != null) {
        query.withPriorityLimit(1 * params.priorityLimit);
    }

    if (params.originPattern != null) {
        query.withOrigin(new RegExp(params.originPattern));
    }

    if (params.servicePattern != null) {
        query.withService(new RegExp(params.servicePattern));
    }

    query.invoke(function (error, message) {
            if (error != null) {
                // @todo audit - these might not be right
                console.log(error);
                process.exit(1);
            }

            var last = false;

            if ((error != null) || (message == null)) {
                last = true;

                new LogResponse(request, mode, path, request, response,
                    error, logs);
            }
            else {
                logs.push(message);
            }

            return (last);
        });
}

StatusResponder.prototype.handle = function (request, response, prefix, path) {
    response.on('error', function (error) {
            logger.warning("status responder", {
                    message: "during response handler",
                    path: path,
                    error: error,
                });
        });

    var requested = Date.now();
    var path;
    var mode;
    var page;

    if ((path == "") || (path == "index.html")) {
        mode = "html";
        page = "index";
    }
    else if (path == "index.json") {
        mode = "json";
        page = "index";
    }
    else if (this.hasLogsView && (path == "logs.json")) {
        mode = "json";
        page = "logs";
    }
    else {
        mode = null;
        page = null;
    }

    if (page == "index") {
        if ((this.cached == null) || (this.cached.expires < requested)) {
            this.cached = new StatusCached(this);
            this.statuses++;
            this.cached.fillCached();
        }

        var self = this;

        this.cached.waitCached(function (cached) {
                self.respond(requested, mode, path, request, response, cached);
            });
    }
    else if (page == "logs") {
        if ((mode == "json") && (request.method == "POST")) {
            var self = this;
            var buffer = new Buffer(0);

            request.on("error", function (error) {
                    self.sendError(request, response, path, 500,
                        "request IO error");
                }).
                on("data", function (chunk) {
                    buffer = Buffer.concat([buffer, chunk]);
                }).
                on("end", function (chunk) {
                    if (chunk != null) {
                        buffer = Buffer.concat([buffer, chunk]);
                    }

                    self.queryLogs(requested, mode, path, request, response,
                        buffer);
                });
        }
        else if (mode == "json") {
            this.queryLogs(requested, mode, path, request, response);
        }
        else {
            this.queryLogs(requested, mode, path, request, response);
        }
    }
    else if (page != null) {
        this.sendError(request, response, path, 404, "no such resource");
    }
    else {
        if (path.indexOf(".css") == path.length - 4) {
            response.setHeader("Content-Type", "text/css; charset=UTF-8");
        }
        else if (path.indexOf(".html") == path.length - 5) {
            response.setHeader("Content-Type", "text/html; charset=UTF-8");
        }
        else if (path.indexOf(".js") == path.length - 3) {
            response.setHeader("Content-Type",
                "application/javascript; charset=UTF-8");
        }
        else {
            // no idea
        }

        var fspath = npath.join(npath.dirname(module.filename),
            "web/" + path);
        var self = this;

        fs.createReadStream(fspath).
            on('error', function (e) {
                if ((e instanceof Object) && (e.errno == 34)) {
                    this.close();
                    self.sendError(request, response, path, 404,
                        "no such resource");
                }
                else {
                    response.end();
                    this.close();
                    logger.warning("during response for " + path, e);
                }
            }).
            pipe(response);
    }
}

StatusResponder.prototype.respond = function (requested,
        mode, path, request, response, cached) {
    var json = cached.json;

    json.requested.ms = requested;
    json.requested.date = new Date(requested).toISOString();

    if (mode == "json") {
        response.setHeader("Content-Type", "application/json");

        /*
            @todo conditional support here for json stringification -
            do not want to serialize stack frames to non-admin users.
            Note, also want to record to logs ...
        */
        response.end(djson.stringify(json, null, 4),
            "UTF-8", function (error) {
                if (error != null) {
                    if (error instanceof Error) {
                        error = error.message;
                    }

                    logger.warning("status responder", {
                            json: json,
                            error: error,
                        });
                }
            });
    }
    else if (mode == "html") {
        response.setHeader("Content-Type", "text/html; charset=UTF-8");

        var writer = new dhtml.HTMLWriter(response);
        var condition;

        if (json.errors.length > 0) {
            condition = "Unstable";
        }
        else {
            condition = "Stable";
        }

        var title = this.name + " " + this.version + " Status " + condition;

        this.sendStandardStart(request, writer, title);

        writer.
            beginElement("div", { class: 'content summary' }).
                beginElement("div", { class: 'application' }).
                sendElement("span", { class: 'key' }, "Application").
                sendElement("span", { class: 'space' }, ": ").
                sendElement("span", { class: 'value' }, json.name).
                endElement("div").
                beginElement("div", { class: 'version' }).
                sendElement("span", { class: 'key' }, "Version").
                sendElement("span", { class: 'space' }, ": ").
                sendElement("span", { class: 'value' }, json.version).
                endElement("div").
                beginElement("div", { class: 'condition ' + condition }).
                sendElement("span", { class: 'key' }, "Condition").
                sendElement("span", { class: 'space' }, ": ").
                sendElement("span", { class: 'value' }, condition).
                endElement("div").
            endElement("div");

        writer.sendElement("h2", { class: 'checks' }, "Checks").
            beginElement("div", { class: 'content checks' });

        for (var header in json.checks) {
            var cjson = json.checks[header];

            writer.beginElement("h3", { class: "check" }).
                sendElement("span", { class: "name" }, header).
                sendElement("span", { class: "space" }, ": ").
                sendElement("span", { class: "status " + cjson.status },
                    cjson.status).
                endElement("h3");

            if (cjson.content != null) {
                writer.beginElement("div", { class: "check-content json" });
                writer.renderJSON(cjson.content);
                writer.endElement("div");
            }
        }

        writer.endElement("div");

        if (json.errors.length > 0) {
            writer.sendElement("h2", { class: "problems" }, "Problems").
                beginElement("div", { class: 'content problems' });

            for (var i = 0; i < json.errors.length; i++) {
                var cjson = json.errors[i];

                writer.beginElement("div", { class: "error" });
                writer.sendElement("h3", { class: "error-title" },
                    "Error for " + cjson.name);

                writer.beginElement("div", { class: "error-content json" });
                writer.renderJSON(cjson.error);
                writer.endElement("div");
                writer.endElement("div");
            }

            writer.endElement("div");
        }

        this.sendStandardFinish(request, writer);

        response.end();
    }
    else {
        this.sendError(request, response, path, 500, "unsupported mode " +
            mode);
    }
}

/**
 * This is just remains for older implementations - it just redirects
 * to the common base class implementation.
 */
StatusResponder.prototype.returnStatusHandler = function (httpServer, path) {
    return (returnServiceHandler(httpServer, path));
}

/**
 * Provide a view of the logs from within the status responder.
 */
StatusResponder.prototype.withLogsView = function (hasLogsView) {
    if (hasLogsView == null) {
        hasLogsView = true;
    }

    this.hasLogsView = hasLogsView;

    return (this);
}

StatusResponder.prototype.withCheckDatabases = function () {
    new StatusCheck(this, "databases", function (callback) {
            var json = {
                    "writable-tx": { },
                };

            exports.openWritableTX(function (error, conn) {
                    if (error != null) {
                        json["writable-tx"].open = {
                                success: false,
                                error: error
                            };

                        errors.push(error);

                        callback(error, json);
                    }
                    else {
                        json["writable-tx"].open = {
                                success: true,
                            };

                        conn.close(function (error) {
                                if (error != null) {
                                    json["writable-tx"].close = {
                                            success: false,
                                            error: error
                                        };

                                    errors.push(error);

                                    callback(error, json);
                                }
                                else {
                                    json["writable-tx"].close = {
                                            success: true,
                                        };

                                    callback(null, json);
                                }
                            });
                    }
                });
        });

    return (this);
}

StatusResponder.prototype.withCheckCustom = function (name, callback) {
    new StatusCheck(this, name, callback);

    return (this);
}

StatusResponder.prototype.withReportError = function (name, message, content) {
    new StatusCheck(this, name, function (callback) {
            callback(new Error(message), content);
        });

    return (this);
}

StatusResponder.prototype.withCrashError = function (name, message) {
    new StatusCheck(this, name, function () {
            throw new Error(message);
        });

    return (this);
}

StatusResponder.prototype.withCheckConfig = function () {
    new StatusCheck(this, "config", function (callback) {
            callback(null, { configured : (config != null) });
        });

    return (this);
}

StatusResponder.prototype.withDefaultChecks = function () {
    this.withCheckConfig();

    //withServerConfig(). // not quite relevant to express - @todo adjust

    if ((config != null) && (config.databases != null)) {
        this.withCheckDatabases();
    }

    return (this);
}

StatusResponder.prototype.withCacheFor = function (ms) {
    this.cacheMS = ms;
}

/**
 * Reports the configuration of the local HTTP server that this
 * status responder is bound to.
 */
StatusResponder.prototype.withServerConfig = function () {
    var self = this;

    new StatusCheck(this, "server-config", function (callback) {
            var json = {
                    listeners: []
                };

            for (var i = 0; i < self.servers.length; i++) {
                var server = self.servers[i];
                var address = server.address();

                json.listeners.push({
                        family: address.family,
                        address: address.address,
                        port: address.port,
                    });
            }

            callback(null, json);
        });

    return (this);
}

util.inherits(Jobs, EventEmitter);

function Jobs(opts) {
    EventEmitter.call(this);

    if (opts == null) {
        opts =  {};
    }

    this.running = [];
    this.maxRunning = 0;
    this.queue = [];
    this.maxQueue = 0;
    this.started = Date.now();
    this.jobsStarted = 0;
    this.jobsCompleted = 0;
    this.jobsElapsed = 0;
    this.errors = [];
    this.limit = 1 * (opts.limit != null ? opts.limit : 10);
    this.accept = true; // accept jobs

    if (false) { // trace
        var self = this;

        ["error", "warning", "running", "completed", "blocking", "drained"].
            forEach(function (event) {
                self.on(event, function () {
                        console.log("job event", event, {
                                running: this.running.length,
                                queue: this.queue.length,
                                limit: this.limit,
                            });
                    });
            });
    }
}

Jobs.prototype.quiesce = function (callback) {
    this.accept = false; // do not run or accept new jobs

    while (this.queue.length > 0) {
        this.failPrivate(this.queue.splice(this.queue.length - 1)[0]);
    }

    this.drain(callback);
}

Jobs.prototype.drain = function (callback) {
    if (callback == null) {
        // just ignore
    }
    else if (this.running.length == 0) {
        callback();
    }
    else {
        this.once('drained', callback);
    }
}

Jobs.prototype.failPrivate = function (job) {
    this.emit('failing', job.fn);

    if (job.callback != null) {
        job.callback(new Error("failed"));
    }
}

Jobs.prototype.runPrivate = function (job) {
    this.running.push(job);

    if (this.running.length > this.maxRunning) {
        this.maxRunning = this.running.length;
    }

    this.jobsStarted++;

    var self = this;
    var started = Date.now();

    this.emit('running', job.fn);

    if (job.callback != null) {
        job.callback();
    }

    job.fn(function (error) {
            var index = self.running.indexOf(job);

            if (index < 0) {
                var message = "job called back more than once";

                self.emit('warning', message);
            }
            else {
                var elapsed = Date.now() - started;

                self.jobsCompleted++;
                self.jobsElapsed += elapsed;

                // remove job from running
                self.running.splice(index, 1);

                self.emit('completed', job.fn, error, elapsed);

                if (error != null) {
                    self.quiesce(null); // do not accept new jobs
                    self.errors.push(error);
                    self.emit('error', error);

                    if (self.running.length == 0) {
                        self.emit('drained', true);
                    }
                }
                else if (self.queue.length > 0) {
                    if (self.queue.length == 1) {
                        self.emit('blocking', false);
                    }

                    self.runPrivate(self.queue.splice(0, 1)[0]);
                }
                else {
                    if (self.running.length == 0) {
                        self.emit('drained', true);
                    }
                }
            }
        });
}

Jobs.prototype.submit = function (fn, callback) {
    var job = {
            fn: fn,
            callback: callback,
        };

    if (!this.accept) {
        this.failPrivate(job);
    }
    else if (this.running.length < this.limit) {
        this.runPrivate(job);
    }
    else {
        if (this.queue.length == 0) {
            this.emit('blocking', true);
        }

        this.queue.push(job);

        if (this.queue.length > this.maxQueue) {
            this.maxQueue = this.queue.length;
        }
    }
}

Jobs.prototype.generateStats = function () {
    var elapsed = Date.now() - this.started;

    if (elapsed == 0) {
        elapsed = 1;
    }

    return ({
            elapsed: { value: elapsed, measure: "ms" },
            jobs: { value: this.jobsCompleted, measure: "" },
            maxRunning: { value: this.maxRunning, measure: "" },
            maxQueue: { value: this.maxQueue, measure: "" },
            jobsElapsed: { value: this.jobsElapsed },
            averageRun: { value: ((this.jobsCompleted > 0) ? 
                (this.jobsElapsed / this.jobsCompleted) : 0), measure: "ms" },
            runRate: { value: Math.floor(this.jobsCompleted /
                (elapsed / 1e3)), measure: "/s" },
        });
}

exports.Jobs = Jobs;

function uncaughtExceptionHandler(error) {
    try {
        logger.critical("uncaught exception",
            {
                cwd: process.cwd(),
                exe: process.execPath,
                platform: process.platform,
                args: process.argv,
                memory: process.memoryUsage()
            },
            error);
    }
    finally {
        exports.shutdown(1); // graceful shutdown
    }
}

exports.uncaught = function (yes) {
    if ((yes === null) || (yes === undefined)) {
        yes = true; // behave as though true, not false
    }

    if ((uncaught == true) != (yes == true)) {
        uncaught = yes;

        if (uncaught) {
            process.addListener('uncaughtException',
                uncaughtExceptionHandler);
        }
        else {
            process.removeListener('uncaughtException',
                uncaughtExceptionHandler);
        }
    }
}

exports.registerStatusResponder = function (name, version) {
        var responder = new StatusResponder(name, version);

        return (responder);
    };

exports.newResourceService = function (root) {
        var drservice = require('./drservice');
        var adapter = new drservice.ResourceService(root);

        return (adapter);
    };

exports.parseVersion = denum.parseVersion;
exports.compareVersions = denum.compareVersions;

["loadGZJSONPath", "saveGZJSONPath", "loadJSONStream", "saveJSONStream"].
    forEach(function (name) {
        exports[name] = djson[name];
    });

exports.origin = null; // origin we calculate during configuration
exports.address = null; // address we calculate during configuration
exports.discoverAddress = discoverAddress;
exports.queryResources = function () {
        return (resourceManager.newResourceQuery());
    };
exports.dschema = dschema; // make direct schema easy to find/DEBUG
exports.Q = Q; // make it easy to find
exports.registerService = null; // only valid in cloud environment
exports.topicEmitter = null; // only valid in cloud environment
exports.hasResourceVersionSupport = false;
exports.queryServices = null; // only valid in cloud environment
exports.querySessions = null; // only valid in cloud environment
exports.FileTreeStepper = dfile.FileTreeStepper;
exports.newResourceImporter = function (localTreePath, resourcePrefix) {
        return (resourceManager.newResourceImporter(localTreePath,
            resourcePrefix));
    };

/**
 * Different versions of node support getting the port from an
 * address in different ways, so wrap up the ability to this into
 * a simple function, given the server object.
 */
exports.getServerPort = function (server) {
        // @todo fix this for later versions of node than 0.10?
        return (server.address().port);
    };

exports.getBasePort = function (offset) {
        if (config == null) {
            throw new Error("can only be called after dinfra.configure");
        }

        var port = config.origin.basePort;

        if (!port) {
            port = 8000; // base port defaults to 8000 always.
        }

        if (offset == null) {
            // port remains the same
        }
        else {
            port += offset;
        }

        port = Math.floor(1 * port); // coerce to a number

        if (Number.isNaN(port)) {
            throw new Error('invalid configuration or offset');
        }

        return (port);
    };

exports.getHardPort = function (offset) {
        if (config == null) {
            throw new Error("can only be called after dinfra.configure");
        }

        var port = config.origin.hardPort;

        if (!port) {
            port = 0; // always return zero to bind to an empheral port
        }
        else if (offset == null) {
            // port remains the same
        }
        else {
            port += offset;
        }

        port = Math.floor(1 * port); // coerce to a number

        if (Number.isNaN(port)) {
            throw new Error('invalid configuration or offset');
        }

        return (port);
    };

exports.newResourceStepper = function (resourcePrefix) {
        return (new dresource.ResourceStepper(resourceManager,
            resourcePrefix));
    };

/**
 * Causes error events sent to non-listening EventEmitters
 * to be logged with information about the target object and
 * call stack location, as well as the original error.  This
 * should not be used in production code - its intended for
 * debugging the origin of missing error listeners.
 */
exports.interceptEmitterErrors = function () {
        if (EventEmitter.zemit == null) {
            EventEmitter.prototype.zemit = EventEmitter.prototype.emit;
            EventEmitter.prototype.emit = function (name, error) {
                    if ((name == "error") && !this.listeners(name).length) {
                        logger.error('missing error event listener', {
                                target: this,
                                emitter: new Error(),
                                error: error,
                            });
                    }

                    this.zemit.apply(this, arguments);
                }
        }
    };


try {
    exports.TopicEmitter = require('./dtopic').TopicEmitter;
}
catch (e) {
    exports.TopicEmitter = null; // no topic emitters for desktop deployments
}

exports.newQueryExprFactory = function () { 
        return (new dschema.QueryExprFactory());
    };

exports.newResourceFS = function (prefix, opts) { 
        return (resourceManager.newResourceFS(prefix, opts));
    };

/**
 * Write a raw dump of the collection to the given stream - this
 * is only intended for debugging purposes, not backups etc.
 * Also, only works on LevelDB right now.
 */
exports.rawCollectionDump = function (stream, collection, callback) {
        return (readableGroup.rawCollectionDump(stream, collection, callback));
    };

/**
 * stringCompare(left, right) will compare strings using the
 * same collating order as the storage abstraction, with the
 * exception that nulls compare as equal, and undefineds are
 * also treated as nulls.  Nulls compare as "greater" than
 * non-nulls.  The storage abstraction collating order is
 * to treat strings as sequences of unicode code-points and
 * to compare them by code-point value.
 */
exports.stringCompare = denum.stringCompare;
exports.stringSort = denum.stringSort;
exports.stringSearch = denum.stringSearch;
exports.binarySort = denum.binarySort;
exports.binarySearch = denum.binarySearch;

