'use strict';
require('rootpath');

/**
 * @param {Object} args
 *  @param {String} args.tirexUrl
 *  @param {String} args.ccsLocation
 * @param {ErrorCallback} callback
 */
exports.testProjects = function({tirexUrl, ccsLocation}, callback) {
    setImmediate(callback);
};

///
// Yargs Command config
///
exports.command = 'test-projects [options]';
exports.describe = 'Test all the projects in tirex';
exports.builder = {
    ccsLocation: {
        alias: 'c',
        demand: true
    },
    tirexUrl: {
        alias: 't',
        demand: true
    }
};
exports.handler = function(argv) {
    exports.testProjects(argv, (err) => {
        if (err) {
	    console.log(err);
	}
	else {
	    console.log('Finished Testing Projects');
        }
    });
};
