var Set = require("../src/set.js");
var Promise = require("promise");
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
        it("should calculate the entropy correctly when there are only one class", function(done) {
            var set = new Set({
                db: {
                    execQuery: function(q) {
                        return new Promise(function(resolve, reject) {
                            resolve([{
                                count_class: 9
                            }]);
                        })
                    }
                }
            });
            set.entropy()
                .then(function(e) {
                    e.should.have.property("entropy");
                    e.should.have.property("sum");
                    e.entropy.should.be.a.Number.and.approximately(0, 0.001);
                }).then(done, done);
        })
        it("should calculate the entropy correctly when there are two class", function(done) {
            var set = new Set({
                db: {
                    execQuery: function(q) {
                        return new Promise(function(resolve, reject) {
                            resolve([{
                                count_class: 9
                            }, {
                                count_class: 5
                            }]);
                        })
                    }
                }
            });
            set.entropy()
                .then(function(e) {
                    e.entropy.should.be.a.Number.and.approximately(0.94, 0.001);
                }).then(done, done);
        })
    })
    describe("#split", function() {
        it("should create 1 set", function(done) {
            var set = new Set({
                db: {
                    execQuery: function(q) {
                        return new Promise(function(resolve, reject) {
                            resolve([{
                                max: 1,
                                min: 0
                            }])
                        })
                    }
                },
                numberSplits: 0
            })

            set.split("attr1")
                .then(function(result) {
                    return result.should.be.instanceof(Array).and.have.lengthOf(1);
                }).then(function() {
                    done()
                }, done);
        })
        it("should create 4 sets", function(done) {
            var set = new Set({
                db: {
                    execQuery: function(q) {
                        return new Promise(function(resolve, reject) {
                            resolve([{
                                max: 1,
                                min: 0
                            }])
                        })
                    }
                },
                numberSplits: 3
            })

            set.split("attr1")
                .then(function(result) {
                    result.should.be.instanceof(Array).and.have.lengthOf(4);
                    result[1].getFilters().should.have.lengthOf(1);
                    result[1].getFilters()[0].max.should.be.approximately(0.5, 0.01);
                    result[1].getFilters()[0].min.should.be.approximately(0.25, 0.01);
                }).then(function() {
                    done()
                }, done);
        })
    })
    describe("#gain", function() {
        it("should calculate the gain correctly", function(done) {
            done()
        })
    })
})