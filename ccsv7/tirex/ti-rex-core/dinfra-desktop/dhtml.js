// Copyright (C) 2015-2016 Texas Instruments Incorporated - http://www.ti.com/
var djson = require('./djson');

function JSONHTMLRenderer(replacer, writer) {
    djson.Walker.call(this, replacer); // q&d super call

    this.writer = writer; 
}

JSONHTMLRenderer.prototype = new djson.Walker(); // q&d subclass

JSONHTMLRenderer.prototype.quotePrivate = function (s) {
    this.writer.sendContent(s);
}

JSONHTMLRenderer.prototype.mayAddComma = function (last) {
    if (!last) {
        this.writer.sendElement("span", { class: "punc comma" }, ", ");
    }
}

JSONHTMLRenderer.prototype.sendNullValue = function (context, last) {
    this.writer.sendElement("span", { class: "value null" }, "null");
    this.mayAddComma(last);
}

JSONHTMLRenderer.prototype.sendUndefinedValue = function (context, last) {
    this.writer.sendElement("span", { class: "value undefined" }, "undefined");
    this.mayAddComma(last);
}

JSONHTMLRenderer.prototype.b16dict = "0123456789abcdef";

JSONHTMLRenderer.prototype.sendBufferValue = function (context, topic, last) {
    var s = "data:base16,";

    for (var i = 0, n = topic.length; i < n; i++) {
        var b = topic[i];

        s += this.b16dict[(b >> 4) & 0xf];
        s += this.b16dict[b & 0xf];
    }

    this.writer.
        beginElement("span", { class: "value data" }).
        sendElement("a", { class: "data-link", href: s }, "data").
        endElement("span");

    this.mayAddComma(last);
}

JSONHTMLRenderer.prototype.sendUnquotedValue = function (topic) {
    this.writer.
        beginElement("span", { class: "value" }).
        sendElement("span", { class: "unquoted" }, topic).
        endElement("span");
}

JSONHTMLRenderer.prototype.sendQuotedValue = function (topic) {
    this.writer.
        beginElement("span", { class: "value date" }).
        sendElement("span", { class: "punc quotes" }, "'").
        sendElement("span", { class: "quoted" }, topic).
        sendElement("span", { class: "punc quotes" }, "'").
        endElement("span");
}

JSONHTMLRenderer.prototype.sendDateValue = function (context, topic, last) {
    sendQuotedValue(topic.toISOString());
    this.mayAddComma(last);
}

JSONHTMLRenderer.prototype.beginList = function (context, topic) {
    this.writer.
        beginElement("span", { class: "value list" }).
        sendElement("span", { class: "punc bracket" }, "[").
        beginElement("div", { class: "indent" });

    return (context);
}

JSONHTMLRenderer.prototype.endList = function (context, topic, last) {
    this.writer.
        endElement("div").
        sendElement("span", { class: "punc bracket" }, "]");
    this.mayAddComma(last);
    this.writer.
        endElement("span");
}

JSONHTMLRenderer.prototype.sendFrame = function (context, topic, last) {
    this.beginMap(context, topic);
    this.beginNamed(context, "name");
    this.sendStringValue(context, topic.name, false);
    this.endNamed(context, "name", false);
    this.beginNamed(context, "loc");
    this.sendStringValue(context, topic.loc, true);
    this.endNamed(context, "loc", true);
    this.endMap(context, topic, last);
}

JSONHTMLRenderer.prototype.beginStack = function (context, topic) {
    this.writer.
        sendElement("span", { class: "punc bracket" }, "[").
        beginElement("div", { class: "indent" });

    return (context);
}

JSONHTMLRenderer.prototype.endStack = function (context, topic, last) {
    this.writer.
        endElement("div").
        sendElement("span", { class: "punc bracket" }, "]");
}

JSONHTMLRenderer.prototype.beginError = function (context, topic) {
    this.writer.
        sendElement("span", { class: "punc brace" }, "{").
        beginElement("div", { class: "indent" });

    return (context);
}

JSONHTMLRenderer.prototype.endError = function (context, topic, last) {
    this.writer.
        endElement("div").
        sendElement("span", { class: "punc bracket" }, "}");
}

JSONHTMLRenderer.prototype.beginNamed = function (context, name) {
    this.writer.
        beginElement("div", { class: "named" }).
            sendElement("span", { class: "named-name" }, name).
            sendElement("span", { class: "punc colon" }, ": ");

    return (context);
}

JSONHTMLRenderer.prototype.endNamed = function(context, name, last) {
    // this.mayAddComma(last); // ignore - let the value handle it
    this.writer.
        endElement("div");
}

JSONHTMLRenderer.prototype.beginMap = function (context, topic) {
    this.writer.
        sendElement("span", { class: "punc brace" }, "{").
        beginElement("div", { class: "indent" });

    return (context);
}

JSONHTMLRenderer.prototype.endMap = function (context, topic, last) {
    this.writer.
        endElement("div").
        sendElement("span", { class: "punc brace" }, "}");
    this.mayAddComma(last);
}

JSONHTMLRenderer.prototype.sendFloatValue = function (context, topic, last) {
    this.sendUnquotedValue("" + topic);
    this.mayAddComma(last);
}

JSONHTMLRenderer.prototype.sendIntegerValue = function (context, topic, last) {
    this.sendUnquotedValue("" + topic);
    this.mayAddComma(last);
}

JSONHTMLRenderer.prototype.sendBooleanValue = function (context, topic, last) {
    this.sendUnquotedValue("" + topic);
    this.mayAddComma(last);
}

JSONHTMLRenderer.prototype.sendStringValue = function (context, topic, last) {
    this.sendQuotedValue(topic);
    this.mayAddComma(last);
}

JSONHTMLRenderer.prototype.sendLoopValue = function (context, topic, used,
        last) {
    this.sendQuotedValue("object loop " + topic + " " + used);
    this.mayAddComma(last);
}

function Frame(parent, name) {
    this.parent = parent;
    this.name = name;
    this.content = false;
}

function HTMLWriter(w) {
    this.w = w;
    this.stack = null;
    this.mode = "html";
    this.selfClosed = false; // for html
}

HTMLWriter.prototype.writeRaw = function (text, offset, length) {
    this.w.write(text, "UTF-8");

    return (this);
}

HTMLWriter.prototype.writeEscaped = function (text) {
    var last = 0;
    var index = 0;

    while (index < text.length) {
        var offset = index;
        var subs = null;
        var c = text.charCodeAt(index++);

        if (c == 0x3c) {
            subs = "&lt;";
        }
        else if (c == 0x3e) {
            subs = "&gt;";
        }
        else if (c == 0x22) {
            subs = "&quot;";
        }
        else if (c == 0x26) {
            subs = "&amp;";
        }
        else {
            subs = null;
        }

        if (subs != null) {
            this.writeRaw(text.substring(last, offset));
            last = index;

            this.writeRaw(subs);
        }
    }

    if (last < index) {
        this.writeRaw(text.substring(last, index));
    }

    return (this);
}

HTMLWriter.prototype.sendAttr = function (name, text) {
    if (this.stack.content) {
        throw new Error("illegal state at " + stack);
    }

    this.writeRaw(" " + name + "=\"");
    this.writeRaw("" + text);
    this.writeRaw("\"");
}

HTMLWriter.prototype.beginElement = function (name, attrs) {
    this.mayCloseTag();

    this.stack = new Frame(this.stack, name);

    this.writeRaw("<" + name);

    if (attrs != null) {
        for (var aname in attrs) {
            this.sendAttr(aname, attrs[aname]);
        }
    }

    return (this);
}

HTMLWriter.prototype.mayCloseTag = function () {
    if (this.stack != null) {
        if (!this.stack.content) {
            this.writeRaw(">");
            this.stack.content = true;
        }
    }

    return (this);
}

HTMLWriter.prototype.sendUnclosedElement = function (name, attrs) {
    this.beginElement(name, attrs);

    this.stack.unclosed = true;

    this.endElement(name);

    return (this);
}

HTMLWriter.prototype.sendElement = function (name, attrs, text) {
    this.beginElement(name, attrs);

    if (text != null) {
        this.sendContent(text);
    }

    this.endElement(name);

    return (this);
}

HTMLWriter.prototype.sendContent = function (text) {
    this.mayCloseTag();

    this.writeEscaped(text);

    return (this);
}

HTMLWriter.prototype.endElement = function (name) {
    if (name != null) {
        if (this.stack.name != name) {
            throw new Error("bad end element for " + name +
                " at " + this.stack);
        }
    }

    if (!this.stack.content && !this.selfClosed) {
        this.writeRaw(">");
        this.stack.content = true;
    }

    if (this.stack.content) {
        this.writeRaw("</" + this.stack.name + ">"); // never use name again
    }
    else if (this.stack.unclosed) {
        this.writeRaw(">");
    }
    else {
        this.writeRaw("/>");
    }

    this.stack = this.stack.parent;

    return (this);
}

HTMLWriter.prototype.renderJSON = function (topic) {
    var walker = new JSONHTMLRenderer(null, this);

    walker.sendValue(null, topic, true);

    return (this);
}

exports.HTMLWriter = HTMLWriter;
