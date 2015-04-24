var c = chrome,
    cr = chrome.runtime;

var http = require("http"),
    fs = require("fs"),
    os = require('os');

var server = http.createServer(),
    socket = require("socket.io"),
    io = socket(server);

var $ = require("jquery"),
    _ = require("underscore");

var log = require("./public/js/console");

//默认端口
var listen = 5390;

//默认全屏
var gui = require('nw.gui');
var win = gui.Window.get();
//win.maximize();
//win.showDevTools();

//获取本地ip
function getLocalIP() {
    var _network = os.networkInterfaces();
    return _network["en0"][1].address;
}

//将title替换为hopper - ip
$("title").html("Hopper" + "    -    " + getLocalIP());

//链接部分
var list_item = $(".connect-list-item");
var connectingList = $("#connecting");
var template = _.template(connectingList.text());
var connected = {};

io.on("connection", function (socket){
    //新成员加入
    socket.on('join', function(data){
        connected[data.hostname] = data.ua;
        var r = template({
            connecting : connected
        });
        list_item.html(r);
    });
    //当有log请求
    socket.on("log", log.log);
    socket.on("debug", log.debug);
});

server.listen(listen);

