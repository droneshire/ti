/**
 * Fixed configuration variables - they don't change at run-time
 */

'use strict';

const os = require('os');
const fs = require('fs');
const path = require('path');
const mkdirp = require('mkdirp');

const logger = require('./logger')();

module.exports = Vars; // object that's returned by a require call

const projectRoot = path.join(__dirname, '..');

/**
 * Constructor
 *
 * init:
 * @property {String} contentPath
 * @property {String} ccsCloudUrl
 * @property {String} downloadsCache

 * @constructor
 */
function Vars(config) {
    // may not be defined if we run tests
    if (!config) config = {};
    if (!config || !config.contentPath) config.contentPath = '';
    if (!config || !config.dbPath) config.dbPath = config.contentPath;
    if (!config || !config.ccsCloudUrl) config.ccsCloudUrl = '';
    if (!config || !config.downloadsCache) config.downloadsCache = '';
    if (!config || !config.contentPackagesConfig) config.contentPackagesConfig = '';

    Vars.projectRoot = projectRoot;

    if (!config || !config.remoteBundleZips) {
        config.remoteBundleZips = '';
    }
    Vars.REMOTE_BUNDLE_ZIPS = config.remoteBundleZips;

    Vars.RESOURCE_OT_FOUND_MSG = 'Resource not found. Click on the TI Resource Explorer Home Button to refresh all resources.';

    Vars.WEBCOMPONENTSSERVER_BASEURL = config.webComponentsServer;
    Vars.CONTENT_BASE_PATH = path.normalize(config.contentPath);
    Vars.DB_BASE_PATH = path.normalize(config.dbPath);
    Vars.DEFAULT_CONTENT_BASE_PATH = Vars.CONTENT_BASE_PATH;    // remember the default value from config
    Vars.DB_LOGS_BASE_PATH = path.join(Vars.DB_BASE_PATH, 'logs');
    Vars.SITEMAP_PATH = path.join(Vars.DB_BASE_PATH, 'sitemap');
    Vars.DOWNLOADS_BASE_PATH = config.downloadsCache; // ensure this is a fast/local drive for better performance
    Vars.CCS_CLOUD_URL = config.ccsCloudUrl;
    Vars.CCS_CLOUD_IMPORT_PATH = '@ti-rex-content'; // the path as it exists on the CCS Cloud proxy
    Vars.TARGET_ID_PLACEHOLDER = '_deviceplaceholder_';
    Vars.CCS_IMPORT_PROJECT_API = '/ide/api/ccsserver/importProject';
    Vars.CCS_IMPORT_SKETCH_API  = '/ide/api/ccsserver/importSketch';
    Vars.CCS_CLOUD_API_BASE = '/ide/api/ccsserver';
    Vars.BIN_BASE_PATH = path.join(projectRoot, 'bin');
    Vars.HOST = os.platform();
    Vars.PACKAGE_LIST_DELIMITER = '::'; // TODO: should deprecate
    Vars.PACKAGE_ID_VERSION_DELIMITER = '__'; // TODO: should deprecate
    Vars.BUNDLE_LIST_DELIMITER = '::';
    Vars.BUNDLE_ID_VERSION_DELIMITER = '__';
    Vars.SUPPORT_MULTIPLE_VERSIONS = true;

    if(config.relocatePackages === 'true') {
        Vars.RELOCATE_PACKAGES = config.relocatePackages;
    }
    if(config.http_proxy != null) {
        Vars.HTTP_PROXY = config.http_proxy;
    }
    else if(config.HTTP_PROXY != null) {
        Vars.HTTP_PROXY = config.HTTP_PROXY;
    }
    if(config.https_proxy != null) {
        Vars.HTTPS_PROXY = config.https_proxy;
    }
    else if(config.HTTPS_PROXY != null) {
        Vars.HTTPS_PROXY = config.HTTPS_PROXY;
    }

    if (config.no_proxy != null) {
        Vars.NO_PROXY = config.no_proxy;
    }
    else if (config.NO_PROXY != null) {
        Vars.NO_PROXY = config.NO_PROXY;
    }

    Vars.USER_CONFIG_PATH = config.userConfigPath;
    Vars.LOCALSERVER = config.mode;

    ///
    // URLs
    ///

    // should only be defined for staging server
    if (config.subMode === 'stagingserver') {
        Vars.handoffServerURLs = [
            'http://tgrttub03.toro.design.ti.com/tirex/handoff/'
        ];
    }
    if (config.remoteserverHost != null) {
        Vars.REMOTESERVER_BASEURL = config.remoteserverHost +
            ((config.myRole !== '') ? '/' + config.myRole : '');
    }

    ///
    // For content
    ///

    Vars.zipsFolder = path.join(Vars.CONTENT_BASE_PATH, 'zips');
    Vars.packageManagerFile = path.join(
        Vars.CONTENT_BASE_PATH, 'config', 'tirex.json'
    );
    {
        const _path = path.isAbsolute(config.contentPackagesConfig) ?
              config.contentPackagesConfig :
              path.join(projectRoot, config.contentPackagesConfig);
        Vars.contentPackagesConfig = _path;
    }

    ///
    // CCS Related
    ///

    Vars.CCS_LOCALPORT = config.ccs_port;

    ///
    // Package metadata related
    ///

    Vars.METADATA_DIR = path.join('.metadata', '.tirex');
    // relative to the METADATA_DIR
    Vars.DEPENDENCY_DIR = path.join('.dependencies');
    // relative to the DEPENDENCY_DIR
    Vars.IMPLICIT_DEPENDENCY_MAPPING_FILE = 'dependency-mapping.json';

    // [ Metadata_2.1 : builtin top nodes
    Vars.META_2_1_TOP_CATEGORY = {
        software: {id:'software', text:'Software'},
        devices:  {id:'devices',  text:'Device Documentation'},
        devtools: {id:'devtools', text:'Development Tools'},
        getByText: function(text) {
            if(     text === Vars.META_2_1_TOP_CATEGORY.software.text) {return Vars.META_2_1_TOP_CATEGORY.software;}
            else if(text === Vars.META_2_1_TOP_CATEGORY.devices.text)  {return Vars.META_2_1_TOP_CATEGORY.devices;}
            else if(text === Vars.META_2_1_TOP_CATEGORY.devtools.text) {return Vars.META_2_1_TOP_CATEGORY.devtools;}
            else {return null;}
        }
    };
    // ]
    // predefined fields in package.tirex.json
    Vars.METADATA_PKG_DOWNLOAD_ONLY = 'desktopOnly';
    Vars.METADATA_PKG_IMPORT_ONLY = 'desktopImportOnly';


    return Vars;
}

Vars.createDirs = function() {
    logger.info('content dir: ' + Vars.CONTENT_BASE_PATH);
    if (fs.existsSync(Vars.DB_BASE_PATH) === false) {
        mkdirp.sync(Vars.DB_BASE_PATH);
    }
    logger.info('db dir: ' + Vars.DB_BASE_PATH);

    if (fs.existsSync(Vars.DB_LOGS_BASE_PATH) === false) {
        mkdirp.sync(Vars.DB_LOGS_BASE_PATH);
    }
    logger.info('db logs dir: ' + Vars.DB_LOGS_BASE_PATH);

    if (fs.existsSync(Vars.SITEMAP_PATH) === false) {
        mkdirp.sync(Vars.SITEMAP_PATH);
    }
    logger.info('sitemap dir: ' + Vars.SITEMAP_PATH);

    if (fs.existsSync(Vars.DOWNLOADS_BASE_PATH) === false) {
        mkdirp.sync(Vars.DOWNLOADS_BASE_PATH);
    }
    logger.info('downloads dir: ' + Vars.DOWNLOADS_BASE_PATH);

    if ( Vars.USER_CONFIG_PATH === null && fs.existsSync(Vars.USER_CONFIG_PATH) === false) {
        mkdirp.sync(Vars.USER_CONFIG_PATH);
    }
    logger.info('user config dir: ' + Vars.USER_CONFIG_PATH);
};

/**
 * Get the dir the metadata folder is located relative to the package folder.
 * 
 * We expect all the .tirex.json files to be located
 * in the METADATA_DIR folder if it exists, otherwise they will all be
 * in the root of the package directory.
 *
 * @param {string} packagePath - the package's path relative to the content folder.
 * @param callback(metadataDir)
 */
Vars.getMetadataDir = function(packagePath, callback) {
    const packageRoot = path.join(Vars.CONTENT_BASE_PATH, packagePath);
    const metadataPath = path.join(packageRoot, Vars.METADATA_DIR);
    fs.stat(metadataPath, function(err, stats) {
        callback(err ? '' : Vars.METADATA_DIR);
    });
};


Vars.restoreDefaultContentBasePath = function() {
    Vars.CONTENT_BASE_PATH = Vars.DEFAULT_CONTENT_BASE_PATH;
};
