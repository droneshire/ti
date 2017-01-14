/**
 * Created by auser on 27/07/16.
 */

'use strict';

var dinfra = require('../dinfra-desktop/dinfra');
var theLogger;

module.exports = function Logger(logger) {
    if (logger == null) {
        if (theLogger == null) {
            theLogger = dinfra.logger('default');
        }
        return theLogger;
    } else {
        theLogger = logger;
    }
};
