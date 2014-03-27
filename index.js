var Q = require("q");
var FS = require("q-io/fs");
var Require = require("mr");

module.exports = main;
function main(find, replace, fs) {
    fs = fs || FS;

    return Q(function () {
        if (!find || !replace) {
            throw new Error("Both find a replace must be given");
        }

        return fs.read("package.json")
        .then(function (content) {
            var packageDescription = JSON.parse(content);
            return Object.keys(packageDescription.dependencies || {})
                .concat(Object.keys(packageDescription.devDependencies || {}));
        })
        .then(function (dependencies) {
            return fs.listTree(".", function (path) {
                if (path.indexOf("node_modules") !== -1) {
                    return null;
                } else {
                    return !!path.match(/\.js$/);
                }
            })
            .then(function (list) {
                return Q.all(list.map(function (path) {
                    var relativeFind = fs.relativeFromFile(path, find);
                    if (!relativeFind.match(/\.\//)) {
                        relativeFind = "./" + relativeFind;
                    }

                    var relativeReplace = fs.relativeFromFile(path, replace);
                    if (!relativeReplace.match(/\.\//)) {
                        relativeReplace = "./" + relativeReplace;
                    }
                    console.log(relativeFind, relativeReplace);
                    // var packagePath = fs.relativeFromDirectory(".", fs.absolute(path));
                    return fs.read(path)
                    .then(function (text) {
                        console.log("Process", path);
                        text = String(text).replace(/(^|[^\w\$_.])require\s*\(\s*["']([^"']*)["']\s*\)/g, function(_, lead, id) {
                            if (id === relativeFind) {
                                id = relativeReplace;
                            }
                            // var top = Require.resolve(id, "") === id;
                            // var external = false;
                            // if (top) {
                            //     var parts = id.split("/");
                            //     var first = parts[0];
                            //     external = dependencies.indexOf(first) >= 0;
                            //     if (!external) {
                            //         id = fs.relativeFromFile(packagePath, id);
                            //         if (id.indexOf(".", 0) < 0) {
                            //             id = "./" + id;
                            //         }
                            //     }
                            // }
                            return lead + "require(" + JSON.stringify(id) + ")";
                        });
                        return fs.write(path, text);
                    });
                }));
            });
        });
    }).call(null);
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
