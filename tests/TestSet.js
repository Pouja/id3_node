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
})