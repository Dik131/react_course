var alarmcount = {
    $alarmType: $('#select_alarm_type'),
    $tabListAlarmType: $('#tab_list_alarmType'),
    $tabListAlarmInfo: $('#tab_list_alarmInfo'),
    $tabAlarmType: $('#tb_alarm_type'),
    $tabAlarmInfo: $('#tb_alarm_info'),
    $tabChart: $('#tab_chart'),
    $search: $('#search'),
    $groupTree: $('#groupTree'),
    $close: $('#a_close'),
    $divTree: $('#div_tree'),
    $open: $('#div_open'),
    $content: $('#div_content'),
    $dateRange: $('#div_daterange'),
    $inputDate: $('#div_daterange input'),
    $export: $('#export'),
    $print: $('#print'),
    $delete: $('#delete'),
    $alarmCharts: '', //获取echart图的id
    tab_index: 0,
    _click: 0, //查询判断位，初始化为0，当点击查询时，值为1或2
    _GUID1: '0', //记录点击查询时当前的guid
    _GUID2: '0',
    alarmInfoTotal: 0, //报警信息总条数
    lang: appCommon.getCookie(appConfig.CONFIGCOOKIENAME, 'L'),
    mk: appCommon.getCookie(appConfig.CONFIGCOOKIENAME, 'MK'),
    DSM_alarmid: [], //DSM报警类型

    init: function init() {
        this.initDSMAlarmId();
        this.dateRange.init();
        this.zTree.init();
        this.page.init();
        //this.Map.init();
        this.tb_alarm_type.init();
        this.tb_alarm_info.init();
        this.eCharts.init();
        this.vehicleGroupFileter.init();
    },
    //初始获取主动安全相关（dsm）报警id
    initDSMAlarmId: function initDSMAlarmId() {
        var that = this;
        var url = '/common/dsmalarmid?guid=' + new Date().getTime();
        appCommon.ajax(url, 'get', 'json', {}, function (res) {
            var dsmIdArr = [];
            if (res.code == 200) {
                dsmIdArr = res.result;
            }
            that.DSM_alarmid = dsmIdArr;
        });
    },
    Map: {
        gmap: null,
        map: null,
        icon: null,
        cdType: '', //纠偏类型
        init: function init(callback) {
            var that = this;
            //初始化地图
            //读取cookie里地图类型
            var mt = appCommon.getCookie(appConfig.CONFIGCOOKIENAME, 'MT');
            /**
             * @author ququ
             * @content 纠偏类型
             */
            switch (mt) {
                case 'BMap':
                    that.cdType = '9';
                    break;
                case 'GMap_CN':
                    that.cdType = '2';
                    break;
                default:
                    that.cdType = '0';
                    break;
            }
            /**
             * end
             */
            var xxx = new Map_Config(mt, alarmcount.mk, function () {
                try {
                    if (alarmcount.Map.gmap) return;
                    alarmcount.Map.map = new CqrmMap('map');
                    alarmcount.Map.gmap = alarmcount.Map.map.Map();
                    if (callback) {
                        callback();
                    }
                } catch (e) {
                    if (console.log) console.log(e);
                }
            });
        },
        analysisLocation: function analysisLocation(lat, lng) {
            var that = this;
            $('#map_info').html('');
            $('#modal').modal('show');
            var interval = setInterval(function () {
                if ($('#modal').is(':visible')) {
                    clearInterval(interval);
                    //第一次查看地图时，进行初始化
                    if (!that.gmap) {
                        that.init(function () {
                            that.analysisLocation(lat, lng);
                        });
                    } else {
                        //地图解析
                        var info;
                        /**
                         * @author ququ
                         * @content 对点进行纠偏
                         */
                        if (that.cdType == '9') {
                            var latLng02 = window.mapCommon.gps84_To_Gcj02(lat, lng);
                            var latLng = window.mapCommon.gcj02_To_Bd09(latLng02.lat, latLng02.lng);
                            lat = latLng.lat;
                            lng = latLng.lng;
                        } else if (that.cdType == '2') {
                            var latLng = window.mapCommon.gps84_To_Gcj02(lat, lng);
                            lat = latLng.lat;
                            lng = latLng.lng;
                        }
                        /**
                         * end
                         */
                        alarmcount.Map.gmap.getPosition(lat, lng, function (data) {
                            info = data;
                            $('#map_info').html(data);
                        });
                        alarmcount.Map.gmap.setZoom(14);
                        alarmcount.Map.gmap.setCenter(lat, lng);
                        //icon指示
                        var latlng = lat + ',' + lng;
                        //第一次调用地图解析时，初始化icon
                        if (alarmcount.Map.icon == null) {
                            alarmcount.Map.icon = alarmcount.Map.map.Icon();
                        }
                        //下载icon图标之前清楚之前的icon
                        alarmcount.Map.icon.clear();
                        alarmcount.Map.icon.loadIcon('id', latlng, '../../images/map/flash.gif', function () {}, null, '35,35');
                    }
                }
            }, 10);
        }
    },
    action: function action() {
        alarmcount.$tabChart.on('click', function () {
            $('#div_more,#delete').addClass('hide');
            //当切换回图的tab页面时，调整大小，设置延时，避免与插件中的方法冲突
            setTimeout(function () {
                alarmcount.$alarmCharts.resize();
            }, 1);
            alarmcount.tab_index = 0;
        });
        //table切换的时候resize表格大小
        alarmcount.$tabListAlarmType.on('click', function () {
            $('#div_more').removeClass('hide');
            $('#delete').addClass('hide');
            //设置一个延时，防止出现包裹表格的外框还没绘制完毕就开始绘制表格，导致表格溢出外框的范围
            setTimeout(function () {
                alarmcount.$tabAlarmType.table('resize');
            }, 10);
            alarmcount.tab_index = 1;
        });
        //table切换的时候resize表格大小
        alarmcount.$tabListAlarmInfo.on('click', function () {
            $('#div_more,#delete').removeClass('hide');
            //设置一个延时，防止出现包裹表格的外框还没绘制完毕就开始绘制表格，导致表格溢出外框的范围
            setTimeout(function () {
                alarmcount.$tabAlarmInfo.table('resize');
            }, 10);
            alarmcount.tab_index = 2;
        });

        alarmcount.$close.on('click', function (e) {
            alarmcount.$content.removeClass('col-lg-9').addClass('col-lg-12');
            alarmcount.$content.removeClass('col-md-8').addClass('col-md-12');
            alarmcount.$content.removeClass('col-sm-8').addClass('col-sm-12');
            alarmcount.$divTree.css({ position: 'absolute', left: 0, zIndex: 100 }).animate({ left: -alarmcount.$divTree.width() - 20 }, 500, function () {
                alarmcount.$divTree.hide();
                alarmcount.$open.show();
            });
            //关闭树形菜单的时候重置表格大小
            alarmcount.$tabAlarmType.table('resize');
            alarmcount.$tabAlarmInfo.table('resize');
            //关闭树形菜单时，调整图大小，设置延时，避免与插件中的方法冲突
            setTimeout(function () {
                alarmcount.$alarmCharts.resize();
            }, 1);
        });
        alarmcount.$open.on('click', function (e) {
            alarmcount.$open.hide();
            alarmcount.$divTree.show().animate({ left: 0 }, 500, function () {
                alarmcount.$divTree.css({ position: 'relative' });
                alarmcount.$content.removeClass('col-lg-12').addClass('col-lg-9');
                alarmcount.$content.removeClass('col-md-12').addClass('col-md-8');
                alarmcount.$content.removeClass('col-sm-12').addClass('col-sm-8');
                //打开树形菜单的时候重置表格大小
                alarmcount.$tabAlarmType.table('resize');
                alarmcount.$tabAlarmInfo.table('resize');
                //打开树形菜单时，调整图大小，设置延时，避免与插件中的方法冲突
                setTimeout(function () {
                    alarmcount.$alarmCharts.resize();
                }, 1);
            });
        });
    },
    page: {
        init: function init() {
            $('.select2').select2();
            var optionArray = [];
            optionArray.push("<option value='-1'>" + lang.allAlarm + '</option>');
            var alarmTypeArray = appCommon.getAlarmTypeArray();
            for (var i = 0; i < alarmTypeArray.length; i++) {
                if (lang['malarm_' + alarmTypeArray[i]]) {
                    optionArray.push("<option value='" + alarmTypeArray[i] + "'>" + lang['malarm_' + alarmTypeArray[i]] + '</option>');
                }
            }
            //添加平台频率异常报警
            optionArray.push("<option value='1000'>" + lang['malarm_1000'] + '</option>');
            alarmcount.$alarmType.html(optionArray.join(''));

            //点击查询加载数据
            alarmcount.$search.on('click', function () {
                if (alarmcount.tab_index == 1) {
                    alarmcount.tb_alarm_type.loadData();
                } else if (alarmcount.tab_index == 2) {
                    alarmcount.tb_alarm_info.getToal();
                    alarmcount.tb_alarm_info.loadData();
                }
            });

            //导出数据
            alarmcount.$export.on('click', function () {
                var trans_lang = {}; //存放导出需要的翻译字段
                // 翻译的颜色汇总
                // for(var i = 1; i < 6; i++) {
                // 	trans_lang["platecolor_"+i] = lang["platecolor_"+i];
                // }
                // //翻译报警类型的汇总
                // for(var i = 1; i < 16; i++) {
                // 	trans_lang["malarm_"+i] = lang["malarm_"+i];
                // }
                for (var key in lang) {
                    if (/(^malarm_)|(^platecolor_)/.test(key)) {
                        trans_lang[key] = lang[key];
                    }
                }
                trans_lang.allAlarm = lang.allAlarm;
                //报警类型的导出
                if (alarmcount.tab_index == 1) {
                    var columnName = [];
                    var fileName = $('#tab_list_alarmType a').text() + '-' + appCommon.formatDate(new Date(), false, 'yyyyMMdd');
                    var url = '../alarm-count/export';
                    $('#tb_alarm_type th').each(function (key, value) {
                        columnName[key] = $.trim($(this).text());
                    });
                    if (alarmcount.lang == 'zh-CN') {
                        columnName.splice(2, 0, lang['plateColor']);
                    }
                    var data = {
                        guid: alarmcount._GUID1,
                        columnName: columnName.join(','),
                        fileName: fileName,
                        lang: trans_lang,
                        logContent: lang['M_2201'] + '-' + lang['alarmTypeCount'] + '-' + lang['export'],
                        type: 'alarmTypeCount',
                        langType: alarmcount.lang,
                        total: alarmcount.alarmInfoTotal,
                        page: 1
                    };
                    appCommon.ajax(url, 'post', 'json', data, function (res) {
                        if (res.code == 200 && res.result != false) {
                            appCommon.downloadFile('../../download/' + res.result);
                        } else if (res.code == 202) {
                            lavaMsg.alert(lang['error202'], 'info', 1000);
                        } else if (res.code == 203) {
                            lavaMsg.alert(lang['error203'], 'info', 1000);
                        }
                    });
                } else if (alarmcount.tab_index == 2) {
                    //报警信息的导出
                    //添加方向的翻译汇总
                    trans_lang['north'] = lang['north'];
                    trans_lang['northeast'] = lang['northeast'];
                    trans_lang['east'] = lang['east'];
                    trans_lang['southeast'] = lang['southeast'];
                    trans_lang['south'] = lang['south'];
                    trans_lang['southwest'] = lang['southwest'];
                    trans_lang['west'] = lang['west'];
                    trans_lang['northwest'] = lang['northwest'];
                    //kapok版本使用
                    trans_lang['dealUser'] = lang['dealUser'];
                    trans_lang['dealMessage'] = lang['dealMessage'];
                    trans_lang['dealTime'] = lang['dealTime'];
                    var requirement = alarmcount.getRequirement();
                    requirement.rows = alarmcount.alarmInfoTotal;
                    var columnName = [];
                    var fileName = $('#tab_list_alarmInfo a').text() + '-' + appCommon.formatDate(new Date(), false, 'yyyyMMdd');
                    var url = '../alarm-count/export';
                    $('#tb_alarm_info th').each(function (key, value) {
                        columnName[key] = $.trim($(this).text());
                    });
                    columnName.splice(0, 2);
                    if (alarmcount.lang == 'zh-CN') {
                        columnName.splice(2, 0, lang['plateColor']);
                        columnName.splice(8, 1, lang['lat'], lang['lng']);
                    } else {
                        columnName.splice(7, 1, lang['lat'], lang['lng']);
                    }
                    var data = {
                        guid: alarmcount._GUID2,
                        columnName: columnName.join(','),
                        fileName: fileName,
                        lang: trans_lang,
                        logContent: lang['M_2201'] + '-' + lang['alarmInfoQuery'] + '-' + lang['export'],
                        type: 'alarmInfoQuery',
                        langType: alarmcount.lang,
                        requirement: JSON.stringify(requirement)
                    };
                    appCommon.ajax(url, 'post', 'json', data, function (res) {
                        if (res.code == 200 && res.result != false) {
                            appCommon.downloadFile('../../download/' + res.result);
                        } else if (res.code == 202) {
                            lavaMsg.alert(lang['error202'], 'info', 1000);
                        } else if (res.code == 203) {
                            lavaMsg.alert(lang['error203'], 'info', 1000);
                        }
                    });
                }
            });
            //打印
            alarmcount.$print.on('click', function () {
                if (alarmcount.tab_index == 1) {
                    alarmcount.$tabAlarmType.table('print');
                } else if (alarmcount.tab_index == 2) {
                    alarmcount.$tabAlarmInfo.table('print');
                }
            });
            //删除
            alarmcount.$delete.on('click', function () {
                alarmcount.tb_alarm_info.deleteAlarmInfo();
            });
        }
    },
    tb_alarm_type: {
        init: function init() {
            /**
             * 请求数据,后台需要处理post请求的参数rows和page,根据参数返回对应的数据，以达成分页的效果
             */
            var that = this;
            var footLanguage = {};
            footLanguage[alarmcount.lang] = {
                total: lang.total,
                from: lang.displaying,
                to: lang.to
            };
            alarmcount.$tabAlarmType.table({
                url: '/report/alarm-count/alarm-type-count',
                frozenNumber: 0,
                fit: true,
                showLoader: true,
                footLanguage: footLanguage,
                columns: [{ field: 'groupName', width: 120 }, { field: 'vehicleLicense', width: 120, formatter: that.formatCarLicense }, { field: 'deviceNo', width: 120 }, { field: 'alarmType', width: 120, formatter: alarmcount.formatAlarmType }, { field: 'alarmTimes', width: 120 }],
                loadFilter: function loadFilter(data) {
                    //当数据加载完成时，让查询，导出，打印按钮可点
                    alarmcount.$search.attr('disabled', false);
                    alarmcount.$export.attr('disabled', false);
                    alarmcount.$print.attr('disabled', false);
                    if (data.code == 200 && data.result.count == 0 && alarmcount._click == 1) {
                        //查询返回没有数据时，提示一下
                        lavaMsg.alert(lang['noData'], 'info', 1000);
                        return { total: 0, rows: [] };
                    } else if (data && data.code == 200 && data.result) {
                        return { total: data.result.count, rows: data.result.items };
                    } else if (data.code != 200) {
                        lavaMsg.alert(lang['error' + data.code], 'danger', 1000);
                        return { total: 0, rows: [] };
                    } else {
                        return { total: 0, rows: [] };
                    }
                },
                lang: alarmcount.lang
            });
        },
        loadData: function loadData() {
            var requirement = alarmcount.getRequirement();
            alarmcount._GUID1 = requirement.guid;
            if (requirement.vehicleIds == '') {
                lavaMsg.alert(lang['choseGroupCar'], 'info', 1000);
            } else {
                alarmcount._click = 1;
                //当前一次查询的请求没有完成的，让查询，导出，打印按钮不可点
                alarmcount.$search.attr('disabled', true);
                alarmcount.$export.attr('disabled', true);
                alarmcount.$print.attr('disabled', true);
                alarmcount.$tabAlarmType.table('load', requirement);
            }
        },
        //格式化车牌号码和车牌颜色
        formatCarLicense: function formatCarLicense(value, row, index) {
            var color = '';
            switch (row.plateColor) {
                case '1':
                    color = 'blue';
                    break;
                case '2':
                    color = 'yellow';
                    break;
                case '3':
                    color = 'black';
                    break;
                case '4':
                    color = 'white';
                    break;
                case '5':
                    color = 'green';
                    break;
                case '9':
                    color = 'other';
                    break;
                default:
                    color = 'other';
                    break;
            }
            return appCommon.formatCarlicense(color, value);
        }
    },
    tb_alarm_info: {
        init: function init() {
            /**
             * 请求数据,后台需要处理post请求的参数rows和page,根据参数返回对应的数据，以达成分页的效果
             */
            var that = this;
            var footLanguage = {};
            footLanguage[alarmcount.lang] = {
                total: lang.total,
                from: lang.displaying,
                to: lang.to
            };
            alarmcount.$tabAlarmInfo.table({
                url: '/report/alarm-count/alarm-info',
                frozenNumber: 0,
                fit: true,
                showLoader: true,
                pagination: true,
                checkbox: true,
                footLanguage: footLanguage,
                columns: [{ field: 'checkbox' }, { field: 'operate', width: 65, formatter: that.formatOperate }, { field: 'groupName', width: 110 }, { field: 'carlicense', width: 100, formatter: that.formatCarLicense }, { field: 'deviceNo', width: 100 }, { field: 'alarmType', width: 120, formatter: alarmcount.formatAlarmType }, { field: 'alarmContent', width: 150 }, { field: 'gpsTime', width: 160 }, { field: 'direction', width: 140, formatter: appCommon.formatDirection }, { field: 'location', width: 140, formatter: that.formatLocation }, { field: 'dealUser', width: 120 }, { field: 'dealMessage', width: 130 }, { field: 'dealTime', width: 160 }],
                loadFilter: function loadFilter(data) {
                    //当数据加载完成时，让查询，导出，打印按钮可点
                    alarmcount.$search.attr('disabled', false);
                    alarmcount.$export.attr('disabled', false);
                    alarmcount.$print.attr('disabled', false);
                    if (data.code == 200 && data.result.items.length == 0 && alarmcount._click == 2) {
                        //查询返回没有数据时，提示一下
                        lavaMsg.alert(lang['noData'], 'info', 1000);
                        return { total: 0, rows: [] };
                    } else if (data && data.code == 200 && data.result) {
                        return { total: alarmcount.alarmInfoTotal, rows: data.result.items };
                    } else if (data.code != 200) {
                        lavaMsg.alert(lang['error' + data.code], 'danger', 1000);
                        return { total: 0, rows: [] };
                    } else {
                        return { total: 0, rows: [] };
                    }
                },
                lang: alarmcount.lang
            });
        },
        //获取报警信息总条数
        getToal: function getToal() {
            var alarm_chart_uri = '/report/alarm-count/alarm-info-count';
            //获取条件
            var requirement = alarmcount.getRequirement();
            if (requirement.vehicleIds == '') {
                lavaMsg.alert(lang['choseGroupCar'], 'info', 1000);
            } else {
                appCommon.ajax(alarm_chart_uri, 'post', 'json', requirement, function (res) {
                    if (res.code == 200) {
                        alarmcount.alarmInfoTotal = res.result.count;
                        $('#tb_alarm_info').table('setPagination', res.result.count);
                    } else {
                        lavaMsg.alert(lang['error' + data.code], 'danger', 1000);
                    }
                });
            }
        },
        //加载数据
        loadData: function loadData() {
            var requirement = alarmcount.getRequirement();
            alarmcount._GUID2 = requirement.guid;
            if (requirement.vehicleIds == '') {
                lavaMsg.alert(lang['choseGroupCar'], 'info', 1000);
            } else {
                alarmcount._click = 2;
                //当前一次查询的请求没有完成的，让查询，导出，打印按钮不可点
                alarmcount.$search.attr('disabled', true);
                alarmcount.$export.attr('disabled', true);
                alarmcount.$print.attr('disabled', true);
                alarmcount.$tabAlarmInfo.table('load', requirement);
            }
        },
        deleteAlarmInfo: function deleteAlarmInfo(alarmid) {
            var that = this;
            if (alarmid) {
                lavaMsg.singleConfirm('#' + alarmid, lang.sureDeleteThis + '?', lang.sure, lang.cancel, function (r) {
                    if (r) {
                        var requirement = {
                            ids: alarmid
                        };
                        that.requestDelete(requirement);
                    }
                });
            } else {
                var rows = alarmcount.$tabAlarmInfo.table('getChecked');
                var idsArray = [];
                for (var i = 0; i < rows.length; i++) {
                    //判断DSM类型报警
                    if (alarmcount.DSM_alarmid.indexOf(rows[i].alarmType) < 0) {
                        lavaMsg.alert(lang.chooseDAalarm, 'info', 1000);
                        return;
                    } else {
                        idsArray.push(rows[i].alarmid);
                    }
                }
                if (idsArray.length == 0) {
                    lavaMsg.alert(lang.chooseOneLeast, 'info', 1000);
                } else {
                    lavaMsg.confirm(lang.prompt, lang.sureDeleteThese + '?', lang.sure, function (r) {
                        if (r) {
                            var requirement = {
                                ids: idsArray.join(',')
                            };
                            that.requestDelete(requirement);
                        }
                    });
                }
            }
        },
        requestDelete: function requestDelete(requirement) {
            var that = this;
            appCommon.ajax('/report/alarm-count/delete-alarm-info', 'post', 'json', requirement, function (data) {
                if (data.code == 200) {
                    lavaMsg.alert(lang.operateSuccess, 'success', 1000);
                    that.loadData();
                } else {
                    var message = appCommon.errorCode2Message(data.code);
                    lavaMsg.alert(message, 'danger', 1000);
                }
            });
        },
        formatOperate: function formatOperate(value, row, index) {
            if (alarmcount.DSM_alarmid.indexOf(row.alarmType) >= 0) {
                var str = '<a id="{0}" class="fa fa-trash font-red" href="javascript:;" onclick="alarmcount.tb_alarm_info.deleteAlarmInfo(\'{0}\')" title="{1}"></a>';
                str = appCommon.strReplace(str, [row.alarmid, lang.delete]);
                return str;
            } else {
                return '';
            }
        },
        //格式化车牌号码和车牌颜色
        formatCarLicense: function formatCarLicense(value, row, index) {
            var color = '';
            switch (row.plateColor) {
                case '1':
                    color = 'blue';
                    break;
                case '2':
                    color = 'yellow';
                    break;
                case '3':
                    color = 'black';
                    break;
                case '4':
                    color = 'white';
                    break;
                case '5':
                    color = 'green';
                    break;
                case '9':
                    color = 'other';
                    break;
                default:
                    color = 'other';
                    break;
            }
            return appCommon.formatCarlicense(color, value);
        },
        //方向解析
        formatDirection: function formatDirection(value, row, index) {
            //如果方向数据不在0-360之间，算作异常数据
            if (value < 0 || value > 360) {
                return '-';
            } else {
                return appCommon.formatDirection(value);
            }
        },
        //地理位置解析
        formatLocation: function formatLocation(value, row, index) {
            //如果经纬度都为0，则为异常数据
            if (row.lat == 0 && row.lng == 0) {
                return '-';
            } else {
                return '<a href="javascript:;" style="text-decoration:underline;" onclick="alarmcount.Map.analysisLocation(' + row.lat + ',' + row.lng + ')"><img src="' + '/images/map/position.png' + '" style="witdh:24px;height:24px;"/></a>';
            }
        }
    },
    dateRange: {
        init: function init() {
            var that = this;
            if (!jQuery().daterangepicker) {
                return;
            }
            alarmcount.$dateRange.daterangepicker({
                opens: 'right',
                startDate: moment(),
                endDate: moment(),
                minDate: '2012-01-01',
                maxDate: '2100-12-30',
                ranges: that.getRange(),
                locale: {
                    format: 'YYYY-MM-DD',
                    separator: lang['to'],
                    applyLabel: lang['sure'],
                    cancelLabel: lang['cancel'],
                    fromLabel: lang['from'],
                    toLabel: lang['to'],
                    customRangeLabel: lang['userDefined'],
                    daysOfWeek: [lang['Sun'], lang['Mon'], lang['Tues'], lang['Wed'], lang['Thur'], lang['Fri'], lang['Sat']],
                    monthNames: [lang['Jan'], lang['Feb'], lang['Mar'], lang['Apr'], lang['May'], lang['June'], lang['July'], lang['Aug'], lang['Sept'], lang['Oct'], lang['Nov'], lang['Dec']]
                }
            }, function (start, end) {
                alarmcount.$inputDate.val(start.format('YYYY-MM-DD') + ' ' + lang['to'] + ' ' + end.format('YYYY-MM-DD'));
            }).on('show.daterangepicker', function () {
                alarmcount.$dateRange.data('daterangepicker').ranges = that.getRange();
            });
            alarmcount.$inputDate.val(moment().format('YYYY-MM-DD') + ' ' + lang['to'] + ' ' + moment().format('YYYY-MM-DD'));
        },
        getRange: function getRange() {
            var range = {};
            range[lang['today']] = [moment(), moment()];
            range[lang['yesterday']] = [moment().subtract(1, 'days'), moment().subtract(1, 'days')];
            range[lang['lateThreeDays']] = [moment().subtract(2, 'days'), moment()];
            range[lang['lateWeek']] = [moment().subtract(6, 'days'), moment()];
            range[lang['lateMonth']] = [moment().subtract(29, 'days'), moment()];
            return range;
        }
    },
    zTree: {
        treeNodes: [],
        treeObj: null,
        init: function init() {
            var that = this;
            var setting = {
                check: {
                    enable: true
                },
                data: {
                    simpleData: {
                        enable: true
                    }
                }
            };
            //树形菜单数据的url
            var tree_uri = '/common/vehicle-tree';
            appCommon.ajax(tree_uri, 'get', 'json', {}, function (res) {
                if (res.code == 200) {
                    $.fn.zTree.init(alarmcount.$groupTree, setting, res.result);
                    that.treeObj = $.fn.zTree.getZTreeObj('groupTree');
                    var nodes = $.fn.zTree.getZTreeObj('groupTree').getNodes();
                    that.treeNodes = $.fn.zTree.getZTreeObj('groupTree').transformToArray(nodes);
                }
            });
        }
    },
    //车组车辆设备号过滤
    vehicleGroupFileter: {
        init: function init() {
            var that = this;
            //模糊搜索按钮(回车)事件绑定
            $('#btn_search_vehicle').on('click', function () {
                that.searchVehicleTree();
            });
            $('#inpVehicleSearch').bind('keypress', function (event) {
                if (event.keyCode == '13') {
                    that.searchVehicleTree();
                }
            });
        },
        //根据输入的值搜索匹配的车组,车牌,设备号
        searchVehicleTree: function searchVehicleTree() {
            var that = this;
            var value = $('#inpVehicleSearch').val();
            var nodes = alarmcount.zTree.treeNodes;
            var result = [];
            if (!/^(\s)*$/g.test(value)) {
                var reg = new RegExp(value.toUpperCase());
                for (var i = 0; i < nodes.length; i++) {
                    if (nodes[i].name && reg.test(nodes[i].name.toUpperCase())) {
                        result.push(nodes[i]);
                    } else if (nodes[i].deviceNo && reg.test(nodes[i].deviceNo.toUpperCase())) {
                        result.push(nodes[i]);
                    }
                }
                if (result.length == 1) {
                    that.selectNode(result[0].tId);
                } else if (result.length > 1) {
                    that.loadVehicleList(result);
                } else {
                    lavaMsg.alert(lang.noMatchedItems, 'warning', 1000);
                }
            }
        },
        //模态框弹出,加载多个匹配节点
        loadVehicleList: function loadVehicleList(nodesArr) {
            var that = this;
            var listArray = [];
            for (var i = 0; i < nodesArr.length; i++) {
                var rowGroup = '<a href="javascript:window.alarmcount.vehicleGroupFileter.selectNode(\'{0}\');" class="list-group-item"><span><img src="../../images/caricon/group.min.png"/>&nbsp;</span>{1}</a>';
                var row = '<a href="javascript:window.alarmcount.vehicleGroupFileter.selectNode(\'{0}\');" class="list-group-item"><span><img src="../../images/caricon/car.min.png"/>&nbsp;</span>{1}({2})</a>';
                var tId = nodesArr[i].tId;
                var name = nodesArr[i].name ? nodesArr[i].name : '';
                var deviceNo = nodesArr[i].deviceNo ? nodesArr[i].deviceNo : '';
                if (deviceNo) {
                    row = appCommon.strReplace(row, [tId, name, deviceNo]);
                    listArray.push(row);
                } else {
                    rowGroup = appCommon.strReplace(rowGroup, [tId, name]);
                    listArray.push(rowGroup);
                }
            }
            $('#ul_vehiclelist').html(listArray.join(''));
            that.modalShow();
        },
        //选中树节点
        selectNode: function selectNode(tId) {
            var that = this;
            var node = alarmcount.zTree.treeObj.getNodeByTId(tId);
            alarmcount.zTree.treeObj.selectNode(node);
            alarmcount.zTree.treeObj.checkNode(node, true, true, true);
            that.modalhide();
        },
        //模态框弹出
        modalShow: function modalShow() {
            $('#div_vehiclelist').modal('show');
        },
        //模态框隐藏
        modalhide: function modalhide() {
            $('#div_vehiclelist').modal('hide');
        }
    },
    eCharts: {
        init: function init() {
            // 基于准备好的dom，初始化echarts实例
            alarmcount.$alarmCharts = echarts.init(document.getElementById('alarmCharts'));
            // 指定图表的配置项和数据
            var option = {
                title: {
                    left: 'center',
                    text: lang['alarmCount']
                },
                grid: {
                    width: '90%',
                    height: '80%',
                    left: 'center',
                    top: 'center'
                },
                tooltip: {
                    trigger: 'axis'
                },
                color: ['#e7505a'],
                xAxis: {
                    name: lang['date'],
                    type: 'category',
                    boundaryGap: false,
                    data: []
                },
                yAxis: {
                    minInterval: 1,
                    name: lang['times'],
                    type: 'value',
                    axisLabel: {
                        formatter: '{value}'
                    }
                },
                series: [{
                    name: lang['alarmTimes'],
                    type: 'line',
                    data: [],
                    label: {
                        normal: {
                            show: true,
                            position: 'top',
                            textStyle: {
                                fontWeight: 'bolder'
                            }
                        }
                    }
                }]
            };
            // 使用刚指定的配置项和数据显示图表。
            alarmcount.$alarmCharts.setOption(option);
            //图随着屏幕大小自适应
            window.onresize = function () {
                if ($('#alarmCharts').is(':visible')) {
                    alarmcount.$alarmCharts.resize();
                }
            };

            alarmcount.$search.on('click', function () {
                if (alarmcount.tab_index == 0) {
                    var dateRangeValue = alarmcount.$inputDate.val();
                    var alarm_chart_uri = '/report/alarm-count/alarm-chart';
                    //获取条件
                    var requirement = alarmcount.getRequirement();
                    if (requirement.vehicleIds == '') {
                        lavaMsg.alert(lang['choseGroupCar'], 'info', 1000);
                    } else {
                        alarmcount.$alarmCharts.showLoading(); //显示Loading动画
                        appCommon.ajax(alarm_chart_uri, 'post', 'json', requirement, function (res) {
                            if (res.code == 200) {
                                var newOption = {
                                    xAxis: {
                                        data: res.result.date
                                    },
                                    series: {
                                        data: res.result.value
                                    }
                                };
                                alarmcount.$alarmCharts.hideLoading(); //取消Loading动画
                                alarmcount.$alarmCharts.setOption(newOption);
                            } else {
                                alarmcount.$alarmCharts.hideLoading(); //取消Loading动画
                            }
                        });
                    }
                }
            });
        }
    },
    /**
     * 汇总查询条件
     */
    getRequirement: function getRequirement() {
        var treeObj = $.fn.zTree.getZTreeObj('groupTree');
        var nodes = treeObj.getCheckedNodes(true);
        var _carIDs = [];
        var _carIDs_value = '';
        for (var i = 0; i < nodes.length; i++) {
            if (nodes[i].icon.indexOf('car.min.png') > 0) {
                _carIDs.push(nodes[i].id);
            }
        }
        for (var i = 0; i < _carIDs.length; i++) {
            _carIDs_value = _carIDs_value + _carIDs[i];
            if (i < _carIDs.length - 1) {
                _carIDs_value = _carIDs_value + ',';
            }
        }
        var dateRangeValue = alarmcount.$inputDate.val();
        var requirement = {
            guid: new Date().getTime(),
            vehicleIds: _carIDs_value,
            startTime: dateRangeValue.substr(0, 10),
            endTime: dateRangeValue.substr(dateRangeValue.length - 10, dateRangeValue.length - 1),
            alarmType: alarmcount.$alarmType.val()
        };
        if (requirement.vehicleIds == '' || requirement == null || requirement.vehicleIds.length == 0) {
            lavaMsg.alert(lang['choseGroupCar'], 'info', 1000);
        }
        return requirement;
    },
    /**
     * 报警类型数值转换成报警类型名称
     * @alarmTypeNumber 报警类型数值
     * @return string
     */
    formatAlarmType: function formatAlarmType(value, row, index) {
        var str = '';
        if (value == -1) {
            if (lang.allAlarm) {
                str = lang.allAlarm;
            }
        } else {
            if (lang['malarm_' + value]) {
                str = lang['malarm_' + value];
            }
        }
        return str;
    }
};
window.onload = function () {
    appCommon.lang(function () {
        alarmcount.init();
        alarmcount.action();
    });
};