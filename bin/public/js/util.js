var util = {};

util.execStack = function ( stack ){
    var _stack = /(.[^\(|\)|\s]+\.js|html)\s*:\s*(\d+)/.exec(stack),
        allInfo = _stack[0],
        fileName = stack[1],
        fileLine = stack[2];

    return {
        allInfo : allInfo,
        file : fileName,
        line : fileLine
    }
};

module.exports = util;