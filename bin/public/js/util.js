var os = require("os");

var util = {};

//获取本地ip
util.getLocalIP = function (){
    var _network = os.networkInterfaces();
    return _network["en0"][1].address;
}

//解析错误栈
util.execStack = function ( stack ){
    var _stack = /at\s*([http|https|file].+\.(?:js|html))\s*:\s*(\d+)\s*:\s*(\d+)/.exec(stack),
        allInfo = _stack[0],
        fileName = _stack[1],  //正则有点问题，临时解决
        fileLine = _stack[2],
        pos = _stack[3];

    return {
        allInfo : allInfo,
        file : fileName,
        line : fileLine,
        pos : pos
    }
};

module.exports = util;