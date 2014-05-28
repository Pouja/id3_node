var should = require("should");
var assert = require("assert");
var Factory = require("../createdt/factory.js");

var factory;
var attributesDisc = [{
    type: "disc",
    name: "attr1",
    split: ["split1", "split2", "split3"]
}]
var attributesCont = [{
    type: "cont",
    name: "attr2",
    split: [{
        min: 0,
        max: 3
    }, {
        min: 4,
        max: 9
    }, {
        min: 10,
        max: 20
    }]
}, {
    type: "cont",
    name: "attr3",
    split: [{
        min: -1,
        max: 2
    }, {
        min: 3,
        max: 5
    }, {
        min: 6,
        max: 8
    }]
}]


describe("Factory", function() {
    describe("#loadMap", function() {
        it("should create a correct map", function() {
            factory = new Factory({});
            var attributes = []
            attributes.push(attributesDisc[0]);
            attributes.push(attributesCont[0]);
            var expected = [{
                type: "disc",
                name: "attr1",
                value: "split1",
                data: []
            }, {
                type: "disc",
                name: "attr1",
                value: "split2",
                data: []
            }, {
                type: "disc",
                name: "attr1",
                value: "split3",
                data: []
            }, {
                type: "cont",
                name: "attr2",
                value: {
                    min: 0,
                    max: 3
                },
                data: []
            }, {
                type: "cont",
                name: "attr2",
                value: {
                    min: 4,
                    max: 9
                },
                data: []
            }, {
                type: "cont",
                name: "attr2",
                value: {
                    min: 10,
                    max: 20
                },
                data: []
            }]
            factory.loadMap(attributes);
            assert.deepEqual(factory.getMap(), expected);
        })
    })
    describe("loadIds", function() {
        it("should fill the map correctly", function() {
            var batch = [{
                class: 0,
                id: 1,
                attr2: 3,
                attr3: 7
            }, {
                class: 1,
                id: 2,
                attr2: 12,
                attr3: -0.8
            }, {
                class: 1,
                id: 3,
                attr2: 19,
                attr3: 9
            }, {
                class: 0,
                id: 4,
                attr2: 1,
                attr3: 4
            }, {
                class: 0,
                id: 5,
                attr2: 0,
                attr3: 100
            }]
            factory = new Factory({})
            factory.getNextBatch = function() {
                return batch;
            }
            factory.loadMap(attributesCont);
            factory.loadIds();
            var result = factory.getMap();
            var expect = [{
                type: "cont",
                name: "attr2",
                value: {
                    min: 0,
                    max: 3
                },
                data: [{
                    class: 0,
                    ids: [5, 4, 1]
                }]
            }, {
                type: "cont",
                name: "attr2",
                value: {
                    min: 4,
                    max: 9
                },
                data: []
            }, {
                type: "cont",
                name: "attr2",
                value: {
                    min: 10,
                    max: 20
                },
                data: [{
                    class: 1,
                    ids: [3, 2]
                }]
            }, {
                type: "cont",
                name: "attr3",
                value: {
                    min: -1,
                    max: 2
                },
                data: [{
                    class: 1,
                    ids: [2]
                }]
            }, {
                type: "cont",
                name: "attr3",
                value: {
                    min: 3,
                    max: 5
                },
                data: [{
                    class: 0,
                    ids: [4]
                }]
            }, {
                type: "cont",
                name: "attr3",
                value: {
                    min: 6,
                    max: 8
                },
                data: [{
                    class: 0,
                    ids: [1]
                }]
            }]
            should(result).eql(expect);
        })
    })
    describe("#ordermap", function() {
        it("should order the map correctly", function() {
            factory.orderMap();
            var result = factory.getMap();
            should(result[0].data[0].ids).eql([1, 4, 5])
        })
    })
})