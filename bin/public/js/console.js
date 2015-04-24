var request = require("request");

var $ = require("jquery"),
    _ = require("underscore");

var util = require("./util.js");

//console nav
var consoleNavs = $(".hopper-console-nav-list");
//子nav
var elementNav = consoleNavs.find(".hopper-nav-element"),
    networkNav = consoleNavs.find(".hopper-nav-network"),
    resourceNav = consoleNavs.find('.hopper-nav-resource'),
    profileNav = consoleNavs.find(".hopper-nav-profile"),
    consoleNav = consoleNavs.find(".hopper-nav-console");

//整个console面板变量获取
var consolePanels = $(".hopper-console-child-layout");
//子console面板
var elementPanel = consolePanels.find(".hopper-console-element"),
    networkPanel = consolePanels.find(".hopper-console-network"),
    resourcePanel = consolePanels.find('.hopper-console-resource'),
    profilePanel = consolePanels.find(".hopper-console-profile"),
    consolePanel = consolePanels.find(".hopper-console-console");

//hash table
var navHashMap = {
    element : elementNav,
    network : networkNav,
    resource : resourceNav,
    profile : profileNav,
    console : consoleNav
}

var panelHashMap = {
    element : elementPanel,
    network : networkPanel,
    resource : resourcePanel,
    profile : profilePanel,
    console : consolePanel
}

//log部分
var logPanel = consolePanel.find("#console-panel"),
    $console = $("#console-panel-template"),
    $console_template = _.template($console.text()),
    $console_statement = [];

var activeClass = "active";

//console dom operator
consoleNavs.find("li").on("click", function (el){
    var r = $(this).text().toLowerCase();
    tableSwitch(r);
});

function tableSwitch (name){
    navSwitch(name);
    panelSwitch(name);
}

//导航切换
function navSwitch ( obj ){
    consoleNavs.find("li").removeClass(activeClass);
    navHashMap[obj].addClass(activeClass);
}

//面板切换
function panelSwitch( obj ){
    consolePanels.find(">div").removeClass(activeClass);
    panelHashMap[obj].addClass(activeClass);
}

//查询连接，并且跳转至resource
logPanel.on("click", function (e){
    var panelName = "resource";
    //当点击的是file标签
    if(e.target.nodeName === "FILE"){
        //先跳转到resource页面
        tableSwitch(panelName);
        var t = $(e.target).text().split("^");
        var fileName = t[0];
        var line = t[1];
        request(fileName, function (err, data){
            var _body = data.body;
            panelHashMap[panelName].find("#showResource").text(data.body);
        })
    }
});

//渲染
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
        logPanel.html(r);
    },
    debug : function ( stack ){

    }
};

module.exports = h;