// Copyright (C) 2015-2016 Texas Instruments Incorporated - http://www.ti.com/

'use strict';

var dinfra = require('../../../dinfra-library__git/lib/dinfra');

var argi = 2;
var dconfig = require(process.argv[argi++]); // where is dinfra config
var localTreePath = process.argv[argi++]; // local tree path (dir)
var resourcePrefix = process.argv[argi++]; // relative resource prefix
var branch = process.argv[argi++]; // branch to update on
var version = process.argv[argi++]; // version to mark new files

var serviceName = 'my-resource-updater'; // put your application here
var logger = dinfra.logger(serviceName);

dinfra.dlog.console(); // don't call this unless debugging/developing

/*
 var jobs = new dinfra.Jobs({ limit: 5 });

 dinfra.addShutdownJob(function () {
 jobs.quiesce(function () {
 if (jobs.errors > 0) {
 logger.critical.apply(logger, jobs.errors);
 dinfra.shutdown(1);
 }
 else {
 dinfra.shutdown();
 }
 });
 });
 */

dinfra.configure(dconfig,
    function (error) {
        if (error != null) {
            logger.critical(error);
            dinfra.shutdown(1);
        }
        else {
            doImport();
        }
    });

function doImport() {
    var importer = dinfra.newResourceImporter(localTreePath,
        resourcePrefix, branch, version);

    dinfra.addShutdownJob(function () {
        logger.info(importer.generateStats());
        dinfra.shutdown();
    });

    importer.
        on('error', function (error) {
            logger.critical('error', error);
            dinfra.shutdown(1);
        }).
        on('result', function (event) {
            if (event.op !== 'ignore') {
                console.log(event.op, event.path);
            }
            this.applyStatEvent(event);
        }).
        on('end', function () {
            dinfra.shutdown();
        }).
        next();
}
