'user strict';
var async = require('async');
var fs = require('fs');
var path = require('path');
var exec = require('child_process').exec;
let multiparty = require('multiparty');
let Buffer = require('buffer').Buffer;
var messageBus = require('../../../../messagebus/index.js');
var requestP = require('../../../../tools/lavaRequest.js').RequestP;
var config = require('../../../../config/app.json');
var enumMap = require('../../../../config/enum.json');
var logger = require('../../../../tools/log4jsHelper.js').apiLog();
var commonfun = require('../../../../tools/commonfun.js');
var errorMap = require('../../../../tools/errorcodemap.js');
var db_user = require('../../../../db' + config.dbType + '/ceiba2/user/index.js');
var db_group = require('../../../../db' + config.dbType + '/ceiba2/group/index.js');
var db_vehicle = require('../../../../db' + config.dbType + '/ceiba2/vehicle/index.js');
var db_roleauthority = require('../../../../db' + config.dbType + '/ceiba2/roleauthority/index.js');
var db_ads = require('../../../../db' + config.dbType + '/ceiba2/ads/index.js');
var db_evidence = require('../../../../db' + config.dbType + '/ceiba2/evidence/index.js');
let db_sqlite_ads = require('../../../../dbsqlite/ads/index.js');
let db_fence = require('../../../../db' + config.dbType + '/ceiba2/fence/index.js');
let db_alarm = require('../../../../db' + config.dbType + '/ceiba2/alarm/index.js');
let db_systemconfig = require('../../../../db' + config.dbType + '/ceiba2/system-config/index.js');
let downloadControl = require('../../../download/index.js');

const TEMPDIR = commonfun.getTemDir();
//const EVIDENCEPICPATH = commonfun.getPictureDir() + path.sep + "EvidenceSnap";

/**
 * 获取请求路径中的参数
 * @name string 获取的参数名
 */
function getQueryString(name, uri) {
    var reg = new RegExp('(^|&)' + name + '=([^&]*)(&|$)', 'i');
    var r = uri.substr(1).match(reg);
    if (r != null) return unescape(r[2]);
    return null;
}

/**
 * 递归查找车组ID
 */
function recursionGroup(pid, items) {
    if (typeof pid == 'string') {
        pid = parseInt(pid);
    }
    var result = [pid];
    var childrens = getChildrensByPid(pid, items);
    if (childrens.length > 0) {
        for (var i = 0; i < childrens.length; i++) {
            var temp = recursionGroup(childrens[i], items);
            result = result.concat(temp);
        }
    }
    return result;
}
/**
 * 根据父节点获取子节点
 * @param pid
 * @param items
 */
function getChildrensByPid(pid, items) {
    var result = [];
    for (var i = 0; i < items.length; i++) {
        if (items[i].pid === pid) {
            result.push(items[i].id);
        }
    }
    return result;
}
/**
 * 显示盘符数组
 * @param {*} callback
 */
function showLetter(callback) {
    exec('%SystemRoot%\\system32\\Wbem\\wmic logicaldisk get caption', function (err, stdout, stderr) {
        if (err || stderr) {
            callback([]);
            return;
        }
        var array = stdout.split('\r\r\n');
        var result = [];
        for (var i = 0; i < array.length; i++) {
            var temp = array[i].trim();
            if (temp !== 'Caption' && temp.length > 0) {
                result.push({
                    disk: temp,
                    used: 1
                });
            }
        }
        callback(result);
    });
}

function customSend(res, json, callback, err) {
    if (err) {
        logger.error(err);
    }
    if (callback) {
        res.jsonp(json);
    } else {
        res.send(json);
    }
}

function getADSSaveDir(fileSize) {
    return new Promise((rs, rj) => {
        db_ads.getDiskPath(function (err, diskRes) {
            if (err) {
                rj(err);
            } else {
                db_ads.getConfig(function (err, cofRes) {
                    if (err) {
                        rj(err);
                    } else {
                        exec('%SystemRoot%\\system32\\Wbem\\wmic logicaldisk get caption,freespace', function (
                            err,
                            stdout,
                            stderr
                        ) {
                            if (err || stderr) {
                                rj(err);
                            } else {
                                var array = stdout.split('\r\r\n');
                                var result = '';
                                for (var i = 1; i < array.length; i++) {
                                    var temp = array[i].replace(/ /g, '').split(':');
                                    if (temp.length > 1) {
                                        // 找到对应的盘符
                                        let item = diskRes.filter(dItem => {
                                            return dItem.used == 1 && dItem.disk == temp[0] + ':';
                                        });
                                        //剩余空间-文件大小> (总大小*剩余率)
                                        if (
                                            item.length > 0 &&
                                            parseInt(temp[1]) - fileSize >
                                                ((item[0].totalsize * (100 - item[0].percent) * 1.0) / 100) *
                                                    1024 *
                                                    1024
                                        ) {
                                            let configItem = JSON.parse(cofRes[0].cofValue);
                                            result = item[0].disk + path.sep + configItem.SaveDir;
                                            break;
                                        }
                                    }
                                }
                                rs(result);
                            }
                        });
                    }
                });
            }
        });
    });
}

function PushRedisMsg(key, value) {
    return new Promise((rs, rj) => {
        logger.info('Redis_rpush:' + key + ', ' + JSON.stringify(value));
        messageBus
            .rpush(key, JSON.stringify(value))
            .then(() => {
                rs(true);
            })
            .catch(error => {
                rj(error);
            });
    });
}

function formatType(value) {
    let type = 1;
    switch (value) {
        case 'N9M':
            type = 4;
            break;
        case 'MDVR':
            type = 1;
            break;
        default:
            type = 0;
            break;
    }
    return type;
}

/**
 * 汇通同步数据接口
 */
//获取不存在的组
function getNonExistGroupArray(groupNameArray, result) {
    let nonExistGroupArray = [];
    groupNameArray.forEach(group => {
        let items = result.filter(a => {
            return a.name == group;
        });
        if (items.length == 0) {
            nonExistGroupArray.push(group);
        }
    });
    return nonExistGroupArray;
}

//获取不存在的设备
function getNonExistDeviceArray(deviceIdArray, result) {
    let nonExistDeviceArray = [];
    deviceIdArray.forEach(device => {
        let items = result.filter(a => {
            return a.deviceno == device;
        });
        if (items.length == 0) {
            nonExistDeviceArray.push(device);
        }
    });
    return nonExistDeviceArray;
}

//获取插入数据
function getInsertItem(insertItem) {
    let item = {
        groupid: insertItem.groupid,
        carlicence: insertItem.carlicence,
        deviceid: insertItem.deviceid,
        type: insertItem.type,
        platecolor: 1,
        channelcount: insertItem.channelCount,
        deviceusername: '',
        devicepassword: '',
        vehicletype: '',
        factorygrade: '',
        seatnumber: null,
        enginenumber: '',
        chassisnumber: '',
        fueltype: '',
        roadnumber: '',
        roadlevel: '',
        validitydate: null,
        fuelconsumption: null,
        province: '',
        city: '',
        cardid: insertItem.sim,
        imei: '',
        imsi: '',
        moduletype: '',
        factorynumber: '',
        factorytime: null,
        installuser: '',
        installtime: null,
        peripheral: '',
        linktype: insertItem.type == 1 ? 121 : 124,
        enable: -1,
        channelname: ''
    };
    return item;
}

//获取用户权限下的所有车辆设备idArr
function getDeviceIdByRoledId(rid) {
    return new Promise((resolve, reject) => {
        let powerGroupidArr = []; //用户权限下的父组权限
        let allGroupidArr = []; //所有组信息
        let groupidArr = []; //用户权限下的所有组,
        db_roleauthority
            .getGroupPowerByRoleIdP(rid)
            .then(r => {
                for (let i = 0; i < r.length; i++) {
                    powerGroupidArr.push(r[i].groupid);
                }
                return db_group.getItemsP();
            })
            .then(r => {
                allGroupidArr = r;
                for (let i = 0; i < powerGroupidArr.length; i++) {
                    groupidArr = groupidArr.concat(
                        commonfun.getRecursionGroup(parseInt(powerGroupidArr[i]), allGroupidArr)
                    );
                }
                return db_vehicle.getVehicleInfoByGroupId(groupidArr);
            })
            .then(r => {
                let teridArr = [];
                for (let i = 0; i < r.length; i++) {
                    teridArr.push(r[i].deviceid);
                }
                resolve(teridArr);
            })
            .catch(err => {
                reject(err);
            });
    });
}
var controller = {
    basicKey: function (req, res) {
        let json = {
            data: { key: '' },
            errorcode: 200
        };
        let callback = req.query.callback;
        try {
            let uri = req._parsedUrl.search;
            let username = getQueryString('username', uri);
            let password = getQueryString('password', uri);
            if (username === undefined || password === undefined) {
                json.errorcode = 207;
                customSend(res, json, callback);
            } else {
                let _sha1Psw = commonfun.getSha1(password);
                let _desPsw = commonfun.desEncrypt(password);
                db_user.isExist(username, _sha1Psw.toUpperCase(), _desPsw, function (err, result) {
                    if (!err) {
                        if (result.length > 0) {
                            let obj = result[0];
                            let now = commonfun.getNowDateTime();
                            if (obj.validend < now) {
                                json.errorcode = 205;
                            } else {
                                let token = commonfun.getWcms4Token(obj.id, obj.roleid);
                                json.data.key = token;
                            }
                        } else {
                            json.errorcode = 206;
                        }
                    } else {
                        json.errorcode = 301;
                    }
                    customSend(res, json, callback, err);
                });
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    basicGroups: function (req, res) {
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.query.callback;
        try {
            let key = req.query.key;
            if (!key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                let keyObj = commonfun.validWcms4Token(key);
                //TODO 是否有车组权限
                db_roleauthority.getGroupPowerByRoleId(keyObj.rid, function (err, result) {
                    //获取用户权限组
                    if (!err) {
                        db_group.getItems(function (err2, result2) {
                            //获取所有组
                            if (!err2) {
                                let tempArray = [];
                                for (let group of result) {
                                    tempArray = tempArray.concat(recursionGroup(group.groupid, result2)); //递归查找权限组的所有子组树
                                }
                                for (let id of tempArray) {
                                    for (let group of result2) {
                                        if (id === group.id) {
                                            json.data.push({
                                                groupid: id,
                                                groupname: group.name,
                                                groupfatherid: group.pid
                                            });
                                        }
                                    }
                                }
                            } else {
                                json.errorcode = 301;
                            }
                            customSend(res, json, callback, err);
                        });
                    } else {
                        json.errorcode = 301;
                        customSend(res, json, callback, err);
                    }
                });
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    basicDevices: function (req, res) {
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.query.callback;
        try {
            let key = req.query.key;
            if (!key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                let keyObj = commonfun.validWcms4Token(key);
                //TODO 是否有终端权限
                async.series(
                    [
                        function (callback) {
                            db_roleauthority.getGroupPowerByRoleId(keyObj.rid, function (err, result) {
                                callback(err, result);
                            });
                        },
                        function (callback) {
                            db_group.getItems(function (err, result) {
                                callback(err, result);
                            });
                        },
                        function (callback) {
                            db_vehicle.getItems(function (err, result) {
                                callback(err, result);
                            });
                        },
                        function (callback) {
                            db_roleauthority.getChannelPowerByRoleId(keyObj.rid, function (err, result) {
                                callback(err, result);
                            });
                        }
                    ],
                    function (err, result) {
                        if (!err) {
                            var userAuthority = result[0];
                            var groupArray = result[1];
                            var vehicleArray = result[2];
                            let channelPower = result[3];
                            let tempArray = [];
                            for (let group of userAuthority) {
                                tempArray = tempArray.concat(recursionGroup(group.groupid, groupArray)); //递归查找权限组的所有子组树
                            }
                            for (let groupid of tempArray) {
                                for (let vehicle of vehicleArray) {
                                    if (vehicle.groupid === groupid) {
                                        let enable = vehicle.channelenable;
                                        let noPowerList = channelPower.filter(a => a.vehicledeviceid == vehicle.id);
                                        if (noPowerList.length > 0) {
                                            if (enable == -1) {
                                                enable = Math.pow(2, vehicle.channel) - 1;
                                            }
                                            let enableStr = parseInt(enable).toString(2);
                                            while (enableStr.length < vehicle.channel) {
                                                enableStr = '0' + enableStr;
                                            }
                                            let enableResult = '';
                                            let chnList = [];
                                            for (let i = 0; i < noPowerList.length; i++) {
                                                chnList.push(noPowerList[i].channel);
                                            }
                                            for (let i = vehicle.channel - 1; i >= 0; i--) {
                                                if (chnList.indexOf(vehicle.channel - 1 - i) >= 0) {
                                                    enableResult = '0' + enableResult;
                                                } else {
                                                    enableResult = enableStr[i] + enableResult;
                                                }
                                            }
                                            enable = parseInt(enableResult, 2);
                                        }
                                        json.data.push({
                                            carlicence: vehicle.carlicense,
                                            deviceid: vehicle.deviceno,
                                            terid: vehicle.deviceno,
                                            sim: vehicle.sim === null ? '' : vehicle.sim,
                                            channelcount: vehicle.channel,
                                            cname: vehicle.channelname === null ? '' : vehicle.channelname,
                                            platecolor: parseInt(vehicle.platecolor),
                                            groupid: vehicle.groupid,
                                            devicetype: vehicle.type === null ? '4' : vehicle.type + '',
                                            linktype: vehicle.linktype === null ? '124' : vehicle.linktype + '',
                                            deviceusername:
                                                vehicle.deviceusername === null ? '' : vehicle.deviceusername,
                                            devicepassword:
                                                vehicle.devicepassword === null ? '' : vehicle.devicepassword,
                                            registerip: vehicle.registerip,
                                            registerport: vehicle.registerport,
                                            transmitip: vehicle.transmitip,
                                            transmitport: vehicle.transmitport,
                                            en: enable
                                        });
                                    }
                                }
                            }
                        } else {
                            json.errorcode = 301;
                        }
                        customSend(res, json, callback, err);
                    }
                );
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    basicCarlicense2DeviceId: function (req, res) {
        let json = {
            data: {
                terid: ''
            },
            errorcode: 200
        };
        let callback = req.query.callback;
        try {
            let key = req.query.key;
            let carlicense = req.params.carlicense;
            if (!key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                db_vehicle.getItems(function (err, result) {
                    if (!err) {
                        var vehicleArray = result;
                        for (let vehicle of vehicleArray) {
                            if (vehicle.carlicense === carlicense) {
                                json.data.terid = vehicle.deviceno;
                            }
                        }
                    } else {
                        json.errorcode = 301;
                    }
                    customSend(res, json, callback, err);
                });
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    createVehicleDevice: function (req, res) {
        let json = {
            data: false,
            errorcode: 200
        };
        let callback = req.query.callback;
        try {
            let key = req.body.key;
            let item = {
                groupid: 1,
                platecolor: 1,
                type: 4,
                linktype: 124,
                channel: 4,
                channelenable: -1,
                channelname: '',
                deviceusername: '',
                devicepassword: '',
                sim: ''
            };
            item.carlicense = req.body.carlicense;
            item.deviceno = req.body.deviceno;
            item.groupid = req.body.groupid;
            item.channel = req.body.channel;
            if (!key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                if (
                    item.carlicense === undefined ||
                    item.deviceno === undefined ||
                    item.groupid === undefined ||
                    item.channel === undefined
                ) {
                    json.errorcode = 207;
                    customSend(res, json, callback);
                } else {
                    db_vehicle.create(item, function (err, result) {
                        if (!err) {
                            json.data = parseInt(result) > 0;
                        } else {
                            json.errorcode = 301;
                        }
                        customSend(res, json, callback, err);
                    });
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    updateVehicleDevice: function (req, res) {
        let json = {
            data: false,
            errorcode: 200
        };
        let callback = req.query.callback;
        try {
            let key = req.body.key;
            let item = {
                platecolor: 1,
                type: 4,
                linktype: 124,
                channel: 4,
                channelenable: -1,
                channelname: '',
                deviceusername: '',
                devicepassword: '',
                sim: ''
            };
            item.id = req.body.id;
            item.carlicense = req.body.carlicense;
            item.deviceno = req.body.deviceno;
            item.groupid = req.body.groupid;
            item.channel = req.body.channel;
            if (!key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                if (
                    item.id === undefined ||
                    item.carlicense === undefined ||
                    item.deviceno === undefined ||
                    item.groupid === undefined ||
                    item.channel === undefined
                ) {
                    json.errorcode = 207;
                    customSend(res, json, callback);
                } else {
                    db_vehicle.update(item, function (err, result) {
                        if (!err) {
                            json.data = true;
                        } else {
                            json.errorcode = 301;
                        }
                        customSend(res, json, callback, err);
                    });
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    deleteVehicleDevice: function (req, res) {
        let json = {
            data: false,
            errorcode: 200
        };
        let callback = req.query.callback;
        try {
            let key = req.query.key;
            let id = req.params.id;
            if (!key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                if (id === undefined) {
                    json.errorcode = 207;
                    customSend(res, json, callback);
                } else {
                    db_vehicle.deleteBatch([id], function (err, result) {
                        if (!err) {
                            json.data = parseInt(result) > 0;
                        } else {
                            json.errorcode = 301;
                        }
                        customSend(res, json, callback, err);
                    });
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    isExistDevice: function (req, res) {
        let json = {
            data: {
                result: true
            },
            errorcode: 200
        };
        let callback = req.query.callback;
        try {
            let terid = req.query.terid;
            if (terid === undefined) {
                json.errorcode = enumMap.errorcode.abnormal_param_num;
                customSend(res, json, callback);
            } else {
                let item = {
                    key: 'deviceno',
                    value: terid
                };
                db_vehicle.exist(item, function (err, result) {
                    if (!err) {
                        if (result <= 0) {
                            json.data.result = false;
                        }
                    } else {
                        json.errorcode = 301;
                    }
                    customSend(res, json, callback, err);
                });
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    basicAuthority: function (req, res) {
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.query.callback;
        try {
            let key = req.query.key;
            if (!key) {
                json.errorcode = enumMap.errorcode.abnormal_param_num;
                customSend(res, json, callback);
            } else {
                let moduleList = [];
                let keyObj = commonfun.validWcms4Token(key);
                db_roleauthority
                    .getAllCode('ModuleInfo')
                    .then(moduleCode => {
                        moduleList = moduleCode;
                        return db_roleauthority.getAllCode('CommandInfo');
                    })
                    .then(cmdCode => {
                        db_roleauthority.getItemsByRoleId(keyObj.rid, function (errCode, powerList) {
                            if (errCode) {
                                json.errorcode = enumMap.errorcode.db_error;
                                customSend(res, json, callback, errCode);
                            } else {
                                for (let moduleinfo of moduleList) {
                                    let item = {
                                        k: moduleinfo.code,
                                        v: 0
                                    };
                                    let power = powerList.filter(a => {
                                        return a.module == moduleinfo.code;
                                    });
                                    if (power.length > 0) {
                                        item.v = 1;
                                    }
                                    json.data.push(item);
                                }
                                for (let cmdinfo of cmdCode) {
                                    let item = {
                                        k: cmdinfo.code,
                                        v: 0
                                    };
                                    let power = powerList.filter(a => {
                                        return a.command == cmdinfo.code;
                                    });
                                    if (power.length > 0) {
                                        item.v = 1;
                                    }
                                    json.data.push(item);
                                }
                                customSend(res, json, callback);
                            }
                        });
                    })
                    .catch(error => {
                        json.errorcode = enumMap.errorcode.db_error;
                        customSend(res, json, callback, error);
                    });
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    basicGPSCount: function (req, res) {
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let key = req.body.key;
            if (!key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                let starttime = req.body.starttime;
                let endtime = req.body.endtime;
                let terids = req.body.terid;

                if (starttime === undefined || endtime === undefined || terids === undefined || terids.length === 0) {
                    json.errorcode = 207;
                    customSend(res, json, callback);
                } else {
                    var url = `http://${config.ceiba2ip}:${config.ceiba2WebApiPort}/gps/outlines`;
                    var options = {
                        uri: url,
                        method: 'POST',
                        headers: {
                            'content-type': 'application/json'
                        },
                        body: {
                            key: encodeURIComponent(key),
                            terminals: terids.join(','),
                            startdate: starttime,
                            enddate: endtime
                        }
                    };
                    requestP(options)
                        .then(result => {
                            if (result.errorcode === 0) {
                                for (let item of result.data) {
                                    json.data.push({
                                        terid: item.terid,
                                        date: item.day,
                                        count: item.count
                                    });
                                }
                            } else {
                                json.errorcode = errorMap.httpError(result.errorcode);
                            }
                            customSend(res, json, callback);
                        })
                        .catch(err => {
                            json.errorcode = 302;
                            customSend(res, json, callback, err);
                        });
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    basicGPSDetail: function (req, res) {
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let key = req.body.key;
            if (!key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                let starttime = req.body.starttime;
                let endtime = req.body.endtime;
                let terid = req.body.terid;

                if (starttime === undefined || endtime === undefined || terid === undefined) {
                    json.errorcode = 207;
                    customSend(res, json, callback);
                } else {
                    var url = `http://${config.ceiba2ip}:${config.ceiba2WebApiPort}/gps/${terid}/${starttime}/${endtime}`;
                    var options = {
                        uri: url,
                        method: 'GET',
                        body: {}
                    };
                    requestP(options)
                        .then(result => {
                            for (let item of result) {
                                json.data.push({
                                    terid: item.TerminalID,
                                    gpstime: item.GpsTime,
                                    altitude: item.Altitude,
                                    direction: item.Direction,
                                    gpslat: item.GpsLat.toFixed(6) + '',
                                    gpslng: item.GpsLng.toFixed(6) + '',
                                    speed: item.Speed,
                                    recordspeed: item.RecordSpeed,
                                    state: item.State,
                                    time: item.Time
                                });
                            }
                            customSend(res, json, callback);
                        })
                        .catch(err => {
                            json.errorcode = 302;
                            customSend(res, json, callback, err);
                        });
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    basicGPSLast: function (req, res) {
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let key = req.body.key;
            if (!key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                let terids = req.body.terid;

                if (terids.length === 0) {
                    json.errorcode = 207;
                    customSend(res, json, callback);
                } else {
                    var url = `http://${config.ceiba2ip}:${config.ceiba2WebApiPort}/gps/last`;
                    var options = {
                        uri: url,
                        method: 'POST',
                        headers: {
                            'content-type': 'application/json'
                        },
                        body: {
                            key: encodeURIComponent(key),
                            terminals: terids.join(',')
                        }
                    };
                    requestP(options)
                        .then(result => {
                            for (let item of result) {
                                json.data.push({
                                    terid: item.TerminalID,
                                    gpstime: item.GpsTime,
                                    altitude: item.Altitude,
                                    direction: item.Direction,
                                    gpslat: item.GpsLat.toFixed(6) + '',
                                    gpslng: item.GpsLng.toFixed(6) + '',
                                    speed: item.Speed,
                                    recordspeed: item.RecordSpeed,
                                    state: item.State,
                                    time: item.Time
                                });
                            }
                            customSend(res, json, callback);
                        })
                        .catch(err => {
                            json.errorcode = 302;
                            customSend(res, json, callback, err);
                        });
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    getGPSDay: function (req, res) {
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let key = req.body.key;
            let terid = req.body.terid;
            let year = req.body.year;
            let month = req.body.month;
            if (!key || terid === undefined || year === undefined || month === undefined) {
                json.errorcode = enumMap.errorcode.abnormal_param_num;
                customSend(res, json, callback);
            } else {
                if (typeof year != 'number' || typeof month != 'number' || month < 1 || month > 12) {
                    json.errorcode = enumMap.errorcode.param_error;
                    customSend(res, json, callback);
                }
                var d = new Date(year, month, 0);
                let startTime = year + '-' + (month < 10 ? '0' + month : month) + '-01 00:00:00';
                let endTime = year + '-' + (month < 10 ? '0' + month : month) + '-' + d.getDate() + ' 23:59:59';
                var url =
                    `http://${config.ceiba2ip}:${config.ceiba2WebApiPort}/gps/oulines?terid=` +
                    terid +
                    `&starttime=` +
                    startTime +
                    `&endtime=` +
                    endTime +
                    `&key=` +
                    key;
                var options = {
                    uri: url,
                    method: 'GET',
                    headers: {
                        'content-type': 'application/json'
                    }
                };
                requestP(options)
                    .then(result => {
                        if (result.errorcode === 0) {
                            for (let item of result.data) {
                                if (item.count > 0) {
                                    json.data.push(item.day);
                                }
                            }
                        } else {
                            json.errorcode = errorMap.httpError(result.errorcode);
                        }
                        customSend(res, json, callback);
                    })
                    .catch(err => {
                        json.errorcode = 302;
                        customSend(res, json, callback, err);
                    });
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    basicAlarmCount: function (req, res) {
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let key = req.body.key;
            if (!key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                let starttime = req.body.starttime;
                let endtime = req.body.endtime;
                let terids = req.body.terid;
                let type = req.body.type;

                if (
                    starttime === undefined ||
                    endtime === undefined ||
                    type === undefined ||
                    terids === undefined ||
                    terids.length === 0
                ) {
                    json.errorcode = 207;
                    customSend(res, json, callback);
                } else {
                    var url = `http://${config.ceiba2ip}:${config.ceiba2WebApiPort}/alarm/outlines`;
                    var options = {
                        uri: url,
                        method: 'POST',
                        headers: {
                            'content-type': 'application/json'
                        },
                        body: {
                            key: encodeURIComponent(key),
                            terminals: terids.join(','),
                            starttime: starttime,
                            endtime: endtime,
                            type: type
                        }
                    };
                    requestP(options)
                        .then(result => {
                            if (result.errorcode === 0) {
                                for (let item of result.data) {
                                    json.data.push({
                                        terid: item.terid,
                                        date: item.day,
                                        count: item.count
                                    });
                                }
                            } else {
                                json.errorcode = errorMap.httpError(result.errorcode);
                            }
                            customSend(res, json, callback);
                        })
                        .catch(err => {
                            json.errorcode = 302;
                            customSend(res, json, callback, err);
                        });
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    basicAlarmDetail: function (req, res) {
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let key = req.body.key;
            if (!key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                let types = req.body.type;
                let starttime = req.body.starttime;
                let endtime = req.body.endtime;
                let terids = req.body.terid;

                if (starttime === undefined || endtime === undefined || terids === undefined || terids.length === 0) {
                    json.errorcode = 207;
                    customSend(res, json, callback);
                } else {
                    var url = `http://${config.ceiba2ip}:${config.ceiba2WebApiPort}/alarm/details`;
                    var options = {
                        uri: url,
                        method: 'POST',
                        headers: {
                            'content-type': 'application/json'
                        },
                        body: {
                            terminals: terids.join(','),
                            alarmtype: types.length === 0 ? '*' : types.join(','),
                            starttime: starttime,
                            endtime: endtime,
                            key: encodeURIComponent(key)
                        }
                    };
                    requestP(options)
                        .then(result => {
                            if (result.errorcode === 0) {
                                for (let item of result.data) {
                                    json.data.push({
                                        terid: item.TerminalID,
                                        gpstime: item.GpsTime,
                                        altitude: item.Altitude,
                                        direction: item.Direction,
                                        gpslat: item.GpsLat.toFixed(6) + '',
                                        gpslng: item.GpsLng.toFixed(6) + '',
                                        speed: item.Speed,
                                        recordspeed: item.RecordSpeed,
                                        state: item.State,
                                        time: item.Time,
                                        type: item.AlarmType,
                                        content: item.Alarm,
                                        cmdtype: item.Cmd,
                                        alarmid: item.alarmid
                                    });
                                }
                            } else {
                                json.errorcode = errorMap.httpError(result.errorcode);
                            }
                            customSend(res, json, callback);
                        })
                        .catch(err => {
                            json.errorcode = 302;
                            customSend(res, json, callback, err);
                        });
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    basicStateLog: function (req, res) {
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let key = req.body.key;
            if (!key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                let starttime = req.body.starttime;
                let endtime = req.body.endtime;
                let terids = req.body.terid;

                if (starttime === undefined || endtime === undefined || terids === undefined || terids.length === 0) {
                    json.errorcode = 207;
                    customSend(res, json, callback);
                } else {
                    var url = `http://${config.ceiba2ip}:${config.ceiba2WebApiPort}/logs/state`;
                    var options = {
                        uri: url,
                        method: 'POST',
                        headers: {
                            'content-type': 'application/json'
                        },
                        body: {
                            terminals: terids.join(','),
                            starttime: starttime,
                            endtime: endtime,
                            key: encodeURIComponent(key)
                        }
                    };
                    requestP(options)
                        .then(result => {
                            if (result.errorcode === 0) {
                                for (let item of result.data) {
                                    json.data.push({
                                        terid: item.terid,
                                        type: item.type,
                                        time: item.time
                                    });
                                }
                            } else {
                                json.errorcode = errorMap.httpError(result.errorcode);
                            }
                            customSend(res, json, callback);
                        })
                        .catch(err => {
                            json.errorcode = 302;
                            customSend(res, json, callback, err);
                        });
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    basicStateNow: function (req, res) {
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let key = req.body.key;
            if (!key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                let terids = req.body.terid;

                if (terids === undefined || terids.length === 0) {
                    json.errorcode = 207;
                    customSend(res, json, callback);
                } else {
                    var url = `http://${config.ceiba2ip}:${config.ceiba2WebApiPort}/dev/online/last`;
                    var options = {
                        uri: url,
                        method: 'POST',
                        headers: {
                            'content-type': 'application/json'
                        },
                        body: {
                            terminals: terids.join(','),
                            key: encodeURIComponent(key)
                        }
                    };
                    requestP(options)
                        .then(result => {
                            if (result.errorcode === 0) {
                                for (let item of result.data) {
                                    json.data.push({
                                        terid: item
                                    });
                                }
                            } else {
                                json.errorcode = errorMap.httpError(result.errorcode);
                            }
                            customSend(res, json, callback);
                        })
                        .catch(err => {
                            json.errorcode = 302;
                            customSend(res, json, callback, err);
                        });
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    basicStateLast: function (req, res) {
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let key = req.body.key;
            if (!key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                let terids = req.body.terid;

                if (terids === undefined || terids.length === 0) {
                    json.errorcode = 207;
                    customSend(res, json, callback);
                } else {
                    var url = `http://${config.ceiba2ip}:${config.ceiba2WebApiPort}/logs/state/last`;
                    var options = {
                        uri: url,
                        method: 'POST',
                        headers: {
                            'content-type': 'application/json'
                        },
                        body: {
                            terminals: terids.join(','),
                            key: encodeURIComponent(key)
                        }
                    };
                    requestP(options)
                        .then(result => {
                            if (result.errorcode === 0) {
                                for (let item of result.data) {
                                    json.data.push({
                                        terid: item.terid,
                                        time: item.time
                                    });
                                }
                            } else {
                                json.errorcode = errorMap.httpError(result.errorcode);
                            }
                            customSend(res, json, callback);
                        })
                        .catch(err => {
                            json.errorcode = 302;
                            customSend(res, json, callback, err);
                        });
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    basicStateNow2: function (req, res) {
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let key = req.body.key;
            if (!key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                let terids = req.body.terid;

                if (terids === undefined || terids.length === 0) {
                    json.errorcode = 207;
                    customSend(res, json, callback);
                } else {
                    var url = `http://${config.ceiba2ip}:${config.ceiba2WebApiPort}/dev/online/last`;
                    var options = {
                        uri: url,
                        method: 'POST',
                        headers: {
                            'content-type': 'application/json'
                        },
                        body: {
                            terminals: terids.join(','),
                            key: encodeURIComponent(key)
                        }
                    };
                    requestP(options)
                        .then(result => {
                            logger.info('basicStateNow2:' + JSON.stringify(result));
                            if (result.errorcode === 0 || result.errorcode === 4) {
                                for (let item of terids) {
                                    if (result.data.indexOf(item) >= 0) {
                                        json.data.push({
                                            terid: item,
                                            state: 1
                                        });
                                    } else {
                                        json.data.push({
                                            terid: item,
                                            state: 0
                                        });
                                    }
                                }
                            } else {
                                json.errorcode = errorMap.httpError(result.errorcode);
                            }
                            customSend(res, json, callback);
                        })
                        .catch(err => {
                            json.errorcode = 302;
                            customSend(res, json, callback, err);
                        });
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    basicMileageCount: function (req, res) {
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let key = req.body.key;
            if (!key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                let starttime = req.body.starttime;
                let endtime = req.body.endtime;
                let terids = req.body.terid;

                if (starttime === undefined || endtime === undefined || terids === undefined || terids.length === 0) {
                    json.errorcode = 207;
                    customSend(res, json, callback);
                } else {
                    var url = `http://${config.ceiba2ip}:${config.ceiba2WebApiPort}/mileagecount`;
                    var options = {
                        uri: url,
                        method: 'POST',
                        json: true,
                        headers: {
                            'content-type': 'application/json'
                        },
                        body: {
                            terminals: terids.join(','),
                            fromdate: starttime + ' 00:00:00',
                            todate: endtime + ' 23:59:59',
                            key: encodeURIComponent(key)
                        }
                    };
                    requestP(options)
                        .then(result => {
                            if (result.errorcode === 0) {
                                for (let item of result.data) {
                                    json.data.push({
                                        terid: item.TerID,
                                        mileage: item.Mileage.toFixed(2) + '',
                                        starttime: item.StartTime,
                                        endtime: item.EndTime
                                    });
                                }
                            } else {
                                json.errorcode = errorMap.httpError(result.errorcode);
                            }
                            customSend(res, json, callback);
                        })
                        .catch(err => {
                            json.errorcode = 302;
                            customSend(res, json, callback, err);
                        });
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    basicLivePort: function (req, res) {
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.query.callback;
        try {
            let key = req.query.key;
            if (!key) {
                customSend(res, json, callback);
            } else {
                for (var item of config.ceiba2FlvPort) {
                    json.data.push({
                        port: parseInt(item)
                    });
                }
            }
            customSend(res, json, callback);
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    basicLiveVideo: function (req, res) {
        let json = {
            data: '',
            errorcode: 200
        };
        let callback = req.query.callback;
        try {
            let hostname = req.hostname;
            let terid = req.query.terid;
            let channel = req.query.chl;
            let isAudio = req.query.audio;
            let st = req.query.st;
            let port = req.query.port;
            let key = req.query.key;
            let dt = req.query.dt;
            if (!key) {
                customSend(res, json, callback);
            } else {
                if (
                    terid === undefined ||
                    channel === undefined ||
                    port === undefined ||
                    st === undefined ||
                    isAudio === undefined
                ) {
                    json.errorcode = 207;
                } else {
                    if (dt) {
                        json.data = {
                            url: `http://${hostname}:${port}/live.flv?devid=${terid}&chl=${channel}&st=${st}&isaudio=${isAudio}&dt=${dt}`
                        };
                    } else {
                        json.data = {
                            url: `http://${hostname}:${port}/live.flv?devid=${terid}&chl=${channel}&st=${st}&isaudio=${isAudio}`
                        };
                    }
                }
                customSend(res, json, callback);
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    basicRecordCalendar: function (req, res) {
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.query.callback;
        try {
            let key = req.query.key;
            if (!key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                let starttime = req.query.starttime;
                let terid = req.query.terid;
                let st = req.query.st;

                if (starttime === undefined || st === undefined || terid === undefined) {
                    json.errorcode = 207;
                    customSend(res, json, callback);
                } else {
                    var url = `http://${config.ceiba2ip}:${config.ceiba2HttpApiPort}/devicevideo/dates/${terid}`;
                    var options = {
                        uri: url,
                        method: 'GET',
                        body: {
                            streamtype: st,
                            yearmonth: starttime.split('-')[0] + '-' + starttime.split('-')[1],
                            key: encodeURIComponent(key)
                        }
                    };
                    requestP(options)
                        .then(result => {
                            if (result.errorcode === 0) {
                                for (let item of result.data) {
                                    json.data.push({
                                        date: item.date,
                                        filetype: item.filetype
                                    });
                                }
                            } else {
                                json.errorcode = errorMap.sdkError(result.errorcode);
                            }
                            customSend(res, json, callback);
                        })
                        .catch(err => {
                            json.errorcode = 302;
                            customSend(res, json, callback, err);
                        });
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    basicRecordFileList: function (req, res) {
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.query.callback;
        try {
            let key = req.query.key;
            if (!key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                let starttime = req.query.starttime;
                let endtime = req.query.endtime;
                let terid = req.query.terid;
                let chl = req.query.chl;
                let st = req.query.st;
                let ft = req.query.ft;

                if (
                    starttime === undefined ||
                    endtime === undefined ||
                    st === undefined ||
                    ft === undefined ||
                    terid === undefined ||
                    chl === undefined
                ) {
                    json.errorcode = 207;
                    customSend(res, json, callback);
                } else {
                    var url = `http://${config.ceiba2ip}:${config.ceiba2HttpApiPort}/devicevideo/filelist/${terid}`;
                    var options = {
                        uri: url,
                        method: 'GET',
                        body: {
                            filetype: ft,
                            streamtype: st,
                            starttime: starttime,
                            endtime: endtime,
                            chn: chl,
                            key: encodeURIComponent(key)
                        }
                    };
                    requestP(options)
                        .then(result => {
                            logger.info(JSON.stringify(result));
                            if (result.errorcode === 0) {
                                for (let item of result.data) {
                                    json.data.push({
                                        name: item.name,
                                        filetype: item.filetype,
                                        //size: item.size,   //接口返回单位太小,表示大小有限
                                        chn: item.chn,
                                        starttime: item.starttime,
                                        endtime: item.endtime
                                    });
                                }
                            } else {
                                json.errorcode = errorMap.sdkError(result.errorcode);
                            }
                            customSend(res, json, callback);
                        })
                        .catch(err => {
                            json.errorcode = 302;
                            customSend(res, json, callback, err);
                        });
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    basicRecordVideo: function (req, res) {
        let json = {
            data: '',
            errorcode: 200
        };
        let callback = req.query.callback;
        try {
            let hostname = req.hostname;
            let terid = req.query.terid;
            let channel = req.query.chl;
            let key = req.query.key;
            let starttime = req.query.starttime;
            let endtime = req.query.endtime;
            if (!key) {
                customSend(res, json, callback);
            } else {
                if (
                    terid === undefined ||
                    channel === undefined ||
                    starttime === undefined ||
                    endtime === undefined ||
                    !key
                ) {
                    json.errorcode = 207;
                } else {
                    json.data = {
                        url: `http://${hostname}:${config.ceiba2HlsPort}/play/${terid}/${channel}/${starttime
                            .replace(/(-)/g, '')
                            .replace(/(:)/g, '')
                            .replace(' ', '')}_${endtime
                            .replace(/(-)/g, '')
                            .replace(/(:)/g, '')
                            .replace(' ', '')}_main.m3u8`
                    };
                }
                customSend(res, json, callback);
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    basicRecordTask: function (req, res) {
        let json = {
            data: '',
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let key = req.body.key;
            if (!key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                let starttime = req.body.starttime;
                let endtime = req.body.endtime;
                let terid = req.body.terid;
                let chl = req.body.chl;
                // let filetype = req.body.filetype;
                let name = req.body.name;

                if (
                    starttime === undefined ||
                    endtime === undefined ||
                    terid === undefined ||
                    chl.length === 0 ||
                    name.length > 15
                ) {
                    json.errorcode = 207;
                    customSend(res, json, callback);
                } else {
                    var form = {
                        action: 'add',
                        par: {
                            TaskName: name,
                            Device: terid,
                            StartTime: starttime.split(' ')[1],
                            EndTime: endtime.split(' ')[1],
                            StartExecute: starttime.split(' ')[0],
                            EndExecute: starttime.split(' ')[0],
                            NetMode: parseInt('0111', 2),
                            TaskPeriod: [],
                            Period: 0, //TODO
                            TaskType: 1,
                            TaskChannel: chl,
                            UserName: 'admin', //TODO
                            TaskIO: [],
                            TaskEvent: [],
                            VideoType: 0
                        }
                    };
                    var formJson = {
                        json: JSON.stringify(form)
                    };
                    var url = `http://${config.ceiba2ip}:${config.ceiba2WebPort}/Plugin/AutoDownload/ClientApi/Task/Default.aspx`;
                    var options = {
                        uri: url,
                        method: 'POST',
                        json: true,
                        headers: {
                            'content-type': 'application/x-www-form-urlencoded'
                        },
                        body: formJson
                    };
                    requestP(options)
                        .then(result => {
                            if (result.errorcode === 0) {
                                json.data = {
                                    taskid: result.data
                                };
                            } else {
                                json.errorcode = errorMap.httpError(result.errorcode);
                            }
                            customSend(res, json, callback);
                        })
                        .catch(err => {
                            json.errorcode = 302;
                            customSend(res, json, callback, err);
                        });
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    basicRecordTaskState: function (req, res) {
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let key = req.body.key;
            if (!key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                let parms = req.body.parms;

                if (!key || parms.length === 0) {
                    json.errorcode = 207;
                    customSend(res, json, callback);
                } else {
                    var _hadRequest = 0;
                    for (let parm of parms) {
                        var form = {
                            action: 'getstatus',
                            par: {
                                TaskID: parm.taskid,
                                Day: parm.date
                            }
                        };
                        var formJson = {
                            json: JSON.stringify(form)
                        };
                        //TODO自动下载获取状态接口如果查询无结果返回的值有异常
                        var url = `http://${config.ceiba2ip}:${config.ceiba2WebPort}/Plugin/AutoDownload/ClientApi/DetailTask/Default.aspx`;
                        var options = {
                            uri: url,
                            method: 'POST',
                            json: true,
                            headers: {
                                'content-type': 'application/x-www-form-urlencoded'
                            },
                            body: formJson
                        };
                        requestP(options)
                            .then(result => {
                                _hadRequest++;
                                if (result.errorcode === 0) {
                                    if (result.data) {
                                        json.data.push({
                                            state: result.data.Status,
                                            percent: result.data.Percent,
                                            taskid: result.data.TaskID
                                        });
                                    }
                                } else {
                                    json.errorcode = errorMap.httpError(result.errorcode);
                                }
                                if (_hadRequest == parms.length) {
                                    customSend(res, json, callback);
                                }
                            })
                            .catch(err => {
                                json.errorcode = 302;
                                customSend(res, json, callback, err);
                            });
                    }
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    basicRecordTaskFileList: function (req, res) {
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.query.callback;
        try {
            var _taskid = req.query.taskid;
            var key = req.query.key;
            if (!key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                if (_taskid === undefined) {
                    json.errorcode = 207;
                    customSend(res, json, callback);
                } else {
                    async.series(
                        [
                            function (callback) {
                                db_ads.getDiskPath(function (err, result) {
                                    callback(err, result);
                                });
                            },
                            function (callback) {
                                db_ads.getConfig(function (err, result) {
                                    callback(err, result);
                                });
                            },
                            function (callback) {
                                db_ads.getTask(_taskid, function (err, result) {
                                    callback(err, result);
                                });
                            },
                            function (callback) {
                                //手动获取盘符
                                showLetter(function (result) {
                                    callback(null, result);
                                });
                            }
                        ],
                        function (err, result) {
                            var pathArray = result[0];
                            var config = JSON.parse(result[1][0].cofValue);
                            var taskArray = result[2];
                            if (pathArray.length === 0) {
                                pathArray = result[3]; //如果ceiba2自动下载没有盘符配置信息，就通过电脑指令获取
                            }
                            if (taskArray.length > 0) {
                                var task = taskArray[0];
                                var dir =
                                    '\\' + task.carlicence + '\\' + task.StartExecute + '\\record\\' + task.TaskID;
                                for (var i = 0, l = pathArray.length; i < l; i++) {
                                    var path = pathArray[i].disk + '\\' + config.SaveDir;
                                    var abPath = path + dir;
                                    if (pathArray[i].used == 1) {
                                        if (fs.existsSync(abPath)) {
                                            var files = fs.readdirSync(abPath);
                                            while (files.length > 0) {
                                                var file = files.shift();
                                                var newFileName = file.replace(
                                                    '0000000000000000-',
                                                    task.carlicence + '-'
                                                ); //更新文件名
                                                fs.renameSync(abPath + '\\' + file, abPath + '\\' + newFileName);
                                                json.data.push({
                                                    name: newFileName,
                                                    dir: commonfun.string2base64(abPath)
                                                });
                                            }
                                            break;
                                        }
                                    }
                                }
                            }
                            customSend(res, json, callback, err);
                        }
                    );
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    basicRecordDownload: function (req, res) {
        var file = req.query.name;
        var dir = commonfun.base642String(req.query.dir);
        var path = dir + '\\' + file;

        res.download(path, function (err) {
            if (!err) {
                return;
            }
            if (err) {
                res.redirect('/error/404.html');
                res.end();
            }
        });
    },
    basicRecordDeleteTask: function (req, res) {
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let key = req.body.key;
            if (!key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                let parms = req.body.parms;

                if (!key || parms.length === 0) {
                    json.errorcode = 207;
                    customSend(res, json, callback);
                } else {
                    var _hadRequest = 0;
                    for (let parm of parms) {
                        var form = {
                            action: 'delete',
                            par: {
                                TaskID: parm.taskid
                            }
                        };
                        var formJson = {
                            json: JSON.stringify(form)
                        };
                        var url = `http://${config.ceiba2ip}:${config.ceiba2WebPort}/Plugin/AutoDownload/ClientApi/Task/Default.aspx`;
                        var options = {
                            uri: url,
                            method: 'POST',
                            json: true,
                            headers: {
                                'content-type': 'application/x-www-form-urlencoded'
                            },
                            body: formJson
                        };
                        requestP(options)
                            .then(result => {
                                _hadRequest++;
                                if (result.errorcode === 0) {
                                    json.data.push({ result: result.data });
                                } else {
                                    json.errorcode = errorMap.httpError(result.errorcode);
                                }
                                if (_hadRequest == parms.length) {
                                    customSend(res, json, callback);
                                }
                            })
                            .catch(err => {
                                json.errorcode = 302;
                                customSend(res, json, callback, err);
                            });
                    }
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },

    basicDeviceProtocol: function (req, res) {
        let json = {
            data: {},
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            req.body.key = encodeURIComponent(req.body.key);
            let key = req.body.key;
            if (!key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                let terid = req.body.terid;

                if (!key || terid.length === 0) {
                    json.errorcode = 207;
                    customSend(res, json, callback);
                } else {
                    var url = `http://${config.ceiba2ip}:${config.ceiba2HttpApiPort}/api/v1/basic/device/protocol`;
                    if (typeof req.body.content === 'object') {
                        req.body.content = JSON.stringify(req.body.content);
                    }
                    var options = {
                        uri: url,
                        method: 'POST',
                        json: true,
                        headers: {
                            'content-type': 'application/json'
                        },
                        body: req.body
                    };
                    requestP(options)
                        .then(result => {
                            if (result.errorcode === 200 || result.errorcode === 0) {
                                json.data = result.data;
                            } else {
                                json.errorcode = errorMap.sdkError(result.errorcode);
                            }
                            customSend(res, json, callback);
                        })
                        .catch(err => {
                            json.errorcode = 302;
                            customSend(res, json, callback, err);
                        });
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    /**
     * 12.1  创建证据（创建数据库信息，创建证据文件夹）
     */
    createEvidenceIndex: function (req, res) {
        let json = {
            data: {},
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            logger.info('/basic/evidence/index');
            logger.info(JSON.stringify(req.body));
            let reqBody = req.body.json;
            if (reqBody === undefined || reqBody === '') {
                json.errorcode = 207;
                customSend(res, json, callback);
            } else {
                let reqJson = JSON.parse(reqBody);
                let token = reqJson.token;
                let uid = 1;
                if (token) {
                    uid = commonfun.resolveToken(token)[2];
                }
                let item = {
                    name: reqJson.name,
                    description: reqJson.desc,
                    carlicense: reqJson.carlicense,
                    terid: reqJson.terid,
                    startTime: reqJson.starttime,
                    endTime: reqJson.endtime,
                    driver: reqJson.driver,
                    keyword: reqJson.keyword,
                    server: '127.0.0.1',
                    uid: uid
                };

                let result = {};
                db_evidence
                    .create(item)
                    .then(eid => {
                        let dateStr =
                            new Date().getFullYear() + '-' + (new Date().getMonth() + 1) + '-' + new Date().getDate();
                        let saveDir = commonfun.getEvidenceDir() + path.sep + dateStr + path.sep + eid + path.sep;

                        //参数中的 文件列表，黑匣子列表和照片列表
                        let dataArray = reqJson.data;
                        let videoArray = dataArray.video;
                        let bbkArray = dataArray.bbk;
                        let picArray = dataArray.pic;

                        let eviArray = []; // 往数据库中插入的数据

                        let resultVideo = [];
                        for (let video of videoArray) {
                            let videoItem = {
                                id: eid,
                                name: video.name,
                                totalSize: video.size,
                                chunk: video.chunk,
                                extraInfo: {
                                    chn: video.chn,
                                    starttime: video.starttime,
                                    endtime: video.endtime,
                                    chndsc: video.chndsc,
                                    devid: video.devid
                                },
                                fileType: enumMap.evidence.filetype.video, // 视频数据类型
                                md5: video.md5,
                                saveFile: saveDir + video.name
                            };
                            eviArray.push(videoItem);

                            let videoItem2 = {
                                name: video.name,
                                chunk: video.chunk,
                                rname: saveDir + video.name
                            };
                            resultVideo.push(videoItem2); //返回结果集
                        }

                        let resultBBK = [];
                        for (let bbk of bbkArray) {
                            let bbkItem = {
                                id: eid,
                                name: bbk.name,
                                totalSize: bbk.size,
                                fileType: enumMap.evidence.filetype.bbk, // 黑匣子
                                md5: bbk.md5,
                                saveFile: saveDir + bbk.name,
                                extraInfo: {}
                            };
                            eviArray.push(bbkItem);

                            let bbkItem2 = {
                                name: bbk.name,
                                chunk: bbk.chunk,
                                rname: saveDir + bbk.name
                            };
                            resultBBK.push(bbkItem2);
                        }

                        let resultPic = [];
                        for (let pic of picArray) {
                            let picItem = {
                                id: eid,
                                name: pic.name,
                                totalSize: pic.size,
                                fileType: enumMap.evidence.filetype.image,
                                md5: pic.md5,
                                chunk: pic.chunk,
                                saveFile: saveDir + pic.name,
                                extraInfo: {}
                            };
                            eviArray.push(picItem);

                            let picItem2 = {
                                name: pic.name,
                                chunk: pic.chunk,
                                rname: saveDir + pic.name
                            };
                            resultPic.push(picItem2);
                        }
                        result = {
                            id: eid,
                            data: {
                                video: resultVideo,
                                bbk: resultBBK,
                                pic: resultPic
                            }
                        };
                        return db_evidence.addFile(eviArray);
                    })
                    .then(flag => {
                        if (flag) {
                            json.data = result;
                        } else {
                            json.errorcode = 301;
                        }
                        logger.info(JSON.stringify(json));
                        customSend(res, json, callback);
                    })
                    .catch(error => {
                        json.errorcode = 302;
                        logger.info(JSON.stringify(json));
                        customSend(res, json, callback, error);
                    });
            }
        } catch (err) {
            json.errorcode = 202;
            logger.info(JSON.stringify(json));
            customSend(res, json, callback, err);
        }
    },
    /**
     * 12.2 上传证据文件
     */
    uploadEvidenceFile: function (req, res) {
        let json = {
            data: { result: true },
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            logger.info('/basic/evidence/file');
            if (req.method.toLowerCase() == 'post') {
                let form = new multiparty.Form();
                form.autoFields = true;
                form.formautoFiles = true;
                form.uploadDir = TEMPDIR;
                form.on('error', function (e) {
                    json.errorcode = 202;
                    logger.info(JSON.stringify(json));
                    customSend(res, json, callback, e);
                });
                form.parse(req, function (err, fields, files) {
                    logger.info(fields);
                    console.log(fields);
                    let data = JSON.parse(fields.json[0].replace(/\\/g, '\\\\')).data;
                    let rname = data.rname;
                    let size = data.size; //文件总大小
                    let position = data.offset; //偏移量
                    //路径不存在时，先创建路径，再创建文件
                    let pathArray = rname
                        .replace(new RegExp('//', 'gm'), path.sep)
                        .replace(/\//g, path.sep)
                        .split(path.sep);
                    let dir = pathArray.splice(0, pathArray.length - 1).join(path.sep);
                    if (!fs.existsSync(dir)) {
                        commonfun.mkdirsSync(dir, true);
                    }
                    if (!fs.existsSync(rname)) {
                        let emptyBuffer = Buffer.alloc(size);
                        fs.writeFileSync(rname, emptyBuffer);
                    }
                    files.file.forEach(function (file) {
                        let fileBuffer = fs.readFileSync(rname);
                        let contentBuffer = fs.readFileSync(file.path);
                        //Create two Buffer instances, buf1 and buf2, and copy buf1 from byte 16 through byte 19 into buf2, starting at the 8th byte in buf2
                        //buf1.copy(buf2, 8, 16, 20);
                        contentBuffer.copy(fileBuffer, position, 0, contentBuffer.length);
                        fs.writeFileSync(rname, fileBuffer);
                        fs.unlinkSync(file.path);
                        position = position + contentBuffer.length;
                    }, this);

                    db_evidence
                        .updateEvidenceFileProcess(rname, position)
                        .then(upRes => {
                            logger.info(JSON.stringify(json));
                            customSend(res, json, callback);
                        })
                        .catch(upErr => {
                            json.errorcode = enumMap.errorcode.db_error;
                            logger.info(JSON.stringify(json));
                            customSend(res, json, callback, upErr);
                        });
                });
            }
        } catch (err) {
            json.errorcode = 202;
            logger.info(JSON.stringify(json));
            customSend(res, json, callback, err);
        }
    },
    /**
     * 12.3 查询未完成的证据文件列表
     */
    getUnfinishEvidenceList: function (req, res) {
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.query.callback;
        try {
            logger.info('/basic/evidence/unfinish');
            logger.info(JSON.stringify(req.query));
            let eid = req.query.evidenceid;
            if (eid === undefined || eid == '') {
                json.errorcode = 209;
                logger.info(JSON.stringify(json));
                customSend(res, json, callback);
            } else {
                db_evidence
                    .getFileItemsByStatus(eid, enumMap.evidence.evidencefile.unfinish)
                    .then(eviList => {
                        for (let evidence of eviList) {
                            let item = {
                                rname: evidence.SaveFile,
                                offset: evidence.Offset,
                                chunk: evidence.Chunk,
                                size: evidence.TotalSize,
                                md5: evidence.MD5,
                                name: evidence.FileName
                            };
                            json.data.push(item);
                        }
                        logger.info(JSON.stringify(json));
                        customSend(res, json, callback);
                    })
                    .catch(error => {
                        json.errorcode = 302;
                        logger.info(JSON.stringify(json));
                        customSend(res, json, callback, error);
                    });
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    /**
     * 12.4 更新证据的状态
     */
    updateEvidenceStatus: function (req, res) {
        let json = {
            data: { result: true },
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            logger.info('/basic/evidence/status');
            logger.info(JSON.stringify(req.body));
            // let key = req.body.key;
            let isNewEviCenter = req.body.isanalyze; //新增参数，是否需要证据分析中处理
            // let videoType = req.body.videoType;
            let status = req.body.flag;
            let eid = req.body.id;
            let rname = req.body.rname;
            //let fileType = req.body.filetype;
            if (status === undefined || eid === undefined || eid == '') {
                json.errorcode = 207;
                logger.info(JSON.stringify(json));
                customSend(res, json, callback);
            } else {
                switch (status) {
                    case '0': //删除证据
                        db_evidence
                            .getItem(eid)
                            .then(evidence => {
                                let dateStr = evidence[0].UploadTime.split(' ')[0];
                                let saveDir = commonfun.getEvidenceDir() + path.sep + dateStr + path.sep + eid;
                                if (fs.existsSync(saveDir)) {
                                    commonfun.deleteDir(saveDir);
                                }
                                let eidArray = [eid];
                                return db_evidence.deleteEvidence(eidArray);
                            })
                            .then(() => {
                                customSend(res, json, callback);
                            })
                            .catch(error => {
                                json.data.result = false;
                                customSend(res, json, callback, error);
                            });
                        break;
                    case '1': // 该证据的所有文件上传完毕
                        let total = 0; //该证据所有录像的总大小
                        let chnArray = []; //记录视频通道信息
                        let isbbk = false;
                        let bbkPath = '';
                        let videoPath = '';
                        db_evidence
                            .updateEvidenceStatus(eid, enumMap.evidence.evidencedata.finish)
                            .then(() => {
                                return db_evidence.getFileItemsByEID(eid);
                            })
                            .then(fileList => {
                                for (let file of fileList) {
                                    if (file.FileType == enumMap.evidence.filetype.video) {
                                        total += file.TotalSize;
                                        videoPath = file.SaveFile.replace(/\\/g, '/');
                                        let extra = JSON.parse(file.ExtraInfo);
                                        if (chnArray.indexOf(extra.chn) < 0) {
                                            chnArray.push(extra.chn);
                                        }
                                    } else if (file.FileType == enumMap.evidence.filetype.bbk) {
                                        isbbk = true;
                                        bbkPath = file.SaveFile.replace(/\\/g, '/');
                                    }
                                }
                                return db_evidence.updateEvidenceStatistic(eid, total, chnArray);
                            })
                            .then(() => {
                                if (isNewEviCenter) {
                                    return db_evidence.getItem(parseInt(eid)); //获取证据信息，组装成redis那边消息结构进行推送
                                } else {
                                    customSend(res, json, callback);
                                }
                            })
                            .then(evidence => {
                                if (!res.finished) {
                                    let module = {
                                        module: 'manualupload',
                                        operation: 'file',
                                        parameter: {
                                            eid: eid + '',
                                            keyword: '',
                                            user_keyword: evidence[0].KeyWords,
                                            starttime: evidence[0].StartTime,
                                            endtime: evidence[0].EndTime,
                                            size: total,
                                            bbk: isbbk ? 1 : 0,
                                            bbk_path: bbkPath,
                                            terid: evidence[0].Device,
                                            comment: evidence[0].Description,
                                            date: evidence[0].StartTime.split(' ')[0],
                                            channel: chnArray,
                                            path: videoPath
                                        }
                                    };
                                    return PushRedisMsg('uploadevidence', module);
                                }
                            })
                            .then(() => {
                                if (!res.finished) {
                                    customSend(res, json, callback);
                                }
                            })
                            .catch(error => {
                                json.errorcode = 202;
                                json.data.result = false;
                                customSend(res, json, callback, error);
                            });
                        break;
                    case '2': // 证据的单个文件上传完毕
                        let fileRes = [];
                        db_evidence
                            .getFileItemsBySaveFile(rname)
                            .then(Res1 => {
                                fileRes = Res1;
                                if (fileRes.length < 0 || !fs.existsSync(rname)) {
                                    json.errorcode = enumMap.errorcode.no_data;
                                    customSend(res, json, callback);
                                } else {
                                    return commonfun.getFileMD5(rname);
                                }
                            })
                            .then(md5 => {
                                if (!res.finished) {
                                    if (md5.toLowerCase() == fileRes[0].MD5.toLowerCase()) {
                                        return db_evidence.updateEvidenceFileStatus(
                                            rname,
                                            enumMap.evidence.evidencefile.finish
                                        );
                                    } else {
                                        //md5码校验错误
                                        if (fs.existsSync(rname)) {
                                            fs.unlinkSync(rname);
                                        }
                                        json.errorcode = enumMap.errorcode.md5_error;
                                        json.errorcause = md5;
                                        return db_evidence.updateEvidenceFileStatus(
                                            rname,
                                            enumMap.evidence.evidencefile.unfinish
                                        );
                                    }
                                }
                            })
                            .then(() => {
                                if (!res.finished) {
                                    customSend(res, json, callback);
                                }
                            })
                            .catch(error => {
                                json.data.result = false;
                                customSend(res, json, callback, error);
                            });
                        break;
                    case '3': // 上传失败
                        db_evidence
                            .updateEvidenceStatus(eid, enumMap.evidence.evidencedata.failed)
                            .then(updateRes => {
                                customSend(res, json, callback);
                            })
                            .catch(error => {
                                json.data.result = false;
                                customSend(res, json, callback, error);
                            });
                        break;
                    default:
                        json.errorcode = 201;
                        customSend(res, json, callback);
                        break;
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    /**
     * 12.5  证据文件明细查询
     */
    getEvidenceList: function (req, res) {
        let json = {
            data: {
                bbk: [],
                video: []
            },
            errorcode: 200
        };
        let callback = req.query.callback;
        try {
            logger.info('/basic/evidence/file/list');
            let eid = req.query.evidenceid;
            if (eid === undefined) {
                json.errorcode = enumMap.errorcode.abnormal_param_num;
                customSend(res, json, callback);
            } else {
                db_evidence
                    .getFileItemsByEID(eid)
                    .then(fileList => {
                        for (let file of fileList) {
                            if (file.FileType == 0) {
                                let videoItem = {
                                    name: file.FileName,
                                    rname: file.SaveFile,
                                    size: file.TotalSize
                                };
                                json.data.video.push(videoItem);
                            }
                        }
                        customSend(res, json, callback);
                    })
                    .catch(error => {
                        json.errorcode = enumMap.errorcode.db_error;
                        customSend(res, json, callback, error);
                    });
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    /**
     * 12.6 证据黑匣子文件查询
     */
    getBBKList: function (req, res) {
        var eid = req.query.evidenceid;
        db_evidence
            .getBBKItem(eid)
            .then(r => {
                if (r != null && fs.existsSync(r[0].SaveFile)) {
                    res.download(r[0].SaveFile, function (err) {
                        if (!err) {
                            return;
                        }
                        if (err) {
                            //res.redirect('/error/404.html');
                            res.end();
                        }
                    });
                } else {
                    res.end();
                }
            })
            .catch(error => {
                logger.error(error);
                res.end();
            });
    },
    /**
     * 12.7 查询证据列表
     */
    getEvidence: function (req, res) {
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let key = req.body.key;
            let keyword = req.body.keyword;
            let isread = req.body.isread;
            let terid = req.body.terid;
            let startTime = req.body.starttime;
            let endTime = req.body.endtime;
            let startIndex = req.body.startIndex;
            let pageSize = req.body.pageSize;
            if (
                !key ||
                isread === undefined ||
                terid === undefined ||
                startIndex === undefined ||
                pageSize === undefined
            ) {
                json.errorcode = 207;
                customSend(res, json, callback);
            } else {
                if (terid.length < 1) {
                    customSend(res, json, callback);
                } else {
                    let queryItem = {
                        teridArr: terid,
                        keyword: keyword,
                        startTime: startTime,
                        endTime: endTime
                    };
                    let eviList = [];
                    let eidArr = [];
                    let readIDArr = [];
                    let keyObj = commonfun.validWcms4Token(key);
                    db_evidence
                        .getEvidenceList(queryItem)
                        .then(eviRes => {
                            eviList = eviRes;
                            for (let evidence of eviRes) {
                                eidArr.push(evidence.ID);
                            }
                            if (eviList.length > 0) {
                                return db_evidence.getEvidenceReadCount(eidArr, keyObj.uid);
                            } else {
                                customSend(res, json, callback);
                            }
                        })
                        .then(readRes => {
                            if (!res.finished) {
                                let readIDArr = [];
                                for (let evidence of readRes) {
                                    readIDArr.push(evidence.EvidenceID);
                                }
                                if (isread == 0) {
                                    // all
                                } else if (isread == 1) {
                                    // 保留已读证据
                                    eviList = eviList.filter(a => {
                                        return readIDArr.indexOf(a.ID) >= 0;
                                    });
                                    eidArr = readIDArr;
                                } else if (isread == 2) {
                                    //unread
                                    eviList = eviList.filter(a => {
                                        return readIDArr.indexOf(a.ID) < 0;
                                    });
                                    eidArr = eidArr.filter(function (e) {
                                        return readIDArr.indexOf(e) < 0;
                                    });
                                }
                                if (eidArr.length == 0) {
                                    customSend(res, json, callback);
                                } else {
                                    return db_evidence.getFileItemsByEID(eidArr);
                                }
                            }
                        })
                        .then(fileInfo => {
                            if (!res.finished) {
                                db_vehicle.getItems(function (err, result) {
                                    if (err) {
                                        json.errorcode = enumMap.errorcode.db_error;
                                        customSend(res, json, callback, err);
                                    } else {
                                        for (let i = startIndex; i < eviList.length && i < startIndex + pageSize; i++) {
                                            let vehicle = result.filter(a => {
                                                return a.deviceno == eviList[i].Device;
                                            });
                                            let files = fileInfo.filter(a => {
                                                return a.ID == eviList[i].ID && a.FileType == 0;
                                            });
                                            let total = 0;
                                            let timeslot = 0;
                                            for (let file of files) {
                                                //计算该证据的总视频大小和总视频时长
                                                total += file.TotalSize;
                                                let start = new Date(JSON.parse(file.ExtraInfo).starttime);
                                                let end = new Date(JSON.parse(file.ExtraInfo).endtime);
                                                timeslot += (end - start) / 1000;
                                            }
                                            let resultItem = {
                                                evidenceid: eviList[i].ID,
                                                carlicense: vehicle[0].carlicense,
                                                terid: eviList[i].Device,
                                                name: eviList[i].Name,
                                                starttime: eviList[i].StartTime,
                                                endtime: eviList[i].EndTime,
                                                isread: readIDArr.indexOf(eviList[i].ID) >= 0 ? 1 : 0,
                                                timeslot: timeslot,
                                                size: total,
                                                image: '',
                                                keyword: eviList[i].KeyWords == null ? '' : eviList[i].KeyWords,
                                                desc: eviList[i].Description == null ? '' : eviList[i].Description,
                                                mark: eviList[i].Mark
                                            };
                                            json.data.push(resultItem);
                                        }
                                        customSend(res, json, callback);
                                    }
                                });
                            }
                        })
                        .catch(error => {
                            json.errorcode = enumMap.errorcode.db_error;
                            customSend(res, json, callback, error);
                        });
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    /**
     * 12.8 查询证据明细
     */
    getEvidenceDetail: function (req, res) {
        let json = {
            data: {},
            errorcode: 200
        };
        let callback = req.query.callback;
        try {
            let key = req.query.key;
            let eid = req.query.evidenceid;
            if (!key || eid === undefined) {
                json.errorcode = enumMap.errorcode.abnormal_param_num;
                customSend(res, json, callback);
            } else {
                let keyObj = commonfun.validWcms4Token(key);
                let evidence = {};
                db_evidence
                    .getItem(eid)
                    .then(eviRes => {
                        evidence = {
                            terid: eviRes[0].Device,
                            carlicense: '',
                            name: eviRes[0].Name,
                            keyword: eviRes[0].KeyWords == null ? '' : eviRes[0].KeyWords,
                            createtime: eviRes[0].UploadTime.split(' ')[0],
                            evitime: eviRes[0].StartTime.split(' ')[0],
                            driver: eviRes[0].Driver == null ? '' : eviRes[0].Driver,
                            desc: eviRes[0].Description == null ? '' : eviRes[0].Description,
                            isread: 0,
                            img: [],
                            video: [],
                            log: []
                        };
                        return db_vehicle.getItemsByDev(evidence.terid);
                    })
                    .then(vehicle => {
                        evidence.carlicense = vehicle[0].carlicense;
                        if (keyObj.uid == 1) {
                            return db_evidence.getFileItemsByEID(eid);
                        } else {
                            return db_evidence.getFileItemsByEID(eid, keyObj.uid);
                        }
                    })
                    .then(fileInfo => {
                        for (let file of fileInfo) {
                            if (file.FileType == enumMap.evidence.filetype.video) {
                                let extractInfo = JSON.parse(file.ExtraInfo);
                                let videoItem = {
                                    start: extractInfo.starttime,
                                    end: extractInfo.endtime,
                                    chn: extractInfo.chn,
                                    size: file.TotalSize
                                };
                                evidence.video.push(videoItem);
                            } else if (file.FileType == enumMap.evidence.filetype.image) {
                                let path = file.SaveFile.split('EvidenceData')[1]
                                    .replace(/\\/g, '/')
                                    .replace(/\/\//g, '/'); // '\'和'//'替换成'/'
                                evidence.img.push('/evidencepic/' + encodeURIComponent(path));
                            }
                        }
                        return db_evidence.getReadLogs(eid);
                    })
                    .then(logs => {
                        for (let i = logs.length - 1; i >= 0; i--) {
                            let logitem = {
                                user: logs[i].SearchUser,
                                time: logs[i].SearchTime
                            };
                            evidence.log.push(logitem);
                        }
                        if (logs.length > 0) {
                            evidence.isread = 1;
                        }
                        json.data = evidence;
                        customSend(res, json, callback);
                    })
                    .catch(error => {
                        json.errorcode = enumMap.errorcode.db_error;
                        customSend(res, json, callback, error);
                    });
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    /**
     * 12.9 添加证据查询日志
     */
    createEvidenceLog: function (req, res) {
        let json = {
            data: { result: true },
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let key = req.body.key;
            let eid = req.body.evidenceid;
            if (!key || eid === undefined) {
                json.errorcode = enumMap.errorcode.abnormal_param_num;
                customSend(res, json, callback);
            } else {
                let keyObj = commonfun.validWcms4Token(key);
                db_user.getItem(keyObj.uid, function (err, user) {
                    if (err) {
                        json.errorcode = enumMap.errorcode.db_error;
                        customSend(res, json, callback);
                    } else {
                        db_evidence
                            .createLog(eid, keyObj.uid, user[0].account)
                            .then(addRes => {
                                if (addRes.affactedRows <= 0) {
                                    json.data.result = false;
                                }
                                customSend(res, json, callback);
                            })
                            .catch(error => {
                                json.errorcode = enumMap.errorcode.db_error;
                                customSend(res, json, callback, error);
                            });
                    }
                });
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    /**
     * 13.1 创建上传任务
     */
    createADSIndex: function (req, res) {
        let json = {
            data: {},
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            logger.info('/basic/ads/index');
            logger.info(JSON.stringify(req.body));
            let reqBody = req.body.json;
            if (reqBody === undefined || reqBody === '') {
                json.errorcode = 207;
                customSend(res, json, callback);
            } else {
                let reqJson = JSON.parse(reqBody).data;
                let token = reqJson.token;
                let uid = 1;
                if (token) {
                    uid = commonfun.resolveToken(token)[2];
                }
                let devItem = {
                    key: 'deviceno',
                    value: reqJson.device
                };
                db_vehicle.exist(devItem, function (err, count) {
                    if (err) {
                        json.errorcode = enumMap.errorcode.db_error;
                        customSend(res, json, callback, err);
                    } else {
                        if (count <= 0) {
                            json.errorcode = enumMap.errorcode.no_device;
                            customSend(res, json, callback, err);
                        } else {
                            db_sqlite_ads
                                .getVideoListUpload(reqJson.device, reqJson.date, reqJson.filesource)
                                .then(videoRes => {
                                    if (videoRes.length > 0) {
                                        json.data = {
                                            chn: videoRes[0].Channel,
                                            device: videoRes[0].Device,
                                            date: reqJson.date,
                                            starttime: videoRes[0].StartTime.split(' ')[1],
                                            endtime: videoRes[0].EndTime.split(' ')[1],
                                            filesource: videoRes[0].FileSource,
                                            size: videoRes[0].TotalSize,
                                            md5: videoRes[0].Summary,
                                            savefile: videoRes[0].SaveFile
                                        };
                                        //路径不存在时，先创建路径，再创建文件
                                        let pathArray = videoRes[0].SaveFile.replace(new RegExp('//', 'gm'), path.sep)
                                            .replace(/\//g, path.sep)
                                            .split(path.sep);
                                        let dir = pathArray.splice(0, pathArray.length - 1).join(path.sep);
                                        if (!fs.existsSync(dir)) {
                                            commonfun.mkdirsSync(dir, true);
                                        }
                                        if (!fs.existsSync(videoRes[0].SaveFile)) {
                                            let emptyBuffer = Buffer.alloc(json.data.size);
                                            fs.writeFileSync(videoRes[0].SaveFile, emptyBuffer);
                                        }
                                        customSend(res, json, callback);
                                    } else {
                                        return getADSSaveDir(reqJson.size); //获取保存的磁盘和文件夹名称
                                    }
                                })
                                .then(saveDir => {
                                    if (!res.finished) {
                                        if (saveDir == '') {
                                            json.errorcode = enumMap.errorcode.no_space;
                                            customSend(res, json, callback);
                                        } else {
                                            saveDir += path.sep + reqJson.device + path.sep + reqJson.date + path.sep;
                                            if (reqJson.filetype == -1) {
                                                saveDir += 'log' + path.sep + 'blackbox';
                                            } else {
                                                saveDir += 'record';
                                            }
                                            //创建文件夹
                                            commonfun.mkdirsSync(saveDir);

                                            let item = {
                                                channel: reqJson.chn,
                                                device: reqJson.device,
                                                curSize: 0,
                                                downloadEnd: '',
                                                downloadStart: '',
                                                downloadStatus: enumMap.ads.videostatus.wait,
                                                downloadTime: 0,
                                                startTime: reqJson.date + ' ' + reqJson.starttime,
                                                error: '',
                                                fileSource: reqJson.filesource,
                                                filetype: reqJson.filetype,
                                                nextAlarm: 0,
                                                preAlarm: 0,
                                                saveFile: saveDir + path.sep + reqJson.filesource,
                                                endTime: reqJson.date + ' ' + reqJson.endtime,
                                                summary: reqJson.md5,
                                                taskID: -1,
                                                totalSize: reqJson.size
                                            };
                                            //若已存在文件，则更改文件的保存地址
                                            if (fs.existsSync(item.saveFile)) {
                                                let nowTime =
                                                    new Date().getHours() +
                                                    new Date().getMinutes() +
                                                    new Date().getSeconds();
                                                item.saveFile = saveDir + path.sep + nowTime + item.fileSource;
                                            }
                                            //将结果预置进去
                                            json.data = {
                                                chn: item.channel,
                                                device: item.device,
                                                date: reqJson.date,
                                                starttime: item.startTime.split(' ')[1],
                                                endtime: item.endTime.split(' ')[1],
                                                filesource: item.fileSource,
                                                size: item.totalSize,
                                                md5: item.summary,
                                                savefile: item.saveFile
                                            };
                                            //路径不存在时，先创建路径，再创建文件
                                            let pathArray = item.saveFile
                                                .replace(new RegExp('//', 'gm'), path.sep)
                                                .replace(/\//g, path.sep)
                                                .split(path.sep);
                                            let dir = pathArray.splice(0, pathArray.length - 1).join(path.sep);
                                            if (!fs.existsSync(dir)) {
                                                commonfun.mkdirsSync(dir, true);
                                            }
                                            if (!fs.existsSync(item.saveFile)) {
                                                let emptyBuffer = Buffer.alloc(item.size);
                                                fs.writeFileSync(item.saveFile, emptyBuffer);
                                            }
                                            return db_sqlite_ads.addUpload(item, reqJson.date);
                                        }
                                    }
                                })
                                .then(() => {
                                    if (!res.finished) {
                                        //已返回结果则不进行处理了
                                        customSend(res, json, callback);
                                    }
                                })
                                .catch(videoErr => {
                                    json.errorcode = enumMap.errorcode.db_error;
                                    customSend(res, json, callback, videoErr);
                                });
                        }
                    }
                });
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    /**
     * 13.2 上传文件
     */
    uploadADSFile: function (req, res) {
        let json = {
            data: { result: true },
            errorcode: 200
        };
        let callback = req.query.callback;
        try {
            logger.info('/basic/ads/file');
            if (req.method.toLowerCase() == 'post') {
                let form = new multiparty.Form();
                form.autoFields = true;
                form.formautoFiles = true;
                form.uploadDir = TEMPDIR;
                form.on('error', function (e) {
                    json.errorcode = 202;
                    logger.info(JSON.stringify(json));
                    customSend(res, json, callback, e);
                });
                form.parse(req, function (err, fields, files) {
                    if (!res.finished) {
                        logger.info(fields);
                        let data = JSON.parse(fields.json[0].replace(/\\/g, '\\\\')).data;
                        let rname = data.savefile;
                        let size = data.filesize; //文件总大小
                        let position = data.offset; //偏移量
                        let fname = data.filesource;
                        //路径不存在时，先创建路径，再创建文件
                        let pathArray = rname
                            .replace(new RegExp('//', 'gm'), path.sep)
                            .replace(/\//g, path.sep)
                            .split(path.sep);
                        let dir = pathArray.splice(0, pathArray.length - 1).join(path.sep);
                        if (!fs.existsSync(dir)) {
                            commonfun.mkdirsSync(dir, true);
                        }
                        if (!fs.existsSync(rname)) {
                            let emptyBuffer = Buffer.alloc(size);
                            fs.writeFileSync(rname, emptyBuffer);
                        }
                        files.file.forEach(function (file) {
                            let contentBuffer = fs.readFileSync(file.path);
                            let fileBuffer = fs.readFileSync(rname);
                            //Create two Buffer instances, buf1 and buf2, and copy buf1 from byte 16 through byte 19 into buf2, starting at the 8th byte in buf2
                            //buf1.copy(buf2, 8, 16, 20);
                            contentBuffer.copy(fileBuffer, position, 0, contentBuffer.length);
                            fs.writeFileSync(rname, fileBuffer);
                            fs.unlinkSync(file.path);
                            position = position + contentBuffer.length;
                        }, this);
                        //更新状态
                        db_sqlite_ads
                            .updateUpload(position, fname, data.device, data.date)
                            .then(upRes => {
                                logger.info(JSON.stringify(json));
                                customSend(res, json, callback);
                            })
                            .catch(upErr => {
                                json.errorcode = enumMap.errorcode.db_error;
                                logger.info(JSON.stringify(json));
                                customSend(res, json, callback, upErr);
                            });
                    }
                });
            }
        } catch (err) {
            json.errorcode = 202;
            logger.info(JSON.stringify(json));
            customSend(res, json, callback, err);
        }
    },
    /**
     * 13.3 查询已完成任务的文件列表
     */
    getFinishADSList: function (req, res) {
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            logger.info('/basic/ads/finish');
            logger.info(JSON.stringify(req.body));
            let reqBody = req.body.json;
            if (reqBody === undefined || reqBody === '') {
                json.errorcode = 207;
                logger.info(JSON.stringify(json));
                customSend(res, json, callback);
            } else {
                let reqJson = JSON.parse(reqBody);
                db_sqlite_ads
                    .getItemsFinish(reqJson.device, reqJson.date)
                    .then(items => {
                        for (let video of items) {
                            let item = {
                                starttime: video.StartTime,
                                endtime: video.EndTime,
                                chn: video.Channel
                            };
                            json.data.push(item);
                        }
                        logger.info(JSON.stringify(json));
                        customSend(res, json, callback);
                    })
                    .catch(error => {
                        json.errorcode = enumMap.errorcode.db_error;
                        logger.info(JSON.stringify(json));
                        customSend(res, json, callback, error);
                    });
            }
        } catch (err) {
            json.errorcode = 202;
            logger.info(JSON.stringify(json));
            customSend(res, json, callback, err);
        }
    },
    /**
     * 13.4 更新上传任务状态
     */
    updateADSStatus: function (req, res) {
        let json = {
            data: { result: true },
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            logger.info('/basic/ads/status');
            logger.info(JSON.stringify(req.body));
            let reqBody = req.body.json;
            if (reqBody === undefined || reqBody === '') {
                json.errorcode = 207;
                logger.info(JSON.stringify(json));
                customSend(res, json, callback);
            } else {
                let reqJson = JSON.parse(reqBody);
                let flag = reqJson.flag;
                let reqData = reqJson.data;
                let fileSource = reqData.filesource;
                let device = reqData.device;
                let date = reqData.date;
                let fileType = reqData.filetype;
                let isanalyze = reqJson.isanalyze;
                let videoType = reqJson.videotype;
                switch (flag) {
                    case 0: //关闭文件上传
                        db_sqlite_ads
                            .updateStatus(enumMap.ads.videostatus.delete, fileSource, device, date)
                            .then(() => {
                                logger.info(JSON.stringify(json));
                                customSend(res, json, callback);
                            })
                            .catch(error => {
                                json.errorcode = enumMap.errorcode.db_error;
                                json.data = false;
                                logger.info(JSON.stringify(json));
                                customSend(res, json, callback, error);
                            });
                        break;
                    case 1: // 当前文件传输完毕
                        //let saveFile = "";
                        //let channel = -1;
                        let file = {};
                        db_sqlite_ads
                            .getVideoListUpload(device, date, fileSource)
                            .then(items => {
                                if (items.length < 1) {
                                    json.errorcode = enumMap.errorcode.no_data;
                                    logger.info(JSON.stringify(json));
                                    customSend(res, json, callback);
                                } else {
                                    if (!fs.existsSync(items[0].SaveFile)) {
                                        json.errorcode = enumMap.errorcode.no_file;
                                        logger.info(JSON.stringify(json));
                                        customSend(res, json, callback);
                                    } else {
                                        //saveFile = items[0].SaveFile;
                                        //channel = items[0].Channel;
                                        file = items[0];
                                        return db_sqlite_ads.updateStatus(
                                            enumMap.ads.videostatus.finish,
                                            fileSource,
                                            device,
                                            date
                                        );
                                    }
                                }
                            })
                            .then(() => {
                                //黑匣子文件则添加到黑匣子文件表中，录像文件则进行统计
                                if (!res.finished) {
                                    if (fileType == -1) {
                                        return db_ads.addBlackbox(
                                            device,
                                            date,
                                            file.SaveFile,
                                            enumMap.ads.bbkstatus.finish
                                        );
                                    } else if (fileType > 0) {
                                        return db_sqlite_ads.statistic(device, date);
                                    }
                                }
                            })
                            .then(staticRes => {
                                //统计录像文件个数，并更新数据库中录像文件个数
                                if (!res.finished && fileType == -1) {
                                    logger.info(JSON.stringify(json));
                                    customSend(res, json, callback);
                                } else if (!res.finished && fileType > 0) {
                                    if (staticRes.length > 0) {
                                        if (staticRes[0].TotalSize == null) {
                                            staticRes[0].TotalSize = 0;
                                        }
                                        if (staticRes[0].PreSize == null) {
                                            staticRes[0].PreSize = 0;
                                        }
                                        if (staticRes[0].FileType == null) {
                                            staticRes[0].FileType = 1;
                                        }
                                        if (staticRes[0].FileType > staticRes[0].Count) {
                                            staticRes[0].FileType = 2;
                                        } else {
                                            staticRes[0].FileType = 1;
                                        }
                                        return db_ads.staticVideoCount(
                                            device,
                                            date,
                                            staticRes[0].FileCount,
                                            JSON.stringify(staticRes[0])
                                        );
                                    } else {
                                        logger.info(JSON.stringify(json));
                                        customSend(res, json, callback);
                                    }
                                }
                            })
                            .then(() => {
                                if (!res.finished) {
                                    if (isanalyze == 1) {
                                        let module = {
                                            module: 'ads',
                                            operation: 'file',
                                            parameter: {
                                                did: device,
                                                date: date,
                                                taskid: -1,
                                                path: file.SaveFile.replace(/\\/g, '/'),
                                                channel: file.Channel,
                                                recordtype: videoType,
                                                starttime: file.StartTime,
                                                endtime: file.EndTime,
                                                filesize: file.TotalSize
                                            }
                                        };
                                        return PushRedisMsg('adsfile', module);
                                    } else {
                                        logger.info(JSON.stringify(json));
                                        customSend(res, json, callback);
                                    }
                                }
                            })
                            .then(() => {
                                if (!res.finished) {
                                    logger.info(JSON.stringify(json));
                                    customSend(res, json, callback);
                                }
                            })
                            .catch(error => {
                                json.errorcode = enumMap.errorcode.db_error;
                                json.data = false;
                                logger.info(JSON.stringify(json));
                                customSend(res, json, callback, error);
                            });
                        break;
                    case 2: // 上传文件失败
                        db_sqlite_ads
                            .updateStatus(enumMap.ads.videostatus.failed, fileSource, device, date)
                            .then(() => {
                                logger.info(JSON.stringify(json));
                                customSend(res, json, callback);
                            })
                            .catch(error => {
                                json.errorcode = enumMap.errorcode.db_error;
                                json.data = false;
                                logger.info(JSON.stringify(json));
                                customSend(res, json, callback, error);
                            });
                        break;
                    default:
                        json.errorcode = 201;
                        json.data = false;
                        logger.info(JSON.stringify(json));
                        customSend(res, json, callback);
                        break;
                }
            }
        } catch (err) {
            json.errorcode = 202;
            logger.info(JSON.stringify(json));
            customSend(res, json, callback, err);
        }
    },
    /**
     * 13.5 查询未完成任务的文件列表
     */
    getUnfinishADSList: function (req, res) {
        let json = {
            data: {},
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            logger.info('/basic/ads/unfinish');
            logger.info(JSON.stringify(req.body));
            let reqBody = req.body.json;
            if (reqBody === undefined || reqBody === '') {
                json.errorcode = 207;
                customSend(res, json, callback);
            } else {
                let reqJson = JSON.parse(reqBody).data;
                let device = reqJson.device;
                let date = reqJson.date;
                let fileSource = reqJson.filesource;
                db_sqlite_ads
                    .getVideoListUpload(device, date, fileSource)
                    .then(items => {
                        if (items.length > 0) {
                            json.data = {
                                chn: items[0].Channel,
                                device: device,
                                date: date,
                                starttime: items[0].StartTime.split(' ')[1],
                                endtime: items[0].EndTime.split(' ')[1],
                                filetype: items[0].FileType,
                                offset: items[0].CurSize,
                                filesource: items[0].FileSource,
                                size: items[0].TotalSize,
                                md5: items[0].Summary,
                                savefile: items[0].SaveFile
                            };
                        }
                        logger.info(JSON.stringify(json));
                        customSend(res, json, callback);
                    })
                    .catch(error => {
                        json.errorcode = enumMap.errorcode.db_error;
                        logger.info(JSON.stringify(json));
                        customSend(res, json, callback, error);
                    });
            }
        } catch (err) {
            json.errorcode = 202;
            logger.info(JSON.stringify(json));
            customSend(res, json, callback, err);
        }
    },
    addOptLog: function (req, res) {
        let json = {
            data: true,
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let key = req.body.key;
            let data = req.body.data;
            if (!key || data === undefined) {
                json.errorcode = 207;
                customSend(res, json, callback);
            } else {
                var url = `http://${config.ceiba2ip}:${config.ceiba2WebApiPort}/opt/add`;
                var options = {
                    uri: url,
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: {
                        key: key,
                        data: data
                    }
                };
                requestP(options)
                    .then(result => {
                        if (result.errorcode != 0) {
                            json.errorcode = errorMap.httpError(result.errorcode);
                        }
                        customSend(res, json, callback);
                    })
                    .catch(err => {
                        json.errorcode = 302;
                        customSend(res, json, callback, err);
                    });
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    addLoginLog: function (req, res) {
        let json = {
            data: true,
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let key = req.body.key;
            let ip = req.body.ip;
            let source = req.body.source;
            let content = req.body.content;
            let time = req.body.time;
            let type = req.body.type;
            if (
                !key ||
                source === undefined ||
                type === undefined ||
                content === undefined ||
                ip === undefined ||
                time === undefined
            ) {
                json.errorcode = 207;
                customSend(res, json, callback);
            } else {
                var url = `http://${config.ceiba2ip}:${config.ceiba2WebApiPort}/logs/login/add`;
                var options = {
                    uri: url,
                    method: 'POST',
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: {
                        key: key,
                        ip: ip,
                        source: source,
                        content: content,
                        time: time,
                        type: type
                    }
                };
                requestP(options)
                    .then(result => {
                        if (result.errorcode != 0) {
                            json.errorcode = errorMap.httpError(result.errorcode);
                        }
                        customSend(res, json, callback);
                    })
                    .catch(err => {
                        json.errorcode = 302;
                        customSend(res, json, callback, err);
                    });
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    /**
     * 15.1 查询围栏名称是否存在
     */
    existFence: function (req, res) {
        let json = {
            data: true,
            errorcode: 200
        };
        let callback = req.query.callback;
        try {
            let name = req.query.name;
            if (name === undefined) {
                json.errorcode = 207;
                customSend(res, json, callback);
            } else {
                db_fence
                    .exist(name)
                    .then(result => {
                        json.data = result[0].count >= 1;
                        customSend(res, json, callback);
                    })
                    .catch(err => {
                        json.errorcode = enumMap.errorcode.db_error;
                        customSend(res, json, callback, err);
                    });
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    createFence: function (req, res) {
        let json = {
            data: true,
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let name = req.body.name;
            let type = req.body.type;
            let points = req.body.points;
            let radius = req.body.radius;
            if (name === undefined || type === undefined || points === undefined) {
                json.errorcode = 207;
                customSend(res, json, callback);
            } else {
                let item = {
                    name: name,
                    type: type,
                    points: points,
                    radius: radius == null ? 0 : radius
                };
                db_fence
                    .create(item)
                    .then(result => {
                        json.data = result;
                        customSend(res, json, callback);
                    })
                    .catch(err => {
                        json.errorcode = enumMap.errorcode.db_error;
                        customSend(res, json, callback, err);
                    });
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    getCBStrategy: function (req, res) {
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let key = req.body.token;
            if (!key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                let keyObj = {};
                try {
                    keyObj = commonfun.validWcms4Token(key);
                } catch (err) {
                    json.errorcode = enumMap.errorcode.key_error;
                }
                let customAlarmList = [];
                let deviceList = [];
                let resultList = {};
                db_alarm
                    .getCustomAlarmList()
                    .then(result => {
                        customAlarmList = result;
                        return db_alarm.getClientStrategy(keyObj.uid);
                    })
                    .then(result => {
                        for (let strategy of result) {
                            let item = {};
                            if (strategy.alarmtypeid > 10000) {
                                //自定义报警
                                item.a = 400;
                                let alarm = customAlarmList.filter(a => {
                                    return a.id == strategy.alarmtypeid - 10000;
                                });
                                if (alarm.length == 0) {
                                    continue;
                                } else {
                                    item.n = alarm[0].alarmname;
                                }
                            } else {
                                item.a = strategy.alarmtypeid;
                            }
                            item.m = strategy.c_map;
                            item.vo = strategy.c_voice;
                            item.vi = strategy.c_allvideo;
                            item.ch = parseInt(strategy.c_videochannel);
                            let did = strategy.deviceid;
                            if (deviceList.indexOf(did) > -1) {
                                resultList[did].push(item);
                            } else {
                                resultList[did] = [];
                                resultList[did].push(item);
                                deviceList.push(did);
                            }
                        }
                        for (let did of deviceList) {
                            let item = {};
                            item.did = did;
                            item.s = resultList[did];
                            json.data.push(item);
                        }
                        customSend(res, json, callback);
                    })
                    .catch(err => {
                        json.errorcode = enumMap.errorcode.db_error;
                        customSend(res, json, callback, err);
                    });
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    synHuitongInfo: function (req, res) {
        let json = {
            code: 0, //客户要求正确时返回code为0
            result: true
        };
        let callback = req.body.callback;
        logger.info('/basic/synHuitongInfo');
        logger.info(JSON.stringify(req.body));
        try {
            req.body = req.body.data;
            let groupname = req.body.orgcode; //获取车组名
            let carLicence = req.body.plateNum; //获取车牌号
            let deviceNo = req.body.gpsno; //获取设备编号(MDVR)
            let terid = req.body.chipCard; //获取设备芯片号(N9M)
            let channelCount = req.body.channelList.length; //获取通道个数
            let simid = req.body.sim; //获取SIM卡号
            let deviceType = req.body.model; //获取设备类型(MDVR/N9M)
            let operator = req.body.source; //获取操作类型      // 1-绑定；2-解绑；3-机构号变化；4-SIM号变化；5-附件（锐明3G视频）渠道列表变化。
            if (
                groupname === undefined ||
                carLicence === undefined ||
                channelCount === undefined ||
                deviceType === undefined ||
                operator === undefined
            ) {
                json.code = 202;
                customSend(res, json, callback);
            }
            if (deviceNo === undefined && terid === undefined) {
                json.code = 202;
                customSend(res, json, callback);
            }
            let deviceID = '';
            let isExistDevice = false;
            //chipCard有值的就是N9M设备，其他为MDVR设备
            if (deviceType == 'D5M') {
                deviceType = 'MDVR';
                deviceID = deviceNo;
            } else {
                deviceType = 'N9M';
                deviceID = terid;
            }
            db_vehicle
                .getStateHuitong('huitong')
                .then(result => {
                    if (parseInt(result[0].configvalue)) {
                        return Promise.resolve(result);
                    } else {
                        return Promise.reject({ updateAllInfo: true });
                    }
                })
                .then(() => {
                    //查询平台是否存在设备ID
                    return db_vehicle.getVehicleIdByDeviceId(deviceID);
                })
                .then(result => {
                    isExistDevice = result.length > 0;

                    //根据客户那边的source类型来判断
                    if (operator == 1 || operator == 3 || operator == 4 || operator == 5) {
                        return db_vehicle.isExistCarlicenseSameAsDevice(deviceID, carLicence);
                    } else if (operator == 2) {
                        //解绑，在DB中删除
                        return db_vehicle.deleteByDeviceId(deviceID);
                    }
                })
                .then(result => {
                    if (operator == 2) {
                        customSend(res, json, callback);
                    } else {
                        if (result) {
                            carLicence = carLicence + '-HT'; //与其他车牌号相同，重命名车牌号
                        }
                        return db_group.getIdByNameP(groupname); //不存在则添加车组，最后返回车组ID
                    }
                })
                .then(result => {
                    if (!res.finished) {
                        let item = {};
                        item.deviceid = deviceID;
                        item.groupid = result;
                        item.carlicence = carLicence;
                        item.channelCount = channelCount;
                        item.sim = simid;
                        item.type = formatType(deviceType);
                        if (isExistDevice) {
                            return db_vehicle.updateHuitongInfoP(item);
                        } else {
                            item = getInsertItem(item);
                            let insertItemArray = [];
                            insertItemArray.push(item);
                            return db_vehicle.createBatchHuitongInfoP(insertItemArray);
                        }
                    }
                })
                .then(() => {
                    if (!res.finished) {
                        customSend(res, json, callback);
                    }
                })
                .catch(err => {
                    if (err.updateAllInfo) {
                        json.code = 212;
                    } else {
                        json.code = 202;
                    }
                    customSend(res, json, callback, err);
                });
        } catch (err) {
            json.code = 202;
            customSend(res, json, callback, err);
        }
    },
    /**
     * 同步汇通单条信息
     */
    synHuitongInfo0: function (req, res) {
        let json = {
            code: 200,
            result: true
        };
        let callback = req.body.callback;
        logger.info('/basic/synHuitongInfo');
        logger.info(JSON.stringify(req.body));
        try {
            req.body = req.body.data;
            let groupname = req.body.orgcode; //获取车组名
            let carLicence = req.body.plateNum; //获取车牌号
            let deviceNo = req.body.gpsno; //获取设备编号(MDVR)
            let terid = req.body.chipCard; //获取设备芯片号(N9M)
            let channelCount = req.body.channelList; //获取通道个数
            let simid = req.body.sim; //获取SIM卡号
            let deviceType = req.body.model; //获取设备类型(MDVR/N9M)
            let operator = req.body.source; //获取操作类型
            let deviceId = '';
            let groupId = '';
            let vehicleId = '';
            let isDeviceExist = false;
            if (
                groupname === undefined ||
                carLicence === undefined ||
                channelCount === undefined ||
                deviceType === undefined ||
                operator === undefined
            ) {
                json.code = 202;
                customSend(res, json, callback);
            }
            if (deviceNo === undefined && terid === undefined) {
                json.code = 202;
                customSend(res, json, callback);
            }
            //chipCard有值的就是N9M设备，其他为MDVR设备
            if (deviceType == 'D5M') {
                deviceType = 'MDVR';
            } else {
                deviceType = 'N9M';
            }
            if (operator == 1) {
                //修改或新增
                db_vehicle
                    .getStateHuitong('huitong')
                    .then(result => {
                        if (parseInt(result[0].configvalue)) {
                            return Promise.resolve(result);
                        } else {
                            return Promise.reject({ updateAllInfo: true });
                        }
                    })
                    .then(() => {
                        //查询车组是否存在
                        let item = {};
                        item.key = 'name';
                        item.value = groupname;
                        return db_group.existP(item);
                    })
                    .then(result => {
                        //处理车组
                        if (result) {
                            //存在车组
                            return Promise.resolve(result);
                        } else {
                            //插入车组
                            let item = {
                                name: groupname,
                                pid: 1,
                                remark: null
                            };
                            return db_group.createP(item);
                        }
                    })
                    .then(() => {
                        return db_group.getIdByNameP(groupname); //获取车组id
                    })
                    .then(result => {
                        //查询数据库中是否存在设备
                        if (deviceType == 'MDVR') {
                            deviceId = deviceNo;
                        } else if (deviceType == 'N9M') {
                            deviceId = terid;
                        }
                        groupId = result;
                        return db_vehicle.isExistDeviceInTable(deviceId);
                    })
                    .then(result => {
                        //处理carlicence重名问题
                        if (result.length > 0) {
                            isDeviceExist = true;
                            vehicleId = result[0].id;
                            return db_vehicle.renameDeviceCarlicence(deviceId, carLicence); //处理存在设备的车牌号
                        } else {
                            return db_vehicle.renameNonDeviceCarlicence(carLicence); //处理插入设备的车牌号
                        }
                    })
                    .then(result => {
                        //更新设备信息
                        if (isDeviceExist) {
                            if (result) {
                                carLicence = carLicence + '-HT';
                            }
                            let item = {};
                            item.id = vehicleId;
                            item.groupid = groupId;
                            item.carlicence = carLicence;
                            item.channelCount = channelCount;
                            item.sim = simid;
                            item.type = formatType(deviceType);
                            return db_vehicle.updateHuitongInfoP(item);
                        } else {
                            //插入设备信息
                            let insertItem = {
                                groupid: groupId,
                                plateNum: req.body.plateNum,
                                gpsno: req.body.gpsno,
                                terid: req.body.terid,
                                model: req.body.model,
                                channel: req.body.channel,
                                sim: req.body.sim
                            };
                            let item = getInsertItem(insertItem);
                            if (result[0].count > 0) {
                                item.carlicence = item.carlicence + '-HT';
                            }
                            let insertItemArray = [];
                            insertItemArray.push(item);
                            if (insertItemArray.length > 0) {
                                return db_vehicle.createBatchHuitongInfoP(insertItemArray);
                            } else {
                                return Promise.resolve(result);
                            }
                        }
                    })
                    .then(result => {
                        customSend(res, json, callback);
                    })
                    .catch(err => {
                        if (err.updateAllInfo) {
                            json.code = 212;
                        } else {
                            json.code = 202;
                        }
                        logger.error(err);
                        customSend(res, json, callback, err);
                    });
            } else if (operator == 2) {
                db_vehicle
                    .getStateHuitong('huitong')
                    .then(result => {
                        if (parseInt(result[0].configvalue)) {
                            return Promise.resolve(result);
                        } else {
                            return Promise.reject({ updateAllInfo: true });
                        }
                    })
                    // .then(result =>{
                    //     //查询车组是否存在
                    //     let item = {};
                    //     item.key = "name";
                    //     item.value = groupname;
                    //     return db_group.existP(item);
                    // })
                    // .then(result =>{
                    //     //车组处理
                    //     if(result){//存在车组
                    //         return db_group.getIdByNameP(groupname);
                    //     }else{
                    //         return Promise.reject(err);
                    //     }
                    // })
                    // .then(result =>{
                    //     //设备处理
                    //     if(deviceType == "MDVR"){
                    //         deviceId = deviceNo;
                    //     }else if(deviceType == "N9M"){
                    //         deviceId = terid;
                    //     }
                    //     groupid = result;
                    //     return db_vehicle.isExistDeviceInTable(deviceId,groupid);  //车组下是否有设备
                    // })
                    //直接按照设备ID删除设备
                    .then(() => {
                        return db_vehicle.deleteByDeviceId(deviceId);
                    })
                    .then(() => {
                        customSend(res, json, callback);
                    })
                    .catch(err => {
                        if (err.updateAllInfo) {
                            json.code = 212;
                        } else {
                            json.code = 202;
                        }
                        logger.error(err);
                        customSend(res, json, callback, err);
                    });
            }
        } catch (err) {
            json.code = 202;
            customSend(res, json, callback, err);
        }
    },
    /**
     * 同步汇通全部信息
     */
    synHuitongAllInfo: function (req, res) {
        let json = {
            code: 200,
            result: true
        };
        let callback = req.body.callback;
        logger.info('/basic/synHuitongAllInfo');
        logger.info(JSON.stringify(req.body));
        try {
            let items = req.body.data; //获取全部的同步数据
            let deviceIdArray = [];
            let nonExistDeviceArray = [];
            //需要插入设备的信息
            let insertItems = [];
            //需要更新设备的信息
            let updateItems = [];
            //获取不存在的组
            let groupNameArray = [];
            let nonExistGroupArray = [];
            for (let i = 0; i < items.length; i++) {
                if (!groupNameArray.includes(items[i].orgcode)) {
                    groupNameArray.push(items[i].orgcode);
                }
                if (
                    items[i].orgcode === undefined ||
                    items[i].plateNum === undefined ||
                    items[i].channel === undefined ||
                    items[i].model === undefined
                ) {
                    continue;
                }
                if (items[i].gpsno === undefined && items[i].terid === undefined) {
                    continue;
                }
            }
            db_group
                .getItemsP()
                .then(result => {
                    nonExistGroupArray = getNonExistGroupArray(groupNameArray, result);
                    //批量插入组信息
                    let itemArray = [];
                    for (let i = 0; i < nonExistGroupArray.length; i++) {
                        let item = [nonExistGroupArray[i], '', 1];
                        itemArray.push(item);
                    }
                    if (itemArray.length > 0) {
                        return db_group.createBatchP(itemArray);
                    } else {
                        return Promise.resolve(result);
                    }
                })
                .then(result => {
                    //获取组id
                    return db_group.getGroupIdfromNameP(groupNameArray);
                })
                .then(result => {
                    for (let m = 0; m < items.length; m++) {
                        for (let n = 0; n < result.length; n++) {
                            if (items[m].orgcode == result[n].groupname) {
                                items[m].groupid = result[n].id;
                                break;
                            }
                        }
                    }
                    return db_vehicle.getItemsP();
                })
                .then(result => {
                    //获取不存在的设备
                    for (let m = 0; m < items.length; m++) {
                        if (items[m].model == 'MDVR') {
                            deviceIdArray.push(items[m].gpsno);
                        } else if (items[m].model == 'N9M') {
                            deviceIdArray.push(items[m].terid);
                        }
                    }
                    nonExistDeviceArray = getNonExistDeviceArray(deviceIdArray, result);
                    for (let m = 0; m < items.length; m++) {
                        let flag = false;
                        for (let n = 0; n < nonExistDeviceArray.length; n++) {
                            if (items[m].gpsno == nonExistDeviceArray[n] || items[m].terid == nonExistDeviceArray[n]) {
                                flag = true;
                                insertItems.push(items[m]);
                                break;
                            }
                        }
                        if (!flag) {
                            updateItems.push(items[m]);
                        }
                    }
                    //获取不存在设备中同名的车牌
                    let insertDeviceCarLicenceArray = [];
                    for (let i = 0; i < insertItems.length; i++) {
                        insertDeviceCarLicenceArray.push(insertItems[i].plateNum);
                    }
                    insertDeviceCarLicenceArray.push('');
                    return db_vehicle.getSameCarLicence(insertDeviceCarLicenceArray);
                })
                .then(result => {
                    //修改不存在设备中同名的车牌
                    for (let i = 0; i < result.length; i++) {
                        for (let j = 0; j < insertItems.length; j++) {
                            if (insertItems[j].plateNum == result[i].carLicence) {
                                insertItems[j].plateNum = result[i].carLicence + '-HT';
                            }
                        }
                    }
                    let insertItemArray = [];
                    for (let i = 0; i < insertItems.length; i++) {
                        let item = getInsertItem(insertItems[i]);
                        insertItemArray.push(item);
                    }
                    //批量插入设备
                    if (insertItems.length > 0) {
                        return db_vehicle.createBatchHuitongInfoP(insertItemArray);
                    } else {
                        return Promise.resolve(result);
                    }
                })
                .then(result => {
                    //是否全部插入成功
                    if (insertItems.length > 0) {
                        if (result != insertItems.length) {
                            json.code = 202;
                        }
                    }
                    //更新设备信息
                    let updateDeviceIdArray = [];
                    for (let m = 0; m < updateItems.length; m++) {
                        if (updateItems[m].model == 'MDVR') {
                            updateDeviceIdArray.push(updateItems[m].gpsno);
                        } else if (updateItems[m].model == 'N9M') {
                            updateDeviceIdArray.push(updateItems[m].terid);
                        }
                    }
                    //获取vehicledeviceid
                    updateDeviceIdArray.push('');
                    return db_vehicle.getVehicleDeviceId(updateDeviceIdArray);
                })
                .then(result => {
                    for (let i = 0; i < updateItems.length; i++) {
                        let deviceId = '';
                        if (updateItems[i].model == 'MDVR') {
                            deviceId = updateItems[i].gpsno;
                        } else if (updateItems[i].model == 'N9M') {
                            deviceId = updateItems[i].terid;
                        }
                        for (let j = 0; j < result.length; j++) {
                            if (deviceId == result[j].deviceid) {
                                updateItems[i].id = result[j].id;
                            }
                        }
                    }
                    for (let i = 0; i < updateItems.length; i++) {
                        let deviceId = '';
                        if (updateItems[i].model == 'MDVR') {
                            deviceId = updateItems[i].gpsno;
                        } else if (updateItems[i].model == 'N9M') {
                            deviceId = updateItems[i].terid;
                        }
                        let item = {};
                        item.id = updateItems[i].id;
                        item.groupid = updateItems[i].groupid;
                        item.carlicence = updateItems[i].plateNum;
                        item.channelCount = updateItems[i].channel;
                        item.sim = updateItems[i].sim;
                        item.type = formatType(updateItems[i].model);
                        db_vehicle
                            .renameDeviceCarlicence(deviceId, updateItems[i].plateNum) //处理存在设备的车牌号
                            .then(result => {
                                if (result) {
                                    item.carlicence = item.carlicence + '-HT';
                                }
                                return db_vehicle.updateHuitongInfoP(item);
                            })
                            .catch(err => {
                                logger.info(JSON.stringify(item));
                                logger.error(err);
                            });
                    }
                    return db_vehicle.updateStateHuitong(1, 'huitong');
                })
                .then(() => {
                    customSend(res, json, callback);
                })
                .catch(err => {
                    json.code = 202;
                    logger.error(err);
                    customSend(res, json, callback, err);
                });
        } catch (err) {
            json.code = 202;
            customSend(res, json, callback, err);
        }
    },
    /**
     * 客流统计接口
     */
    passengerCount: function (req, res) {
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let key = req.body.key;
            let terid = req.body.terid;
            let starttime = req.body.starttime;
            let endtime = req.body.endtime;
            let door = req.body.door;
            if (!key || starttime === undefined || endtime === undefined || terid === undefined) {
                json.errorcode = 207;
                customSend(res, json, callback);
            } else {
                var url = `http://${config.ceiba2ip}:${config.ceiba2HttpApiPort}/api/v1/schoolbus/passengertraffic/detail`;
                var options = {
                    uri: url,
                    method: 'POST',
                    json: true,
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: {
                        key: encodeURIComponent(key),
                        terid,
                        starttime,
                        endtime,
                        door,
                        pageSize: 9999999,
                        pageIndex: 1
                    }
                };
                requestP(options)
                    .then(result => {
                        if (result.errorcode != 200) {
                            json.errorcode = errorMap.httpError(result.errorcode);
                        }
                        json.data = result.data;
                        customSend(res, json, callback);
                    })
                    .catch(err => {
                        json.errorcode = 302;
                        customSend(res, json, callback, err);
                    });
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    /**
     * 获取地图类型配置key
     */
    getConfingMapkey: function (req, res) {
        let json = {
            errorcode: 200,
            result: {
                GMapKey: ''
            }
        };
        try {
            let callback = req.query.callback;
            let key = req.query.key;
            if (!key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                db_systemconfig.getItems((err, data) => {
                    if (!err) {
                        for (let i = 0; i < data.length; i++) {
                            if (data[i].name == 'MapKey') {
                                json.result.GMapKey = data[i].value;
                                break;
                            }
                        }
                        customSend(res, json, callback);
                    } else {
                        json.errorcode = 202;
                        customSend(res, json, callback, err);
                    }
                });
            }
        } catch (err) {
            json.errorcode = enumMap.errorcode.servererror;
            customSend(res, json, callback, err);
        }
    },
    //证据中心相关接口
    /**
     * 证据检索列表条数查询
     */
    getEvidenceCenterListCount: function (req, res) {
        logger.info('<---/api/v1/basic/evidence-center/count--->');
        let json = {
            data: {
                total: 0
            },
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let _body = req.body;
            if (!_body.key) {
                json.errorcode = enumMap.errorcode.no_authorization_key;
                customSend(res, json, callback);
            } else if (
                _body.terid === undefined ||
                _body.starttime === undefined ||
                _body.endtime === undefined ||
                _body.type === undefined ||
                _body.keytype === undefined ||
                _body.keyword === undefined
            ) {
                json.errorcode = enumMap.errorcode.abnormal_param_num;
                customSend(res, json, callback);
            } else {
                let pm = new Promise((resolve, reject) => {
                    if (_body.terid.length == 0) {
                        let _user = commonfun.validWcms4Token(_body.key);
                        getDeviceIdByRoledId(_user.rid)
                            .then(r => {
                                if (r.length > 0) {
                                    resolve(r);
                                } else {
                                    reject({ noVehicle: true });
                                }
                            })
                            .catch(err => {
                                reject(err);
                            });
                    } else {
                        resolve(_body.terid);
                    }
                });
                pm.then(r => {
                    let _terid = r;
                    let uri = `http://${config.ceiba2ip}:${config.ceiba2HttpApiPort}/api/v1/evidence/count`;
                    let options = {
                        uri: uri,
                        method: 'POST',
                        json: true,
                        headers: {
                            'content-type': 'application/json'
                        },
                        body: {
                            key: encodeURIComponent(_body.key),
                            terid: _terid,
                            starttime: _body.starttime,
                            endtime: _body.endtime,
                            type: _body.type,
                            keytype: parseInt(_body.keytype),
                            keyword: _body.keyword,
                            source: 1
                        }
                    };
                    return requestP(options);
                })
                    .then(r => {
                        if (r.errorcode == 200) {
                            json.data.total = r.data.total;
                            customSend(res, json, callback);
                        } else {
                            let err = new Error('httpSDK errorcode != 200, errorcode =' + r.errorcode);
                            json.errorcode = errorMap.sdkError(r.errorcode);
                            customSend(res, json, callback, err);
                        }
                    })
                    .catch(err => {
                        if (err.noVehicle) {
                            customSend(res, json, callback); //当前权限下无车辆时，直接返回
                        } else {
                            json.errorcode = enumMap.errorcode.servererror;
                            customSend(res, json, callback, err);
                        }
                    });
            }
        } catch (err) {
            json.errorcode = enumMap.errorcode.servererror;
            customSend(res, json, callback, err);
        }
    },
    /**
     * 证据检索列表明细查询
     */
    getEvidenceCenterListDetail: function (req, res) {
        logger.info('<---/api/v1/basic/evidence-center/list--->');
        let json = {
            data: [],
            errorcode: 200,
            context: ''
        };
        let callback = req.body.callback;
        try {
            let _body = req.body;
            if (!_body.key) {
                json.errorcode = enumMap.errorcode.no_authorization_key;
                customSend(res, json, callback);
            } else if (
                _body.terid === undefined ||
                _body.starttime === undefined ||
                _body.endtime === undefined ||
                _body.type === undefined ||
                _body.keytype === undefined ||
                _body.keyword === undefined ||
                _body.page === undefined ||
                _body.count === undefined
            ) {
                json.errorcode = enumMap.errorcode.abnormal_param_num;
                customSend(res, json, callback);
            } else {
                let pm = new Promise((resolve, reject) => {
                    if (_body.terid.length == 0) {
                        let _user = commonfun.validWcms4Token(_body.key);
                        getDeviceIdByRoledId(_user.rid)
                            .then(r => {
                                if (r.length > 0) {
                                    resolve(r);
                                } else {
                                    reject({ noVehicle: true });
                                }
                            })
                            .catch(err => {
                                reject(err);
                            });
                    } else {
                        resolve(_body.terid);
                    }
                });
                pm.then(r => {
                    let _terid = r;
                    let uri = `http://${config.ceiba2ip}:${config.ceiba2HttpApiPort}/api/v1/evidence/list`;
                    let options = {
                        uri: uri,
                        method: 'POST',
                        json: true,
                        headers: {
                            'content-type': 'application/json'
                        },
                        body: {
                            key: encodeURIComponent(_body.key),
                            terid: _terid,
                            starttime: _body.starttime,
                            endtime: _body.endtime,
                            type: _body.type,
                            keytype: parseInt(_body.keytype),
                            keyword: _body.keyword,
                            page: parseInt(_body.page),
                            count: parseInt(_body.count),
                            source: 1,
                            context: _body.context
                        }
                    };
                    return requestP(options);
                })
                    .then(r => {
                        if (r.errorcode == 200) {
                            for (let item of r.data) {
                                item.pic = encodeURIComponent(item.pic);
                            }
                            json.data = r.data;
                            json.context = r.context;
                            customSend(res, json, callback);
                        } else {
                            let err = new Error('httpSDK errorcode != 200, errorcode =' + r.errorcode);
                            json.errorcode = errorMap.sdkError(r.errorcode);
                            customSend(res, json, callback, err);
                        }
                    })
                    .catch(err => {
                        if (err.noVehicle) {
                            customSend(res, json, callback); //当前权限下无车辆时，直接返回
                        } else {
                            json.errorcode = enumMap.errorcode.servererror;
                            customSend(res, json, callback, err);
                        }
                    });
            }
        } catch (err) {
            json.errorcode = enumMap.errorcode.servererror;
            customSend(res, json, callback, err);
        }
    },
    /**
     * 指定偏移位置和条数证据列表明细
     */
    getEvidenceCenterOffsetListDetail: function (req, res) {
        logger.info('<---/api/v1/basic/evidence-center/offsetlist--->');
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let _body = req.body;
            if (!_body.key) {
                json.errorcode = enumMap.errorcode.no_authorization_key;
                customSend(res, json, callback);
            } else if (
                _body.terid === undefined ||
                _body.starttime === undefined ||
                _body.endtime === undefined ||
                _body.alarmtype === undefined ||
                _body.keytype === undefined ||
                _body.keyword === undefined ||
                _body.index === undefined ||
                _body.count === undefined
            ) {
                json.errorcode = enumMap.errorcode.abnormal_param_num;
                customSend(res, json, callback);
            } else {
                let pm = new Promise((resolve, reject) => {
                    if (_body.terid.length == 0) {
                        let _user = commonfun.validWcms4Token(_body.key);
                        getDeviceIdByRoledId(_user.rid)
                            .then(r => {
                                if (r.length > 0) {
                                    resolve(r);
                                } else {
                                    reject({ noVehicle: true });
                                }
                            })
                            .catch(err => {
                                reject(err);
                            });
                    } else {
                        resolve(_body.terid);
                    }
                });
                pm.then(r => {
                    let _terid = r;
                    let uri = `http://${config.ceiba2ip}:${config.ceiba2HttpApiPort}/api/v1/basic/evidence-app/offsetlist`;
                    let options = {
                        uri: uri,
                        method: 'POST',
                        json: true,
                        headers: {
                            'content-type': 'application/json'
                        },
                        body: {
                            key: encodeURIComponent(_body.key),
                            terid: _terid,
                            starttime: _body.starttime,
                            endtime: _body.endtime,
                            type: _body.alarmtype,
                            keytype: parseInt(_body.keytype),
                            keyword: _body.keyword,
                            index: parseInt(_body.index),
                            count: parseInt(_body.count)
                        }
                    };
                    return requestP(options);
                })
                    .then(r => {
                        let err = null;
                        if (r.errorcode == 200) {
                            for (let item of r.data) {
                                item.pic = encodeURIComponent(item.pic);
                            }
                            json.data = r.data;
                        } else {
                            json.errorcode = errorMap.sdkError(r.errorcode);
                            err = new Error('httSDK errorcode: ' + r.errorcode);
                        }
                        if (err) {
                            customSend(res, json, callback, err);
                        } else {
                            customSend(res, json, callback);
                        }
                    })
                    .catch(err => {
                        if (err.noVehicle) {
                            customSend(res, json, callback); //当前权限下无车辆时，直接返回
                        } else {
                            json.errorcode = enumMap.errorcode.servererror;
                            customSend(res, json, callback, err);
                        }
                    });
            }
        } catch (err) {
            json.errorcode = enumMap.errorcode.servererror;
            customSend(res, json, callback, err);
        }
    },
    /**
     * 获取证据图片列表
     */
    getEvidenceCenterPicList: function (req, res) {
        logger.info('<---/api/v1/basic/evidence-center/picture/list--->');
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let _body = req.body;
            if (!_body.key) {
                json.errorcode = enumMap.errorcode.no_authorization_key;
                customSend(res, json, callback);
            } else if (_body.eid === undefined) {
                json.errorcode = enumMap.errorcode.abnormal_param_num;
                customSend(res, json, callback);
            } else {
                let uri = `http://${config.ceiba2ip}:${config.ceiba2HttpApiPort}/api/v1/evidence/picture`;
                let options = {
                    uri: uri,
                    method: 'POST',
                    json: true,
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: {
                        key: encodeURIComponent(_body.key),
                        eid: _body.eid
                    }
                };
                requestP(options)
                    .then(r => {
                        if (r.errorcode == 200) {
                            for (let item of r.data) {
                                item.path = encodeURIComponent(item.path);
                            }
                            json.data = r.data;
                            customSend(res, json, callback);
                        } else {
                            let err = new Error('httpSDK errorcode != 200, errorcode =' + r.errorcode);
                            json.errorcode = errorMap.sdkError(r.errorcode);
                            customSend(res, json, callback, err);
                        }
                    })
                    .catch(err => {
                        json.errorcode = enumMap.errorcode.servererror;
                        customSend(res, json, callback, err);
                    });
            }
        } catch (err) {
            json.errorcode = enumMap.errorcode.servererror;
            customSend(res, json, callback, err);
        }
    },
    /**
     *获取指定证据明细
     */
    getEvidenceCenterDetail: function (req, res) {
        logger.info('<---/api/v1/basic/evidence-center/detail--->');
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let _body = req.body;
            if (!_body.key) {
                json.errorcode = enumMap.errorcode.no_authorization_key;
                customSend(res, json, callback);
            } else if (_body.eid === undefined) {
                json.errorcode = enumMap.errorcode.abnormal_param_num;
                customSend(res, json, callback);
            } else {
                let uri = `http://${config.ceiba2ip}:${config.ceiba2HttpApiPort}/api/v1/basic/evidence-app/detail`;
                let options = {
                    uri: uri,
                    method: 'POST',
                    json: true,
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: {
                        key: encodeURIComponent(_body.key),
                        eid: _body.eid
                    }
                };
                requestP(options)
                    .then(r => {
                        if (r.errorcode == 200) {
                            let httpData = r.result;
                            for (let item of httpData) {
                                json.data.push({
                                    eid: item.eid,
                                    size: item.size,
                                    terid: item.terid,
                                    groupname: item.groupName,
                                    carlicense: item.carLicense,
                                    platecolor: item.plateColor,
                                    alarmtype: item.alarmType,
                                    speed: item.speed,
                                    starttime: item.startTime,
                                    endtime: item.endTime,
                                    lat: item.lat,
                                    lng: item.lng,
                                    location: item.location,
                                    drivername: item.driverName,
                                    driverphone: item.driverPhone,
                                    driverlicense: item.driverLicense,
                                    driverimg: encodeURIComponent(item.driverImg),
                                    handleusername: item.handleUserName,
                                    handletime: item.handleTime,
                                    handlemethod: item.handleMethod,
                                    handlecontent: item.handleContent,
                                    evidencestatus: item.evidencestatus,
                                    evidencestatusmsg: item.evidencestatusmsg
                                });
                            }
                            customSend(res, json, callback);
                        } else {
                            let err = new Error('httpSDK errorcode != 200, errorcode =' + r.errorcode);
                            json.errorcode = errorMap.sdkError(r.errorcode);
                            customSend(res, json, callback, err);
                        }
                    })
                    .catch(err => {
                        json.errorcode = enumMap.errorcode.servererror;
                        customSend(res, json, callback, err);
                    });
            }
        } catch (err) {
            json.errorcode = enumMap.errorcode.servererror;
            customSend(res, json, callback, err);
        }
    },
    /**
     * 获取指定证据视频列表
     */
    getEvidenceCenterVideoList: function (req, res) {
        logger.info('<---/api/v1/basic/evidence-center/video/list--->');
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let _body = req.body;
            if (!_body.key) {
            } else if (_body.eid === undefined) {
                json.errorcode = enumMap.errorcode.abnormal_param_num;
                customSend(res, json, callback);
            } else {
                let uri = `http://${config.ceiba2ip}:${config.ceiba2HttpApiPort}/api/v1/basic/evidence-app/video/list`;
                let options = {
                    uri: uri,
                    method: 'POST',
                    json: true,
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: {
                        key: encodeURIComponent(_body.key),
                        eid: _body.eid,
                        type: _body.type == 0 || _body.type == 1 ? _body.type : 1 //获取视频类型 0:264, 1:mp4
                    }
                };
                requestP(options)
                    .then(r => {
                        if (r.errorcode == 200) {
                            for (let item of r.data) {
                                for (let item2 of item.video) {
                                    item2.path = encodeURIComponent(item2.path);
                                }
                            }
                            json.data = r.data;
                            customSend(res, json, callback);
                        } else {
                            let err = new Error('httpSDK errorcode != 200, errorcode =' + r.errorcode);
                            json.errorcode = errorMap.sdkError(r.errorcode);
                            customSend(res, json, callback, err);
                        }
                    })
                    .catch(err => {
                        json.errorcode = enumMap.errorcode.servererror;
                        customSend(res, json, callback, err);
                    });
            }
        } catch (err) {
            json.errorcode = enumMap.errorcode.servererror;
            customSend(res, json, callback, err);
        }
    },
    /**
     * 图片预览，视频播放(绝对路径)
     */
    mediaFileView: function (req, res) {
        downloadControl.absoluteView(req, res);
    },
    /**
     * 获取指定偏移位置和条数的报警信息
     */
    alarmOffsetDetail: function (req, res) {
        logger.info('<---/api/v1/basic/alarm/offsetdetail--->');
        let json = {
            data: [],
            errorcode: 200
        };
        let callback = req.body.callback;
        try {
            let _body = req.body;
            if (!_body.key) {
                json.errorcode = enumMap.errorcode.no_authorization_key;
                customSend(res, json, callback);
            } else if (
                _body.terid === undefined ||
                _body.starttime === undefined ||
                _body.endtime === undefined ||
                _body.alarmtype === undefined ||
                _body.dealtype === undefined ||
                _body.index === undefined ||
                _body.count === undefined
            ) {
                json.errorcode = enumMap.errorcode.abnormal_param_num;
                customSend(res, json, callback);
            } else {
                let pm = new Promise((resolve, reject) => {
                    if (_body.terid.length == 0) {
                        let _user = commonfun.validWcms4Token(_body.key);
                        getDeviceIdByRoledId(_user.rid)
                            .then(r => {
                                if (r.length > 0) {
                                    resolve(r);
                                } else {
                                    reject({ noVehicle: true });
                                }
                            })
                            .catch(err => {
                                reject(err);
                            });
                    } else {
                        resolve(_body.terid);
                    }
                });
                pm.then(r => {
                    let _terid = r;
                    let uri = `http://${config.ceiba2ip}:${config.ceiba2HttpApiPort}/api/v1/basic/alarm/offsetdetail`;
                    let options = {
                        uri: uri,
                        method: 'POST',
                        json: true,
                        headers: {
                            'content-type': 'application/json'
                        },
                        body: {
                            key: encodeURIComponent(_body.key),
                            terid: _terid,
                            starttime: _body.starttime,
                            endtime: _body.endtime,
                            alarmtype: _body.alarmtype,
                            dealtype: parseInt(_body.dealtype),
                            index: parseInt(_body.index),
                            count: parseInt(_body.count)
                        }
                    };
                    return requestP(options);
                })
                    .then(r => {
                        if (r.errorcode == 200) {
                            let data = r.data;
                            for (let item of data) {
                                json.data.push({
                                    eid: item.eid,
                                    terid: item.terid,
                                    alarmid: item.uuid,
                                    alarmtype: item.alarmType,
                                    alarmdesc: item.desc,
                                    alarmtime: item.time,
                                    dealuser: item.du,
                                    dealdesc: item.dm,
                                    dealtype: item.dealtype,
                                    dealtime: item.dt,
                                    gpslng: item.lng,
                                    gpslat: item.lat,
                                    speed: item.sp,
                                    direction: item.direction,
                                    altitude: item.altitude
                                });
                            }
                            customSend(res, json, callback);
                        } else {
                            let err = new Error('httpSDK errorcode != 200, errorcode =' + r.errorcode);
                            json.errorcode = errorMap.sdkError(r.errorcode);
                            customSend(res, json, callback, err);
                        }
                    })
                    .catch(err => {
                        if (err.noVehicle) {
                            customSend(res, json, callback); //当前权限下无车辆时，直接返回
                        } else {
                            json.errorcode = enumMap.errorcode.servererror;
                            customSend(res, json, callback, err);
                        }
                    });
            }
        } catch (err) {
            json.errorcode = enumMap.errorcode.servererror;
            customSend(res, json, callback, err);
        }
    },
    faceComCount: function* (req, res) {
        let json = {
            errorcode: 200,
            data: {
                count: 0
            }
        };
        let callback = req.query.callback;
        try {
            let _key = req.body.key;
            if (!_key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                var countBody = {
                    key: _key,
                    terid: req.body.terid,
                    trigger: parseInt(req.body.trigger),
                    status: parseInt(req.body.status),
                    starttime: req.body.starttime,
                    endtime: req.body.endtime
                };
                var countData = yield requestP({
                    uri: 'http://' + config.ceiba2ip + ':' + config.ceiba2HttpApiPort + '/api/v1/face/comparison/count',
                    method: 'post',
                    json: true,
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: countBody
                });
                if (countData.errorcode == 200) {
                    json.data.count = countData.data.total;
                    res.send(json);
                } else {
                    json.errorcode = 302;
                    customSend(res, json, callback, err);
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    faceComList: function* (req, res) {
        let json = {
            errorcode: 200,
            data: []
        };
        let callback = req.query.callback;
        try {
            let _key = req.body.key;
            if (!_key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                var listBody = {
                    key: _key,
                    terid: req.body.terid,
                    trigger: parseInt(req.body.trigger),
                    status: parseInt(req.body.status),
                    starttime: req.body.starttime,
                    endtime: req.body.endtime,
                    page: parseInt(req.body.page),
                    count: parseInt(req.body.count)
                };
                var listData = yield requestP({
                    uri: 'http://' + config.ceiba2ip + ':' + config.ceiba2HttpApiPort + '/api/v1/face/comparison/list',
                    method: 'post',
                    json: true,
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: listBody
                });
                if (listData.errorcode == 200) {
                    json.data = listData.data;
                    res.send(json);
                } else {
                    json.errorcode = 302;
                    customSend(res, json, callback, err);
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    faceComDetail: function* (req, res) {
        let json = {
            errorcode: 200,
            data: []
        };
        let callback = req.query.callback;
        try {
            let _key = req.body.key;
            if (!_key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                var detailBody = {
                    key: _key,
                    terid: req.body.terid,
                    trigger: parseInt(req.body.trigger),
                    status: parseInt(req.body.status),
                    starttime: req.body.starttime,
                    endtime: req.body.endtime,
                    page: parseInt(req.body.page),
                    count: parseInt(req.body.count)
                };
                var detailData = yield requestP({
                    uri:
                        'http://' +
                        config.ceiba2ip +
                        ':' +
                        config.ceiba2HttpApiPort +
                        '/api/v1/face/comparison/listdetail',
                    method: 'post',
                    json: true,
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: detailBody
                });
                if (detailData.errorcode == 200) {
                    json.data = detailData.data;
                    res.send(json);
                } else {
                    json.errorcode = 302;
                    customSend(res, json, callback, err);
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    /**
     * 文件下载
     */
    absoluteDwnFile: function* (req, res) {
        try {
            let _key = req.query.key;
            if (!_key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                let encodeStr = decodeURIComponent(req.query.dir);
                let dir = commonfun.base642String(encodeStr).replace(/\/|\\/g, path.sep);
                let dirArr = dir.split(path.sep);
                // let fileName = '';
                // let pathT = '';
                // let temp = dir + path.sep + req.query.filename;
                // if(fs.existsSync(temp)){
                //     fileName = req.query.filename;
                //     pathT = temp;
                // }else{
                //     fileName = dirArr[dirArr.length - 1];
                //     pathT = dir;
                // }
                let fileName = dirArr[dirArr.length - 1];
                let pathT = dir;
                res.download(pathT, fileName, function (err) {
                    if (!err) {
                        res.end();
                        return;
                    }
                    if (err) {
                        logger.error(err);
                        res.send(err.message).end();
                    }
                });
            }
        } catch (err) {
            logger.error(err);
            res.end();
        }
    },
    /**
     * 压缩证据获取文件相对路径
     */
    zipFileDownload: function (req, res) {
        let json = {
            errorcode: 200,
            data: {
                path: ''
            }
        };
        let _key = req.body.key;
        if (!_key) {
            json.errorcode = 209;
            res.send(json);
        } else {
            try {
                let eid = req.body.eid;
                let serverip = req.body.serverip;
                let reqBody = {
                    eid: eid
                };
                requestP({
                    uri:
                        'http://' +
                        serverip +
                        ':' +
                        config.ceiba2HttpApiPort +
                        '/api/v1/evidence/download/pack?key=123',
                    method: 'POST',
                    json: true,
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: reqBody
                })
                    .then(r => {
                        if (r.errorcode == 200) {
                            json.data.path = r.data.path;
                            res.send(json);
                        } else {
                            return Promise.reject(new Error('get evidence download file failed!'));
                        }
                    })
                    .catch(err => {
                        logger.error(err);
                        json.errorcode = 202;
                        res.send(json);
                    });
            } catch (err) {
                logger.error(err);
                json.errorcode = 202;
                res.send(json);
            }
        }
    },
    /**
     * 证据分布式-服务器信息查询
     */
    evidenceServerInfo: function* (req, res) {
        let json = {
            errorcode: 200,
            data: []
        };
        let callback = req.query.callback;
        try {
            let _key = req.body.key;
            if (!_key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                var reqBody = {
                    key: _key
                };
                var Data = yield requestP({
                    uri:
                        'http://' +
                        config.ceiba2ip +
                        ':' +
                        config.ceiba2HttpApiPort +
                        '/api/v1/evidence/evidenceserverinfo',
                    method: 'post',
                    json: true,
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: reqBody
                });
                if (Data.errorcode == 200) {
                    json.data = Data.data;
                    res.send(json);
                } else {
                    json.errorcode = 302;
                    err = Data.errorcode;
                    customSend(res, json, callback, err);
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    },
    /**
     * 证据报警&轨迹
     */
    relatedgpsalarm: async function (req, res) {
        let json = {
            errorcode: 200,
            errorcase: '',
            result: []
        };
        let callback = req.query.callback;
        try {
            let _key = req.body.key;
            if (!_key) {
                json.errorcode = 209;
                customSend(res, json, callback);
            } else {
                var reqBody = {
                    key: _key,
                    eid: req.body.eid
                };
                var Data = await requestP({
                    uri: 'http://' + config.ceiba2ip + ':' + config.ceiba2HttpApiPort + '/alarm/relatedgpsalarm',
                    method: 'post',
                    json: true,
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: reqBody
                });
                if (Data.errorcode == 200) {
                    json.result = Data.result;
                    json.errorcase = Data.errorcase;
                    res.send(json);
                } else {
                    json.errorcode = 302;
                    json.errorcase = Data.errorcase;
                    err = Data.errorcode;
                    customSend(res, json, callback, err);
                }
            }
        } catch (err) {
            json.errorcode = 202;
            customSend(res, json, callback, err);
        }
    }
};
module.exports = controller;
