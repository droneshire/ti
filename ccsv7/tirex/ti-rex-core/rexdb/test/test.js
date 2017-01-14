/**
 * Created by osohm on 22/07/14.
 */

'use strict';
var fs = require('fs');
var assert = require('chai').assert;

var rexdb = require('../lib/rexdb.js');

describe('RexDB', function() {
    it('Inserting', function(done) {
        var doc1 = {prop1: 'A', prop2: 'B'};
        var doc2 = {prop1: 'C', prop2: 'A'};
        var doc3 = {prop1: 'A', prop2: 'Z'};
        var collection = new rexdb();
        collection.insert([doc1], function(err, results) {
            var msg = 'Returned results: ' + JSON.stringify(results);
            assert(err === null, err);
            assert.deepEqual(results[0], doc1, msg);
            assert(results.length === 1, msg);

            collection.insert([doc2, doc3], function(err, results) {
                var msg = 'Returned results: ' + JSON.stringify(results);
                assert(err === null, err);
                assert.deepEqual(results[0], doc1, msg);
                assert.deepEqual(results[1], doc2, msg);
                assert.deepEqual(results[2], doc3, msg);
                assert(results.length === 3, msg);
                done();
            });
        });
    });
    it('Removing all documents', function(done) {
        var doc1 = {prop1: 'A', prop2: 'B'};
        var doc2 = {prop1: 'C', prop2: 'A'};
        var doc3 = {prop1: 'A', prop2: 'Z'};
        var data = [doc1, doc2, doc3];
        var collection = new rexdb();
        collection.insertSync(data);
        collection.remove({}, function(err) {
            assert(err === null, err);
            collection.find({}, function(err, result) {
                assert(result.length === 0);
                done();
            });
        });
    });
    it('Save and load database', function(done) {
        var doc1 = {prop1: 'A', prop2: 'B'};
        var doc2 = {prop1: 'C', prop2: 'A'};
        var doc3 = {prop1: 'A', prop2: 'Z'};
        var data = [doc1, doc2, doc3];
        try {
            fs.unlinkSync('test.db'); // delete db files
            fs.unlinkSync('test.db.index');
        } catch(e) {}
        var collection = new rexdb('test.db');
        collection.insert(data, function(err) {
            assert(err == null);
            collection.save(function(err) {
                assert(err == null);
                var collectionLoaded = new rexdb('test.db');
                collectionLoaded.find({}, function(err, results) {
                    var msg = 'Returned results: ' + JSON.stringify(results);
                    assert(err == null);
                    assert.deepEqual(data, results, msg);
                    assert(results.length === 3);
                    done();
                });
            });
        });
    });
    describe('Queries', function() {
        describe('Find single property', function() {
            it('find all documents that have a property with the specified text', function(done) {
                var doc1 = {prop1: 'A', prop2: 'B'};
                var doc2 = {prop1: 'C', prop2: 'A'};
                var doc3 = {prop1: 'A', prop2: 'Z'};
                var data = [doc1, doc2, doc3];
                var collection = new rexdb();
                collection.insertSync(data);
                collection.find({prop1: 'A'}, function(err, results) {
                    var msg = 'Returned results: ' + JSON.stringify(results);
                    assert(err === null, err);
                    assert.deepEqual(results[0], doc1, msg);
                    assert.deepEqual(results[1], doc3, msg);
                    assert(results.length === 2, msg);
                    done();
                });
            });
            it('find first document that has a property with the specified text', function(done) {
                var doc1 = {prop1: 'A', prop2: 'B'};
                var doc2 = {prop1: 'A', prop2: 'Z'};
                var doc3 = {prop1: 'D', prop2: 'E'};
                var doc4 = {prop1: 'F', prop2: 'Z'};
                var data = [doc1, doc2, doc3, doc4];
                var collection = new rexdb();
                collection.insertSync(data);
                collection.findOne({prop2: 'Z'}, function(err, result) {
                    var msg = 'Returned results: ' + JSON.stringify(result);
                    assert(err === null, err);
                    assert.deepEqual(result, doc2, msg);
                    done();
                });
            });
            it('find number', function(done) {
                var doc1 = {prop1: 1, prop2: 'B'};
                var doc2 = {prop1: 2, prop2: 'A'};
                var doc3 = {prop1: 1, prop2: 'Z'};
                var data = [doc1, doc2, doc3];
                var collection = new rexdb();
                collection.insertSync(data);
                collection.find({prop1: 1}, function(err, results) {
                    var msg = 'Returned results: ' + JSON.stringify(results);
                    assert(err === null, err);
                    assert.deepEqual(results[0], doc1, msg);
                    assert.deepEqual(results[1], doc3, msg);
                    assert(results.length === 2, msg);
                    done();
                });
            });
            it('find boolean', function(done) {
                var doc1 = {prop1: false, prop2: 'B'};
                var doc2 = {prop1: true, prop2: 'A'};
                var doc3 = {prop1: false, prop2: 'Z'};
                var data = [doc1, doc2, doc3];
                var collection = new rexdb();
                collection.insertSync(data);
                collection.find({prop1: false}, function(err, results) {
                    var msg = 'Returned results: ' + JSON.stringify(results);
                    assert(err === null, err);
                    assert.deepEqual(results[0], doc1, msg);
                    assert.deepEqual(results[1], doc3, msg);
                    assert(results.length === 2, msg);
                    done();
                });
            });
            it('find documents that have a property that is either null or doesn\'t exist', function(done) {
                var doc1 = {prop1: null, prop2: 'B'};
                var doc2 = {prop1: 'C', prop2: 'A'};
                var doc3 = {prop2: 'Z'};
                var data = [doc1, doc2, doc3];
                var collection = new rexdb();
                collection.insertSync(data);
                collection.find({prop1: null}, function(err, results) {
                    var msg = 'Returned results: ' + JSON.stringify(results);
                    assert(err === null, err);
                    assert.deepEqual(results[0], doc1, msg);
                    assert.deepEqual(results[1], doc3, msg);
                    assert(results.length === 2, msg);
                    done();
                });
            });
            it('$in: find documents that have a property that has a specifed value, is null or doesn\'t exist', function(done) {
                var doc1 = {prop1: null, prop2: 'B'};
                var doc2 = {prop1: 'C', prop2: 'A'};
                var doc3 = {prop1: 'C'};
                var doc4 = {prop2: 'Z'};
                var doc5 = {prop2: 'A'};
                var data = [doc1, doc2, doc3, doc4, doc5];
                var collection = new rexdb();
                collection.insertSync(data);
                collection.find({prop1: {$in: ['C', null]}, prop2: {$in: ['A', null]}}, function(err, results) {
                    var msg = 'Returned results: ' + JSON.stringify(results);
                    assert(err === null, err);
                    assert.deepEqual(results[0], doc2, msg);
                    assert.deepEqual(results[1], doc3, msg);
                    assert.deepEqual(results[2], doc5, msg);
                    assert(results.length === 3, msg);
                    done();
                });
            });
        });

        describe('Find multiple properties', function() {
            var doc1 = {prop1: 'A', prop2: 'B', prop3: 'X'};
            var doc2 = {prop1: 'A', prop2: 'B'};
            var doc3 = {prop1: 'D', prop2: 'B', prop3: 'X'};
            var doc4 = {prop1: 'F', prop2: 'Z'};
            var data = [doc1, doc2, doc3, doc4];
            var collection = new rexdb();
            collection.insertSync(data);
            it('simple syntax: find all documents that have all properties with the specified text', function(done) {
                collection.find({prop2: 'B', prop3: 'X'}, function(err, results) {
                    var msg = 'Returned results: ' + JSON.stringify(results);
                    assert(err === null, err);
                    assert.deepEqual(results[0], doc1, msg);
                    assert.deepEqual(results[1], doc3, msg);
                    assert(results.length === 2, msg);
                    done();
                });
            });
            it('simple syntax: undefined means DON`T CARE', function(done) {
                var val;
                collection.find({prop2: 'B', prop3: val}, function(err, results) {
                    var msg = 'Returned results: ' + JSON.stringify(results);
                    assert(err === null, err);
                    assert.deepEqual(results[0], doc1, msg);
                    assert.deepEqual(results[1], doc2, msg);
                    assert.deepEqual(results[2], doc3, msg);
                    assert(results.length === 3, msg);
                    done();
                });
            });
            it('$and syntax: find all documents that have all properties with the specified text', function(done) {
                collection.find({$and: [{prop2: 'B'}, {prop3: 'X'}]}, function(err, results) {
                    var msg = 'Returned results: ' + JSON.stringify(results);
                    assert(err === null, err);
                    assert.deepEqual(results[0], doc1, msg);
                    assert.deepEqual(results[1], doc3, msg);
                    assert(results.length === 2, msg);
                    done();
                });
            });
        });

        describe('Array properties', function() {
            var doc1 = {prop1: 'A', prop2: [['B', 'X'], ['M', 'X', 'N']]};
            var doc2 = {prop1: 'A', prop2: [['Y']]};
            var doc3 = {prop1: 'D'};
            var doc4 = {prop1: 'A', prop2: [['X']]};
            var doc5 = {prop1: 'F', prop2: ['Z', 'G', 'E', 'F']};
            var doc6 = {prop1: 'F', prop2: [['Z', 'G'], ['X', 'F']]};
            var data = [doc1, doc2, doc3, doc4, doc5, doc6];
            var collection = new rexdb();
            collection.insertSync(data);
            it('find all documents that have an array element with the specified string', function(done) {
                collection.find({prop2: 'X'}, function(err, results) {
                    var msg = 'Returned results: ' + JSON.stringify(results);
                    assert(err === null, err);
                    assert.deepEqual(results[0], doc1, msg);
                    assert.deepEqual(results[1], doc4, msg);
                    assert.deepEqual(results[2], doc6, msg);
                    assert(results.length === 3, msg);
                    done();
                });
            });
            it('find all documents that have an array containing ALL specified strings', function(done) {
                collection.find({$and: [{prop2: 'X'}, {prop2: 'Z'}]}, function(err, results) {
                    var msg = 'Returned results: ' + JSON.stringify(results);
                    assert(err === null, err);
                    assert.deepEqual(results[0], doc6, msg);
                    assert(results.length === 1, msg);
                    done();
                });
            });
        });

        describe('Find with RegExp', function() {
            var doc1 = {prop1: 'A', prop2: [['B', 'X'], ['M', 'X', 'N']]};
            var doc2 = {prop1: 'A', prop2: [['Y']]};
            var data = [doc1, doc2];
            var collection = new rexdb();
            collection.insertSync(data);
            it('find all documents that match a RegExp', function(done) {
                collection.find({prop2: /X/}, function(err, results) {
                    var msg = 'Returned results: ' + JSON.stringify(results);
                    assert(err === null, err);
                    assert.deepEqual(results[0], doc1, msg);
                    assert(results.length === 1, msg);
                    done();
                });
            });
        });

        describe('Text search', function() {
            var doc1 = {prop1: 'A', prop2: 'Boosters are great', prop3: '42'};
            var doc2 = {prop1: 'A', prop2: ['X', 'No packs here']};
            var doc3 = {prop1: 'D', prop2: 'B', prop3: 42};
            var doc4 = {prop2: 'Here is something else', prop1: 'A'};
            var data = [doc1, doc2, doc3, doc4];
            var collection = new rexdb();
            collection.insertSync(data);
            it('should find all docs with prop1 = A and the text booster, pack or here in any other field', function (done) {
                collection.find({prop1: 'A', $text: {$search: 'booster pack, HERE'}}, function (err, results) {
                    var msg = 'Returned results: ' + JSON.stringify(results);
                    assert(err === null, err);
                    assert.deepEqual(results[0], doc1, msg);
                    assert.deepEqual(results[1], doc2, msg);
                    assert.deepEqual(results[2], doc4, msg);
                    assert(results.length === 3, msg);
                    done();
                });
            });
            it('should find all docs with text 42', function (done) {
                collection.find({$text: {$search: '42'}}, function (err, results) {
                    var msg = 'Returned results: ' + JSON.stringify(results);
                    assert(err === null, err);
                    assert.deepEqual(results[0], doc1, msg);
                    assert.deepEqual(results[1], doc3, msg);
                    assert(results.length === 2, msg);
                    done();
                });
            });
        });

        it('find all documents', function(done) {
            var doc1 = {prop1: false, prop2: 'B'};
            var doc2 = {prop1: true, prop2: 'A'};
            var doc3 = {prop1: false, prop2: 'Z'};
            var data = [doc1, doc2, doc3];
            var collection = new rexdb();
            collection.insertSync(data);
            collection.find({}, function(err, results) {
                var msg = 'Returned results: ' + JSON.stringify(results);
                assert(err === null, err);
                assert.deepEqual(results, data, msg);
                assert(results.length === 3, msg);
                done();
            });
        });
    });
});

