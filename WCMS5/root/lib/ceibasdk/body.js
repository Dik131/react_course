/**
 * json转换到字节数组
 */
function json2buffer(json) {
    var bodyBuffer = Buffer.from(JSON.stringify(json));
    return bodyBuffer;
}
module.exports = {
    /**
     * 客户端登录消息体
     */
    cmanm_clientlogin: function (userName, password, clientType, lang) {
        var json = {
            module: 'cmanm',
            operation: 'clientlogin',
            session: '',
            parameter: {
                user: userName,
                key: password,
                sdktype: 0
                //"type": clientType ? clientType : 1,
                //"id": "",
                //"pnum": "",
                //"lantype": lang ? lang : 1
            }
        };
        return json2buffer(json);
    },
    /**
     * 心跳消息体
     */
    cmanm_keeplive: function () {
        let json = {
            module: 'cmanm',
            operation: 'keeplive'
        };
        return json2buffer(json);
    },
    /**
     * 3.5.1
     * 增加订阅
     */
    pub_addsub: function (clientid, termailList) {
        var json = {
            module: 'pub',
            operation: 'addsub',
            session: '',
            parameter: {
                accessid: clientid,
                terlist: termailList,
                subtype: 0 //0:all,1:alarm,2:gps
            }
        };
        return json2buffer(json);
    },
    /**
     * 3.8.1
     * 报警启用
     */
    alarmpub_regalarm: function (clientid) {
        var json = {
            module: 'alarmpub',
            operation: 'regalarm',
            session: '',
            parameter: {
                userid: clientid,
                type: 1,
                id: '',
                pnum: null,
                lantype: 0
            }
        };
        return json2buffer(json);
    },
    /**
     * 3.8.3
     * 动态临时订阅GPS
     */
    alarmpub_subgps: function (clientid) {
        var json = {
            module: 'alarmpub',
            operation: 'subgps',
            session: '',
            parameter: {
                userid: clientid,
                type: 1,
                gidl: null,
                didl: null,
                area: null
            }
        };
        return json2buffer(json);
    },
    /**
     * 3.11.1 在线统计模块
     */
    ols_regols: function (clientid) {
        var json = {
            module: 'ols',
            operation: 'regols',
            session: '',
            parameter: {
                userid: clientid,
                iszip: 1
            }
        };
        return json2buffer(json);
    },
    /**
     * 3.11.4 查询在线状态
     */
    ols_getoldevice: function (clientid) {
        var json = {
            module: 'ols',
            operation: 'getoldevice',
            session: '',
            parameter: {
                userid: clientid,
                didl: null
            }
        };
        return json2buffer(json);
    }
};
