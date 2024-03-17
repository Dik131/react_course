var request = require('../../../tools/lavaRequest.js');
var async = require('async');
var fs = require('fs');
var exec = require('child_process').exec;
var config = require('../../../config/app.json');
var db_ads = require('../../../db' + config.dbType + '/' + config.platform + '/ads/index.js');
var db_vehicle = require('../../../db' + config.dbType + '/' + config.platform + '/vehicle/index.js');
var db_roleauthority = require('../../../db' + config.dbType + '/' + config.platform + '/roleauthority/index.js');
var logger = require('../../../tools/log4jsHelper.js').appLog();
var commonFun = require('../../../tools/commonfun.js');
var reportComFun = require('../../report/commonFunction/index.js');
var gpsHelper = require('../../../tools/gpsHelper.js');

var customRequest = function (url, requestBody, _startTime, callback) {
    request(
        {
            url: url, //
            method: 'GET',
            json: true,
            headers: {
                'content-type': 'application/json'
            },
            body: requestBody
        },
        function (error, response, body) {
            var result = [];
            if (!error && response.statusCode == 200) {
                var data = body.data ? body.data : [];
                for (var i = 0, l = data.length; i < l; i++) {
                    var temp = data[i];
                    var fStartTime = '';
                    var fEndTime = '';
                    if (temp.starttime) {
                        fStartTime = temp.starttime;
                        fEndTime = temp.endtime;
                    } else {
                        var pathArray = temp.name.split('-');
                        var stStr = pathArray[4],
                            edStr = pathArray[5];
                        fStartTime =
                            _startTime +
                            ' ' +
                            stStr.charAt(0) +
                            stStr.charAt(1) +
                            ':' +
                            stStr.charAt(2) +
                            stStr.charAt(3) +
                            ':' +
                            stStr.charAt(4) +
                            stStr.charAt(5);
                        fEndTime =
                            _startTime +
                            ' ' +
                            edStr.charAt(0) +
                            edStr.charAt(1) +
                            ':' +
                            edStr.charAt(2) +
                            edStr.charAt(3) +
                            ':' +
                            edStr.charAt(4) +
                            edStr.charAt(5);
                    }

                    result.push({
                        chn: temp.chn,
                        fileType: temp.filetype,
                        size: temp.size,
                        path: temp.name,
                        startTime: fStartTime,
                        endTime: fEndTime
                    });
                }
            }
            callback(error, result);
        }
    );
};
var convertPoint = function (_mt, temp) {
    var tempPoint = { lat: temp.GpsLat, lng: temp.GpsLng };
    if (parseFloat(temp.GpsLat) !== 0 || parseFloat(temp.GpsLng) !== 0) {
        if (_mt === 'GMap_CN') {
            tempPoint = gpsHelper.gps84_To_Gcj02(temp.GpsLat, temp.GpsLng);
        }
        if (_mt === 'BMap') {
            tempPoint = gpsHelper.gps84_To_Gcj02(temp.GpsLat, temp.GpsLng);
            tempPoint = gpsHelper.gcj02_To_Bd09(tempPoint.lat, tempPoint.lng);
        }
    }
    return tempPoint;
};
/**
 * 显示盘符数组
 * @param {*} callback
 */
var showLetter = function (callback) {
    exec('wmic logicaldisk get caption', function (err, stdout, stderr) {
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
};
var controller = {
    /**
     * 终端通道
     */
    deviceChannel: function (req, res) {
        var json = {
            code: 200,
            result: []
        };
        try {
            var vid = req.params.vid;
            var rid = res.locals.user.rid;
            db_vehicle.getItems(function (err, result) {
                if (err) {
                    logger.error(err);
                    json.code = 202;
                    res.send(json);
                } else {
                    db_roleauthority.getChannelPowerByRoleId(rid, function (err, result2) {
                        if (err) {
                            logger.error(err);
                            json.code = 202;
                            res.send(json);
                        } else {
                            var index = result.findIndex(i => i.id === parseInt(vid));
                            var item = result[index];
                            var channel = parseInt(item.channel);
                            var channelEnable =
                                item.channelenable === -1
                                    ? (Math.pow(2, channel) - 1).toString(2)
                                    : item.channelenable.toString(2); //通道使能切换
                            while (channelEnable.length < channel) {
                                channelEnable = '0' + channelEnable;
                            }
                            for (var j = 0; j < channel; j++) {
                                if (channelEnable.charAt(channelEnable.length - j - 1) === '0') {
                                    continue;
                                } //过滤通道使能没开启的
                                var index2 = result2.findIndex(n => n.vehicledeviceid === item.id && n.channel === j);
                                if (index2 > -1) {
                                    continue;
                                } //过滤非权限通道
                                var channelNameArray =
                                    item.channelname !== null && item.channelname.length > 0
                                        ? item.channelname.split(',')
                                        : [];
                                json.result.push({
                                    id: j,
                                    name:
                                        channelNameArray.length > 0
                                            ? channelNameArray[j].length > 0
                                                ? channelNameArray[j] + '[' + (j + 1) + ']'
                                                : '[' + (j + 1) + ']'
                                            : j + 1
                                });
                            }
                            res.send(json);
                        }
                    });
                }
            });
        } catch (err) {
            logger.error(err);
            json.code = 202;
            res.send(json);
        }
    },
    /**
     * 设备日历
     */
    deviceCalendar: function (req, res) {
        var json = {
            code: 200,
            result: []
        };
        try {
            var _deviceNo = req.query.deviceNo;
            var _startTime = req.query.startTime;
            var _streamType = req.query.streamType; //0:字码流  1:主码流
            var _user = res.locals.user;

            var requestBody = {
                key: commonFun.getWcms4Token(_user.uid, _user.rid),
                yearmonth: _startTime.split('-')[0] + '-' + _startTime.split('-')[1],
                streamtype: _streamType
            };

            request(
                {
                    url:
                        'http://' +
                        config.ceiba2ip +
                        ':' +
                        config.ceiba2HttpApiPort +
                        '/devicevideo/dates/' +
                        _deviceNo,
                    method: 'GET',
                    json: true,
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: requestBody
                },
                function (error, response, body) {
                    if (!error && response.statusCode == 200 && body.errorcode == 0) {
                        json.result = body.data && body.data.length > 0 ? body.data : [];
                    } else {
                        json.result = false;
                    }
                    res.send(json);
                }
            );
        } catch (err) {
            logger.error(err);
            json.code = 202;
            res.send(json);
        }
    },
    /**
     * 设备视频文件列表
     */
    deviceVideoList: function (req, res) {
        var json = {
            code: 200,
            result: []
        };
        try {
            var _deviceNo = req.query.deviceNo;
            var _startTime = req.query.startTime;
            var _channelStr = req.query.channel;
            var _channnelArray = _channelStr.split(',');
            var _streamType = req.query.streamType;
            var _user = res.locals.user;

            _channnelArray.forEach(function (element) {
                json.result.push({
                    channel: element,
                    filelist: []
                });
            }, this);

            var requestBody = {
                key: commonFun.getWcms4Token(_user.uid, _user.rid),
                starttime: _startTime + ' 00:00:00',
                endtime: _startTime + ' 23:59:59',
                chn: _channelStr, //通道编号
                filetype: 0,
                streamtype: _streamType
            };
            request(
                {
                    url:
                        'http://' +
                        config.ceiba2ip +
                        ':' +
                        config.ceiba2HttpApiPort +
                        '/devicevideo/filelist/' +
                        _deviceNo,
                    method: 'GET',
                    json: true,
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: requestBody
                },
                function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        if (body && body.data) {
                            while (body.data.length > 0) {
                                var data = body.data.shift();
                                for (var i = 0; i < json.result.length; i++) {
                                    if (data.chn == json.result[i].channel) {
                                        json.result[i].filelist.push({
                                            chn: data.chn,
                                            fileType: data.filetype,
                                            size: data.size,
                                            path: data.name,
                                            startTime: data.starttime,
                                            endTime: data.endtime
                                        });
                                    }
                                }
                            }
                        }
                    }
                    res.send(json);
                }
            );
        } catch (err) {
            logger.error(err);
            json.code = 202;
            res.send(json);
        }
    },
    /**
     * 服务器日历
     */
    serverCalendar: function (req, res) {
        var json = {
            code: 200,
            result: []
        };
        try {
            var _deviceNo = req.query.deviceNo;
            var _startTime = req.query.startTime;
            var _endTime = req.query.endTime;
            var _user = res.locals.user;

            var requestBody = {
                key: commonFun.getWcms4Token(_user.uid, _user.rid),
                starttime: _startTime,
                endtime: _endTime
            };

            request(
                {
                    url: 'http://' + config.ceiba2ip + ':' + config.ceiba2WebApiPort + '/video/dates/' + _deviceNo,
                    method: 'GET',
                    json: true,
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: requestBody
                },
                function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        json.result = body.data;
                    }
                    res.send(json);
                }
            );
        } catch (err) {
            logger.error(err);
            json.code = 202;
            res.send(json);
        }
    },
    /**
     * 服务器视频文件列表
     */
    serverVideoList: function (req, res) {
        var json = {
            code: 200,
            result: []
        };
        try {
            var _deviceNo = req.query.deviceNo;
            var _startTime = req.query.startTime;
            var _channelCount = parseInt(req.query.channelCount);
            var _user = res.locals.user;
            var _hadRequest = 0;
            for (var i = 1; i <= _channelCount; i++) {
                //多少个通道发送多少次
                json.result.push({
                    channel: i,
                    filelist: []
                });
            }
            for (var i = 1; i <= _channelCount; i++) {
                //多少个通道发送多少次
                var url = 'http://' + config.ceiba2ip + ':' + config.ceiba2WebApiPort + '/video/filelist/' + _deviceNo;
                var requestBody = {
                    key: commonFun.getWcms4Token(_user.uid, _user.rid),
                    starttime: _startTime + ' 00:00:00',
                    endtime: _startTime + ' 23:59:59',
                    chn: i, //通道编号
                    filetype: 0
                };
                customRequest(url, requestBody, _startTime, function (err, result) {
                    _hadRequest++;
                    if (!err) {
                        if (result.length > 0) {
                            var channel = result[0].chn;
                            for (var j = 0, l = json.result.length; j < l; j++) {
                                if (json.result[j].channel == channel) {
                                    json.result[j].filelist = result;
                                }
                            }
                        }
                    }
                    if (_hadRequest == _channelCount) {
                        res.send(json);
                    }
                });
            }
            //async 的顺序流
            // async.series(funcArray, function(err, result) {
            //     if (!err) {
            //         for (var i = 0; i < result.length; i++) {
            //             json.result.push({
            //                 "channel": i + 1,
            //                 "filelist": result[i]
            //             });
            //         }
            //     } else {
            //         logger.error(err);
            //         code = 202;
            //     }
            //     res.send(json);
            // });
        } catch (err) {
            logger.error(err);
            json.code = 202;
            res.send(json);
        }
    },
    /**
     * 获取gps
     */
    gps: function (req, res) {
        var json = {
            code: 200,
            result: {
                count: 0,
                items: []
            }
        };
        try {
            var _deviceNo = req.query.deviceNo;
            var _startTime = req.query.startTime + ' 00:00:00';
            var _endTime = req.query.startTime + ' 23:59:59';
            var _cookieName = commonFun.getConfigCookierName();
            var _mt = JSON.parse(req.cookies[_cookieName]).MT;
            var _guid = req.query.guid;
            var _rows = parseInt(req.query.rows);
            var _page = parseInt(req.query.page);

            var _fileResult = reportComFun.getJsonFromFile(_guid, _rows, _page);
            if (_fileResult.items.length != 0) {
                json.result = _fileResult;
                res.send(json);
            } else {
                request(
                    {
                        uri:
                            'http://' +
                            config.ceiba2ip +
                            ':' +
                            config.ceiba2WebApiPort +
                            '/gps/' +
                            _deviceNo +
                            '/' +
                            _startTime +
                            '/' +
                            _endTime,
                        method: 'GET',
                        json: true,
                        headers: {
                            'content-type': 'application/json'
                        }
                    },
                    function (error, response, body) {
                        var result = [];
                        if (!error && response.statusCode == 200) {
                            for (var i = 0, l = body.length; i < l; i++) {
                                var temp = body[i];
                                if (temp.GpsLat === 0 && temp.GpsLng === 0) continue; //过滤异常点
                                var tempPoint = convertPoint(_mt, temp);
                                result.push({
                                    d: temp.Direction,
                                    lt: tempPoint.lat.toFixed(6),
                                    lg: tempPoint.lng.toFixed(6),
                                    s: temp.Speed,
                                    t: temp.GpsTime
                                });
                            }
                        }
                        if (result.length >= _rows) {
                            for (var i = (_page - 1) * _rows; i < _page * _rows && i < result.length; i++) {
                                json.result.items.push(result[i]);
                            }
                            reportComFun.saveJsonToFile(_guid, result);
                        } else {
                            json.result.items = result;
                        }
                        json.result.count = result.length;

                        res.send(json);
                    }
                );
            }
        } catch (err) {
            logger.error(err);
            json.code = 202;
            res.send(json);
        }
    },
    /**
     * 获取报警
     */
    alarm: function (req, res) {
        var json = {
            code: 200,
            result: {
                count: 0,
                items: []
            }
        };
        try {
            var _deviceNo = req.query.deviceNo;
            var _startTime = req.query.startTime + ' 00:00:00';
            var _endTime = req.query.startTime + ' 23:59:59';
            var _user = res.locals.user;
            var _guid = req.query.guid;
            var _rows = parseInt(req.query.rows);
            var _page = parseInt(req.query.page);
            var _cookieName = commonFun.getConfigCookierName();
            var _mt = JSON.parse(req.cookies[_cookieName]).MT;

            var _fileResult = reportComFun.getJsonFromFile(_guid, _rows, _page);
            if (_fileResult.items.length != 0) {
                json.result = _fileResult;
                res.send(json);
            } else {
                var requestBody = {
                    alarmtype: '*',
                    terminals: _deviceNo,
                    starttime: _startTime,
                    endtime: _endTime,
                    key: commonFun.getWcms4Token(_user.uid, _user.rid)
                };
                request(
                    {
                        uri: 'http://' + config.ceiba2ip + ':' + config.ceiba2WebApiPort + '/alarm/details',
                        method: 'POST',
                        json: true,
                        headers: {
                            'content-type': 'application/json'
                        },
                        body: requestBody
                    },
                    function (error, response, body) {
                        var result = [];
                        if (!error && response.statusCode == 200) {
                            for (var i = 0, l = body.data.length; i < l; i++) {
                                var temp = body.data[i];
                                var tempPoint = convertPoint(_mt, temp);
                                result.push({
                                    d: temp.Direction,
                                    lt: tempPoint.lat.toFixed(6),
                                    lg: tempPoint.lng.toFixed(6),
                                    s: temp.Speed,
                                    at: temp.AlarmType,
                                    a: temp.Alarm,
                                    t: temp.GpsTime
                                });
                            }
                        }
                        if (result.length >= _rows) {
                            for (var i = (_page - 1) * _rows; i < _page * _rows && i < result.length; i++) {
                                json.result.items.push(result[i]);
                            }
                            reportComFun.saveJsonToFile(_guid, result);
                        } else {
                            json.result.items = result;
                        }
                        json.result.count = result.length;

                        res.send(json);
                    }
                );
            }
        } catch (err) {
            logger.error(err);
            json.code = 202;
            res.send(json);
        }
    },
    /**
     * 添加任务
     */
    addTask: function (req, res) {
        var json = {
            code: 200,
            result: -1
        };
        try {
            var _deviceNo = req.query.deviceNo;
            var _date = req.query.date;
            var _startTime = req.query.startTime;
            var _endTime = req.query.endTime;
            var _channel = req.query.channel.split(',');
            //var _fileType = req.query.fileType;  //默认就用mp4不支持264的选择了
            var _netmode = parseInt('0111', 2);
            var _period = 0;
            var _taskType = 1;
            var _taskName = req.query.taskName; // + "." + _fileType;
            var _user = res.locals.user;

            var form = {
                action: 'add',
                par: {
                    TaskName: _taskName,
                    Device: _deviceNo,
                    StartTime: _startTime,
                    EndTime: _endTime,
                    StartExecute: _date,
                    EndExecute: _date,
                    NetMode: _netmode,
                    TaskPeriod: [],
                    Period: _period, //TODO
                    TaskType: _taskType,
                    TaskChannel: _channel,
                    UserName: _user.un,
                    TaskIO: [],
                    TaskEvent: []
                }
            };
            var formJson = {
                json: JSON.stringify(form)
            };
            request(
                {
                    url:
                        'http://' +
                        config.ceiba2ip +
                        ':' +
                        config.ceiba2WebPort +
                        '/Plugin/AutoDownload/ClientApi/Task/Default.aspx',
                    method: 'POST',
                    json: true,
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded'
                    },
                    body: formJson
                },
                function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        json.result = body.data;
                    }
                    res.send(json);
                }
            );
        } catch (err) {
            logger.error(err);
            json.code = 202;
            res.send(json);
        }
    },
    /**
     * 获取任务状态
     */
    taskState: function (req, res) {
        var json = {
            code: 200,
            result: []
        };
        try {
            var _taskidStr = req.query.taskid;
            var _dateStr = req.query.date;

            var taskIdArray = _taskidStr.split(',');
            var dateArray = _dateStr.split(',');
            var _hadRequest = 0;
            for (var i = 0, l = taskIdArray.length; i < l; i++) {
                var _taskid = taskIdArray[i];
                var _date = dateArray[i];
                var form = {
                    action: 'getstatus',
                    par: {
                        TaskID: _taskid,
                        Day: _date
                    }
                };
                var formJson = {
                    json: JSON.stringify(form)
                };
                request(
                    {
                        url:
                            'http://' +
                            config.ceiba2ip +
                            ':' +
                            config.ceiba2WebPort +
                            '/Plugin/AutoDownload/ClientApi/DetailTask/Default.aspx',
                        method: 'POST',
                        json: true,
                        headers: {
                            'content-type': 'application/x-www-form-urlencoded'
                        },
                        body: formJson
                    },
                    function (error, response, body) {
                        _hadRequest++;
                        if (!error && response.statusCode == 200) {
                            if (body.data) {
                                json.result.push({
                                    state: body.data.Status,
                                    percent: body.data.Percent,
                                    taskId: body.data.TaskID
                                });
                            }
                        }
                        if (_hadRequest == taskIdArray.length) {
                            res.send(json);
                        }
                    }
                );
            }
        } catch (err) {
            logger.error(err);
            json.code = 202;
            res.send(json);
        }
    },
    /**
     * 删除任务
     */
    deleteTask: function (req, res) {
        var json = {
            code: 200,
            result: false
        };
        try {
            var _taskid = req.query.taskid;

            var form = {
                action: 'delete',
                par: {
                    TaskID: _taskid
                }
            };
            var formJson = {
                json: JSON.stringify(form)
            };
            request(
                {
                    url:
                        'http://' +
                        config.ceiba2ip +
                        ':' +
                        config.ceiba2WebPort +
                        '/Plugin/AutoDownload/ClientApi/Task/Default.aspx',
                    method: 'POST',
                    json: true,
                    headers: {
                        'content-type': 'application/x-www-form-urlencoded'
                    },
                    body: formJson
                },
                function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        json.result = body.data;
                    }
                    res.send(json);
                }
            );
        } catch (err) {
            logger.error(err);
            json.code = 202;
            res.send(json);
        }
    },
    /**
     * 获取任务
     */
    getTask: function (req, res) {
        var json = {
            code: 200,
            result: []
        };
        try {
            var _userName = req.query.userName;
            if (!_userName) {
                json.code = 201;
                res.send(json);
            } else {
                db_ads.getTaskByUserName(_userName, function (err, result) {
                    if (!err) {
                        while (result.length > 0) {
                            var temp = result.shift();
                            json.result.push({
                                taskId: temp.TaskID,
                                carlicense: temp.carlicence,
                                deviceNo: temp.Device,
                                fileType: 2, //默认就是mp4
                                taskName: temp.TaskName,
                                day: temp.StartExecute
                            });
                        }
                    } else {
                        json.code = 202;
                        logger.error(err);
                    }
                    res.send(json);
                });
            }
        } catch (err) {
            json.code = 202;
            logger.error(err);
            res.send(json);
        }
    },
    /**
     * 获取下载文件列表
     */
    taskFileList: function (req, res) {
        var json = {
            code: 200,
            result: []
        };
        try {
            var _taskid = req.query.taskid;
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
                        var dir = '\\' + task.carlicence + '\\' + task.StartExecute + '\\record\\' + task.TaskID;
                        for (var i = 0, l = pathArray.length; i < l; i++) {
                            var path = pathArray[i].disk + '\\' + config.SaveDir;
                            var abPath = path + dir;
                            //if (pathArray[i].used == 1) {  //默认检索所有目录，直到找到为止
                            if (fs.existsSync(abPath)) {
                                var files = fs.readdirSync(abPath);
                                while (files.length > 0) {
                                    var file = files.shift();
                                    var newFileName = file.replace('0000000000000000-', task.carlicence + '-'); //更新文件名
                                    fs.renameSync(abPath + '\\' + file, abPath + '\\' + newFileName);
                                    json.result.push({
                                        name: newFileName,
                                        dir: commonFun.string2base64(abPath)
                                    });
                                }
                                break;
                            }
                            //}
                        }
                    }
                    res.send(json);
                }
            );
        } catch (err) {
            logger.error(err);
            json.code = 202;
            res.send(json);
        }
    }
};
module.exports = controller;
