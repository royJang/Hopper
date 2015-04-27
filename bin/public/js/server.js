var http = require("http"),
    fs = require("fs"),
    os = require('os');

var server = http.createServer(),
    socket = require("socket.io"),
    io = socket(server);

var $ = require("jquery"),
    _ = require("underscore");

var util = require("./public/js/util");
var log = require("./public/js/console");
var ip = require("./public/js/ip");

//默认端口
var listen = 5390;

//默认全屏
var gui = require('nw.gui');
var win = gui.Window.get();
//win.maximize();
//win.showDevTools();

//将title替换为hopper - ip
$("title").html("Hopper" + "    -    " + ip.address() + " : " + listen );

//链接部分
var list_item = $(".connect-list-item");
var connectingList = $("#connecting");
var template = _.template(connectingList.text());
var connected = {};

io.on("connection", function (socket){

    socket.on("disconnect", function (){
        //清空连接列表
        connected = {};
        list_item.html("");

        //console 执行disconnect
        log.disconnect();
    });

    //新成员加入
    socket.on('join', function(data){
        if(data){
            connected[data.hostname] = data.ua;
        }
        var r = template({
            connecting : connected
        });
        list_item.html(r);
    });

    //获取页面信息
    //url, localStorage, SessionStorage, cookies
    socket.on("pageInfo", log.pageInfo);

    //当有log请求
    socket.on("log", log.log);
    socket.on("clientError", log.clientError);
    socket.on("debug", log.debug);
});


server.listen(listen);

