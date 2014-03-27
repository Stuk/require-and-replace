var Q = require("q");
var Require = require("mr");

module.exports = main;
function main(find, replace) {

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
