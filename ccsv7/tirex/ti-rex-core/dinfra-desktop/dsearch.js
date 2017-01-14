// Copyright (C) 2015-2016 Texas Instruments Incorporated - http://www.ti.com/
const util = require('util');
const denum = require('./denum');
const djson = require('./djson');
const umeta = require('./unicode-meta.json');
const TRACE = null; // console.log; // set to console.log for trace

/**
 * A tokenizer accepts blocks of text and chops that text up into
 * meaningful tokens for further analysis and handling.  A tokenizer
 * can take any segment of text and produce multiple, even overlapping
 * tokens from it to aid in search.  For example, "step-through" might
 * render two tokens "step-through" and "through".  Typically, a tokenizer
 * is selected for a specific type of text: such as prose, or code; and
 * a specific script or locale.  Tokenizers must be stateless.
 */
function Tokenizer() {
}

/**
 * Tokenize some text and send the results to the given function,
 * one at a time in sequence.
 */
Tokenizer.prototype.tokenizeText = function (text, fn) {
    throw new denum.UnsupportedError();
}

exports.Tokenizer = Tokenizer;

/**
 * A pattern tokenizer finds tokens via a RegExp pattern string.
 */
util.inherits(PatternTokenizer, Tokenizer);

function PatternTokenizer(pattern) {
    Tokenizer.call(this);

    this.pattern = new RegExp(pattern.toString(), "g");
}

PatternTokenizer.prototype.tokenizeText = function (text, fn) {
    var lastIndex = 0;

    while (lastIndex < text.length) {
        this.pattern.lastIndex = lastIndex;

        var results = this.pattern.exec(text);

        if (results == null) {
            lastIndex = text.length;
        }
        else {
            lastIndex = this.pattern.lastIndex;

            fn(results[0]);
        }
    }
}

util.inherits(Latin1Tokenizer, PatternTokenizer);

function Latin1Tokenizer() {
    var alpha = "[A-Za-z\u00c0-\u00d6\u00d8-\u00f6\u00f8-\u00ff]";
    var digit = "[0-9]";
    var punc = "\\-|\\.";
    var any = alpha;
    var start = any;
    var middle = any + "|" + digit + "|" + punc;
    var end = any + "|" + digit;

    PatternTokenizer.call(this, "(" + start + ")(" + middle + ")*(" +
        end + ")");
}

exports.Latin1Tokenizer = Latin1Tokenizer;

/**
 * A Normalizer accepts raw tokens from a tokenizer and processes them into
 * any number of normalized tokens, calling a supplied function once for
 * each output token.  A normalizer will typically perform case folding,
 * for a script that supports it (eg. Latin), or width folding for a script
 * that supports that (eg. Hiragana).  A normalizer will also typically
 * omit words that occur so commonly in a typical corpus for a language as
 * to be unimportant for searching (such as "and" and "the" in English).
 * The normalizer may use the unfolded raw token to make a distinction
 * in this case.  Normalizers must be stateless.
 */
function Normalizer() {
}

Normalizer.prototype.normalizeToken = function (token, fn) {
    throw new denum.UnsupportedError();
}

exports.Normalizer = Normalizer;

/**
 * A MappingNormalizer maps tokens and parts of tokens to
 * other tokens and parts.  It can also elide whole tokens
 * that have no mappings.
 */
util.inherits(MappingNormalizer, Normalizer);

function MappingNormalizer(wholes, parts) {
    Normalizer.call(this);

    this.wholes = wholes;
    this.parts = parts;

    for (var token in wholes) {
        if (wholes[token] == null) {
        }
        else if (typeof(wholes[token]) != "string") {
            throw new RangeError("all wholes must be valid strings or null: " +
                token + " typeof is " + typeof(wholes[token]));
        }
    }

    var length = 0;

    for (var token in parts) {
        if (token.length > length) {
            length = token.length;
        }

        if (typeof(parts[token]) != "string") {
            throw new RangeError("all parts must be valid strings: " +
                token + " typeof is " + typeof(parts[token]));
        }
    }

    this.maxPartLength = length;
}

MappingNormalizer.prototype.normalizeToken = function (token, fn) {
    var result;

    if (token in this.wholes) {
        result = this.wholes[token];
    }
    else {
        var index = 0;
        var length = token.length;

        result = "";

        while (index < length) {
            var sub = this.maxPartLength;

            if (sub > length) {
                sub = length;
            }

            var out = null;

            while ((sub > 0) &&
                    ((out = this.parts[token.substr(index, sub)]) == null)) {
                --sub;
            }

            if (sub > 0) {
                result += out;
                index += sub;
            }
            else {
                result += token.substr(index++, 1);
            }
        }
    }

    if (result != null) {
        fn(result);
    }
}

exports.MappingNormalizer = MappingNormalizer;

/**
 * The latin1 normalizer is a very simple normalizer, really only
 * good for English, if that.  Case folding is borrowed from UNICODE,
 * which actually normalizes more than Latin1.
 */
util.inherits(Latin1Normalizer, MappingNormalizer);

function Latin1Normalizer() {
    MappingNormalizer.call(this, {
            the: null,
            and: null,
            a: null,
            an: null,
            to: null,
        },
        umeta.fold);
}

Latin1Normalizer.prototype.normalizeToken = function (token, fn) {
    MappingNormalizer.prototype.normalizeToken.call(this, token, fn);
}

exports.Latin1Normalizer = Latin1Normalizer;

/**
 * The UNICODENormalizer currently assumes that all text is
 * already in NFC.  All it does is takes the character stream
 * in each token and case-folds it to remove diacritical marks.
 *
 * http://unicode.org/reports/tr15
 */
util.inherits(UNICODENormalizer, MappingNormalizer);

function UNICODENormalizer() {
    MappingNormalizer.call(this, {}, umeta.fold);
}

UNICODENormalizer.prototype.normalizeToken = function (token, fn) {
    MappingNormalizer.prototype.normalizeToken.call(this, token, fn);
}

exports.UNICODENormalizer = UNICODENormalizer;

/**
 * State aggregates analyzer state between passes of different
 * classifications of text.
 */
function State(analyzer) {
    this.analyzer = analyzer;
    this.tokens = {};
    this.ranked = [];
    this.list = null;

    var self = this;

    this.tokenizedBound = this.tokenizedPrivate.bind(this);
    this.normalizedBound = this.normalizedPrivate.bind(this);
    this.tokenizer = null;
    this.normalizer = null;
}

/**
 * Function to receive the results from a tokenizer pass.
 */
State.prototype.tokenizedPrivate = function (token) {
    this.normalizer.normalizeToken(token, this.normalizedBound);
}

/**
 * Function to receive the results from a normalizer pass.
 */
State.prototype.normalizedPrivate = function (token) {
    var record = this.tokens[token];

    if (record != null) {
        record.count++;
    }
    else {
        record = { token: token, count: 1 };

        this.tokens[token] = record;

        this.ranked.push(record); // keep partial order
    }
}

/**
 * Return a ranked list of token records.
 */
State.prototype.getRankedList = function () {
    if (this.list == null) {
        denum.binarySort(this.ranked, null, function (left, right) {
                return (right.count - left.count); // keep partial order
            });

        var list = [];

        this.ranked.forEach(function (record) {
                list.push(record.token);
            });

        this.list = list;
    }

    return (this.ranked);
}

/**
 * Return a ranked list of token strings.
 */
State.prototype.getTokenList = function () {
    this.getRankedList(); // sort if needed

    return (this.list);
}

/**
 * Provide text of a given locale, script and type.
 */
State.prototype.text = function (text, opts) {
    try {
        this.tokenizer = this.analyzer.selectTokenizer(opts);
        this.normalizer = this.analyzer.selectNormalizer(opts);

        this.tokenizer.tokenizeText(text, this.tokenizedBound);
    }
    finally {
        this.tokenizer = null;
        this.normalizer = null;
    }
}

State.prototype.json = function (json, opts) {
    var walker = new djson.Walker();
    var self = this;

    walker.sendStringValue = function (context, topic, last) {
            self.text(topic, opts); 
        };

    walker.sendValue(null, json, true);
}

/**
 * Furnish JSON meta-data with the right kind of additions to
 * support free text search from the completed analyzer state.
 */
State.prototype.asSearchJSONProtected = function () {
    var json = {};

    json[this.analyzer.name] = {};
    json[this.analyzer.name][this.analyzer.version] = {
            tokens: this.getTokenList(),
            name: this.analyzer.name,
            version: this.analyzer.version,
        };

    return (json);
}

/**
 * An Analyzer is a re-useable object that keeps information about
 * tokenizers and normalizers for text search applications.
 * Each analyzer has a name and version.  These are used to
 * keep track of exactly how to regenerate information about 
 * a subject when for example, either the subject changes, or
 * the analyzer itself changes.
 */
function Analyzer(name, version) {
    this.normalizers = [];
    this.tokenizers = [];
    this.name = name;
    this.version = version;
}

/**
 * Analyzes the text given the options and returns a
 * list of tokens in rank order.  Opts will select the
 * right normalizer and tokenizer to use.  Analyze can
 * only be used in those cases where the text is a single
 * block of all the same type (for example, code).
 * If mixing blocks for the same analysis, use newState()
 * to create a state for analysis instead.
 */
Analyzer.prototype.analyze = function (text, opts) {
    var state = this.newState();

    state.text(text, opts);

    return (state.getTokenList());
}

Analyzer.prototype.selectPrivate = function (list, opts) {
    var index = 0;
    var found = false;

    do {
        found = list[index++];

        if (found.opts == null) {
            // OK
        }
        else if (opts == null) {
            // OK
        }
        else {
            for (var name in opts) {
                if (found.opts[name] != opts[name]) {
                    if (found.opts[name] != null) {
                        found = null;
                        break;
                    }
                }
            }
        }
    }
    while ((found == null) && (index < list.length));

    return (found ? found.select : null);
}

Analyzer.prototype.selectTokenizer = function (opts) {
    return (this.selectPrivate(this.tokenizers, opts));
}

Analyzer.prototype.selectNormalizer = function (opts) {
    return (this.selectPrivate(this.normalizers, opts));
}

Analyzer.prototype.addTokenizer = function (tokenizer, opts) {
    this.tokenizers.push({ select: tokenizer, opts: opts });
}

Analyzer.prototype.addNormalizer = function (normalizer, opts) {
    this.normalizers.push({ select: normalizer, opts: opts });
}

/**
 * Create a new state for analyzing text: this is used in those
 * cases where a corpus contains text with different characteristics
 * (locale, script and type).
 */
Analyzer.prototype.newState = function () {
    return (new State(this));
}

exports.Analyzer = Analyzer;
exports.LATIN1_ANALYZER = new Analyzer("latin1", "0.1");

exports.LATIN1_ANALYZER.addTokenizer(new Latin1Tokenizer(), {});
exports.LATIN1_ANALYZER.addNormalizer(new UNICODENormalizer(), {});

