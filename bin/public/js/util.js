var _ = require("underscore");

var request = require("request");
var beautify = require("js-beautify").html;
var htmlparser = require("htmlparser2");

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

    //解析错误栈
    var _stack = /at\s*.+?((?:http|https|blob|file).+\/(\w+\.\w+)?):(\d+):(\d+)\)?/.exec(stackStatement);

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

        $body.split("\n").forEach(function (el,i){
            //element面板必须是每行都要有内容的
            //source面板则可以有空格行
            if((el && el.length > 0)|| defaultOptions.line){
                //lineNumber 的值为 i+1
                defaultOptions.lm = (i+1);

                var _html;

                //非html标签不做domParse
                if(/^[^<>`~!/@\#}$%:;)(_^{&*=|'+]+$/.test(el)){
                    _html = el;
                } else {
                    _html = self.stringToDOMTree( el, defaultOptions );
                }

                //解析完成后拼装
                codeStr += _html + "\n";
            }
        });

        return callback(codeStr);
    });
}

//是否是一个完整的闭合标签
util.isCloseTag = function (str){
    var _b = false;
    //有些人自闭合标签写的不规范，导致解析出错,
    //这里直接将自闭合枚举出来
    ["!doctype", "meta", "link", "img", "br", "hr", "area", "input", "<!--"].forEach(function (el){
        if( str.indexOf(el) > -1 ){
            _b = true;
        }
    })
    //匹配 <div></div> 这种格式的
    //匹配成功也算是闭合标签
    if( !!(str.match(/<(\w+).+<\/(\w+)>|<.+\/>/igm)) ){
        _b = true;
    }
    return _b;
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

    //str = str.toLowerCase();

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
        label:for(var i = 0, len = elementCollectForLi.length; i<len; i++ ){
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
        $html += "<i id=\"l"+ options.lm +"\">";
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
        }else {
            //非闭合标签++
            if( !ict ) {
                $html += "<ul class='hopper-table hopper-tree'><i class='icon-plus hopper-plus'></i>";
                $html += str;
                elementCollectForLi.push({
                    n : hopper_len,
                    tag : $tag
                });
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







































