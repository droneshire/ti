/**
 * Progress
 *
 * osohm, 3/29/2016
 */

'use strict';

var logger = require('./logger')();

//module.exports = ProgressInfo; // object that's returned by a require call

/**
 * Constructor
 * @param numStages
 * @param numIterations
 * @param finalResult
 * @param scale: array of scale factors for each stage; scale is [0;1]
 * @constructor
 */
exports.ProgressInfo = function (numStages, numIterations, finalResult, scale) {
    // fields
    this.active = false;
    this.done = false;
    this.progress = 0; // cumulative progress [0;1] excluding current stage
    this.currentStageProgress = 0; // [0;1], un-scaled
    this.currentStageInd = 0;
    this.numStages = numStages;
    this.message = '';
    this.result = finalResult;
    if (scale == null) {
        this.scale = [];
        for (var i = 0; i < numStages; i++) {
            this.scale.push(1 / (numStages * numIterations)); // default: assume equal weight to each stage to keep it simple
        }
    } else {
        this.scale = scale;
        for (var j = 0; j < numStages; j++) {
            this.scale[j] /= numIterations;
        }
    }
    this.error = null;
    this.cancel = false;
    this.canCancel = false;
};

exports.ProgressInfo.prototype.setStageWorked = function(worked, total) {
    this.currentStageProgress = worked / total;
};

exports.ProgressInfo.prototype.stageDone = function() {
    this.progress += this.scale[this.currentStageInd];
    this.currentStageProgress = 0;
    if (this.currentStageInd < this.numStages - 1) {
        this.currentStageInd++;
    }
};

/**
 *
 * @returns {number}
 */
exports.ProgressInfo.prototype.getProgressPercent = function() {
    var overallProgress = this.progress + (this.currentStageProgress * this.scale[this.currentStageInd]);
    var progressPercent = Math.floor(1000 * overallProgress) / 10; // xx.x
    // cap at some %
    if (progressPercent >= 100) {
        progressPercent = 100;
    }
    return progressPercent;
};
