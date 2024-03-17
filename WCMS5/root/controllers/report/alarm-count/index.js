var config = require('../../../config/app.json');
var logger = require('../../../tools/log4jsHelper.js').appLog();
var dataAndnodexlsx = require('../../../tools/dataAndnodexlsx.js');
var commonFunction = require('../commonFunction/index.js');
var db_vehicle = require('../../../db' + config.dbType + '/ceiba2/vehicle/index.js');
var moment = require('moment');
var request = require('../../../tools/lavaRequest.js');
var requestP = require('../../../tools/lavaRequest.js').RequestP;
var errorcodemap = require('../../../tools/errorcodemap.js');
var toolCommonFun = require('../../../tools/commonfun.js');
const path = require('path');
var tool_method = {
    /**
     * 将从CEIBA2服务器上获取的报警次数数据转化为前端报警类型统计表需要的格式
     */
    transformTypeData: function (ApiInfoArr, alarmType, BaseInfo) {
        var _items = [];

        for (var i = 0; i < BaseInfo.length; i++) {
            var alarmTimes = 0;
            for (var j = 0; j < ApiInfoArr.length; j++) {
                if (BaseInfo[i].deviceno == ApiInfoArr[j].terid) {
                    alarmTimes += ApiInfoArr[j].count;
                }
            }
            if (alarmTimes != 0) {
                _items.push({
                    groupName: BaseInfo[i].name,
                    vehicleLicense: BaseInfo[i].carlicense,
                    plateColor: BaseInfo[i].platecolor,
                    deviceNo: BaseInfo[i].deviceno,
                    alarmType: alarmType,
                    alarmTimes: alarmTimes,
                    vehicleid: BaseInfo[i].id
                });
            }
        }
        return _items;
    },
    /**
     * 将从CEIBA2服务器上获取的报警信息数据转化为前端报警信息表需要的格式
     */
    transformInfoData: function (ApiInfoArr, BaseInfo) {
        var _items = [];
        if (ApiInfoArr) {
            for (var i = 0; i < ApiInfoArr.length; i++) {
                for (var j = 0; j < BaseInfo.length; j++) {
                    if (ApiInfoArr[i].TerminalID == BaseInfo[j].deviceno) {
                        _items.push({
                            groupName: BaseInfo[j].name,
                            carlicense: BaseInfo[j].carlicense,
                            plateColor: BaseInfo[j].platecolor,
                            deviceNo: BaseInfo[j].deviceno,
                            alarmType: ApiInfoArr[i].AlarmType,
                            alarmContent: ApiInfoArr[i].Alarm,
                            gpsTime: ApiInfoArr[i].GpsTime,
                            direction: ApiInfoArr[i].Direction,
                            lat: ApiInfoArr[i].GpsLat.toFixed(6),
                            lng: ApiInfoArr[i].GpsLng.toFixed(6),
                            //下面三个字段在kapok版本中使用
                            dealUser: ApiInfoArr[i].du,
                            dealMessage: ApiInfoArr[i].dm,
                            dealTime: ApiInfoArr[i].dt,
                            //251:支持删除报警数据
                            alarmid: ApiInfoArr[i].alarmid,
                            vehicleid: BaseInfo[j].id,
                            speed: ApiInfoArr[i].Speed
                        });
                        break;
                    }
                }
            }
        }
        return _items;
    },
    /**
     * 翻译导出数据的字段
     */
    translateExportData: function (array, lang, type, langType) {
        for (var i = 0; i < array.length; i++) {
            //根据不同的表翻译不同的字段（type是表的名称）
            if (array[i].length === 0) {
                continue;
            }
            if (type == 'alarmTypeCount') {
                array[i].splice(array[i].length - 1, 1);
                array[i][2] = lang['lang[platecolor_' + array[i][2] + ']'];
                if (array[i][4] == -1) {
                    array[i][4] = lang['lang[allAlarm]'];
                } else {
                    array[i][4] = lang['lang[malarm_' + array[i][4] + ']'];
                }
            } else if (type == 'alarmInfoQuery') {
                array[i].splice(array[i].length - 3, 3);
                array[i][2] = lang['lang[platecolor_' + array[i][2] + ']'];
                array[i][4] = lang['lang[malarm_' + array[i][4] + ']'];
                array[i][7] = commonFunction.formatDirection(array[i][7], lang);
            }

            if (langType !== 'zh-CN') {
                array[i].splice(2, 1);
            }
        }
        return array;
    },
    /**
     * 统计出时间
     */
    getAlarmInfoTotal: function (array) {
        var total = 0;
        array.map(i => {
            var a = i;
            total += i.count;
        });
        return total;
    },
    /**
     * 查询报警信息表数据
     */
    getAlarmInfo: function (param) {
        let promise = new Promise(function (resolve, reject) {
            let idsArray = commonFunction.formatIdsFromStrToArray(param.vehicleIds);
            db_vehicle.getItemsByVehicleId(idsArray, async function (err, result) {
                if (!err) {
                    let devicenos = [];
                    for (let i = 0; i < result.length; i++) {
                        devicenos.push(result[i].deviceno);
                    }
                    let terminals = devicenos.join(',');
                    let requestBody = {
                        terminals: terminals,
                        alarmtype: param.alarmType == -1 ? '*' : param.alarmType,
                        starttime: param.startTime + ' 00:00:00',
                        endtime: param.endTime + ' 23:59:59',
                        page: parseInt(param.page) ? parseInt(param.page) : 1,
                        count: parseInt(param.rows) > 100000 ? 100000 : parseInt(param.rows)
                    };
                    let listData = await requestP({
                        uri: 'http://' + config.ceiba2ip + ':' + config.ceiba2HttpApiPort + '/alarm/details',
                        method: 'post',
                        json: true,
                        headers: {
                            'content-type': 'application/json'
                        },
                        body: requestBody
                    });
                    var resultArray = tool_method.transformInfoData(listData.data, result);
                    resolve(resultArray);
                } else {
                    reject(err);
                }
            });
        });
        return promise;
    },
    /**
     * 将JSON数组转化为值的二维数组
     * @example [{'name':'zhangsan','age':'18'},{'name':'lisi','age':'20'}]   ----->  [['zhangsan','18'],['lisi','20']]
     * @param jsonArray JSON数组
     * @returns arr 值的二维数组
     */
    getDataArrayFromJsonArray: function (jsonArray) {
        var arr = [];
        for (var o of jsonArray) {
            var temp = [];
            for (var i in o) {
                if (o[i] instanceof Array) {
                    for (var j of o[i]) {
                        temp.push(j);
                    }
                } else {
                    temp.push(o[i]);
                }
            }
            arr.push(temp);
        }
        return arr;
    }
};

var alarmController = {
    /**
     * 获取报警次数趋势图数据
     */
    getAlarmChart: function (req, res) {
        var json = {
            code: 200,
            result: {}
        };
        try {
            var idsArray = commonFunction.formatIdsFromStrToArray(req.body.vehicleIds);
            db_vehicle.getItemsByVehicleId(idsArray, function (err, result) {
                if (!err) {
                    var devicenos = [];
                    for (var i = 0; i < result.length; i++) {
                        devicenos.push(result[i].deviceno);
                    }
                    var terminals = devicenos.join(',');

                    var requestBody = {
                        terminals: terminals,
                        type: req.body.alarmType,
                        starttime: req.body.startTime + ' 00:00:00',
                        endtime: req.body.endTime + ' 23:59:59'
                    };

                    request(
                        {
                            url: 'http://' + config.ceiba2ip + ':' + config.ceiba2HttpApiPort + '/alarm/outlines',
                            method: 'POST',
                            json: true,
                            headers: {
                                'content-type': 'application/json'
                            },
                            body: requestBody
                        },
                        function (error, response, body) {
                            try {
                                if (!error && response.statusCode == 200) {
                                    var _resultArr = alarmController.transformChartData(
                                        body.data,
                                        req.body.startTime,
                                        req.body.endTime
                                    );

                                    json.result = _resultArr;
                                } else {
                                    logger.error(error);
                                    json.code = 202;
                                }
                                res.send(json);
                            } catch (err) {
                                logger.error(err);
                                json.code = 202;
                                res.send(json);
                            }
                        }
                    );
                } else {
                    json.code = 202;
                    res.send(json);
                }
            });
        } catch (err) {
            logger.error(err);
            json.code = 202;
            res.send(json);
        }
    },
    /**
     * 获取报警类型统计表数据
     */
    getAlarmTypeCount: function (req, res) {
        var json = {
            code: 200,
            result: {
                items: [],
                count: 0
            }
        };
        var guid = req.body.guid;
        var rows = req.body.rows;
        var page = req.body.page;
        //如果存在guid,则说明是新的查询
        if (req.body.guid) {
            try {
                var _fileResult = commonFunction.getJsonFromFile(guid, rows, page);
                if (_fileResult.items.length != 0) {
                    json.result = _fileResult;
                    res.send(json);
                } else {
                    //将请求参数中的id转化为查询数据库需要的id数组
                    var idsArray = commonFunction.formatIdsFromStrToArray(req.body.vehicleIds);
                    //根据id数组查询基本信息
                    db_vehicle.getItemsByVehicleId(idsArray, function (err, result) {
                        if (!err) {
                            //把从数据库中获取的设备型号拼接成访问接口需要的格式（字符串类型，多个设备型号用逗号隔开）
                            var devicenos = [];
                            for (var i = 0; i < result.length; i++) {
                                devicenos.push(result[i].deviceno);
                            }
                            var terminals = devicenos.join(',');
                            //构建访问接口的请求体
                            var requestBody = {
                                terminals: terminals,
                                type: req.body.alarmType,
                                starttime: req.body.startTime + ' 00:00:00',
                                endtime: req.body.endTime + ' 23:59:59'
                            };
                            //发起http请求，访问ceiba2webAPI
                            request(
                                {
                                    url:
                                        'http://' +
                                        config.ceiba2ip +
                                        ':' +
                                        config.ceiba2HttpApiPort +
                                        '/alarm/outlines',
                                    method: 'POST',
                                    json: true,
                                    headers: {
                                        'content-type': 'application/json'
                                    },
                                    body: requestBody
                                },
                                function (error, response, body) {
                                    try {
                                        //如果请求成功
                                        if (!error && response.statusCode == 200) {
                                            var resultArray = [];
                                            //把从数据库查到的数据和从接口查到的数据组合成前端需要的格式
                                            if (body.data) {
                                                resultArray = tool_method.transformTypeData(
                                                    body.data,
                                                    req.body.alarmType,
                                                    result
                                                );
                                            }
                                            //查询有数据的时候，根据数据的长度做出相应操作
                                            if (resultArray.length != 0) {
                                                //将结果存为文件(缓存分页和导出时需要用到该文件)
                                                commonFunction.saveJsonToFile(guid, resultArray);
                                                //如果json数据的长度大于表格每页数据最大行数，则按照分页条件进行截取
                                                if (resultArray.length > rows) {
                                                    for (
                                                        var i = (page - 1) * rows;
                                                        i < page * rows && i < resultArray.length;
                                                        i++
                                                    ) {
                                                        json.result.items.push(resultArray[i]);
                                                    }
                                                } else {
                                                    json.result.items = resultArray;
                                                }
                                                json.result.count = resultArray.length;
                                            }
                                        } else {
                                            logger.error(error);
                                            json.code = 202;
                                        }
                                        res.send(json);
                                    } catch (err) {
                                        logger.error(err);
                                        json.code = 202;
                                        res.send(json);
                                    }
                                }
                            );
                        } else {
                            json.code = 202;
                            res.send(json);
                        }
                    });
                }
            } catch (err) {
                logger.error(err);
                json.code = 202;
                res.send(json);
            }
        } else {
            res.send(json);
        }
    },
    /**
     * 获取报警信息表数据总条数
     */
    getAlarmInfoCount: function (req, res) {
        let json = {
            code: 200,
            result: {
                count: []
            }
        };
        let guid = req.body.guid;
        if (guid) {
            try {
                let idsArray = commonFunction.formatIdsFromStrToArray(req.body.vehicleIds);
                db_vehicle.getItemsByVehicleId(idsArray, async function (err, result) {
                    if (!err) {
                        let devicenos = [];
                        for (let i = 0; i < result.length; i++) {
                            devicenos.push(result[i].deviceno);
                        }
                        let terminals = devicenos.join(',');
                        let requestBody = {
                            terminals: terminals,
                            type: req.body.alarmType,
                            starttime: req.body.startTime + ' 00:00:00',
                            endtime: req.body.endTime + ' 23:59:59'
                        };
                        let listData = await requestP({
                            uri: 'http://' + config.ceiba2ip + ':' + config.ceiba2HttpApiPort + '/alarm/outlines',
                            method: 'post',
                            json: true,
                            headers: {
                                'content-type': 'application/json'
                            },
                            body: requestBody
                        });
                        if (listData.errorcode == 0) {
                            let total = tool_method.getAlarmInfoTotal(listData.data);
                            json.result.count = total;
                            res.send(json);
                        } else {
                            throw new Error(`httpsdk request errorcode  != 0, errorcode = ${listData.errorcode}`);
                        }
                    } else {
                        json.code = 202;
                        res.send(json);
                    }
                });
            } catch (err) {
                logger.error(err);
                json.code = 202;
                res.send(json);
            }
        } else {
            res.send(json);
        }
    },
    /**
     * 获取报警信息表数据
     */
    getAlarmInfo: function (req, res) {
        let json = {
            code: 200,
            result: {
                items: []
            }
        };
        let guid = req.body.guid;
        if (guid) {
            try {
                tool_method
                    .getAlarmInfo(req.body)
                    .then(r => {
                        json.result.items = r;
                        res.send(json);
                    })
                    .catch(err => {
                        logger.error(err);
                        json.code = 202;
                        res.send(json);
                    });
            } catch (err) {
                logger.error(err);
                json.code = 202;
                res.send(json);
            }
        } else {
            res.send(json);
        }
    },
    /**
     * 导出
     */
    export: function (req, res) {
        var json = {
            code: 200,
            result: false
        };
        try {
            var guid = req.body.guid;
            var type = req.body.type;
            var langType = req.body.langType;
            // 报警明细导出
            if (req.body.requirement != undefined) {
                var _requirement = JSON.parse(req.body.requirement);
                if (guid && guid != 0) {
                    //获取列名
                    var columnNameArry = req.body.columnName.split(',');
                    //条件查询数据
                    tool_method
                        .getAlarmInfo(_requirement)
                        .then(r => {
                            // 这里限制20万，防止导出数据量过大致使服务占用内存过高
                            var dataArray = tool_method.getDataArrayFromJsonArray(r);
                            //获取文件名
                            var fileName = req.body.fileName;
                            //语言包
                            var lang = commonFunction.getLang(req.body);
                            //根据语言包翻译要导出的数据
                            var finalDataArray = tool_method.translateExportData(dataArray, lang, type, langType);

                            if (finalDataArray.length != 0) {
                                json.result = dataAndnodexlsx.data2xlsx(columnNameArry, finalDataArray, fileName);
                            }
                            res.send(json);
                            let temPath = path.join(toolCommonFun.getDownloadDir(), 'xlsx');
                            toolCommonFun.cleanTempFiles(temPath).catch(err => {
                                logger.error(err);
                            });
                        })
                        .catch(err => {
                            logger.error(err);
                            json.code = 202;
                            res.send(json);
                        });
                } else {
                    res.send(json);
                }
            } else {
                // 报警类型导出
                if (guid && guid != 0) {
                    //获取列名
                    var columnNameArry = req.body.columnName.split(',');
                    //从文件获取表格数据二维数组
                    var dataArray = commonFunction.getDataArrayFromFile(guid);
                    //获取文件名
                    var fileName = req.body.fileName;
                    //语言包
                    var lang = commonFunction.getLang(req.body);
                    //根据语言包翻译要导出的数据
                    var finalDataArray = tool_method.translateExportData(dataArray, lang, type, langType);

                    if (finalDataArray.length != 0) {
                        //获取相对路径/xlsx/guid/filename.xlsx
                        json.result = dataAndnodexlsx.data2xlsx(columnNameArry, finalDataArray, fileName);
                    }
                }
                res.send(json);
                let temPath = path.join(toolCommonFun.getDownloadDir(), 'xlsx');
                toolCommonFun.cleanTempFiles(temPath).catch(err => {
                    logger.error(err);
                });
            }
        } catch (err) {
            logger.error(err);
            json.code = 202;
            res.send(json);
        }
    },
    /**
     * 删除报警数据
     */
    deleteAlarmInfo: function (req, res) {
        let json = {
            code: 200,
            result: true
        };
        let ids = req.body.ids;
        if (ids) {
            let requestBody = {
                alarmids: ids.split(',')
            };
            requestP({
                uri: 'http://' + config.ceiba2ip + ':' + config.ceiba2HttpApiPort + '/alarm/detail/delete',
                method: 'POST',
                json: true,
                headers: {
                    'content-type': 'application/json'
                },
                body: requestBody
            })
                .then(result => {
                    if (result.errorcode != 0) {
                        json.code = errorcodemap.httpError(result.errorcode);
                        json.result = false;
                    }
                    res.send(json);
                })
                .catch(err => {
                    logger.error(err);
                    json.code = 202;
                    json.result = false;
                    res.send(json);
                });
        } else {
            json.code = 201;
            json.result = false;
            res.send(json);
        }
    },

    /**
     * 注意：（不要进行路由映射，放在这里是为了供报表看板复用代码）
     * 将从CEIBA2服务器上获取的报警次数数据转化为前端chart需要的格式
     */
    transformChartData: function (ApiInfoArr, startTime, endTime) {
        var days = commonFunction.getDateDifference(startTime, endTime);
        var result = {
            date: [],
            value: []
        };
        var date1 = [];
        for (var i = days - 1; i >= 0; i--) {
            result.date.push(moment(endTime, 'YYYY-MM-DD').subtract(i, 'days').format('YYYY-MM-DD'));
            date1.push(moment(endTime, 'YYYY-MM-DD').subtract(i, 'days').format('YYYY-M-D'));
            result.value.push(0);
        }
        if (ApiInfoArr) {
            for (var i = 0; i < ApiInfoArr.length; i++) {
                for (var j = 0; j < result.date.length; j++) {
                    if (ApiInfoArr[i].day == result.date[j] || ApiInfoArr[i].day == date1[j]) {
                        result.value[j] += ApiInfoArr[i].count;
                        break;
                    }
                }
            }
            for (var i = 0; i < result.value.length; i++) {
                result.value[i] = Math.round(result.value[i]);
            }
        }
        return result;
    }
};
module.exports = alarmController;
