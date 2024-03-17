var sdkClientObj = require('./net_client.js');
var messageObj = require('./message.js');
var logger = require('../../tools/log4jsHelper.js').appLog();
const commonfun = require('../../tools/commonfun.js');

function alarmpub_regalarm(userid) {
    return messageObj.alarmpub_regalarm(userid);
}

function alarmpub_subgps(userid) {
    return messageObj.alarmpub_subgps(userid);
}

function cmanm_clientlogin() {
    return messageObj.cmanm_clientlogin();
}

function ols_regols(clientid) {
    return messageObj.ols_regols(clientid);
}

function ols_getoldevice(clientid) {
    return messageObj.ols_getoldevice(clientid);
}
function cmanm_keeplive(clientid) {
    return messageObj.cmanm_keeplive(clientid);
}
/**
 * 断开与客户端接入服务的链接，再启动重连
 */
function disconnectClientAccessAndReconnect() {
    sdkClientObj.clear();
    sdkClientObj.reConnect();
}
module.exports = {
    /**
     *
     */
    callback: null,
    /**
     * 注册回调
     * dataType=alarm/gps/state/
     * function(dataType,data){}
     */
    addHandler: function (cb) {
        if (typeof cb == 'function') {
            this.callback = cb;
        }
    },
    /**
     * 初始化
     */
    init: function (ip, port) {
        var that = this;
        var loginFlag = null;
        var alarmSubFlag = null;
        var gpsSubFlag = null;
        var stateSubFlag = null;
        //心跳包定时器标志
        let keepliveFlag = null;
        //socket客户端向客户端接入服务注册次数，超过5次无回应时，重连
        let sdkClientRegCout = 1;
        sdkClientObj.init(ip, port); //210.21.204.50  12020
        //客户端接入连接成功回调
        sdkClientObj.addConnectHandler(function () {
            //获取 登录客户端接入服务 请求体request
            var request = cmanm_clientlogin();
            sdkClientObj.send(request);
            //socket sdk client 10s 发一次登录注册请求
            if (loginFlag) {
                clearInterval(loginFlag);
            }
            loginFlag = setInterval(function () {
                if (sdkClientRegCout <= 3) {
                    logger.info(`clientlogin try register times:${sdkClientRegCout}`);
                    sdkClientRegCout += 1;
                    sdkClientObj.send(request);
                } else {
                    //向客户端接入服务注册失败后，取消注册，断开链接，重连客户端接入服务
                    if (loginFlag) {
                        clearInterval(loginFlag);
                    }
                    sdkClientRegCout = 1;
                    disconnectClientAccessAndReconnect();
                }
            }, 10000);
        });
        //客户端接入应答解析回高
        sdkClientObj.addJsonHandler(function (json) {
            switch (json.operation) {
                case 'clientlogin':
                    //登录成功应答，清除5s定时发登录注册请求操作
                    if (loginFlag) {
                        //客户端接入注册次数置1
                        sdkClientRegCout = 1;
                        clearInterval(loginFlag);
                    }
                    var clientid = json.response.clientid;
                    logger.info('[' + new Date().toISOString() + ']:clientid:' + clientid + '\n\t');
                    //订阅报警
                    var requestAlarm = alarmpub_regalarm(clientid);
                    sdkClientObj.send(requestAlarm);

                    alarmSubFlag = setInterval(function () {
                        sdkClientObj.send(requestAlarm);
                    }, 20000);
                    //订阅GPS
                    setTimeout(function () {
                        var requestGps = alarmpub_subgps(clientid);
                        sdkClientObj.send(requestGps);

                        gpsSubFlag = setInterval(function () {
                            sdkClientObj.send(requestGps);
                        }, 21000);
                    }, 500);

                    //订阅上下线状态
                    setTimeout(function () {
                        var requestState = ols_regols(clientid);
                        sdkClientObj.send(requestState);
                        stateSubFlag = setInterval(function () {
                            sdkClientObj.send(requestState);
                        }, 22000);
                    }, 1000);
                    //发送心跳
                    setTimeout(() => {
                        if (keepliveFlag) {
                            clearInterval(keepliveFlag);
                        }
                        keepliveFlag = setInterval(() => {
                            if (sdkClientObj.sendKeepliveCount < 3) {
                                //心跳最大重试三次
                                let request_keepalive = cmanm_keeplive(clientid);
                                sdkClientObj.send(request_keepalive);
                                //心跳发送次数+1
                                sdkClientObj.sendKeepliveCount += 1;
                            } else {
                                if (keepliveFlag) {
                                    clearInterval(keepliveFlag);
                                }
                                //心跳发送次数置0
                                sdkClientObj.sendKeepliveCount = 0;
                                //心跳发送三次无应答时
                                disconnectClientAccessAndReconnect();
                            }
                        }, 10000);
                    }, 1500);
                    break;
                case 'pa':
                    var isZip = json.parameter.z; //是否压缩
                    var dataArray = json.parameter.d;
                    if (dataArray === null) {
                        return;
                    }
                    for (var data of dataArray) {
                        //logger.info(data);
                        var gpsAll = data.p;
                        var serverDate = new Date();
                        let gpsDate = new Date();
                        gpsDate.setTime(gpsAll && gpsAll.t ? gpsAll.t * 1000 : data.t * 1000);
                        if (data.y > 0) {
                            //报警
                            if (data.y == 752) {
                                //里程
                                var mileage = {
                                    deviceno: data.d,
                                    dateTime: gpsDate,
                                    serverTime: serverDate,
                                    mileage: data.ml.m / 1000
                                };
                                that.callback('mileage', mileage);
                            } else if (data.y == 751) {
                                //ACC
                                var acc = {
                                    deviceno: data.d,
                                    acc: data.ac.a,
                                    dateTime: gpsDate,
                                    serverTime: serverDate,
                                    lat: gpsAll ? gpsAll.w : '-',
                                    lng: gpsAll ? gpsAll.j : '-',
                                    speed: gpsAll ? gpsAll.s / 100 : '-',
                                    direction: gpsAll ? gpsAll.c / 100 : '-',
                                    altitude: gpsAll ? (gpsAll.h ? gpsAll.h : '-') : '-'
                                };
                                that.callback('acc', acc);
                            } else if (data.y == 753) {
                                //GDS
                                var result = {
                                    deviceno: data.d,
                                    gpsinfo: data.p,
                                    utime: commonfun.getNowDateTime(gpsDate),
                                    accelerator: data.g.a,
                                    normalbrake: data.g.b,
                                    handbrake: data.g.h,
                                    coolanttemp: data.g.c,
                                    voltage: data.g.v,
                                    engineload: data.g.e,
                                    instantfuel: data.g.i / 100,
                                    shortfuel: data.g.s / 100,
                                    totalfuel: data.g.f / 100,
                                    shortmileage: data.g.m / 100,
                                    totalmileage: data.g.tm / 100,
                                    uspeed: data.g.u / 100,
                                    torque: data.g.q / 100,
                                    enginerpm: data.g.r,
                                    clutchcount: data.g.l
                                };
                                that.callback('gds', result);
                            } else {
                                var alarm = {
                                    deviceno: data.d,
                                    type: data.y,
                                    state: 2,
                                    alarmId: data.a ? data.a : '',
                                    alarmState: data.c, //1 解除报警  2 开始报警   3 预警
                                    speed: gpsAll ? gpsAll.s / 100 : '-',
                                    direction: gpsAll ? gpsAll.c / 100 : '-',
                                    content: data.f ? data.f : '',
                                    lat: gpsAll ? gpsAll.w : '-',
                                    lng: gpsAll ? gpsAll.j : '-',
                                    altitude: gpsAll ? gpsAll.h : '-',
                                    dateTime: gpsDate,
                                    serverTime: serverDate
                                };
                                that.callback('alarm', alarm);
                            }
                        } else {
                            //非报警
                            var gps = {
                                deviceno: data.d,
                                lat: gpsAll ? gpsAll.w : '-',
                                lng: gpsAll ? gpsAll.j : '-',
                                state: 1,
                                speed: gpsAll ? gpsAll.s / 100 : '-',
                                direction: gpsAll ? gpsAll.c / 100 : '-',
                                altitude: gpsAll.h ? gpsAll.h : '-',
                                dateTime: gpsDate,
                                serverTime: serverDate
                            };
                            that.callback('gps', gps);
                        }
                    }
                    break;
                case 'regols':
                    if (stateSubFlag) {
                        clearInterval(stateSubFlag);
                    }
                    var iszip = json.response.iszip;
                    var data = json.response.data;
                    if (data === null || data === undefined) return;
                    var result = [];
                    for (var tid of data.terid) {
                        var obj = { deviceno: tid, state: 1 };
                        result.push(obj);
                    }
                    that.callback('state', result);
                    break;
                case 'updateols':
                    var iszip = json.response.iszip;
                    var data = json.response.data;
                    if (data === null) return;
                    var result = [];
                    for (var i = 0; i < data.terid.length; i++) {
                        var sta = data.status ? data.status[i] : 1;
                        var obj = { deviceno: data.terid[i], state: sta };
                        result.push(obj);
                    }
                    that.callback('state', result);
                    break;
                case 'regalarm':
                case 'subgps':
                    if (gpsSubFlag) {
                        clearInterval(gpsSubFlag);
                    }
                    if (alarmSubFlag) {
                        clearInterval(alarmSubFlag);
                    }
                    break;
                default:
                    break;
            }
        });
    }
};
