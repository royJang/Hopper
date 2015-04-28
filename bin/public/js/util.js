var _ = require("underscore");

var request = require("request");
var beautify = require("js-beautify").html;

var util = {};

var isAddLIElement = false;
var elementCollectForLi = [];

var char = "\x68\x23\x23";
var replaceChar = "&nbsp;";
var reg = new RegExp(char + "|<|>", "g");
var reg2 = new RegExp(char, "g");

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

//bug太多了，没法fixed
util.parseDOM = function ( url, options, callback ){
    var self = this,
        defaultOptions = {
            line : false
        };

    _.extend(defaultOptions, options);

    request(url, function (err, data){

        var $body = data.body;
        var codeStr = "";

        //element模块做一下美化
        if( !defaultOptions.line ){
            $body = beautify($body,{
                indent_size : 4,
                indent_char : char
            })
        }

        isAddULElement = false;

        $body.split("\n").forEach(function (el,i){
            //element面板必须是每行都要有内容的
            //source面板则可以有空格行
            if((el && el.length > 0)|| defaultOptions.line){
                //lineNumber 的值为 i+1
                defaultOptions.lm = (i+1);

                //解析html，确定从属关系
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
    return !!str.match(/<(\w+).+<\/(\w+)>|<.+\/>/igm);
}

util.isCompleteTag = function ( $tag ){
    var _b = false;
    elementCollectForLi.forEach(function (el,i){
        if( "/" + el.tag === $tag ){
            _b = true;
        }
    });
    return _b;
}

//<returns> string
util.stringToDOMTree = function ( str, options ){

    //doctype头直接return出去
    if( str.toLowerCase().indexOf("!doctype") > -1 ){
        return "<li class='hopper-rows hopper-tree'><font color='#ccc'>" + str + "</font></li>";
    }

    var ict = this.isCloseTag(str),
        _tag = str.replace(reg2, "").match(/<(\/?\w+)/);
    var $tag = _tag ? _tag[1] : null;

    //将 < 替换为 &lt;
    //将 > 替换为 &gt;
    str = str.replace(reg, function ( f ){
        if( f == "<" ){
            return "&lt;"
        }else if( f == ">" ){
            return "&gt;"
        }else{
            //将 char 替换为 空格;
            if( options.line ){
                return replaceChar;
            }
            //element面板不做处理，原样返回
            else{
                return char;
            }
        }
    });

    var hopper_len = str.split(char).length;
    hopper_len = (hopper_len && hopper_len > 1) ? (hopper_len-1) : 0;

    //确定length后，将char删除
    str = str.replace(reg2, replaceChar);

    var $html = "";

    var hasHopper = function (){
        var _b = false,
            n = -1;
        label:for(var i= 0, len=elementCollectForLi.length; i<len; i++ ){
            var el = elementCollectForLi[i];
            if( el.n == hopper_len ){
                _b = true;
                n = i;
                break label;
            }
        }
        return {
            n : n,
            b : _b
        };
    }

    var $iof = hasHopper(),
        isCanBeCloseTag = (!ict && $iof.b) && this.isCompleteTag($tag),
        mayBeCloseTag = !ict && this.isCompleteTag($tag);

    //需要加行号
    if( options.line ){
        $html += "<li>";
        $html += "<i>";
        $html += options.lm;
        $html += "</i>";
        //如果支持显示行号
        //且行号 等于 当前渲染的 行数
        //则 把当前行 加一个active,css会把它渲染成黄色的
        if( options.line && options.lineNumber && options.lineNumber > 0 && options.lineNumber == options.lm ){
            $html += "<active>"+ str +"</active>";
        }else{
            $html += str;
        }
        $html += "</li>";
    }else{
        //闭合标签直接over
        if( ict ){
            $html += "<li class='hopper-rows hopper-tree'>" + str + "</li>";
        }
        //可以闭合标签的时候，闭合ul
        if( isCanBeCloseTag ){
            elementCollectForLi.splice($iof.n, 1);
            $html += str;
            $html += "</ul>";
        }
        //也许可以闭合标签的时候 xxxx </xx> 这种情况下
        else if( mayBeCloseTag ){
            $html += str;
            $html += "</ul>";
        }
        //非闭合标签++
        else if( !ict ) {
            $html += "<ul class='hopper-table hopper-tree'>";
            $html += str;
            elementCollectForLi.push({
                n : hopper_len,
                tag : $tag
            });
        }
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
    return callback( localStructure );
};

module.exports = util;







































