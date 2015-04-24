var $ = require("jquery"),
    _ = require("underscore");

var util = require("./public/js/util");

//console部分
var panel = $("#console-panel"),
    $console = $("#hopper-console"),
    $console_template = _.template($console.text()),
    $console_statement = [];

var h = {
    log : function ( obj ){
        //解析栈
        var stackObj = util.execStack(obj.stack);
        //将解析结果赋给obj
            _.extend(obj,stackObj);
        //push进console列表中
        $console_statement.push(obj);
        //渲染template
        var r = $console_template({
            statement : $console_statement
        });
        panel.html(r);
    },
    debug : function ( stack ){

    }
};

module.exports = h;