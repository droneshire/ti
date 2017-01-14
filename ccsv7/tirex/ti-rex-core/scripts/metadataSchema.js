var packageVersion = {
        "id": "/PackageVersion",
        "type": "string",
        "pattern": "^([0-9]{1,2}[.][0-9]{1,2}[.][0-9]{1,2})([.].*)?"
    };

var coreType = {
    "id": "/CoreType",
    "type": "object",
    "properties": {
        "id": {
            "type": "string"
        },
        "name": {
            "type": "string"
        },

    },
    "required": [
        "id",
        "name"
    ]
};

var packageInfo = {
    "id": "/PackageInfo",
    "type": "object",
    "properties": {
        "id": {
            "type": "string"
        },
        "version": {
            "$ref": "/PackageVersion"
        }
    },
    "required": [
        "id",
        "version"
    ]
};

var packageSchema = {
    "id": "/PackageSchema",
    "type": "object",
    "properties": {
        "id": {
            "type": "string"
        },
        "name": {
            "type": "string"
        },
        "version": {
            "$ref": "/PackageVersion"
        },
        "type": {
            "type": "string",
            "pattern": "^(devices|devtools|software)$"
        },
        "license": {
            "type": "string",
            "pattern": "^[^/][^:](.)*(\.[^/]+)$"
        },
        "image": {
            "type": "string",
            "pattern": "^[^/][^:](.)*(\.[^/]+)$"
        },
        "description": {
            "type": "string"
        },
        "allowPartialDownload": {
            "type": "string",
            "pattern": "^(true|false)$"
        },
        "devices": {
            "type": "array",
            "items": {
                "type": "string"
            }
        },
        "metadataVersion": {
            "type": "string",
            "pattern": "^([0-9][.][0-9]{1,2}[.][0-9]{1,2})$"
        },
        "supplement": {
            "$ref": "/PackageInfo"
        },
        "packageCore": {
            "type": "string"
        },
        "dependencies": {
            "$ref": "/PackageInfo"
        }
    },
    "required": [
        "id",
        "name",
        "version",
        "type",
        "image",
        "description",
        "allowPartialDownload",
        "metadataVersion",
        "devices"
    ]
};

var packageArray = {
    "id": "/PackageArray",
    "type": "array",
    "items": {
        "$ref": "/PackageSchema"
    }
};

var deviceSchema = {
    "id": "/Devices",
    "type": "object",
    "properties": {
        "name": {
            "type": "string"
        },
        "id": {
            "type": "string"
        },
        "type": {
            "type": "string",
            "pattern": "^(device|family|subfamily)$"
        },
        "parent": {
            "type": "string"
        },
        "description": {
            "type": "string"
        },
        "image": {
            "type": "string",
            "pattern": "^[^/][^:](.)*(\.[^/]+)$"
        },
        "coreTypes": {
            "type": "array",
            "items": {
                "$ref": "/CoreType"
            }
        }
    },
    "required": [
        "id",
        "name",
        "type"
    ]
};

var deviceArray = {
    "id": "/DeviceArray",
    "type": "array",
    "items": {
        "$ref": "/Devices"
    }
};

var devtoolsSchema = {
    "id": "/DevTools",
    "type": "object",
    "properties": {
        "name": {
            "type": "string"
        },
        "id": {
            "type": "string"
        },
        "type": {
            "type": "string",
            "pattern": "^(board|ide|probe|programmer|utility)$"
        },
        "devices": {
            "type": "array",
            "items": {
                "type": "string"
            }
        },
        "description": {
            "type": "string"
        },
        "image": {
            "type": "string",
            "pattern": "^[^/][^:](.)*(\.[^/]+)$"
        },
        "connections": {
            "type": "array",
            "items": {
                "type": "string"
            }
        },
        "buyLink": {
            "type": "string",
            "pattern": "^(http(s)?:\\/\\/.)?(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)$"
        },
        "toolsPage": {
            "type": "string",
            "pattern": "^(http(s)?:\\/\\/.)?(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)$"
        }
    },
    "required": [
        "id",
        "name",
        "type",
        "description",
        "image"
    ]
};

var devToolsArray = {
    "id": "/DevToolsArray",
    "type": "array",
    "items": {
        "$ref": "/DevTools"
    }
};

var resourceContentSchema = {
    "id": "/Content",
    "type": "object",
    "properties": {
        "name": {
            "type": "string"
        },
        "devices": {
            "type": "array",
            "item": {
                "type": "string"
            }
        },
        "devtools": {
            "type": "array",
            "item": {
                "type": "string"
            }
        },
        "coreTypes": {
            "type": "array",
            "item": {
                "type": "string"
            }
        },
        "tags": {
            "type": "array",
            "item": {
                "type": "string"
            }
        },
        "resourceType": {
            "type": "string",
            "pattern": "^(project.ccs|protject.energia|project.iar|project.keil|file|file.importable|file.executable|folder|folder.importable|web.page|web.app|categoryInfo|other)$"
        },
        "fileType": {
            "type": "string",
            "pattern": "^[.][^.]+$"
        },
        "description": {
            "type": "string"
        },
        "location": {
            "type": "string",
            "pattern": "^((.+)[/]([^/]+)|(http(s)?:\\/\\/.)?(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{2,256}\\.[a-z]{2,6}\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*))$"
        },
        "categories": {
            "oneOf": [
                {
                    "type": "array",
                    "items": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        }
                    }
                },
                {
                    "type": "array",
                    "items": {
                        "type": "string"
                    }
                }
            ]
        },
        "mainCategories": {
            "oneOf": [
                {
                    "type": "array",
                    "items": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        }
                    }
                },
                {
                    "type": "array",
                    "items": {
                        "type": "string"
                    }
                }
            ]
        },
        "subCategories": {
            "oneOf": [
                {
                    "type": "array",
                    "items": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        }
                    }
                },
                {
                    "type": "array",
                    "items": {
                        "type": "string"
                    }
                }
            ]
        },
        "icon": {
            "type": "string",
            "pattern": "^[^/][^:](.)*(\.[^/]+)$"
        },
        "ide": {
            "type": "array",
            "items": {
                "type": "string",
                "pattern": "^(ccs|iar|keil)$"
            }
        },
        "hostOS": {
            "type": "array",
            "items": {
                "type": "string",
                "pattern": "^(macros|linux|win)$"
            }
        },
        "targetOS": {
            "type": "array",
            "items": {
                "type": "string",
                "pattern": "^(tirtos|freertos)$"
            }
        },
        "language": {
            "type": "array",
            "items": {
                "type": "string",
                "pattern": "^(english|chinese)$"
            }
        },
        "license": {
            "type": "string",
            "pattern": "^[^/][^:](.)*(\.[^/]+)$"
        },
        "compiler": {
            "type": "array",
            "items": {
                "type": "string",
                "pattern": "^(ccs|gcc|iar)$"
            }
        },
        "locationForDownload": {
            "type": "object",
            "$ref": "/LocationForDownload"
        },
        "advance": {
            "$ref": "/Advance"
        }
    },
    "required": [
        "name",
        "resourceType",
        "location",
        "mainCategories"
    ]
};

var locationForDownload = {
    "id": "/LocationForDownload",
    "type": "object",
    "properties": {
        "macos": {
            "type": "string",
            "pattern": "^[^/][^:](.)*(\.[^/]+)$"
        },
        "linux": {
            "type": "string",
            "pattern": "^[^/][^:](.)*(\.[^/]+)$"
        },
        "win": {
            "type": "string",
            "pattern": "^[^/][^:](.)*(\.[^/]+)$"
        }

    }
};

var advance = {
    "id": "/Advance",
    "type": "object",
    "properties": {
        "overrideProjectSpecDeviceId": "boolean"
    },
    "required": [
        "overrideProjectSpecDeviceId"
    ]
};

var contentArray = {
    "id": "/ContentArray",
    "type": "array",
    "items": {
        "$ref": "/Content"
    }
};

exports.contentArray = contentArray;
exports.advanceField = advance;
exports.locationForDownload = locationForDownload;
exports.resourceContentSchema = resourceContentSchema;
exports.devToolsArray = devToolsArray;
exports.devtoolsSchema = devtoolsSchema;
exports.deviceArray = deviceArray;
exports.deviceSchema = deviceSchema;
exports.packageArray = packageArray;
exports.packageSchema = packageSchema;
exports.packageInfo = packageInfo;
exports.coreType = coreType;
exports.packageVersion = packageVersion;