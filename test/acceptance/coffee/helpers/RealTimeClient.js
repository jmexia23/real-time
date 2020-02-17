/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
let Client;
const {
    XMLHttpRequest
} = require("../../libs/XMLHttpRequest");
const io = require("socket.io-client");

const request = require("request");
const Settings = require("settings-sharelatex");
const redis = require("redis-sharelatex");
const rclient = redis.createClient(Settings.redis.websessions);

const uid = require('uid-safe').sync;
const signature = require("cookie-signature");

io.util.request = function() {
	const xhr = new XMLHttpRequest();
	const _open = xhr.open;
	xhr.open = function() {
		_open.apply(xhr, arguments);
		if (Client.cookie != null) {
			return xhr.setRequestHeader("Cookie", Client.cookie);
		}
	}.bind(this);
	return xhr;
};

module.exports = (Client = {
	cookie: null,

	setSession(session, callback) {
		if (callback == null) { callback = function(error) {}; }
		const sessionId = uid(24);
		session.cookie = {};
		return rclient.set("sess:" + sessionId, JSON.stringify(session), function(error) {
			if (error != null) { return callback(error); }
			const secret = Settings.security.sessionSecret;
			const cookieKey = 's:' + signature.sign(sessionId, secret);
			Client.cookie = `${Settings.cookieName}=${cookieKey}`;
			return callback();
		});
	},
			
	unsetSession(callback) {
		if (callback == null) { callback = function(error) {}; }
		Client.cookie = null;
		return callback();
	},
			
	connect(cookie) {
		const client = io.connect("http://localhost:3026", {'force new connection': true});
		return client;
	},
		
	getConnectedClients(callback) {
		if (callback == null) { callback = function(error, clients) {}; }
		return request.get({
			url: "http://localhost:3026/clients",
			json: true
		}, (error, response, data) => callback(error, data));
	},
		
	getConnectedClient(client_id, callback) {
		if (callback == null) { callback = function(error, clients) {}; }
		return request.get({
			url: `http://localhost:3026/clients/${client_id}`,
			json: true
		}, (error, response, data) => callback(error, data));
	}
});

