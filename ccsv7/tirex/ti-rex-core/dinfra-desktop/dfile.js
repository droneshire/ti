// Copyright (C) 2015-2016 Texas Instruments Incorporated - http://www.ti.com/
const stream = require('stream');
const events = require('events');
const npath = require('path');
const fs = require('fs');
const util = require('util');
const denum = require('./denum');
const STATE = denum.cardinals(
    'END',
    'STEP',
    'STAT',
    'DIR');

util.inherits(FileTreeStepper, events.EventEmitter);

/**
 * A FileTreeStepper allows you to efficiently step through a
 * file tree one entry at a time without loading the whole tree
 * into memory.  Each node reports its results with a "stat" event
 * called with (path, lstat).  The next node will not report until
 * next() is called, until finally an "end" event is issued.  The
 * event event is also used to report errors.  The next() call will
 * have no effect once the "end" event has been issued.   Internally
 * this works as a stack and stack machine.  Note that directories
 * are listed prior to their children and there are no "." or ".."
 * entries reported.  The current implementation lists directory
 * contents in unicode general collating order (ie. not by locale),
 * in order to be consistent with the output of name-ordered
 * ResourceQuery.
 *
 * A straight scan of 300000 nodes with each node reported using
 * a synchronous console.log() call will take about 180s on typical
 * Linux hardware, 90s if cached.
 *
 * The choice of lexical order versus directory order just determines
 * whether the directory entries immediately follow the directories
 * themselves.  In directory order, they do, in lexical order, they
 * appear in their character code order (of the total path, ignorant
 * of directory transitions).
 *
 * @param root - the path to the root directory
 * @param lexicalOrder - true for lexical order results, false for directory.
 */
function FileTreeStepper(root, lexicalOrder) {
    events.EventEmitter.call(this);

    this.root = root; 
    this.stack = [[""], 0];
    this.state = STATE.STEP;
    this.lexicalOrder = !!lexicalOrder;
}

/*
    Sort the directory list in the same order as the database would
    return it.

    When the add parameter is used it assumes the list is already sorted
    and it adds the add parameter to it.
*/
FileTreeStepper.prototype.sortDirList = function (list, add) {
    return (denum.stringSort(list, add));
}

FileTreeStepper.prototype.openReadable = function(path) {
    return (fs.createReadStream(this.root + path));
}

FileTreeStepper.prototype.next = function() {
    var self = this;

    //console.log("here", this.state, this.stack);

    if (this.state === STATE.END) {
        // do nothing
    }
    else if (this.state === STATE.STAT) {
        var path = this.stack[this.stack.length - 1];

        fs.lstat(this.root + path, function (error, stat) {
                if (error != null) {
                    self.state = STATE.END;
                    self.emit('end', error);
                }
                else if (self.lexicalOrder) {
                    if (!stat.isSymbolicLink() && stat.isDirectory()) {
                        // insert a dir marker in the sort list ...
                        self.sortDirList(self.stack[self.stack.length - 3],
                            npath.basename(path) + "/");
                    }

                    self.stack.pop(); // pop the path off
                    self.state = STATE.STEP;
                    self.emit('result', path, stat);
                }
                else {
                    if (!stat.isSymbolicLink() && stat.isDirectory()) {
                        // insert a dir marker in the sort list ...
                        self.stack.pop(); // pop the path off
                        self.stack.push(path + "/"); // add the dir slash
                        self.state = STATE.DIR;
                    }
                    else {
                        self.stack.pop(); // pop the path off
                        self.state = STATE.STEP;
                    }

                    self.emit('result', path, stat);
                }
            });
    }
    else if (this.state === STATE.DIR) {
        var path = this.stack[this.stack.length - 1];

        fs.readdir(this.root + path, function (error, list) {
                if (error != null) {
                    self.state = STATE.END;
                    self.emit('end', error);
                }
                else {
                    self.sortDirList(list);
                    self.stack.push(list);
                    self.stack.push(0);
                    self.state = STATE.STEP;

                    self.next();
                }
            });
    }
    else if (this.state === STATE.STEP) {
        var stack = this.stack;

        if (stack.length == 0) {
            this.step = STATE.END;
            self.emit('end', null); // no error
        }
        else if (stack.length < 2) {
            throw new denum.StateError();
        }
        else {
            var peek = stack.length - 1;
            var index = stack[peek];
            var list = stack[peek - 1];

            if (index < list.length) {
                var prefix;

                if (stack.length > 2) {
                    prefix = stack[peek - 2];
                }
                else {
                    prefix = "";
                }

                var name = list[index++];
                var path = prefix + name;

                if (name.indexOf("/") >= 0) {
                    stack.push(path);
                    stack[peek] = index;
                    this.state = STATE.DIR;
                    this.next();
                }
                else {
                    stack.push(path);
                    stack[peek] = index;
                    this.state = STATE.STAT;
                    this.next();
                }
            }
            else {
                this.stack.pop();
                this.stack.pop();
                this.stack.pop();
                this.next();
            }
        }
    }
    else {
        throw new Error("unsuported state " + this.state);
    }
}

exports.FileTreeStepper = FileTreeStepper;

