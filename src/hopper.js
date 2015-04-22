//hopper main
var socket = io.connect("http://10.10.12.103:5389");

var platform = function (){
    var _ua = navigator.userAgent.toLowerCase();
        _platform = "pc";

    var _platform_items = ["android", "iphone", "ipad", "windows phone"];

    _platform_items.forEach(function (el, i, array){
        if(_ua.indexOf(el) > -1){
            _platform = array[i];
        }
    })

    return _platform;
};

socket.emit("join", {
    ua : platform(),
    hostname : location.hostname
});