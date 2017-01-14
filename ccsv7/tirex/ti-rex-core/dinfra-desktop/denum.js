// Copyright (C) 2015-2016 Texas Instruments Incorporated - http://www.ti.com/
const util = require('util');
const Q = require('q');
const TRACE = null; // console.log; // set to console.log for trace

function Enumeration() {
    this.list = []; 
}

Enumeration.prototype.withDeclare = function (index, name) {
    index = 1 * index;
    name = "" + name;

    this.list[index] = name;
    this[name] = index;

    return (this);
}

Enumeration.prototype.ensureValid = function (anIndex) {
    var index = 1 * anIndex;
    var result;

    if ((index < 0) || (index >= this.list.length) ||
            ((result = this.list[index]) == null)) { // either undefined or null
        throw new Error("invalid index: " + anIndex);
    }

    return (index);
}

Enumeration.prototype.nameOf = function (index) {
    var name;

    if (index == null) { // either null or undefined
        name = index; // set it the same, null or undefined
    }
    else {
        // do any type casting and check validity,
        // return as number and index into list for name.
        name = this.list[this.ensureValid(index)];
    }

    return (name);
}

/**
 * Because Error is inherited weirdly and this needs
 * to be done consistently.
 */
util.inherits(ExtendError, Error);

function ExtendError(message) {
    Error.captureStackTrace(this, this.constructor);

    this.name = this.constructor.name;
    this.message = message;
}

exports.ExtendError = ExtendError;

/**
 * When the state of some process doesn't permit a particular
 * at this time.
 */
util.inherits(StateError, ExtendError);

function StateError(message) {
    ExtendError.call(this, message);
}

exports.StateError = StateError;

/**
 * When a pathway, option or configuration is not supported.
 */
util.inherits(UnsupportedError, ExtendError);

function UnsupportedError(message) {
    if (message == null) {
        message = "unsupported operation";
    }

    ExtendError.call(this, message);
}

exports.UnsupportedError = UnsupportedError;
exports.configOverlay = function (defaults, opts) {
        var results = {};

        for (var v in defaults) {
            results[v] = defaults[v];
        }

        for (var v in opts) {
            results[v] = opts[v];
        }

        return (results);
    };


exports.cardinals = function () {
        var en = new Enumeration();

        for (var i = 0; i < arguments.length; i++) {
            en.withDeclare(i, arguments[i]);
        }

        return (en);
    };

/**
 * Escapes the string for "RegExp" processing,
 */
exports.escapeRegExp = function (s) {
        s = s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');

        return (s);
    };

/**
 * Declare a property as constant (uneditable).
 */
exports.constantProperty = function (owner, fieldName, fieldValue) {
        if (arguments.length == 2) {
            fieldValue = owner[fieldName];
        }

        Object.defineProperty(owner, fieldName, {
                configurable: false,
                enumerable: true,
                writable: false,
                value: fieldValue
            });
    };

/**
 * Declare a property as constant and hidden.
 */
exports.constantHidden = function (owner, fieldName, fieldValue) {
        if (arguments.length == 2) {
            fieldValue = owner[fieldName];
        }

        Object.defineProperty(owner, fieldName, {
                configurable: false,
                enumerable: false,
                writable: false,
                value: fieldValue
            });
    };

/**
 * Declare a property with a getter.
 */
exports.getterProperty = function (owner, fieldName, fieldFunction) {
        if (!(fieldFunction instanceof Function)) {
            throw new RangeError("need fieldFunction");
        }

        Object.defineProperty(owner, fieldName, {
                configurable: false,
                enumerable: true,
                get: fieldFunction,
            });
    };

/**
 * Return the components of a version string as a series
 * of comparable values.
 */
exports.parseVersion = function (version) {
        var array;

        if (version == null) {
            array = null;
        }
        else if (version == "") {
            array = [];
        }
        else if (typeof(version) != "string") {
            array = parseVersion("" + version);
        }
        else {
            var index;

            array = [];

            while (((index = version.indexOf('.')) >= 0) || (version != "")) {
                var part;

                if (index >= 0) {
                    part = version.substring(0, index);
                    version = version.substring(index + 1);
                }
                else {
                    part = version;
                    version = "";
                }

                if (part == "") {
                    // ignore
                }
                else {
                    if (/^[0-9]+$/.test(part)) {
                        part = 1 * part;
                    }

                    array.push(part);
                }
            }
        }

        return (array);
    };

/**
 * Compares two version strings and returns 0 for equal,
 * -1 for left < right, and 1 for left > right.
 */
exports.compareVersions = function (left, right) {
        var leftArray = exports.parseVersion(left);
        var rightArray = exports.parseVersion(right);
        var result;

        if (leftArray == null) {
            leftArray = [];
        }

        if (rightArray == null) {
            rightArray = [];
        }

        var index = 0;
        var result = 0;

        while ((result == 0) && (index < leftArray.length) &&
                (index < rightArray.length)) {
            if (leftArray[index] < rightArray[index]) {
                result = -1;
            }
            else if (leftArray[index] > rightArray[index]) {
                result = 1;
            }
            else {
                index++;
            }
        }

        if (result == 0) {
            if (leftArray.length < rightArray.length) {
                result = -1;
            }
            else if (leftArray.length > rightArray.length) {
                result = 1;
            }
            else {
                // all the same
            }
        }

        return (result);
    };

function pad(c, n, t) {
    t = "" + t; // coerce to string

    while (t.length < n) {
        t = "" + c + t;
    }

    return (t);
}

exports.pad = pad;

/**
 * Convert a JS Date, or milliseconds since 1970 into an RFC822
 * compliant date for use in SMTP and HTTP etc.
 */
exports.rfc822Date = function (date) {
        if (typeof(date) == "number") {
            date = new Date(date);
        }

        // HTTP-Date AKA RFC822 date-time string ...
        // See http://www.w3.org/Protocols/rfc2616/rfc2616-sec14.html
        // Don't use toISOString() here.
        // Undoubtedly available in a zillion date time libraries.
        var dateText = [ // from RFC822
                'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
            ][date.getUTCDay()] + // zero-based
            ", " +
            date.getUTCDate() + // don't pad this
            " " + [ // from RFC822
                'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
            ][date.getUTCMonth()] +  // zero-based
            " " + date.getUTCFullYear() + // four digits
            " " + exports.pad('0', 2, date.getUTCHours()) + // zero based, 24hr 
            ":" + exports.pad('0', 2, date.getUTCMinutes()) +
            ":" + exports.pad('0', 2, date.getUTCSeconds()) +
            " GMT"; // do not use UTC here

        return (dateText);
    };

/**
 * Search using a custom comparator.  Simple newtonian binary search. 
 * Its not sophisticated.  Returns the index of the name in the list,
 * or the negative index where it could be inserted, minus one.
 * If the upper parameter is provided, it sets an upper limit on
 * the sorted space, which is useful when sorting existing lists.
 */
exports.binarySearch = function (list, record, comparator, upper) {
    var lower = 0;
    var found = false;

    if (upper == null) {
        upper = list.length;
    }

    while (lower != upper) {
        var half = ((lower + upper) >> 1);
        var trecord = list[half];
        var status = comparator(record, trecord);

        if (status < 0) {
            upper = half; // narrow search range
        }
        else {
            if (status == 0) {
                found = true;
            }

            lower = half + 1; // narrow search range
        }
    }

    if (found) {
        --lower; // the LAST match in the case of partial ordering
    }
    else {
        lower = -lower - 1;
    }

    return (lower);
}

/**
 * Sort using a customer comparator.  We just do a kind of bubble sort
 * augmented with newtonian binary search.  Its not sophisticated.
 * If add is not null it will be inserted into the list, which is
 * assumed to have already been sorted.  Otherwise, it will sort the
 * list itself.  Returns the position of the last item inserted, or -1
 * if nothing was inserted.  Maintains partial ordering.
 * Unlike stringSort, this actually uses the binarySearch function as
 * part of its implementation.
 */
exports.binarySort = function (list, add, comparator) {
    var index; // the sorted index;
    var position = -1;

    if (add != null) {
        index = list.length;
        list.push(add);
    }
    else if (list.length == 0) { // just for form, not really necessary
        index = 0;
    }
    else {
        index = 1; // the first value is always already sorted against itself
    }

    while (index < list.length) {
        var record = list[index];
        var position = exports.binarySearch(list, record, comparator, index);

        if (position < 0) {
            position = -position - 1;
        }
        else {
            position++;
        }

        if (position == index) {
            // can happen when sorts to end - means we don't move this record
        }
        else {
            // remove and insert ...
            list.splice(position, 0, list.splice(index, 1)[0]);
        }

        index++;
    }

    return (position);
}

/*
    See comments in dinfra.js
*/
exports.stringCompare = function (left, right) {
    var result;

    if (left === right) {
        result = 0;
    }
    else if (left == null) {
        result = 1; // sort nulls after content
    }
    else if (right == null) {
        result = -1; // sort nulls after content
    }
    else if (left > right) {
        result = 1;
    }
    else if (left < right) {
        result = -1;
    }
    else {
        throw new Error("incomparable: " + left + " <> " + right);
    }

    return (result);
}

/**
 * Search using unicode code-point collating order - list of strings.
 * Simple newtonian binary search.  Its not sophisticated.
 * Returns the index of the name in the list, or the negative index
 * where it could be inserted, minus one.  If the optional upper argument
 * is provided, it sets the upper limit of the existing sorted list,
 * which is useful when sorting a list in place.
 */
exports.stringSearch = function (list, name, upper) {
    var lower = 0;
    var found = false;

    if (upper == null) {
        upper = list.length;
    }

    while (lower != upper) {
        var half = ((lower + upper) >> 1);
        var tname = list[half];

        if (name < tname) {
            upper = half; // narrow search range
        }
        else {
            if (name === tname) {
                found = true;
            }

            lower = half + 1;
        }
    }

    if (found) {
        --lower; // the LAST match in the case of partial ordering
    }
    else {
        lower = -lower - 1;
    }


    return (lower);
}

/**
 * Sort using unicode code-point collating order - list of strings.
 * We just do a kind of bubble sort augmented with newtonian
 * binary search.  Its not sophisticated.
 * If add is not null it will be inserted into the list, which is
 * assumed to have already been sorted.  Otherwise, it will sort
 * the list itself.  Returns the position of the last item inserted,
 * or -1 if nothing was inserted.  Maintains partial ordering.
 */
exports.stringSort = function (list, add) {
    var index; // the sorted index;
    var position = -1;

    if (add != null) {
        index = list.length;
        list.push(add);
    }
    else if (list.length == 0) { // just for form, not really necessary
        index = 0;
    }
    else {
        index = 1; // the first value is always already sorted against itself
    }

    while (index < list.length) {
        var name = list[index];
        var lower = 0;
        var upper = index;

        // note, it is MUCH faster to inline this (at node-0.10.26)
        while (lower != upper) {
            var half = ((lower + upper) >> 1);
            var tname = list[half];

            if (name < tname) {
                upper = half; // narrow search range
            }
            else {
                lower = half + 1; // narrow search range
            }
        }

        position = lower;

        if (position == index) {
            // can happen when sorts to end - means we don't move
        }
        else {
            list.splice(position, 0, list.splice(index, 1)[0]);
        }

        index++;
    }

    return (position);
}

function NamedLock(name, callback) {
    this.next = null;
    this.name = name;
    this.prev = this.openLocks[name];

    if (this.prev != null) {
        this.prev.next = this; 
    }

    this.openLocks[name] = this;
    this.callback = callback;
    this.used = false;
    this.id = NamedLock.prototype.idSeq++;

    if (TRACE) {
        TRACE("lock", this.id, "attempt", this.name);
    }
}

/**
 * This contains a map of open lock names to
 * the *last* requested opener.  That means that
 * the current owner of the lock is not necessarily
 * the one in openLocks.
 */
NamedLock.prototype.openLocks = {};

/**
 * An id counter so locks have unique numbers.
 */
NamedLock.prototype.idSeq = 1;

/**
 * This can be called repeatedly - its an internal only function.
 */
NamedLock.prototype.open = function () {
    if (this.prev == null) {
        if (TRACE) {
            TRACE("lock", this.id, "acquired", this.name);
        }

        this.used = true;
        this.callback(this);
    }
}

/**
 * Call this to close an acquired lock.  There is no callback,
 * since there is no waiting.
 */
NamedLock.prototype.close = function () {
    if (TRACE) {
        TRACE("lock", this.id, "released", this.name);
    }

    if (this.next != null) {
        this.next.prev = null;
        this.next.open();
        this.next = null;
    }
    else {
        // this is done to ensure that we don't keep names
        // around in memory.
        delete this.openLocks[this.name];
    }
}

function openNamedLock(name, callback) {
    new NamedLock(name, callback).open();
}

exports.openNamedLock = openNamedLock;

/**
 * As of node 0.10.26, buffer comparisons don't really
 * work, especially when trying to compare a SlowBuffer with a
 * regular Buffer.  So we roll our own ...
 */
function equalBuffers(left, right) {
    var length = left.length;
    var result;

    if (length != right.length) {
        result = false;
    }
    else {
        var index = 0;

        while ((index < length) &&
                (left[index] === right[index])) {
            index++;
        }

        result = (index === length);
    }

    return (result);
}

exports.equalBuffers = equalBuffers;

/**
 * Returns a string value that can be compared with another
 * string value for sorted order and equivalency.  The
 * method handles strings, numbers, booleans and Dates
 * in formal ways, and for anything else just concatenates
 * it to an empty string (invoking toString() and coercing
 * the result to a "string").
 *
 * Numbers are represented in an encoding of the binary form.
 *
 * Dates are just converted to their ISO-8601 form with milliseconds
 * in the UTC timezone (ie. toISOString()).
 *
 * Booleans are represented as the word true or false respectively.
 */
function compareTextForValue(value) {
    var vtype = typeof(value);
    var result;

    if (vtype === "string") {
        // no change
        result = value;
    }
    else if (vtype === "number") {
        result = renderNumberEncoding(value);
    }
    else if (vtype === "boolean") {
        result = "" + value;
    }
    else if (value instanceof Date) {
        result = value.toISOString();
    }
    else {
        result = "" + value;
    }

    return (result);
}

exports.compareTextForValue = compareTextForValue;

/**
 * Renders the JS number value as a hex-encoded IEEE-754 binary64,
 * with some adjustments to make the hex-encoding compare as
 * a plain string.  The IEEE form has:
 *
 * 1 bit sign indicator for the mantissa (1 for negative)
 * 11 bits of exponent including sign, zero adjusted for unsigned compare
 * 52 bits of mantissa
 *
 * Our form adjusts the sign indicator and exponent so that it will
 * compare as an unsigned number overall (IEEE compares as a signed
 * integer).
 */
function renderNumberEncoding(value) {
    var buf = new Buffer(8);

    if (Number.isNaN(value)) {
        value = NaN; // positive NaN specifically
    }

    buf.writeDoubleBE(value, 0);

    if (value == 0) {
        if (buf[0] == 0x80) { // negative signed zero can happen
            buf[0] = 0; // correct it now, since we only want one zero
        }
    }

    if (buf[0] & 0x80) {
        buf[0] = (buf[0] ^ 0xff); // invert
        buf[1] = (buf[1] ^ 0xe0); // invert
    }
    else {
        buf[0] = (buf[0] | 0x80); // toggle in the top bit
    }

    return ("F0x" + buf.toString("hex"));
}

exports.renderNumberEncoding  = renderNumberEncoding;

function parseNumberEncoding(s) {
    if (s.indexOf("F0x") != 0) {
        // short cut old-school number.
        return (new Number(s).valueOf());
    }

    var buf = new Buffer(s.substr(3), "hex");

    if (buf[0] & 0x80) {
        buf[0] = (buf[0] & 0x7f); // toggle in the top bit
    }
    else {
        buf[0] = (buf[0] ^ 0xff); // invert
        buf[1] = (buf[1] ^ 0xe0); // invert
    }

    // we don't encode negative zero, so we shouldn't get it out either

    return (buf.readDoubleBE(0));
}

exports.parseNumberEncoding = parseNumberEncoding;
