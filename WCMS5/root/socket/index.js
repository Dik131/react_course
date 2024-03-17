var server = require('socket.io');
var timers = require('timers');
var sdk = require('../lib/ceibasdk/app.js');
var config = require('../config/app.json');
const enumMap = require('../config/enum.json');
var db_vehicle = require('../dbmysql/ceiba2/vehicle/index.js');
var commonfun = require('../tools/commonfun.js');
var logger = require('../tools/log4jsHelper.js').appLog();
var gpsHelper = require('../tools/gpsHelper.js');
const common_control = require('../controllers/commonFun/index.js');

function socket_emit(socket, type, errorcode) {
    socket.emit('sub_' + type, {
        message: 'sub_' + type + ' faild',
        errorcode: errorcode
    });
}
/**
 * 报警在车辆下线后推过来时，30s后将状态设置为下线
 * @param {*} deviceno
 */
function refreshState(lastItem, deviceno) {
    var item = {
        deviceno: deviceno,
        state: 0
    };
    setTimeout(function () {
        // 30s内有可能上线状态推送过来，此时取消推送下线状态
        if (lastItem.state === 0 && item.state === 2) {
            var arr = [];
            arr.push(item);
            app.data.state.push(arr);
        }
    }, 30 * 1000);
}
var app = {
    //管理链接对象
    connect: {
        list: [],
        //合法链接验证
        valid: function (socket, type, data) {
            //API接口订阅的为设备参数为didArray,元素为设备号
            if (data.didArray !== undefined) {
                if (data.key && data.key.length > 0) {
                    var keyObj = commonfun.validWcms4Token(data.key);
                    if (keyObj.rid === null || keyObj.uid === null) {
                        socket_emit(socket, type, enumMap.errorcode.key_error);
                        return false;
                    } else {
                        //校验didArray中设备权限
                        common_control
                            .validTeridAuthority(data.key, data.didArray)
                            .then(r => {
                                if (r.terid.length) {
                                    return true;
                                } else {
                                    socket_emit(socket, type, enumMap.errorcode.permission_denied);
                                    return false;
                                }
                            })
                            .catch(e => {
                                logger.error('socket_sub', e);
                                socket_emit(socket, type, enumMap.errorcode.servererror);
                                return false;
                            });
                    }
                } else {
                    //errorcode 210 授权key错误
                    socket_emit(socket, type, enumMap.errorcode.key_error);
                    return false;
                }
            } else {
                return true;
            }
        },
        push: function (socket) {
            //订阅定位信息
            //订阅格式json字符串 {vidArray:[1,2,3],didArray:['D13134559A']?alarmType:[1,2,3]}
            socket.on('sub_gps', function (data) {
                if (app.connect.valid(socket, 'gps', data)) {
                    app.sub.push(
                        socket.id,
                        data.vidArray === undefined ? [] : data.vidArray,
                        data.didArray === undefined ? [] : data.didArray,
                        'gps',
                        undefined,
                        data.cdType
                    );
                }
            });
            //订阅状态信息
            socket.on('sub_state', function (data) {
                if (app.connect.valid(socket, 'state', data)) {
                    app.sub.push(
                        socket.id,
                        data.vidArray === undefined ? [] : data.vidArray,
                        data.didArray === undefined ? [] : data.didArray,
                        'state'
                    );
                    app.pub('state'); //第一次订阅推最新历史列表
                }
            });
            //订阅报警信息
            socket.on('sub_alarm', function (data) {
                if (app.connect.valid(socket, 'alarm', data)) {
                    app.sub.push(
                        socket.id,
                        data.vidArray === undefined ? [] : data.vidArray,
                        data.didArray === undefined ? [] : data.didArray,
                        'alarm',
                        data.alarmType,
                        data.cdType
                    );
                }
            });
            //订阅里程信息
            socket.on('sub_mileage', function (data) {
                if (app.connect.valid(socket, 'mileage', data)) {
                    app.sub.push(
                        socket.id,
                        data.vidArray === undefined ? [] : data.vidArray,
                        data.didArray === undefined ? [] : data.didArray,
                        'mileage'
                    );
                }
            });
            //订阅ACC信息
            socket.on('sub_acc', function (data) {
                if (app.connect.valid(socket, 'acc', data)) {
                    app.sub.push(
                        socket.id,
                        data.vidArray === undefined ? [] : data.vidArray,
                        data.didArray === undefined ? [] : data.didArray,
                        'acc'
                    );
                }
            });
            //订阅GDS信息
            socket.on('sub_gds', function (data) {
                logger.info('订阅GDS信息');
                if (app.connect.valid(socket, 'gds', data)) {
                    app.sub.push(
                        socket.id,
                        data.vidArray === undefined ? [] : data.vidArray,
                        data.didArray === undefined ? [] : data.didArray,
                        'gds'
                    );
                }
            });
            //链接断开
            socket.on('disconnect', function () {
                app.connect.remove(socket.id);
                app.sub.remove(socket.id);
            });
            //增加链接到队列
            app.connect.list.push({
                id: socket.id,
                socket: socket
            });
        },
        remove: function (id) {
            var index = -1;
            var that = app.connect;
            for (var i = 0, l = that.list.length; i < l; i++) {
                if (that.list[i].id == id) {
                    that.list[i].socket = null; //释放资源
                    index = i;
                    break;
                }
            }
            if (index > -1) {
                that.list.splice(index, 1);
            }
        },
        send: function (socketid, type, data) {
            var that = app.connect;
            for (var i = 0, l = that.list.length; i < l; i++) {
                if (that.list[i].id == socketid) {
                    that.list[i].socket.emit('sub_' + type, data);
                    break;
                }
            }
        }
    },
    //管理数据
    data: {
        //车辆数据
        vehicle: {
            list: [],
            init: function () {
                app.data.vehicle.list.length = 0;
                db_vehicle
                    .getAllDeviceAndGroupInfo()
                    .then(data => {
                        for (let i = 0, l = data.length; i < l; i++) {
                            app.data.vehicle.list.push({
                                vid: data[i].id,
                                deviceno: data[i].deviceno,
                                groupName: data[i].name,
                                carlicense: data[i].carlicense
                            });
                        }
                    })
                    .catch(err => {
                        logger.error('---------------socket refresh vehicle failed------------------');
                        logger.error(err);
                    });
            },
            conv: function (deviceno) {
                var that = app.data.vehicle;
                for (var i = 0, l = that.list.length; i < l; i++) {
                    if (that.list[i].deviceno == deviceno) {
                        return that.list[i];
                    }
                }
                return null;
            }
        },
        //定位数据
        gps: {
            //列表
            list: [],
            //添加,存在更新，不存在添加
            push: function (item) {
                var isHad = false;
                var that = app.data.gps;
                for (var i = 0, l = that.list.length; i < l; i++) {
                    if (that.list[i].deviceno == item.deviceno) {
                        that.list[i] = item;
                        isHad = true;
                        break;
                    }
                }
                if (!isHad) {
                    that.list.push(item);
                }
            },
            //移除
            remove: function (deviceno) {
                var index = -1;
                var that = app.data.gps;
                for (var i = 0, l = that.list.length; i < l; i++) {
                    if (that.list[i].deviceno == deviceno) {
                        index = i;
                        break;
                    }
                }
                if (index > -1) {
                    that.list.splice(index, 1);
                }
            }
        },
        //报警数据
        alarm: {
            //列表
            list: [],
            //添加,存在更新，不存在添加
            push: function (item) {
                var isHad = false;
                var that = app.data.alarm;
                for (var i = 0, l = that.list.length; i < l; i++) {
                    if (that.list[i].deviceno == item.deviceno) {
                        that.list[i] = item;
                        isHad = true;
                        break;
                    }
                }
                if (!isHad) {
                    that.list.push(item);
                }
                var temp = {
                    deviceno: item.deviceno,
                    state: item.alarmState ? item.alarmState : 1 //1:解除报警  2:报警
                };
                app.data.state.push([temp]); //根据报警切换状态
            },
            //移除
            remove: function (deviceno) {
                var index = -1;
                var that = app.data.alarm;
                for (var i = 0, l = that.list.length; i < l; i++) {
                    if (that.list[i].deviceno == deviceno) {
                        index = i;
                        break;
                    }
                }
                if (index > -1) {
                    that.list.splice(index, 1);
                }
            }
        },
        //状态数据
        state: {
            //列表
            list: [],
            //添加,存在更新，不存在添加
            push: function (items) {
                var pubList = [];
                while (items.length > 0) {
                    var item = items.shift();
                    var isHad = false;
                    var that = app.data.state;
                    for (var i = 0, l = that.list.length; i < l; i++) {
                        if (that.list[i].deviceno == item.deviceno) {
                            if (that.list[i].state !== item.state) {
                                //状态有变化
                                pubList.push(item);
                            }
                            // 报警状态在下线状态之后推送设置定时器
                            if (that.list[i].state === 0 && item.state === 2) {
                                refreshState(that.list[i], item.deviceno);
                            }
                            that.list[i] = item;
                            isHad = true;
                            break;
                        }
                    }
                    if (!isHad) {
                        that.list.push(item);
                        pubList.push(item); //不存在
                    }
                }
                //推送变化的状态出去
                if (pubList.length > 0) {
                    app.pub('state', pubList);
                }
            },
            //移除
            remove: function (deviceno) {
                var index = -1;
                var that = app.data.state;
                for (var i = 0, l = that.list.length; i < l; i++) {
                    if (that.list[i].deviceno == deviceno) {
                        index = i;
                        break;
                    }
                }
                if (index > -1) {
                    that.list.splice(index, 1);
                }
            }
        },
        //里程数据
        mileage: {
            //列表
            list: [],
            //添加,存在更新,不存在添加
            push: function (item) {
                var isHad = false;
                var that = app.data.mileage;
                for (var i = 0, l = that.list.length; i < l; i++) {
                    if (that.list[i].deviceno == item.deviceno) {
                        that.list[i] = item;
                        isHad = true;
                        break;
                    }
                }
                if (!isHad) {
                    that.list.push(item);
                }
            },
            //移除
            remove: function (deviceno) {
                var index = -1;
                var that = app.data.mileage;
                for (var i = 0, l = that.list.length; i < l; i++) {
                    if (that.list[i].deviceno == deviceno) {
                        index = i;
                        break;
                    }
                }
                if (index > -1) {
                    that.list.splice(index, 1);
                }
            }
        },
        //ACC数据
        acc: {
            //列表
            list: [],
            //添加,存在更新,不存在添加
            push: function (item) {
                var isHad = false;
                var that = app.data.acc;
                for (var i = 0, l = that.list.length; i < l; i++) {
                    if (that.list[i].deviceno == item.deviceno) {
                        that.list[i] = item;
                        isHad = true;
                        break;
                    }
                }
                if (!isHad) {
                    that.list.push(item);
                }
            },
            //移除
            remove: function (deviceno) {
                var index = -1;
                var that = app.data.acc;
                for (var i = 0, l = that.list.length; i < l; i++) {
                    if (that.list[i].deviceno == deviceno) {
                        index = i;
                        break;
                    }
                }
                if (index > -1) {
                    that.list.splice(index, 1);
                }
            }
        },
        //GDS数据
        gds: {
            //列表
            list: [],
            //添加,存在更新,不存在添加
            push: function (item) {
                var isHad = false;
                var that = app.data.gds;
                for (var i = 0, l = that.list.length; i < l; i++) {
                    if (that.list[i].deviceno == item.deviceno) {
                        that.list[i] = item;
                        isHad = true;
                        break;
                    }
                }
                if (!isHad) {
                    that.list.push(item);
                }
            },
            //移除
            remove: function (deviceno) {
                var index = -1;
                var that = app.data.gds;
                for (var i = 0, l = that.list.length; i < l; i++) {
                    if (that.list[i].deviceno == deviceno) {
                        index = i;
                        break;
                    }
                }
                if (index > -1) {
                    that.list.splice(index, 1);
                }
            }
        }
    },
    //管理订阅
    sub: {
        list: [],
        //增加订阅
        push: function (socketid, vidArray, didArray, dataType, alarmType, cdType) {
            var isHad = false;
            var that = app.sub;
            for (var i = 0, l = that.list.length; i < l; i++) {
                if (that.list[i].sid == socketid) {
                    //TODO 针对增量订阅问题需要处理。目前只是全量订阅
                    that.list[i].vids = vidArray;
                    that.list[i].dids = didArray;
                    that.list[i][dataType].isEnable = true;
                    if (alarmType) {
                        that.list[i][dataType].alarmType = alarmType;
                    }
                    if (cdType) {
                        that.list[i][dataType].cdType = cdType;
                    }
                    isHad = true;
                    break;
                }
            }
            if (!isHad) {
                var item = {
                    sid: socketid, //链接id
                    vids: vidArray, //车辆id数组
                    dids: didArray, //终端id数组
                    gps: { isEnable: false, cdType: '0' }, //是否订阅了gps
                    state: { isEnable: false }, //是否订阅了状态
                    alarm: { isEnable: false, alarmType: [], cdType: '0' }, //是否订阅了报警
                    mileage: { isEnable: false }, //是否订阅了里程
                    acc: { isEnable: false }, //是否订阅了ACC
                    gds: { isEnable: false } //是否订阅了gds
                };
                item[dataType].isEnable = true;
                if (alarmType) {
                    item[dataType].alarmType = alarmType;
                }
                if (cdType) {
                    //是否纠偏
                    item[dataType].cdType = cdType;
                }
                that.list.push(item);
            }
        },
        //移除订阅
        remove: function (socketid) {
            var index = -1;
            var that = app.sub;
            for (var i = 0, l = that.list.length; i < l; i++) {
                if (that.list[i].sid == socketid) {
                    index = i;
                    break;
                }
            }
            if (index > -1) {
                that.list.splice(index, 1);
            }
        }
    },
    //初始化
    init: function (httpServer) {
        //初始化基础数据
        app.data.vehicle.init();
        timers.setInterval(function () {
            app.data.vehicle.init();
        }, 1000 * 60); //60 s 刷新一次数据
        try {
            var io = new server(httpServer);
            //建立链接
            io.on('connection', function (socket) {
                logger.info('socket.io 建立链接');
                app.connect.push(socket);
            });
            io.on('event', function (data) {});
            sdk.addHandler(function (dataType, data) {
                switch (dataType) {
                    case 'gps':
                        app.data.gps.push(data);
                        app.pub('gps', data);
                        break;
                    case 'alarm':
                        app.data.alarm.push(data);
                        app.pub('alarm', data);
                        break;
                    case 'state':
                        app.data.state.push(data);
                        break;
                    case 'mileage':
                        app.data.mileage.push(data);
                        app.pub('mileage', data);
                        break;
                    case 'acc':
                        app.data.acc.push(data);
                        app.pub('acc', data);
                        break;
                    case 'gds':
                        app.data.gds.push(data);
                        app.pub('gds', data);
                        break;
                    default:
                        break;
                }
            });
            sdk.init(config.ceiba2ip, config.ceiba2port);
        } catch (err) {
            logger.error(err);
        }
    },
    //发布
    pub: function (type, data) {
        if (data) {
            //sdk推送
            if (data.length) {
                while (data.length) {
                    app.send(type, data.shift());
                }
            } else {
                app.send(type, data);
            }
        } else {
            //缓存数据
            var that = app.data[type];
            for (var i = 0, l = that.list.length; i < l; i++) {
                app.send(type, that.list[i]);
            }
        }
    },
    //发送
    send: function (type, data) {
        var sub = app.sub;
        var vehicle = app.data.vehicle.conv(data.deviceno);
        if (vehicle === null) {
            return;
        }
        data.vid = vehicle.vid;
        data.carlicense = vehicle.carlicense;
        data.groupName = vehicle.groupName;
        if (data.dateTime) {
            data.dateTime = commonfun.getNowDateTime(data.dateTime);
            delete data.serverTime;
        }
        var tempData = null;
        for (var i = 0, l = sub.list.length; i < l; i++) {
            tempData = JSON.parse(JSON.stringify(data)); //解构，解决不同订阅内容（如有无经纬度纠偏）的bug
            var item = sub.list[i];
            if (item[type].isEnable) {
                //是否启用了订阅
                if (item.dids.length === 0 && item.vids.length !== 0) {
                    //车辆id订阅方式
                    if (!app.exist(tempData.vid, item.vids)) {
                        //车辆id过滤
                        continue; //未订阅车辆
                    }
                }
                if (item.vids.length === 0 && item.dids.length !== 0) {
                    //终端id订阅方式
                    if (!app.exist(tempData.deviceno, item.dids)) {
                        //终端id过滤
                        continue; //未订阅车辆
                    }
                }
                if (item[type].cdType && item[type].cdType !== '0') {
                    //是否纠偏
                    if (tempData.lat !== '-' || tempData.lng !== '-') {
                        //过滤无效
                        var tempLat = parseFloat(tempData.lat);
                        var tempLng = parseFloat(tempData.lng);
                        if (tempLat !== 0 || tempLng !== 0) {
                            //过滤异常点
                            var tempPoint = gpsHelper.gps84_To_Gcj02(tempLat, tempLng);
                            if (item[type].cdType === '9') {
                                tempPoint = gpsHelper.gcj02_To_Bd09(tempPoint.lat, tempPoint.lng);
                            }
                            tempData.lat = tempPoint.lat.toFixed(6);
                            tempData.lng = tempPoint.lng.toFixed(6);
                        }
                    }
                }
                if (type == 'alarm') {
                    //是否报警
                    if (item[type].alarmType.length === 0) {
                        //所有报警类型
                        app.connect.send(item.sid, type, tempData);
                    } else if (app.exist(tempData.type, item[type].alarmType)) {
                        //其他报警类型
                        app.connect.send(item.sid, type, tempData);
                    }
                } else {
                    app.connect.send(item.sid, type, tempData);
                }
            }
        }
    },
    exist: function (item, array) {
        for (var i = 0, l = array.length; i < l; i++) {
            if (item == array[i]) {
                return true;
            }
        }
        return false;
    }
};
module.exports = app;
