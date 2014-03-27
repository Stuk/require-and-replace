var Q = require("q");
var FS = require("q-io/fs");

module.exports = main;
function main(find, replace, fs) {
    fs = fs || FS;

    return Q(function () {
        if (!find || !replace) {
            throw new Error("Both find a replace must be given");
        }

        return fs.listTree(".", function (path) {
            if (path.indexOf("node_modules") !== -1) {
                return null;
            } else {
                return !!path.match(/\.js$/);
            }
        })
        .then(function (list) {
            return Q.all(list.map(function (path) {
                var relativeFind = relativeFromFile(path, find, fs);
                var relativeReplace = relativeFromFile(path, replace, fs);

                return fs.read(path)
                .then(function (text) {
                    text = String(text).replace(/(^|[^\w\$_.])require\s*\(\s*(["'])((?:(?!\2).)*)\2\s*\)/g, function(_, lead, quote, id) {
                        if (id === relativeFind) {
                            id = relativeReplace;
                        }
                        return lead + "require(" + quoteString(id, quote) + ")";
                    });
                    return fs.write(path, text);
                });
            }));
        });
    }).call(null);
}

var IS_RELATIVE_RE = /^\.\.?\//;
function relativeFromFile(path, id, fs) {
    if (IS_RELATIVE_RE.test(id)) {
        id = fs.relativeFromFile(path, id);
        if (!IS_RELATIVE_RE.test(id)) {
            id = "./" + id;
        }
    }
    return id;
}

// Implementation of Quote from http://www.ecma-international.org/ecma-262/5.1/#sec-15.12.3
// so that we can support both ' and " quotes (we can simply use JSON.stringify
// if we only want to output double quotes)
function quoteString(string, quote) {
    var product = quote;

    getSymbols(string).forEach(function (symbol) {
        if (symbol === quote || symbol === "\\") {
            product += "\\" + symbol;
        } else if (symbol === "\b" || symbol === "\f" || symbol === "\n" || symbol === "\r" || symbol === "\t") {
            product += "\\";
            switch(symbol) {
            case "\b":
                product += "b";
                break;
            case "\f":
                product += "f";
                break;
            case "\n":
                product += "n";
                break;
            case "\r":
                product += "r";
                break;
            case "\t":
                product += "t";
                break;
            }
        } else if (symbol < " ") {
            product += "\\u";
            // Can use charCodeAt here, because any character < " " will not
            // have a surrogate pair
            var hex = symbol.charCodeAt(0).toString(16);
            while (hex.length < 4) {
                hex = "0" + hex;
            }
            product += hex;
        } else {
            product += symbol;
        }
    });

    product += quote;

    return product;
}

// from http://mathiasbynens.be/notes/javascript-unicode
function getSymbols(string) {
    var length = string.length;
    var index = -1;
    var output = [];
    var character;
    var charCode;
    while (++index < length) {
        character = string.charAt(index);
        charCode = character.charCodeAt(0);
        if (charCode >= 0xD800 && charCode <= 0xDBFF) {
            // note: this doesn’t account for lone high surrogates
            output.push(character + string.charAt(++index));
        } else {
            output.push(character);
        }
    }
    return output;
}

function help() {
    console.log("require-and-replace", "<find>", "<replace>");
    console.log();
    console.log("Finds all `require()` calls for the given <find> module and");
    console.log("replaces them will require() calls for given <replace> module.");
    console.log();
    console.log("Relative module ids are resolved both when finding and");
    console.log("replacing. For example:");
    console.log();
    console.log("\trequire-and-replace ./find ./dir/replace");
    console.log();
    console.log("will replace `require('../find')` with `require('./replace')`");
    console.log("in ./dir/example.js");
}

if (require.main === module) {
    var argv = require('minimist')(process.argv.slice(2));

    if (!argv._ || argv._.length !== 2) {
        help();
        process.exit(1);
    } else {
        main(argv._[0], argv._[1]).done();
    }
}
