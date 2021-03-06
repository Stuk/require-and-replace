var createSpy = require("jasminum/spy");
var Q = require("q");
var MockFS = require("q-io/fs-mock");
var rar = require("../index");

describe("require and replace", function () {
    it("rejects if find or replace is missing", function () {
        var spy1 = createSpy();
        var spy2 = createSpy();
        var spy3 = createSpy();
        var pass = function () {};

        return Q.all([
            rar().then(spy1, pass),
            rar("./find").then(spy2, pass),
            rar(null, "./replace").then(spy3, pass)
        ]).then(function () {
            expect(spy1).not.toHaveBeenCalled();
            expect(spy2).not.toHaveBeenCalled();
            expect(spy3).not.toHaveBeenCalled();
        });
    });

    it("replaces parent relative find with sibling relative replace", function () {
        var fs = MockFS({
            "dir": {
                "example.js": 'require("../find");'
            }
        });
        return rar("./find", "./dir/replace", fs)
        .then(function () {
            return fs.read("dir/example.js");
        })
        .then(function (content) {
            expect(content).toEqual('require("./replace");');
        });
    });

    it("replaces sibling relative find with parent relative replace", function () {
        var fs = MockFS({
            "dir": {
                "example.js": 'require("./find");'
            }
        });
        return rar("./dir/find", "./replace", fs)
        .then(function () {
            return fs.read("dir/example.js");
        })
        .then(function (content) {
            expect(content).toEqual('require("../replace");');
        });
    });

    it("replaces absolute find with parent relative replace", function () {
        var fs = MockFS({
            "dir": {
                "example.js": 'require("find");'
            }
        });
        return rar("find", "./replace", fs)
        .then(function () {
            return fs.read("dir/example.js");
        })
        .then(function (content) {
            expect(content).toEqual('require("../replace");');
        });
    });

    it("replaces sibling relative find with absolute replace", function () {
        var fs = MockFS({
            "dir": {
                "example.js": 'require("./find");'
            }
        });
        return rar("./dir/find", "replace", fs)
        .then(function () {
            return fs.read("dir/example.js");
        })
        .then(function (content) {
            expect(content).toEqual('require("replace");');
        });
    });

    it("leaves the quotes alone", function () {
        var fs = MockFS({
            "dir": {
                "example.js": "require('./find');"
            }
        });
        return rar("a", "b", fs)
        .then(function () {
            return fs.read("dir/example.js");
        })
        .then(function (content) {
            expect(content).toEqual("require('./find');");
        });
    });

    it("handles module ids with quote", function () {
        var fs = MockFS({
            "dir": {
                "example.js": "require('quote');"
            }
        });
        return rar("quote", "qu'ote", fs)
        .then(function () {
            return fs.read("dir/example.js");
        })
        .then(function (content) {
            expect(content).toEqual("require('qu\\'ote');");
        });
    });

    it("handles surrounding content", function () {
        var fs = MockFS({
            "dir": {
                "example.js": 'var a = require("a");\nvar b = require("find");\n\nconsole.log(b);'
            }
        });
        return rar("find", "replace", fs)
        .then(function () {
            return fs.read("dir/example.js");
        })
        .then(function (content) {
            expect(content).toEqual('var a = require("a");\nvar b = require("replace");\n\nconsole.log(b);');
        });
    });

});
