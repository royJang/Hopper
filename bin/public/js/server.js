var http = require("http");
var fs = require("fs");
var server = http.createServer();
var $ = require("jquery");
var _ = require("underscore");
var socket = require("socket.io");
var io = socket(server);
var gui = require('nw.gui');
var win = gui.Window.get();
win.maximize();

var listen = 5389;

var list_item = $(".connect-list-item");
var connectingList = $("#connecting");
var template = _.template(connectingList.html());
var connected = {};

io.on("connection", function (socket){
    socket.on('join', function(data){
        connected[data.hostname] = data.ua;
        var r = template({
            connecting : connected
        });
        list_item.html(r);
    });
});

server.listen(listen);

