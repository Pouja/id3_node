var Set = require("../src/set.js");
var Promise = require("bluebird");
var should = require("should");
var assert = require("assert");

describe("Set", function() {
    describe("#constructor", function() {
        it("should throw an error", function() {
            assert.throws(Set, Error)
        });
        it("should not thow an error", function() {
            assert.doesNotThrow(function() {
                new Set({
                    db: {
                        t: 1
                    }
                });
            })
        });
    });
    describe("#entropy", function() {
        it("should calculate the entropy correctly when there are only one class", function() {
            var set = new Set({
                db: {
                    execQuerySync: function(q) {
                        return [{
                            count_class: 9
                        }]
                    }
                }
            });
            var e = set.entropy()
            e.should.have.property("entropy");
            e.should.have.property("sum");
            e.entropy.should.be.a.Number.and.approximately(0, 0.001);
        });
        it("should calculate the entropy correctly when there are two class", function() {
            var set = new Set({
                db: {
                    execQuerySync: function(q) {
                        return [{
                            count_class: 9
                        }, {
                            count_class: 5
                        }];
                    }
                }
            });
            var e = set.entropy()
            e.entropy.should.be.a.Number.and.approximately(0.94, 0.001);
        });
    });
    describe("#gain", function() {
        it("should correctly calculate the gain", function() {
            var sets = [{
                entropy: function() {
                    return {
                        sum: 8,
                        entropy: 0.811
                    }
                }
            }, {
                entropy: function() {
                    return {
                        sum: 6,
                        entropy: 1
                    }
                }
            }]
            var set = new Set({
                db: {}
            });
            set.entropy = function() {
                return {
                    sum: 14,
                    entropy: 0.940
                }
            };
            set.split = function() {
                return sets;
            }
            var result = set.gain({});
            result.should.approximately(0.048, 0.0001);
        })
    })
    describe("#split", function() {
        it("should create a new set with one attribute less and one filter more", function() {
            var attr = {
                name: "weather",
                split: ["hot", "cold"],
                type: "disc"
            }
            var set = new Set({
                db: {},
                attrs: [attr]
            });
            var sets = set.split(attr);
            sets.should.be.a.Array.with.lengthOf(2);
            sets[0].attrs.should.be.a.Array.with.lengthOf(0);
            sets[0].filters.should.be.a.Array.with.lengthOf(1);
            sets[1].filters[0].should.eql({
                name: "weather",
                type: "disc",
                value: "cold"
            })
        })
    })
})