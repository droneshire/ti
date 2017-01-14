'use strict';
require('rootpath');

const fs = require('fs-extra');

const request = require('request');

const util = require('scripts/util');

const stagingServerPostLink = 'https://staging.toro.design.ti.com/tirex/stage/';

function main({handoffFile}, callback) {
    const file = util.resolvePath(handoffFile);
    fs.readJSON(file, (err, json) => {
        if (err) {
            callback(err);
            return;
        }
        json.map((data) => {
            request
                .post({url: stagingServerPostLink,
                       json: true,
                       headers: {
                           'content-type': 'application/json'
                       },
                       body: data})
                .on('response', (response) => {
                    callback(null, response.statusCode);
                })
                .on('error', (err) => {
                    callback(err);
                });
        });
    });
}

///
// Yargs Command config
///
exports.command = 'handoff [options]';
exports.describe = 'A simple client to handoff package(s)';
exports.builder = {
    handoffFile: {
        alias: 'f',
        describe: 'The json file to handoff (absolute or relative to the current working directory)',
        demand: true
    }
};
exports.handler = function(argv) {
    main(argv, (err, statusCode) => {
        if (err) {
            console.log(err);
        }
        else {
            console.log('status code ', statusCode);
        }
    });
};
