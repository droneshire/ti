#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

if (require.main === module) {
    // look here incase the user hasn't done a build yet
    // in production this path is not available so assume it is built
    const yargsBackup = path.join(
        __dirname, '..', '3rd_party', 'shared', 'node_modules', 'yargs'
    );
    fs.stat(yargsBackup, (err) => {
        let yargs = null;
        if (err) {
            yargs = require('yargs');
        }
        else {
            yargs = require(yargsBackup);
        }
        if (yargs.parse(process.argv)._.indexOf('build') > -1) {
            yargs
	        .usage('Usage: $0 <command> [options]')
                .command(require('./build'))
                .require(1)
	        .help('h')
	        .alias('h', 'help')
	        .argv;
        }
        else {
            // The above code is meant to handle if the user tries to run this script without building first (they have not node_modules installed)
            // This is the important piece for adding commands
            yargs
	        .usage('Usage: $0 <command> [options]')
                .command(require('./run-tirex'))
                .command(require('./build'))
                .command(require('test/run-tests'))
                .command(require('./handoff-client/main'))
                .command(require('./ccs-dependent/test-projects'))
                .require(1)
	        .help('h')
	        .alias('h', 'help')
	        .argv;
        }
    });
}
