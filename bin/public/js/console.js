var request = require("request");

var $ = require("jquery"),
    _ = require("underscore");

var util = require("./util.js");

//console nav
var consoleNavs = $(".hopper-console-nav-list");
//子nav
var elementNav = consoleNavs.find(".hopper-nav-element"),
    networkNav = consoleNavs.find(".hopper-nav-network"),
    sourceNav = consoleNavs.find('.hopper-nav-source'),
    resourcesNav = consoleNavs.find(".hopper-nav-resources"),
    consoleNav = consoleNavs.find(".hopper-nav-console");

//整个console面板变量获取
var consolePanels = $(".hopper-console-child-layout");
//子console面板
var elementPanel = consolePanels.find(".hopper-console-element"),
    networkPanel = consolePanels.find(".hopper-console-network"),
    sourcePanel = consolePanels.find('.hopper-console-source'),
    resourcesPanel = consolePanels.find(".hopper-console-resources"),
    consolePanel = consolePanels.find(".hopper-console-console");

//hash table
var navHashMap = {
    element : elementNav,
    network : networkNav,
    source : sourceNav,
    resources : resourcesNav,
    console : consoleNav
}

var panelHashMap = {
    element : elementPanel,
    network : networkPanel,
    source : sourcePanel,
    resources : resourcesPanel,
    console : consolePanel
}

//log部分
var logPanel = panelHashMap.console.find("#console-panel"),
    sourcePanelItems = panelHashMap.source.find(".file-items"),
    $console = $("#console-panel-template"),
    $source = $("#source-item-template"),
    $console_template = _.template($console.text()),
    $console_statement = [],
    $source_template = _.template($source.text()),
    $source_statement = [];

var activeClass = "active";

//console dom operator
consoleNavs.find("li").on("click", function (el){
    var r = $(this).text().toLowerCase();
    tableSwitch(r);
});

function tableSwitch (name){
    navSwitch(name) && panelSwitch(name);
}

//导航切换
function navSwitch ( obj ){
    consoleNavs.find("li").removeClass(activeClass);
    navHashMap[obj].addClass(activeClass);
    return true;
}

//面板切换
function panelSwitch( obj ){
    consolePanels.find(">div").removeClass(activeClass);
    panelHashMap[obj].addClass(activeClass);
    return true;
}

//element面板,展开/关闭树
$("#elementResource").delegate(".icon-plus", "click", function (){
    $(this).parent().find(">ul,>li").show();
    $(this).removeClass("icon-plus").addClass("icon-minus");
})

//source面板中的文件切换
sourcePanelItems.delegate("li", "click", function (e){
    var tag = $(this).attr("data-value");
    sourcePanelItems.find("li").removeClass("active");
    $(this).addClass("active");
    util.parseDOM(tag,{ //这里只展示line,不显示匹配的行号
        line : true,
        lineNumber : -1
    },function (data){
        panelHashMap.source.find("#showSource").html(data);
    })
});

//查询连接，并且跳转至source
logPanel.on("click", function (e){
    var panelName = "source";
    //当点击的是file标签
    if(e.target.nodeName === "FILE"){
        //先跳转到source页面
        tableSwitch(panelName);

        var et = $(e.target),
            t = et.attr("data-file"),
            u = et.attr("data-line");

        //对应的file对应显示active
        sourcePanelItems.find("li").each(function (i, el){
            var $li = $(el);
            if( $li.text() == t ){
                sourcePanelItems.find("li").removeClass("active");
                $li.addClass("active");
            }
        });

        util.parseDOM(t, {
            line : true,
            lineNumber : u
        }, function (data){
            panelHashMap[panelName].find("#showSource").html(data);
            window.location.href = "#l" + u;
        })
    }
});

//渲染
var h = {
    //当disconnect
    disconnect : function (){
        //element页面清空
        panelHashMap.element.find("#elementResource").html("");
        //resource页面清空
        panelHashMap.resources.find(".resource-content-content").html("");
        //log页面清空
        logPanel.html("");
        //log数组清空
        $console_statement.length = 0;
        $console_statement = [];
        //source数组清空
        $source_statement.length = 0;
        $source_statement = [];
        //source页面清空
        panelHashMap["source"].find("#showSource").html("");
        //resource 跳回 localStorage
        panelHashMap.resources.find(".resource-type>ul>li:eq(0)").click();
    },
    pageInfo : function ( obj ){
        //渲染dom
        util.parseDOM(obj.url, {}, function ( data ){
            panelHashMap.element.find("#elementResource").html(data);
        });
        //默认渲染localStorage
        util.parseStorage(obj.localStorage, function (data){
            panelHashMap.resources.find(".resource-content-content").html(data);
        });

        //resource页面,localStorage,SessionStorage,Cookie间切换
        var resourceTypeItem = panelHashMap.resources.find(".resource-type>ul>li");

        resourceTypeItem.on("click", function (){
            var typeTitle = $(this).text();
            var typeName = $(this).attr("data-value");
            resourceTypeItem.removeClass("active");
            $(this).addClass("active");
            util.parseStorage(obj[typeName], function (data){
                panelHashMap.resources.find(".resource-content-content").html(
                    data.length < 1 ? ("<p class='typeTitle'>"+typeTitle+"</p") : data
                );
            })
        });
    },
    log : function ( obj ){
        //解析栈
        var stackObj = util.execStack(obj.stack);
        //将解析结果赋给obj
            _.extend(obj,stackObj);

        var _log = obj.log;

        //客户端对string做了encodeURIComponent
        //这里做一个解析
        if( $.type(_log) == "string" ){
            obj.log = window.decodeURIComponent(_log);
        }

        //push进console列表中
        $console_statement.push(obj);
        //push进source的文件列表

        var IN = false;
        //判断在数组中有没有这个文件
        $source_statement.forEach(function (el, i){
            if( el.fullName == obj.fullName ){
                IN = true;
            }
        });

        if(!IN){
            $source_statement.push(obj);
        }

        //渲染console template
        var r = $console_template({
            statement : $console_statement
        });
        //渲染source template
        var sourceR = $source_template({
            statement : $source_statement
        });

        logPanel.html(r);
        sourcePanelItems.html(sourceR);
    },
    clientError : function (obj){
        obj.type = "Error";
        //push进console列表中
        $console_statement.push(obj);
        //渲染template
        var r = $console_template({
            statement : $console_statement
        });
        logPanel.html(r);
    },
    debug : function ( stack ){

    }
};

module.exports = h;