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
    describe("#split", function() {
        it("should create 1 set", function() {
            var set = new Set({
                db: {
                    execQuerySync: function(q) {
                        return [{
                            max: 1,
                            min: 0
                        }]
                    }
                },
                numberSplits: 0
            })

            var result = set.split("attr1")
            result.should.be.instanceof(Array).and.have.lengthOf(1);
        });
        it("should create 4 sets", function() {
            var set = new Set({
                db: {
                    execQuerySync: function(q) {
                        return [{
                            max: 1,
                            min: 0
                        }]
                    }
                },
                numberSplits: 3,
                attrs: ["attr1", "attr2"]
            })

            var splitlvl1 = set.split("attr1")
            splitlvl1.should.be.instanceof(Array).and.have.lengthOf(4);
            splitlvl1[1].getFilters().should.have.lengthOf(1);
            splitlvl1[1].getFilters()[0].max.should.be.approximately(0.5, 0.01);
            splitlvl1[1].getFilters()[0].min.should.be.approximately(0.25, 0.01);
            splitlvl1[1].getAttrs().should.have.lengthOf(1);

            var splitlvl2 = splitlvl1[1].split("attr2");
            splitlvl2[0].getFilters().should.have.lengthOf(2);
            splitlvl2[0].getAttrs().should.have.lengthOf(0);
        })
    });
})