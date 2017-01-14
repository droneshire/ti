
/**
 * Refresh macros from macros.tirex.json files
 */

'use strict';

var path = require('path');

var vars = require('../vars');
var preproc = require('./preproc');

const loggerMacros = {
    log: function() {

    }
};

/**
 * Clear log
 */
exports.clearLog = function() {
    return;
};

/**
 * Refresh macros
 * 
 * @param packagePath
 * @param macros
 * @param callback(err, logFile) - called when an error occurs.
 */
exports.refresh = function(packagePath, macros, log, callback) {
    loggerMacros.log = (type, message) => {
        if (type === 'debug') {
            return;
        }
        if (log.userLogger[type]) {
            log.userLogger[type](message);
        }
        else {
            log.userLogger.info(message);
        }
    };
    
    vars.getMetadataDir(packagePath, function(metadataDir) {
        var macrosFile = path.join(vars.CONTENT_BASE_PATH, packagePath,
                                   metadataDir, 'macros.tirex.json');
        preproc.processFile(macrosFile, null, loggerMacros, (err, preprocResult) => {
            if (err || !preprocResult) {
                return callback(err);
            }

            // exports._process ?
            macros[packagePath] = preprocResult.macros;
            return callback();
        });
    });
};
