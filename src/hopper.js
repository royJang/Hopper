(function (window){

    //hopper main
    var socket = io.connect("http://10.10.12.103:5390");

    var class2type = {},
        toString = class2type.toString;

    "Boolean Number String Function Array Date RegExp Object Error".split(" ").forEach(function ( el ){
        class2type[ "[object " + el + "]" ] = el.toLowerCase();
    });

    var rwindow = /^\[object (?:Window|DOMWindow|global)\]$/;
    var oproto = Object.prototype;
    var ohasOwn = oproto.hasOwnProperty;
    var serialize = oproto.toString;
    var ap = Array.prototype;
    var aps = ap.slice;
    var apf = ap.forEach;
    var apu = ap.push;

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

    function copyObject(org) {
        var copy = Object.create(Object.getPrototypeOf(org));
        copyOwnPropertiesFrom(copy, org);
        return copy;
    }

    function copyOwnPropertiesFrom(target, source) {
        Object.getOwnPropertyNames(source)
            .forEach(function(propertyKey) {
                var desc = Object.getOwnPropertyDescriptor(source, propertyKey);
                Object.defineProperty(target, propertyKey, desc);
            });

        return target;
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

    var h  = {
        send : function (args, stack){
            var _log = "",
                _type = "",
                _stack = stack;

            apf.call(args, function (el, i, array){

                var obj = el
                var log = obj;
                var type = getType(log);

                //根据type 处理log
                switch ( type ){
                    case "object" : {
                        var _obj = obj;
                        //是一个元素
                        if(!util.isPlainObject(_obj)){
                            log = _obj.toString();
                        }else{
                            log = JSON.stringify(_obj);
                        }
                        break;
                    }
                    case "string" : {
                        log = String(log);
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
                stack : _stack
            });
        },
        log : function (){
            var _stack;
            //获取文件信息
            try {
                whatTheFuck
            }catch(e){
                _stack = e.stack;
            }
            this.send( arguments, _stack );
        },
        info : function (){
            this.log( arguments );
        },
        warn : function (){
            this.log( arguments );
        },
        error : function ( msg, file, line ){
            this.send({
                "log": msg,
                "type": "Error",
                "line" : line,
                "file" : file
            });
        },
        debug : function (){
            var self = this;
            try{
                whatTheFuck
            }
            catch(e){
                //捕获错误栈,传给server,这样server就知道当前是哪个页面了
                socket.emit("debug", e.stack);
            }
        }
    };

    //覆盖console
    window.console = h;

    //捕获全局异常
    window.onerror = function (msg, file, line) {
        console.error(msg, file, line);
    };

    //join ~
    socket.emit("join", {
        ua : util.platform(),
        hostname : location.hostname
    });

})(window);


console.log(1,2);

//console.debug();








