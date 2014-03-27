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
                    text = String(text).replace(/(^|[^\w\$_.])require\s*\(\s*["']([^"']*)["']\s*\)/g, function(_, lead, id) {
                        if (id === relativeFind) {
                            id = relativeReplace;
                        }
                        return lead + "require(" + JSON.stringify(id) + ")";
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

function help() {
    console.log("require-and-replce", "<find>", "<replace>");
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
