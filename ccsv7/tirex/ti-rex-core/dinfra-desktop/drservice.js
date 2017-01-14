// Copyright (C) 2016 Texas Instruments Incorporated - http://www.ti.com/
const npath = require('path');
const util = require('util');
const dinfra = require('./dinfra');
const dhtml = require('./dhtml');
const djson = require('./djson');
const dresource = require('./dresource');

util.inherits(ResourceService, dinfra.ServiceAdapter);

function ResourceService(root) {
    dinfra.ServiceAdapter.call(this);

    this.root = root;
}

ResourceService.prototype.addResourceHeaders = function (response, resource) {
    var headers = resource.getHeaders();

    for (var header in headers) {
        response.setHeader(header, headers[header]);
    }
}

ResourceService.prototype.sendResourceContent = function (response, resource) {
    var readable = resource.openReadable();

    readable.pipe(response).on("error", function (error) {
            logger.warning("resource-service", {
                    operation: "content-delivery",
                    resource: resource.name,
                    error: error
                });
        }).on("end", function () {
            resource.close(function (error) {
                    if (error != null) {
                        logger.warning("resource-service", {
                                operation: "resource-close",
                                resource: resource.name,
                                error: error
                            });
                    }
                }); // always close
        });
}

ResourceService.prototype.sendResourceJSON = function (response, resource,
        json, operation) {
    response.setHeader("Content-Type", "text/plain; charset=UTF-8");
    response.on("error", function (error) {
            logger.warning("resource-service", {
                    operation: operation,
                    resource: resource.name,
                    error: error
                });
        }).on("end", function () {
            resource.close(function (error) {
                    if (error != null) {
                        logger.warning("resource-service", {
                                operation: "resource-close",
                                resource: resource.name,
                                error: error
                            });
                    }
                }); // always close
        }).
        end(djson.stringify(json, null, 4), "UTF-8");
}

ResourceService.prototype.sendResourceMeta = function (response, resource,
        sub) {
    var meta;

    if ((sub == null) || (sub === true)) {
        meta = resource.meta;
    }
    else {
        meta = resource.getMeta(sub);
    }

    if (meta == null) {
        meta = {};
    }

    this.sendResourceJSON(response, resource, meta, "meta-delivery");
}

ResourceService.prototype.sendResourceListing = function (response,
        prefix, path, rpath, params) {
    response.setHeader("Content-Type", "text/plain; charset=UTF-8");

    response.write("[", "UTF-8");

    var sep = "";
    var self = this;

    var query = dinfra.queryResources();

    if (params.filter) {
        /*
            Must concatenate the escape rpath here, since we
            don't want to match the rpath with the filter,
            and we have to do the work of withNamePrefix.
        */
        query.withNamePattern(new RegExp("^" +
            denum.escapeRegExp(rpath) + ".*" + params.filter)); // as well
    }
    else {
        // simpler approach ...
        query.withNamePrefix(rpath);
    }

    query.
        withAllVersions().
        withTerminations().
        invoke(function (error, result) {
            if (error != null) {
                self.sendError("resource-service", {
                        operation: "resource-listing",
                        path: rpath,
                        error: error
                    });
            }
            else if (result == null) {
                response.end("]", "UTF-8");
            }
            else {
                response.write(sep + JSON.stringify(result), "UTF-8");
                sep = ",\n";
            }

            return (false);
        });
}

ResourceService.prototype.sendResourceDirectory = function (request, response,
        resource, prefix, path, rpath, params) {
    response.setHeader("Content-Type", "text/html; charset=UTF-8");

    var writer = new dhtml.HTMLWriter(response);
    var title = "List " + resource.getSegment();
    var relative;
    var basename;

    if (path.lastIndexOf("/") == path.length - 1) {
        relative = "";
        basename = "";
    }
    else {
        relative = resource.getSegment() + "/";
        basename = resource.getSegment();
    }

    this.sendStandardStart(request, writer, title);

    writer.
        beginElement("div", { class: 'content summary' }).
           sendContent("as: ").
           sendElement("a",
               { href: basename + ";list" },
               "JSON (deep)").
        endElement().
        beginElement("div", { class: 'content' });

    var self = this;
    var query = dinfra.queryResources();

    query.
        withNoAssumptions().
        withParentName(resource.name).
        withOrderBySegment(true).
        on('error', function (error) {
            self.sendError("resource-service", {
                    operation: "resource-listing",
                    error: error
                });
        }).
        on('result', function (info) {
            info.segment = info.name.substr(resource.name.length + 1);

            writer.
                beginElement("div", { class: 'line' }).
                   sendElement("a", { href: relative + info.segment },
                   info.segment).
                endElement();

            this.next();
        }).
        on('end', function () {
            writer.endElement("div");

            self.sendStandardFinish(request, writer);

            response.end();
        }).
        next();
}

ResourceService.prototype.sendResourceVersions = function (response, resource,
        versions) {
    var map = resource.mapVersions();

    this.sendResourceJSON(response, resource, map, "versions-delivery");
}

ResourceService.prototype.handleResource = function (request, response,
        prefix, path, rpath, params, resource) {
    if (params.meta) {
        this.sendResourceMeta(response, resource, params.meta);
    }
    else if (params.versions) {
        this.sendResourceVersions(response, resource, params.versions);
    }
    else if (params.list) {
        this.sendResourceListing(response, prefix, path, rpath, params);
    }
    else if (resource.type == dresource.RTYPE.DIR) {
        this.sendResourceDirectory(request,
            response, resource, prefix, path, rpath, params);
    }
    else {
        this.addResourceHeaders(response, resource);
        this.sendResourceContent(response, resource);
    }
}

ResourceService.prototype.handle = function (request, response, prefix, path) {
    var params = {};
    var rpath = this.root + this.stripParamsPath(path, params);
    var self = this;
    var openOpts = {
            termination: (params.meta ||
                params.version ||
                params.versions),
            version: params.version
        };

    if ((rpath.length > 0) && (rpath.lastIndexOf("/") == rpath.length - 1)) {
        rpath = rpath.substr(0, rpath.length - 1);
    }

    dinfra.openResource(rpath, openOpts,
        function (error, resource) {
            if (error != null) {
                self.sendError(request, response, path, 500,
                    "could not load resource " + rpath);
            }
            else if (resource == null) {
                self.sendError(request, response, path, 404,
                    "could not find resource " + rpath);
            }
            else {
                self.handleResource(request, response, prefix, path, rpath,
                    params, resource);
            }
        });
}

exports.ResourceService = ResourceService;
