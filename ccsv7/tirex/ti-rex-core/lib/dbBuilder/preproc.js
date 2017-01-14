/**
 * Created by osohm on 28/05/15.
 */

'use strict';

var fs = require('fs');

/**
 * Helper for preprocessing *.tirex.json files
 * @param jsonFile
 * @param existingMacros
 * @param logger
 * @param callback
 */
exports.processFile = function(jsonFile, existingMacros, logger, callback) {
    fs.readFile(jsonFile, 'utf8', function (err, jsonText) {
        if (err) {
            logger.log('info', 'File ' + jsonFile + ' not found, skipping ...');
            return callback();
        }
        logger.log('info', 'Read ' + jsonFile + ' sucessfully');
        var preprocResult;
        try {
            preprocResult = exports.process(jsonText, existingMacros);
        } catch (e) {
            return callback('Error preprocessing json file ' + jsonFile + ': ' + e.message);
        }
        logger.log('info', 'Preprocessed json data');
        for (var i = 0; i < preprocResult.unresolvedMacros.length; i++) {
            logger.log('error', 'Unresolved macro: ' + preprocResult.unresolvedMacros[i]);
        }
        if (preprocResult.unresolvedMacros.length > 0) {
            return callback('Aborting due to unresolved macros');
        }
        callback(null, preprocResult);
    });
};

/**
 *
 * - array macros are converted to text macros
 *    + cannot use '.' in the name (reserved for setmacro references)
 * - text macros are replaced in the json text
 *    + cannot use '.' in the name (reserved for setmacro references)
 * - set macros are expanded in the objectified json
 *    + fields can only contain the reference to the macro, nothing else (unlike text macros)
 */

exports.process = function(jsonText, existingMacros) {
    var macroName;
    var macro;

    var macros = { text: {}, set: {}};

    if (existingMacros != null) {
        for (var prop in macros) {
            if (macros.hasOwnProperty(prop)) {
                if (existingMacros[prop] != null) {
                    macros[prop] = deepCopy(existingMacros[prop]);
                }
            }
        }
    }

    // find all text and array macro definitions
    // NOTE: ARRAY MACROS ARE CONVERTED TO TEXT MACROS
    var records = JSON.parse(jsonText);
    findTextAndArraymacroDefs(records);

    // first replace all text macros inside other text macros; do as many passes as necessary until
    // there no more nested text macros
    replaceNestedTextmacros();

    // now replace all text macros in the json text in a single pass
    var jsonTextResult = replaceMacros(jsonText, macros.text);

    records = JSON.parse(jsonTextResult.text);

    // now process the setmacros
    if (findSetmacroDefs(records) === true || macros.set != null) {
        expandSetmacros(records);
    }

    // remove all macro definition records
    for (var ifr = records.length - 1; ifr >= 0; ifr--) {
        var finalRecord = records[ifr];
        if (finalRecord.textmacro != null || finalRecord.arraymacro != null || finalRecord.setmacro != null) {
            records.splice(ifr, 1);
        }
    }

    // check for any unresolved macros
    var unresolvedMacros = findUnresolvedMacros(records);
    
    return {records: records, unresolvedMacros: unresolvedMacros, macros: macros};

    /**
     *
     * @param records
     * @returns {Array}
     */
    function findUnresolvedMacros(records) {
        var text = JSON.stringify(records); // TODO: performance?
        var $macroRe = /\$\(.*?\)/g;
        var execResult;
        var unresolvedMacros = [];
        while ((execResult = $macroRe.exec(text)) !== null) {
            unresolvedMacros.push(execResult[0]);
        }
        return unresolvedMacros;
    }
    
    /**
     * find all textmacro and arraymacro definitions
     * NOTE: ARRAY MACROS ARE CONVERTED TO TEXT MACROS
     */
    function findTextAndArraymacroDefs(records) {
        for (var i = 0; i < records.length; i++) {
            var record = records[i];
            if (record.textmacro != null) {
                if (record.value == null) throw 'textmacro must have a "value"';
                macros.text[record.textmacro] = {value: record.value};
            }
            else if (record.arraymacro != null) {
                if (record.value == null) throw 'arraymacro must have a "value"';
                macros.text[record.arraymacro] = {value: record.value.join('","')};
            }
        }
    }

    /**
     * replace all text macros inside other text macros; do as many passes as necessary until
     * there no more nested text macros
     */
    function replaceNestedTextmacros() {
        var count = Number.MAX_VALUE;
        var previousCount;
        do {
            previousCount = count;
            count = 0;
            for (macroName in macros.text) {
                if (macros.text.hasOwnProperty(macroName)) {
                    var result = replaceMacros(macros.text[macroName].value, macros.text);
                    count += result.count;
                    macros.text[macroName].value = result.text;
                }
            }
        } while (count > 0 && count < previousCount);
        if (count >= previousCount) throw 'Circular Macro';
    }

    /**
     *
     * @param text
     * @param macroTable
     * @param macroType
     * @returns {number}
     */
    function replaceMacros(text, macroTable) {
        var $macroRe = /\$\((.*?)\)/g; // looks for '$(macroname)' and remembers macroname
        var replacedCount = 0;
        var newtext = text.replace($macroRe, function (match, macroname) {
            macro = macroTable[macroname];
            if (macro != null) {
                replacedCount++;
                return macro.value;
            } else {
                return match; // don't replace
            }
        });
        var result = {count: replacedCount, text: newtext};
        return result;
    }

    /**
     * find all setmacro definitions
     */
    function findSetmacroDefs(records) {
        var found = false;
        for (var i = 0; i < records.length; i++) {
            var record = records[i];
            if (record.setmacro != null) {
                if (record.values == null) throw 'setmacro must have "values"';
                if (record.fields == null) throw 'setmacro must have "fields"';
                var fieldIndices = {};
                for (var f = 0; f < record.fields.length; f++) {
                    var field = record.fields[f];
                    fieldIndices[field] = f;
                }
                macros.set[record.setmacro] = {values: record.values, fieldIndices: fieldIndices};
                found = true;
            }
        }
        return found;
    }

    /**
     * find and expand set macros
     *
     * @param records
     */
    function expandSetmacros(records) {
        // find and expand set macros
        for (var iRecord = records.length - 1; iRecord >= 0; iRecord--) {
            var record = records[iRecord];
            var fieldsToReplace = {};
            var numSets = 0;
            if (find(record) === true) {
                var expandedRecords = expand(record);
                // replace original record with expanded records
                var spliceArgs = [iRecord, 1].concat(expandedRecords);
                Array.prototype.splice.apply(records, spliceArgs);
            }
        }

        // check if a record using a setmacro
        function find(record) {
            var $macrosetRe = /\$\((.*?)\.(.*?)\)/; // $(setmacroname.fieldname)
            var found = false;
            for (var recordField in record) {
                if (record.hasOwnProperty(recordField) && typeof recordField === 'string') {
                    if ($macrosetRe.test(record[recordField]) === true) { // test is faster than exec
                        var matchResult = $macrosetRe.exec(record[recordField]);
                        var setmacro = matchResult[1];
                        var setmacroField = matchResult[2];
                        if (macros.set[setmacro] != null) {
                            // we found a setmacro usage
                            found = true;
                            if (record[recordField] !== matchResult[0]) throw 'Field value must only consist of setmacro reference';
                            fieldsToReplace[recordField] = {setmacro: setmacro, setmacroField: setmacroField};
                            if (macros.set[setmacro].values.length > numSets) {
                                numSets = macros.set[setmacro].values.length;
                            }
                        }
                    }
                }
            }
            return found;
        }

        // expand the record
        function expand(record) {
            var expandedRecords = [];
            for (var i = 0; i < numSets; i++) {
                var newRecord = deepCopy(record);
                for (var recordField in fieldsToReplace) {
                    if (fieldsToReplace.hasOwnProperty(recordField)) {
                        var setmacro = fieldsToReplace[recordField].setmacro;
                        var setmacroField = fieldsToReplace[recordField].setmacroField;
                        var fieldIndex = macros.set[setmacro].fieldIndices[setmacroField];
                        newRecord[recordField] = macros.set[setmacro].values[i][fieldIndex];
                    }
                }
                expandedRecords.push(newRecord);
            }
            return expandedRecords;
        }
    }

    /**
     * Based on http://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-clone-an-object/5344074#5344074
     * Note: it doesn't copy functions, Date and Regex's
     * @param obj
     * @returns {*}
     */
    function deepCopy(obj) { // TODO: move into a util class
        return JSON.parse(JSON.stringify(obj));
    }

};