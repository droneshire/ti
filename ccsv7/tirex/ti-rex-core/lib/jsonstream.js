/**
 * Created by Oliver Sohm on 27/06/16.
 *
 * Based on https://github.com/substack/stream-handbook
 *
 * This is NOT a generic implementation for streaming any kind of object. It is optimized for tirex in that the smallest
 * unit to be stringified is intended to be a database record (object) which can be considered of a relatively small size of
 * about 2-3kb. Any further breakdown would not lower memory pressure much more.
 *
 * Supported structure:
 *
 * {
 *   key1: [UNIT1, UNIT2, UNIT3],
 *   key2: [UNIT4, UNIT5]
 * }
 *
 * Each array element UNITx is stringified separately using JSON.stringify and pushed to the stream. UNITx can be a
 * primitive, object or array.
 *
 */

'use strict';

var Readable = require('stream').Readable;
var inherits = require('util').inherits;

module.exports = Source; // object that's returned by a require call

function Source(obj, options) {
    Readable.call(this, options);
    this.obj = obj;
    this.arrLen = this.arrInd = 0;
    this.keys = Object.keys(obj);
    this.keysLen = this.keys.length;
    this.keyInd = -1;
}
inherits(Source, Readable);

Source.prototype._read = function (size) {
    var that = this;
    if (this.arrInd >= this.arrLen) {
        // done with previous array, prepare for next array
        this.keyInd++;
        this.arrInd = 0;
        if (this.keyInd === 0) {
            // the very first {
            this.push('{');
        }
        if (this.keyInd < this.keysLen) {
            // start next key with array
            this.arrLen = this.obj[this.keys[this.keyInd]].length;
            this.push(JSON.stringify(this.keys[this.keyInd]) + ':[');
            if (this.arrLen === 0) {
                // empty array
                endOfArray();
                return;
            }
        } else {
            // end the stream
            this.push(null);
            return;
        }
    }
    // stringify array element, TODO: would using iterator be faster?
    var string = JSON.stringify(this.obj[this.keys[this.keyInd]][this.arrInd]);
    if (string != null) {
        this.push(string);
    }
    if (this.arrInd < this.arrLen - 1) {
        // between array elements
        this.push(',');
    } else {
        endOfArray();
    }
    this.arrInd++;
    return;

    /**
     *
     */
    function endOfArray() {
        // end of array
        that.push(']');
        if (that.keyInd < that.keysLen - 1) {
            // between arrays
            that.push(',');
        } else {
            // the very last }
            that.push('}');
        }
    }
};
