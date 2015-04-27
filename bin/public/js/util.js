var _ = require("underscore");

var request = require("request");
var beautify = require("js-beautify").html;

var util = {};

var isAddULElement = false;
var isAddLIElement = false;
var elementCollectForLi = [];
var elementCollectForUL = [];

//解析错误栈
util.execStack = function ( stack, callback ){

    var stackArr = stack.split("\n"),
        stackStatement = stackArr[stackArr.length-1];

    var _stack = /at\s*(.+\/(\w+\.\w+)?):(\d+):(\d+)/.exec(stackStatement);
    var fullName = "",
        fileName = "",
        fileLine = 0,
        pos = 0;

    if(_stack){
        fullName = _stack[1];
        fileName = _stack[2] || fullName;
        fileLine = _stack[3];
        pos = _stack[4];
    }

    return {
        file : fileName,
        fullName : fullName,
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

        //非source面板，做美化
        if( !defaultOptions.line ){
            $body = beautify($body,{
                indent_size : 4
            })
        }

        isAddULElement = false;

        $body.split("\n").forEach(function (el,i){
            //element面板必须是每行都要有内容的
            //source面板则可以有空格行
            if((el && el.length > 0)|| defaultOptions.line){
                //lineNumber 的值为 i+1
                defaultOptions.lm = (i+1);

                //解析html，确定从属关系 (暂时没有实现)
                var _html = self.stringToDOMTree( el, defaultOptions );

                //解析完成后拼装
                codeStr += _html + "\n";
            }
        });

        return callback(codeStr);
    });
}

//是否是一个完整的闭合标签
util.isCloseTag = function (str){
    var m = str.match(/<(\w+).+<\/(\w+)>/im);
    if(m){
        return m[1] == m[2];
    }else{
        return false;
    }
}

//<returns> string
util.stringToDOMTree = function ( str, options ){

    var ict = this.isCloseTag(str);
    console.log(ict);

    //将 < 替换为 &lt;
    //将 > 替换为 &gt;
    //将 4个空格 替换为 4个&nbsp;
    str = str.replace(/\s{4}|<|>/g, function ( f ){
        if( f == "<" ){
            return "&lt;"
        }else if( f == ">" ){
            return "&gt;"
        }else{
            //source面板替换为&nbsp;
            //element面板替换为@，然后做再一次处理
            if( options.line ){
                return "&nbsp;&nbsp;&nbsp;";
            }else{
                return "{HOPPER}";
            }
        }
    });

    var hopper_len = str.split("{HOPPER}").length;

    hopper_len = (hopper_len && hopper_len > 1) ? hopper_len-1 : 0;

    //确定层级后，将{HOPPER}删除
    str = str.replace(/\{HOPPER\}/g,"&nbsp;&nbsp;&nbsp;&nbsp;");

    var $html = "";

    if( !options.line ){ //element模块
        if( hopper_len % 2 === 0 ){

            var $iof = elementCollectForLi.indexOf(hopper_len) > -1;

            if($iof && isAddLIElement ){
                $html += "</li>";
                elementCollectForLi.splice($iof,1);
            }

            if(!ict){
                elementCollectForLi.push(hopper_len);
            }

            isAddLIElement = true;
            $html += "<li class='hopper-rows hopper-tree'>";
        }else{
            if((elementCollectForUL[elementCollectForUL.length-1] == hopper_len) && isAddULElement){
                $html += "</ul>";
                elementCollectForUL.pop();
            }
            isAddULElement = true;
            elementCollectForUL.push(hopper_len);
            $html += "<ul class='hopper-table hopper-tree'>";
        }
    //source模块
    }else{
        $html = "<li>";
    }

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

    if( options.line ){ //source模块
        $html += "</li>";
    }

    return $html;
}


//解析localStorage/sessionStorage/cookie
util.parseStorage = function ( ls, callback ){
    if(typeof ls != "object"){
        return callback("");
    }
    var localStructure = "";
    for(var i in ls){
        localStructure += "<ul>";
        localStructure += "<li>" + i + "</li>";
        localStructure += "<li>" + ls[i] + "</li>";
        localStructure += "</ul>";
    }
    return callback(localStructure);
};

module.exports = util;







































