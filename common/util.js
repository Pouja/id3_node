module.exports.intersection = function(list1, list2) {
    var out = [];
    var i = 0;
    var j = 0;
    while (i < list1.length && j < list2.length) {
        if (list1[i] > list2[j])
            j++;
        else if (list1[i] < list2[j])
            i++;
        else if (list1[i] === list2[j]) {
            out.push(list1[i])
            i++;
            j++;
        }
    }
    return out;
}

module.exports.union = function(list1, list2) {
    var out = [];
    var i = 0;
    var j = 0;
    while (i < list1.length && j < list2.length) {
        if (list1[i] < list2[j]) {
            out.push(list1[i])
            i++;
        } else if (list1[i] > list2[j]) {
            out.push(list2[j])
            j++;
        } else {
            out.push(list1[i]);
            i++;
            j++;
        }
    }
    for (; i < list1.length; i++)
        out.push(list1[i])

    for (; j < list2.length; j++)
        out.push(list2[j])
    return out;
}