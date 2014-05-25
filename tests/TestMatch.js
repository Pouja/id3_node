var match = require("../testdt/looper.js").match;
var assert = require("assert");
var should = require("should");

describe("match", function() {
    describe("disc values", function() {
        var node = {
            data: function() {
                return {
                    filters: [{
                        type: "disc",
                        name: "name1",
                        value: "value1"
                    }, {
                        type: "disc",
                        name: "name2",
                        value: "value2"
                    }]
                }
            }
        }
        var entry = [{
            name3: "value3",
        }];
        it("should return false, since no filter matches the attributes", function() {
            assert(!match(node, entry))
        })
        it("should return false, because not all attributes match the filters", function() {
            entry.name2 = "value2";
            assert(!match(node, entry))
        })
        it("should return true", function() {
            var entry = {
                name1: "value1",
                name2: "value2"
            }
            assert(match(node, entry))
        })
    });
    describe("cont values", function() {
        var node = {
            data: function() {
                return {
                    filters: [{
                        type: "cont",
                        name: "name1",
                        value: {
                            min: 0,
                            max: 3
                        }
                    }, {
                        type: "cont",
                        name: "name2",
                        value: {
                            min: 2,
                            max: 5
                        }
                    }]
                }
            }
        }
        var entry = {
            name1: 4,
        };
        it("should return false, since no filter matches the attributes", function() {
            assert(!match(node, entry))
        })
        it("should return false, because not all attributes match the filters", function() {
            entry.name2 = 1;
            assert(!match(node, entry))
        })
        it("should return true", function() {
            var entry = {
                name1: 1,
                name2: 3
            }
            assert(match(node, entry))
        })
    })
})