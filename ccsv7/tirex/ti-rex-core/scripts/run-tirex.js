'use strict';
require('rootpath')();

const os = require('os');
const p = require('child_process');
const path = require('path');

const async = require('async');

const util = require('./util');
const transpile = require('./transpile').transpile;

const processManager = new util.ProcessManager();
const entryFile = path.join(util.projectRoot, 'app.js');

function run(argv, callback) {
    const {production} = argv;
    if (production) {
        runTirex(argv, callback);
    }
    else {
        const nodemon = require('nodemon');
        transpile({
            sourceDir: path.join(util.projectRoot, 'public', 'js'),
            destinationFile: path.join(
                util.projectRoot, 'public', 'lib', 'bundle.js'
            ),
            dev: true
        });
        const args = Object
              .keys(argv)
              .map((key) => {
                  if (argv[key]) {
                      return ['--' + key, argv[key].toString()];
                  }
                  else {
                      return null;
                  }
              })
              .filter((item) => {
                  return item;
              })
              .reduce((item1, item2) => {
                  return item1.concat(item2);
              });
        nodemon({
            script: __filename,
            args,
            watch: util.backendJsItems
        });
        setImmediate(callback);
    }
}

function runTirex(config, callback) {
    async.waterfall([(callback) => {
        if (!config.localOnly) {
            runRemoteServer(config, callback); 
        }
        else {
            setImmediate(callback);
        }
    }, (callback) => {
        if (!config.remoteOnly) {
            runLocalServer(config, callback); 
        }
        else {
            setImmediate(callback);
        }
    }], callback);
} exports.runTirex = runTirex;

function runRemoteServer(config, callback) {
    async.waterfall([(callback) => {
	setValues('remoteserver', callback, config);
    }, ({nodeArgs, dinfra, remoteServerConfig, out}, callback) => {
        // prepare the args
        const remoteServerArgs = `${dinfra} ${remoteServerConfig}`;
	const args = (`${nodeArgs} ${entryFile} ${remoteServerArgs}`).trim().split(' ');

        // run the remoteserver
	out.write('Launching Remoteserver\n');
	const remoteserver = p.spawn(process.execPath, args, {
            cwd: util.projectRoot
        });
        remoteserver.on('close', (code) => {
            out.write(`Remoteserver exited with code ${code}\n`);
        });
        util.setupLog(util.remoteServerLog, (err, logStream) => {
            callback(err, remoteserver, logStream);
        });
    }, (remoteserver, logStream, callback) => {
        processManager.addProcess({
            child: remoteserver,
            out: logStream,
            name: 'remoteserver'
        });
        setTimeout(callback, 500);
    }], callback);
}

function runLocalServer(config, callback) {
    async.waterfall([(callback) => {
	setValues('localserver', callback, config);
    }, ({nodeArgs, dinfra, localServerConfig, out}, callback) => {
	// prepare the args
        const localServerArgs = `${dinfra} ${localServerConfig} --ccs-port=58173`; 
	const args = (`${nodeArgs} ${entryFile} ${localServerArgs}`)
              .trim()
              .split(' ');

        // launch the local server
	out.write('Launching Localserver\n');
	const localserver = p.spawn(process.execPath, args, {
            cwd: util.projectRoot
        });
        localserver.on('close', (code) => {
            out.write(`Localserver exited with code ${code}\n`);
        });
        util.setupLog(util.localServerLog, (err, logStream) => {
            callback(err, localserver, logStream);
        });
    }, (localserver, logStream, callback) => {
        processManager.addProcess({
            child: localserver,
            out: logStream,
            name: 'localserver'
        });
        setTimeout(callback, 1000);
    }], callback);
}

///
// Helpers
///

/**
 * Sets a set of values based on the config 
 *
 * @param {String} serverMode - either localserver or remoteserver.
 * @param callback(err, values)
 * @param {Object} config
 */
function setValues(serverMode, callback, {debug, 
                                          production,
                                          dinfra,
                                          debugBrk,
                                          handoffServer,
                                          stagingServer,
                                          out=process.stdout}) {
    let nodeArgs = '';
    if (debug || debugBrk) {
        let debugOption = '';
        if (debug) {
            debugOption = '--debug=';
        }
        else if (debugBrk) {
            debugOption = '--debug-brk=';
        }
        nodeArgs += debugOption +
            (serverMode === 'localserver' ?
             util.localServerDebugPort : util.remoteServerDebugPort);
    }

    let dinfraConfig = '';
    if (serverMode === 'localserver') {
        dinfraConfig = 'dinfra-desktop/dinfra.js config/dconfig_localserver.json';
    }
    else if (!dinfra) {
        dinfraConfig = 'dinfra-desktop/dinfra.js config/dconfig_remoteserver.json';
    }
    else {
        dinfraConfig = dinfra + ' config/dconfig_auser.json';
    }

    let remoteServerConfig = null;
    if (serverMode === 'remoteserver') {
        if (stagingServer) {
            remoteServerConfig = 'config/app_stagingserver.json';
        }
        else if (handoffServer) {
            remoteServerConfig = 'config/app_handoffserver.json';
        }
        else {
            remoteServerConfig = 'config/app_remoteserver.json';
        }
    }

    callback(null, {
        nodeArgs,
        dinfra: dinfraConfig,
        remoteServerConfig,
        localServerConfig: (isWindows() ? 'config/app_localserver_win.json' :
                            'config/app_localserver.json'),
        out
    });
}

function isWindows() {
    return os.platform() === 'win32';
}

///
// Yargs Command config
///
exports.command = 'start [options]';
exports.describe = 'Run ti-rex-core';
exports.builder = {
    localOnly: {
        alias: 'l',
        describe: 'run only the tirex local server'
    },
    remoteOnly: {
        alias: 'r',
        describe: 'run only the tirex remote server'
    },
    stagingServer: {
        alias: 's',
        describe: 'run remote server as a staging server'
    },
    handoffServer: {
        describe: 'run remote server as a handoff server'
    },
    production: {
        alias: 'p',
        describe: 'Run in a production environment'
    },
    dinfra: {
        describe: 'the location of dinfra.js (relative to the root of ti-rex-core)'
    },
    debug: {
        alias: 'd',
        describe: 'run in debug mode'
    },
    debugBrk: {
        describe: 'run in debug-brk mode'
    }
};
exports.handler = function(argv) {
    run(argv, (err) => {
        if (err) {
            console.log(err);
        }
    });
};

if (require.main === module) {
    // for nodemon only
    const argv = require('yargs').parse(process.argv);
    runTirex(argv, (err) => {
        if (err) {
            console.log(err);
        }
    });
}

