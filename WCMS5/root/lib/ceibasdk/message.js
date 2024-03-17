var bodyObj = require('./body.js');
var headObj = require('./head.js');
/**
 * 获取消息流水
 */
function getMessageSn() {
    return new Date().getTime().toString().slice(6, 13);
}
//拼装TCP请求buffer,然后发送到客户端接入服务
function concat(head, body) {
    var request = Buffer.concat([head, body], head.length + body.length);
    return request;
}
module.exports = {
    _username: 'AdministratorAdministrator',
    _password: 'admin',
    _clientid: 0,
    /**
     * 登录客户端接入服务器请求协议组装
     */
    cmanm_clientlogin: function () {
        var body = bodyObj.cmanm_clientlogin(this._username, this._password, '1', '1');
        var sn = getMessageSn();
        var head = headObj.getHead(body.length, sn, 'n', 'cg');
        return concat(head, body);
    },
    /**
     * 封装心跳包请求消息体
     * @param {*} userid 客户端socket id
     */
    cmanm_keeplive: function (userid) {
        var body = bodyObj.cmanm_keeplive();
        var sn = getMessageSn();
        var head = headObj.getHead(body.length, sn, userid, 'cg');
        return concat(head, body);
    },
    /**
     * 设备接入服务器
     */
    pub_addsub: function (userid) {
        var body = bodyObj.pub_addsub(userid, '');
        var sn = getMessageSn();
        var head = headObj.getHead(body.length, sn, userid, 'dg');
        return concat(head, body);
    },
    /**
     * 报警服务器
     */
    alarmpub_regalarm: function (userid) {
        var body = bodyObj.alarmpub_regalarm('admin');
        var sn = getMessageSn();
        var head = headObj.getHead(body.length, sn, userid, 'as');
        return concat(head, body);
    },
    /**
     * 报警服务器订阅gps
     */
    alarmpub_subgps: function (userid) {
        var body = bodyObj.alarmpub_subgps('admin');
        var sn = getMessageSn();
        var head = headObj.getHead(body.length, sn, userid, 'as');
        return concat(head, body);
    },
    /**
     * 在线统计
     */
    ols_regols: function (userid) {
        var body = bodyObj.ols_regols('admin');
        var sn = getMessageSn();
        var head = headObj.getHead(body.length, sn, userid, 'os');
        return concat(head, body);
    },
    /**
     * 在线统计
     */
    ols_getoldevice: function (userid) {
        var body = bodyObj.ols_getoldevice(userid);
        var sn = getMessageSn();
        var head = headObj.getHead(body.length, sn, userid, 'os');
        return concat(head, body);
    }
};
