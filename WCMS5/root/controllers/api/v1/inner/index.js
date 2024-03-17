var config = require('../../../../config/app.json');
let messageBus = require('../../../../messagebus/index.js');
let apiLogger = require('../../../../tools/log4jsHelper.js').apiLog();
let db_user = require('../../../../db' + config.dbType + '/ceiba2/user/index.js');
let db_systemconfig = require('../../../../db' + config.dbType + '/ceiba2/system-config/index.js');
var enumMap = require('../../../../config/enum.json');
var commonfun = require('../../../../tools/commonfun.js');
const requestP = require('../../../../tools/lavaRequest.js').RequestP;

/**
 * api调用通用应答
 * @param {*} res
 * @param {*} json
 * @param {*} callback
 * @param {*} err
 */
function customSend(res, json, callback, err) {
    if (err) {
        apiLogger.error(err);
    }
    if (callback) {
        res.jsonp(json);
    } else {
        res.send(json);
    }
}
/**
 *
 * @param {string} eid 证据id
 * @param {string} key 令牌token
 * @return 证据IP和Port
 */
async function getEvidenceIPPort(eid, key) {
    let IP = '';
    let port = '';
    let serverres = await requestP({
        uri: `http://${config.ceiba2ip}:${config.ceiba2HttpApiPort}/api/v1/evidence/evidenceserverinfo`,
        method: 'POST',
        json: true,
        headers: {
            'content-type': 'application/json'
        },
        body: { key }
    });
    let serverInfo = serverres.errorcode === 200 ? serverres.data : [];
    let eviInfo = [];
    let evires = await requestP({
        uri: `http://${config.ceiba2ip}:${config.ceiba2HttpApiPort}/api/v1/basic/evidence-app/detail`,
        method: 'POST',
        json: true,
        headers: {
            'content-type': 'application/json'
        },
        body: {
            key,
            eid: [eid]
        }
    });
    if (evires.errorcode === 200) {
        eviInfo = evires.result;
    }
    //当查询了证据所在的服务器信息并成功时，匹配证据IP，当不是分布试时，取mainserver的IP,port
    if (eviInfo.length) {
        serverInfo.forEach(item => {
            for (let evi of eviInfo) {
                if (item.servername === evi.evidenceservername) {
                    IP = item.serverip;
                    port = item.serverrectport;
                    break;
                }
            }
        });
    } else {
        serverInfo.forEach(item => {
            if (item.servername === 'mainserver') {
                IP = item.serverip;
                port = item.serverrectport;
            }
        });
    }
    return { IP, port };
}
/**
 * 验证用户登录
 * @param {*} username
 * @param {*} password
 */
function isUserExist(username, password) {
    return new Promise((resolve, reject) => {
        let _sha1Psw = commonfun.getSha1(password);
        let _desPsw = commonfun.desEncrypt(password);
        db_user.isExist(username, _sha1Psw.toUpperCase(), _desPsw, function (err, res) {
            if (!err) {
                resolve(res);
            } else {
                reject(err);
            }
        });
    });
}
/**
 * 获取系统配置，拿到公网IP
 */
function getSystemConfig() {
    return new Promise((resolve, reject) => {
        try {
            db_systemconfig.getItems(function (err, res) {
                if (!err && res) {
                    resolve(res);
                } else {
                    reject(err);
                }
            });
        } catch (err) {
            reject(err);
        }
    });
}
let innerController = {
    key: function (req, res) {
        apiLogger.info('<---------/api/v1/inner/key---------->');
        let json = {
            errorcode: 200,
            data: {
                key: ''
            }
        };
        let callback = req.query.callback;
        try {
            let _username = req.query.username;
            let _password = req.query.password;
            if (_username && _password) {
                //password rsa解密
                //_password = commonfun.decryptRSAString(decodeURIComponent(_password));
                isUserExist(_username, _password)
                    .then(r => {
                        if (r.length > 0) {
                            let obj = r[0];
                            let token = commonfun.getWcms4Token(obj.id, obj.roleid);
                            json.data.key = token;
                            let now = commonfun.getNowDateTime();
                            if (obj.validend && obj.validend + ' 23:59:59' < now) {
                                json.errorcode = enumMap.errorcode.account_expired;
                                customSend(res, json, callback);
                            } else {
                                if (obj.id == 1 && obj.roleid == 1 && obj.account == 'admin') {
                                    //admin用户登录不受限制
                                    customSend(res, json, callback);
                                } else {
                                    db_user
                                        .getUserConfigByid(obj.id)
                                        .then(r => {
                                            if (r.length > 0 && r[0].uniquelogin == 1) {
                                                //是唯一性登录
                                                let encodeURIBase64Account = commonfun.string2base64(obj.account);
                                                return messageBus.sismember('useronline', encodeURIBase64Account);
                                            } else {
                                                return Promise.resolve({ notUnique: true });
                                            }
                                        })
                                        .then(r => {
                                            if (!r.notUnique) {
                                                if (r > 0) {
                                                    json.errorcode = enumMap.errorcode.user_login;
                                                    json.data.key = '';
                                                }
                                            }
                                            customSend(res, json, callback);
                                        })
                                        .catch(err => {
                                            json.errorcode = enumMap.errorcode.servererror;
                                            customSend(res, json, callback, err);
                                        });
                                }
                            }
                        } else {
                            json.errorcode = enumMap.errorcode.user_error;
                            customSend(res, json, callback);
                        }
                    })
                    .catch(err => {
                        json.errorcode = enumMap.errorcode.servererror;
                        customSend(res, json, callback, err);
                    });
            } else {
                json.errorcode = enumMap.errorcode.abnormal_param_num;
                customSend(res, json, callback);
            }
        } catch (err) {
            json.errorcode = enumMap.errorcode.servererror;
            customSend(res, json, callback, err);
        }
    },
    /**
     * 获取用户配置信息
     */
    getUserConfig: function (req, res) {
        apiLogger.info('<---------/api/v1/inner/userconfig---------->');
        let json = {
            errorcode: 200,
            data: {}
        };
        let callback = req.query.callback;
        try {
            let _key = req.body.key;
            if (_key) {
                let _userInfo = commonfun.validWcms4Token(_key);
                if (_userInfo && _userInfo.rid && _userInfo.uid) {
                    db_user
                        .getUserConfigByid(_userInfo.uid)
                        .then(r => {
                            if (r.length > 0) {
                                json.data.chncount = parseInt(r[0].chncount) ? r[0].chncount : 16; //备份还原的数据，userconfig无chncount数据，默认16通道
                            } else {
                                json.data.errorcode = enumMap.errorcode.user_error;
                            }
                            customSend(res, json, callback);
                        })
                        .catch(err => {
                            json.errorcode = enumMap.errorcode.servererror;
                            customSend(res, json, callback, err);
                        });
                } else {
                    json.errorcode = enumMap.errorcode.key_error;
                    customSend(res, json, callback);
                }
            } else {
                json.errorcode = enumMap.errorcode.no_authorization_key;
                customSend(res, json, callback);
            }
        } catch (err) {
            json.errorcode = enumMap.errorcode.servererror;
            customSend(res, json, callback, err);
        }
    },
    /**
     * 生成证据邮件链接
     */
    eviLink: function (req, res) {
        apiLogger.info('<---------/api/v1/inner/evilink---------->');
        let json = {
            errorcode: 200,
            data: {
                evilink: ''
            }
        };
        let callback = req.query.callback;
        try {
            let eid = req.body.eid;
            if (eid) {
                let protocol = config.ishttps ? 'https' : 'http';
                let ip = '';
                let port = config.reactPort;
                let lang = config.lang;
                let token = commonfun.getWcms4Token(1, 1); //默认是admin用户
                let path = '/jump?';
                let mt = '';
                let su = '';
                let creatTime = new Date().getTime();
                let validity = 8760; //小时，默认一年
                getSystemConfig()
                    .then(r => {
                        for (let item of r) {
                            if (item.name.toLowerCase() == 'registerip') {
                                ip = item.value;
                            }
                            if (item.name.toLowerCase() == 'maptype') {
                                mt = item.value;
                            }
                            if (item.name.toLowerCase() == 'speedunit') {
                                su = item.value;
                            }
                        }
                        //获取eid对应的分布式服务器ip and port
                        return getEvidenceIPPort(eid.toString(), token);
                    })
                    .then(r => {
                        let { IP: evidenceIp = ip, port: evidencePort = port } = r;
                        //nginx代理https时不支持分布式
                        //组装链接
                        let jumpURL = encodeURI(
                            `${protocol}://${evidenceIp}:${
                                config.trustProxy ? port : evidencePort
                            }${path}eid=${eid}&token=${token}&lang=${lang}&mt=${mt}&su=${su}&creatTime=${creatTime}&validity=${validity}`
                        );
                        json.data.evilink = jumpURL;
                        customSend(res, json, callback);
                    })
                    .catch(err => {
                        json.errorcode = enumMap.errorcode.servererror;
                        customSend(res, json, callback, err);
                    });
            } else {
                json.errorcode = enumMap.errorcode.illegal_request;
                customSend(res, json, callback);
            }
        } catch (err) {
            json.errorcode = enumMap.errorcode.servererror;
            customSend(res, json, callback, err);
        }
    },
    /**
     * 获取rsa公钥
     */
    getRSAPublicKey: function* (req, res) {
        let json = {
            errorcode: 200,
            result: ''
        };
        let callback = req.query.callback;
        try {
            apiLogger.info('<---------/api/v1/inner/rsapubkey---------->');
            let pubkey = commonfun.getRSAPublicKey();
            json.result = pubkey;
            res.send(json);
            let _key = req.query.key;
            // if (_key) {
            //     let _userInfo = commonfun.validWcms4Token(_key);
            //     if (_userInfo && _userInfo.rid && _userInfo.uid) {
            //     } else {
            //         json.errorcode = enumMap.errorcode.key_error;
            //         customSend(res, json, callback);
            //     }
            // } else {
            //     json.errorcode = enumMap.errorcode.no_authorization_key;
            //     customSend(res, json, callback);
            // }
        } catch (err) {
            json.errorcode = enumMap.errorcode.servererror;
            customSend(res, json, callback, err);
        }
    },
    /**
     * 客户端获取设备设置URL
     */
    getDeviceSettingUrl: function* (req, res) {
        let json = {
            errorcode: 200,
            data: {
                url: ''
            }
        };
        try {
            apiLogger.info('<---------/api/v1/inner//device/setting/url---------->');
            let { devid, devversion, lan, ngnixip, ngnixport, password, user } = req.query;
            if (
                devid === undefined ||
                devversion === undefined ||
                lan === undefined ||
                ngnixip === undefined ||
                ngnixport === undefined ||
                password === undefined ||
                user === undefined
            ) {
                json.errorcode = enumMap.errorcode.abnormal_param_num;
                res.send(json);
            } else {
                let key = commonfun.getWcms4Token(res.locals.uid, res.locals.rid);
                let reqBody = {
                    uri:
                        'http://' +
                        config.ceiba2ip +
                        ':' +
                        config.ceiba2HttpApiPort +
                        '/api/v1/basic/device/setting/url',
                    method: 'POST',
                    json: true,
                    headers: {
                        'content-type': 'application/json'
                    },
                    body: { devid, devversion, lan, ngnixip, ngnixport, password, user, key }
                };
                let httpRes = yield requestP(reqBody);
                json.errorcode = httpRes.errorcode;
                json.data.url = httpRes.data.url;
                res.send(json);
            }
        } catch (err) {
            json.errorcode = enumMap.errorcode.servererror;
            customSend(res, json, callback, err);
        }
    }
};
module.exports = innerController;
