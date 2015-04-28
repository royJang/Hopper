var http = require("http"),
    fs = require("fs"),
    os = require('os'),
    url = require("url"),
    process = require("process");

var server = http.createServer(httpHandle),
    socket = require("socket.io"),
    io = socket(server);

var $ = require("jquery"),
    _ = require("underscore");

var util = require("./public/js/util");
var log = require("./public/js/console");
var ip = require("./public/js/ip");

var localStorage = window.localStorage;

//默认端口

var port,
    _port = localStorage.getItem('port');

if( !_port ){
    port = 5390;
    localStorage.setItem('port', 5390);
}else{
    port = localStorage.getItem('port');
}

console.log(port);


//最后给出的js是这样一个地址
/*
    http://ip:port/hopper.js
*/

//默认全屏
var gui = require('nw.gui');
var win = gui.Window.get();
//win.maximize();
//win.showDevTools();

//将title替换为hopper - ip
$("title").html("Hopper" + "    -    " + ip.address() + " : " + port);

//实现一个只能提供js的http静态服务器
function httpHandle (request ,response){
    //解析请求url
    var pathname = url.parse(request.url).pathname;
    //拿到当前绝对路径
    var realPath = process.cwd() + "/client/dist" + pathname;
    fs.exists(realPath, function (exists) {
        if (!exists) {
            response.writeHead(404, {'Content-Type': 'text/plain'});
            response.end();
        } else {
            fs.readFile(realPath, "binary", function(err, file) {
                if (err) {
                    response.writeHead(500, {"Content-Type": "text/plain"});
                    response.end(err);
                } else {
                    response.writeHead(200, {"Content-Type" : "text/javascript"});
                    response.write(file, "binary");
                    response.end();
                }
            });
        }
    });
}

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

server.listen(port);

