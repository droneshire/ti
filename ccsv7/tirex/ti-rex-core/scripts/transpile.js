#!/usr/bin/env node

'use strict';
require('rootpath')();

const path = require('path');
const fs = require('fs-extra');

const async = require('async');
const glob = require('glob');
const browserify = require('browserify');
const watchify = require('watchify');
const errorify = require('errorify');

/**
 * Transpiles javascript files and puts the result in the destination file.
 * Current Transformations:
 *     ES6 -> ES5
 *
 * @param {Object} args
 *  @param {String} args.sourceDir - The top-level location of the javascript
 *   files. Sub-directories will also be searched for javascript files.
 *  @param {String} args.destinationFile - The file which 
 *   the transpiled result will be stored.
 *  @param {Boolean} args.dev
 * @param {ErrorCallback} callback
 */
function transpile({sourceDir, destinationFile, dev}, callback=(()=>{})) {
    const options = dev ? {
        cache: {},
	packageCache: {},
	plugin: [watchify, errorify]
    } : null;
    async.waterfall([(callback) => {
        fs.ensureDir(path.dirname(destinationFile), callback);
    }, (_, callback) => {
        glob(path.join(sourceDir, '**/*.js'), callback);
    }, (files, callback) => {
        const b = browserify(files, options)
              .transform('babelify', {
                  presets: ['es2015']
              });
        b.bundle().pipe(
            fs.createWriteStream(destinationFile).on('close', callback)
        );
        if (dev) {
	    b.on('update', () => {
	        b.bundle().pipe(fs.createWriteStream(destinationFile));
	    });	
        }
    }], callback);    
} exports.transpile = transpile;

if (require.main === module) {
    const argv = require('yargs')
	  .usage('Usage: $0 [options]')
	  .help('h')
	  .alias('h', 'help')

	  .describe('s', '')
	  .alias('s', 'sourceDir')
	  .demand(0, ['s'])

	  .describe('d',  '')
	  .alias('d', 'destinationFile')
	  .demand(0, ['d'])

	  .describe('dev', 'for development use')

	  .argv;
    
    const config = {
	sourceDir: argv.sourceDir || argv.s,
        destinationFile: argv.destinationFile || argv.d
    };
    
    transpile(config, ((err) => {
        if (err) {
            console.log('transpile failed');
            console.log(err);
        }
        else {
            console.log('transpile successful');
        } 
    }));
}
