var should = require("should");
var assert = require("assert");
var _ = require("underscore");

var DecisionTree = require("../src/dt.js");

describe("dt", function() {
    describe("#setup", function() {
        var dt;
        before(function() {
            dt = new DecisionTree();
        })
        it("should throw error because the argument attributes is unknown", function() {
            var msg = /Number of attributes should be larger than 0./
            assert.throws(dt.Setup, msg);
        });
        it("should throw error because the type is unknown", function() {
            var msg = /Missing or invalid type and or name at index: 0./
            assert.throws(function() {
                dt.Setup([{
                    type: "blaat",
                    name: ""
                }])
            }, msg);
        });
        it("should throw error because the number of splits is unknown", function() {
            var msg = /Specify number of splits for attribute: weather is either invalid or undefined./
            assert.throws(function() {
                dt.Setup([{
                    type: "cont",
                    name: "weather",
                }])
            }, msg);
        });
        it("should give the correct distinct discrete values", function() {
            var attr = {
                type: "disc",
                name: "weather"
            };
            var names = ["hot", "windy"];
            var dt = new DecisionTree({
                db: {
                    execQuerySync: function() {
                        return [names];
                    }
                }
            });

            dt.Setup([attr])
            dt.attrs.should.be.a.Array.with.lengthOf(1);
            dt.attrs[0].should.have.property("split").with.eql(names);
        });
        it("should give the correct parts of the continues values", function() {
            var attr = {
                type: "cont",
                name: "temperature",
                numberSplits: 4
            };
            var split = [0, 0.2, 0.4, 0.6, 0.8, 1];
            var dt = new DecisionTree({
                db: {
                    execQuerySync: function() {
                        return [{
                            min: 0,
                            max: 1
                        }];
                    }
                }
            });

            dt.Setup([attr])
            dt.attrs.should.be.a.Array.with.lengthOf(1);
            _.each(dt.attrs[0].split, function(n, i) {
                n.min.should.approximately(split[i], 0.001);
                n.max.should.approximately(split[i + 1], 0.001)
            });
        });
    });
    describe("#run", function() {
        it("should call _run correctly", function() {
            var dt = new DecisionTree({
                db: {
                    t: "test"
                }
            });
            dt._Run = function(node) {
                node.data("model").should.be.ok;
            }
            dt.Run();
        })
    });
    describe("#_run", function() {
        it("TODO", function() {
            throw new Error("make test");
        })
    })
})