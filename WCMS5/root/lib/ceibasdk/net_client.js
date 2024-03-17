var net = require('net');
var logger = require('../../tools/log4jsHelper.js').appLog();
//处理客户端接入服务推送来的数据模块，把二进制数据转化为json对象
var buffer2protocolObj = require('./buffer2protocol.js');

module.exports = {
    client: null,
    jsonCallback: null, //处理客户端推送数据的结果回调
    connectCallback: null, //已链接回调
    errorCallback: null, //错误回调
    host: null,
    port: null,
    maxReCnnect: 50000,
    reConnectCount: 0,
    //连接客户端接入服务次数
    reCnnectCount: 0,
    //心跳包发送次数
    sendKeepliveCount: 0,
    //客户端接入服务重连flag
    reCnnectSettimeoutFlag: null,
    init: function (host, port) {
        var that = this;
        //客户端接入服务IP
        that.host = host;
        //客户端接入服务port
        that.port = port;
        //接收客户端接入服务推送来的消息处理后应答(write)
        buffer2protocolObj.addHandler(function (data, bodyJson) {
            switch (bodyJson.operation) {
                //客户端接入发过来的心跳
                case 'keeplive':
                    that.client.write(data);
                    //心跳发送次数置为0
                    that.sendKeepliveCount = 0;
                    break;
                default:
                    //其他数据
                    that.jsonCallback(bodyJson);
                    break;
            }
        });
        this.client = net.connect({ host: host, port: port }, function (err) {
            console.log(`${new Date()},net.connect success! client localPort:${that.client.localPort}`);
            logger.info(`${new Date()},net.connect success! client localPort:${that.client.localPort}`);
            //当socket客户端分配的端口也是12020时，连上了自已，就要重连
            if (that.client.localPort === that.port) {
                logger.info('connect itself,localPort:', that.client.localPort);
                //http://www.tuicool.com/articles/2qUfU3
                //当连上自已时，1min再重连
                setTimeout(() => {
                    that.reConnect();
                }, 60 * 1000);
            } else {
                //客户端接入服务连接成功后回调，开始发登录验证信息
                if (that.connectCallback) {
                    that.connectCallback();
                }
                that.reConnectCount = 0;
            }
        });
        //客户端接入数据应答
        this.client.on('data', function (data) {
            buffer2protocolObj.push(data);
        });
        this.client.on('error', function (error) {
            logger.error('net client socket error', error);
            //当客户端接入服务异常，创建与客户端接入连接失败，connecting为false,30s后重连
            if (that.client && that.client.destroyed) {
                logger.info('setTimout net socket start connectting');
                if (that.reCnnectSettimeoutFlag) {
                    clearTimeout(that.reCnnectSettimeoutFlag);
                }
                that.reCnnectSettimeoutFlag = setTimeout(() => {
                    that.reConnect();
                }, 30 * 1000);
            }
        });
        this.client.on('end', function () {
            console.log('end');
        });
        this.client.on('close', function (error) {
            console.log('close', error);
        });
    },
    //向客 户端接入服务 写应答数据
    send: function (data) {
        if (this.client && !this.client.destroyed) {
            this.client.write(data);
        }
    },
    //断链接路
    clear: function () {
        if (this.client) {
            this.client.end();
            this.client.destroy();
        }
    },
    //重连客户端接入
    reConnect: function () {
        if (this.reConnectCount === this.maxReCnnect) {
            this.clear();
            this.reConnectCount = 0;
        } else {
            this.init(this.host, this.port);
            this.reConnectCount++;
            console.log(`[net socket has connect]: ${this.reConnectCount} [times]`);
        }
    },
    //客户端接入服务推送过来数据的处理回调
    addJsonHandler: function (callback) {
        this.jsonCallback = callback;
    },
    //net socket client连接客户端接入服务成功后，后续登录处理回调
    addConnectHandler: function (callback) {
        this.connectCallback = callback;
    },
    // 错误回调暂时没有用到
    addErrorHandler: function (callback) {
        this.errorCallback = callback;
    }
};
