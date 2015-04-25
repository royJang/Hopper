var os = require("os");
var _ = require("underscore");
var request = require("request");

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
        fileName = _stack[1],
        fileLine = _stack[2],
        pos = _stack[3];

    return {
        allInfo : allInfo,
        file : fileName,
        line : fileLine,
        pos : pos
    }
};

util.parseDOM = function ( url, options, callback ){
    var self = this,
        defaultOptions = {
            line : false
        };

    _.extend(defaultOptions, options);

    request(url, function (err, data){
        var $body = data.body;
        var codeStr = "";

        $body.split("\n").forEach(function (el,i){
            //解析html，确定从属关系 (暂时没有实现)
            defaultOptions.lm = (i+1);
            var _html = self.stringToDOMTree( el, defaultOptions );
            codeStr += _html + "\n";
        });

        return callback(codeStr);
    });
}

//<returns> string
util.stringToDOMTree = function ( str, options ){

    //将4个空格替换为4个&nbsp;
    str = str.replace(/\s{4}|<|>/g, function ( f ){
        if( f == "<" ){
            return "&lt;"
        }else if( f == ">" ){
            return "&gt;"
        }else{
            return "&nbsp;&nbsp;&nbsp;";
        }
    });

    var $html = "<li>";

    if( options.line ){
        $html += "<i>";
        $html += options.lm;
        $html += "</i>";
    }

    if( str.search(/doctype/i) > -1 ){
        $html += "<font color='#ccc'>" + str + "</font>";
    }else{
        //如果支持显示行号
        //且行号 等于 当前渲染的 行数
        //则 把当前行 加一个active,css会把它渲染成黄色的
        if( options.line && options.lineNumber && options.lineNumber > 0 && options.lineNumber == options.lm ){
            $html += "<active>"+ str +"</active>";
        }else{
            $html += str;
        }
    }

    $html += "</li>";

    return $html;
}

module.exports = util;







































