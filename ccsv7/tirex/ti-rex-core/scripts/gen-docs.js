#!/usr/bin/env node

'use strict';
require('rootpath')();

const path = require('path');
const fs  = require('fs-extra');

const jsdoc = require('jsdoc-api');
const async = require('async');
const glob = require('glob');

const util = require('./util');

const templateFolder = path.join(
    util.projectRoot, 'node_modules', 'ink-docstrap', 'template'
);
const template = path.join(templateFolder, 'jsdoc.conf.json');
const jsItems = util.backendJsItems.concat([
    path.join(util.projectRoot, 'scripts'),
    path.join(util.projectRoot, 'public', 'js'),
    path.join(util.projectRoot, 'types')
]);

function genDocs(config, callback) {
    async.map(jsItems, (item, callback) => {
        async.waterfall([(callback) => {
            fs.stat(item, callback);
        }, (stats, callback) => {
            if (stats.isDirectory()) {
                glob(path.join(item, '**', '*.js'), callback);
            }
            else {
                setImmediate(callback, null, [item]);
            }
        }], callback);
    }, (err, result) => {
        if (err) {
            setImmediate(callback, err);
            return;
        }
        const files = result.reduce((item1, item2) => {
            return item1.concat(item2);
        });
        configTemplate(template, {sort: false}, (err) => {
            if (err) {
                callback(err);
                return;
            }
            jsdoc.renderSync({
                configure: template,
                files,
                destination: util.jsDocFolder,
                // private: true,
                template: templateFolder
            });
            callback(err);
        }); 
    });
} exports.genDocs = genDocs;

function configTemplate(file, override, callback) {
    async.waterfall([
        (callback) => {
            fs.readJSON(file, callback);
        }, (template, callback) => {
            Object.keys(override).map((key) => {
                template.templates[key] = override[key];
            });
            fs.writeJSON(file, template, callback);
        }
    ], callback);
}

if (require.main === module) {
    const argv = require('yargs')
          .usage('Usage: $0 [options]')
          .help('h')
          .alias('h', 'help')
    
	  .argv;
    const config = {
        
    };
    genDocs(config, (err) => {
        if (err) {
            console.log(err);
            return;
        }
        console.log('gen docs successful');
    });
}

