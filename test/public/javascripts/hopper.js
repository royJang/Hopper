(function (window){

    //hopper main
    var socket = io.connect("http://10.10.12.103:5390");

    var class2type = {},
        toString = class2type.toString;

    "Boolean Number String Function Array Date RegExp Object Error".split(" ").forEach(function ( el ){
        class2type[ "[object " + el + "]" ] = el.toLowerCase();
    });

    var console = window.console;

    //获得当前的地址
    var path = window.location.href,
        localStorage = window.localStorage,
        sessionStorage = window.sessionStorage;

    var rwindow = /^\[object (?:Window|DOMWindow|global)\]$/;

    var oproto = Object.prototype;
    var ohasOwn = oproto.hasOwnProperty;
    var serialize = oproto.toString;

    var ap = Array.prototype;
    var aps = ap.slice;
    var apf = ap.forEach;
    var apu = ap.push;

    //捕获全局异常
    window.onerror = function (log, file, line, pos) {
        socket.emit("clientError", {
            log: log,
            file: file,
            line: line,
            pos: pos
        });
    };

    var whatTheFuck = function ( callback ){
        try{
            new Error("bom");
        }
        catch(e){
            console.log(e);
            return callback(e);
        }
    };

    var getType = function ( obj ){
        if (obj == null) {
            return String(obj)
        }
        // 早期的webkit内核浏览器实现了已废弃的ecma262v4标准，可以将正则字面量当作函数使用，因此typeof在判定正则时会返回function
        return typeof obj === "object" || typeof obj === "function" ?
        class2type[serialize.call(obj)] || "object" :
            typeof obj
    },
    isWindow = function (obj) {
        return rwindow.test(serialize.call(obj))
    }

    //获取客户端localStorage & session Storage
    function getStorage ( storage ){
        var o = {},
            len = storage.length;
        for(var i= 0; i<len; i++){
            var _k = storage.key(i);
            o[_k] = storage.getItem(_k);
        }
        return o;
    }

    //获取客户端cookie
    function getCookies (){
        var o = {};

        document.cookie.split(";").forEach(function (el){
            var c = el.split("=");
            o[c[0]] = c[1];
        });

        return o;
    }

    var util = {
        isPlainObject : function (obj){
            if (!obj || getType(obj) !== "object" || obj.nodeType || isWindow(obj)) {
                return false;
            }
            try {
                if (obj.constructor && !ohasOwn.call(obj, "constructor") && !ohasOwn.call(obj.constructor.prototype, "isPrototypeOf")) {
                    return false;
                }
            } catch (e) {
                return false;
            }

            for (key in obj) {}

            return key === void 0 || ohasOwn.call(obj, key)
        },
        platform : function (){
            var _ua = navigator.userAgent.toLowerCase(),
                _platform = "pc",
                _platform_items = ["android", "iphone", "ipad", "windows phone"];

            _platform_items.forEach(function (el, i, array){
                if(_ua.indexOf(el) > -1){
                    _platform = array[i];
                }
            })
            return _platform;
        }
    };

    function send (args, stack){
        var _log = "",
            _type = "";

        apf.call(args, function (el, i, array){
            var obj = el
            var log = obj;
            var type = getType(log);

            //根据type 处理log
            switch ( type ){
                case "object" : {
                    //是一个元素
                    if(!util.isPlainObject(obj)){
                        log = obj.toString();
                    }else{
                        log = JSON.stringify(obj);
                    }
                    break;
                }
                case "string" : {
                    log = encodeURIComponent(obj);
                    break;
                }
                case "function" : {
                    log = log.toString();
                    break;
                }
                case "regexp" : {
                    log = obj.log.toString();
                    break;
                }
                case "array" : {
                    log = "[ " + log + " ]";
                    break;
                }
                case "undefined" : {
                    break;
                }
            }

            //索引大于0 在log 前面加一个, 变为 <String, String>这种形式～
            _log += (i > 0 ? (", " + log) : log);
            _type += (i > 0 ? (", " + type) : type);
        })
        socket.emit("log", {
            log : _log,
            type : _type,
            stack : stack
        });
    }

    function log (){
        var args = arguments;
        //获取文件信息
        whatTheFuck(function (e){
            send( args, e.stack );
        })
    }

    function debug (){
        whatTheFuck(function (e){
            //捕获错误栈,传给server,这样server就知道当前是哪个页面了
            socket.emit("debug", e.stack);
        });
    }

    //覆盖console
    console.log = log;
    console.info = log;
    console.warn = log;
    console.error = log;

    //join ~
    socket.emit("join", {
        ua : util.platform(),
        hostname : location.hostname
    });

    //传输DOM结构
    socket.emit("pageInfo", {
       url : path,
       localStorage : getStorage(localStorage),
       sessionStorage : getStorage(sessionStorage),
       cookies : getCookies()
    });

})(window);







