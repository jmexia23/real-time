/* eslint-disable
    camelcase,
    handle-callback-err,
    no-return-assign,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * DS201: Simplify complex destructure assignments
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const async = require("async");
const chai = require("chai");
const {
    expect
} = chai;
chai.should();

const RealTimeClient = require("./helpers/RealTimeClient");
const FixturesManager = require("./helpers/FixturesManager");

const settings = require("settings-sharelatex");
const redis = require("redis-sharelatex");
const rclient = redis.createClient(settings.redis.websessions);

const redisSettings = settings.redis;

describe("applyOtUpdate", function() {
	before(function() {
		return this.update = {
			op: [{i: "foo", p: 42}]
		};});
	describe("when authorized", function() {
		before(function(done) {
			return async.series([
				cb => {
					return FixturesManager.setUpProject({
						privilegeLevel: "readAndWrite"
					}, (e, {project_id, user_id}) => {
						this.project_id = project_id;
						this.user_id = user_id;
						return cb(e);
					});
				},
					
				cb => {
					return FixturesManager.setUpDoc(this.project_id, {lines: this.lines, version: this.version, ops: this.ops}, (e, {doc_id}) => {
						this.doc_id = doc_id;
						return cb(e);
					});
				},

				cb => {
					this.client = RealTimeClient.connect();
					return this.client.on("connectionAccepted", cb);
				},
						
				cb => {
					return this.client.emit("joinProject", {project_id: this.project_id}, cb);
				},
				
				cb => {
					return this.client.emit("joinDoc", this.doc_id, cb);
				},
					
				cb => {
					return this.client.emit("applyOtUpdate", this.doc_id, this.update, cb);
				}
			], done);
		});
		
		it("should push the doc into the pending updates list", function(done) {
			rclient.lrange("pending-updates-list", 0, -1, (error, ...rest) => {
				const [doc_id] = Array.from(rest[0]);
				doc_id.should.equal(`${this.project_id}:${this.doc_id}`);
				return done();
			});
			return null;
		});

		it("should push the update into redis", function(done) {
			rclient.lrange(redisSettings.documentupdater.key_schema.pendingUpdates({doc_id: this.doc_id}), 0, -1, (error, ...rest) => {
				let [update] = Array.from(rest[0]);
				update = JSON.parse(update);
				update.op.should.deep.equal(this.update.op);
				update.meta.should.deep.equal({
					source: this.client.socket.sessionid,
					user_id: this.user_id
				});
				return done();
			});
			return null;
		});

		return after(function(done) {
			return async.series([
				cb => rclient.del("pending-updates-list", cb),
				cb => rclient.del("DocsWithPendingUpdates", `${this.project_id}:${this.doc_id}`, cb),
				cb => rclient.del(redisSettings.documentupdater.key_schema.pendingUpdates(this.doc_id), cb)
			], done);
		});
	});
		
	describe("when authorized to read-only with an edit update", function() {
		before(function(done) {
			return async.series([
				cb => {
					return FixturesManager.setUpProject({
						privilegeLevel: "readOnly"
					}, (e, {project_id, user_id}) => {
						this.project_id = project_id;
						this.user_id = user_id;
						return cb(e);
					});
				},
					
				cb => {
					return FixturesManager.setUpDoc(this.project_id, {lines: this.lines, version: this.version, ops: this.ops}, (e, {doc_id}) => {
						this.doc_id = doc_id;
						return cb(e);
					});
				},

				cb => {
					this.client = RealTimeClient.connect();
					return this.client.on("connectionAccepted", cb);
				},
						
				cb => {
					return this.client.emit("joinProject", {project_id: this.project_id}, cb);
				},
				
				cb => {
					return this.client.emit("joinDoc", this.doc_id, cb);
				},
					
				cb => {
					return this.client.emit("applyOtUpdate", this.doc_id, this.update, error => {
						this.error = error;
						return cb();
					});
				}
			], done);
		});
		
		it("should return an error", function() {
			return expect(this.error).to.exist;
		});
		
		it("should disconnect the client", function(done) {
			return setTimeout(() => {
				this.client.socket.connected.should.equal(false);
				return done();
			}
			, 300);
		});
			
		return it("should not put the update in redis", function(done) {
			rclient.llen(redisSettings.documentupdater.key_schema.pendingUpdates({doc_id: this.doc_id}), (error, len) => {
				len.should.equal(0);
				return done();
			});
			return null;
		});
	});
				
	return describe("when authorized to read-only with a comment update", function() {
		before(function(done) {
			this.comment_update = {
				op: [{c: "foo", p: 42}]
			};
			return async.series([
				cb => {
					return FixturesManager.setUpProject({
						privilegeLevel: "readOnly"
					}, (e, {project_id, user_id}) => {
						this.project_id = project_id;
						this.user_id = user_id;
						return cb(e);
					});
				},
					
				cb => {
					return FixturesManager.setUpDoc(this.project_id, {lines: this.lines, version: this.version, ops: this.ops}, (e, {doc_id}) => {
						this.doc_id = doc_id;
						return cb(e);
					});
				},

				cb => {
					this.client = RealTimeClient.connect();
					return this.client.on("connectionAccepted", cb);
				},
						
				cb => {
					return this.client.emit("joinProject", {project_id: this.project_id}, cb);
				},
				
				cb => {
					return this.client.emit("joinDoc", this.doc_id, cb);
				},
					
				cb => {
					return this.client.emit("applyOtUpdate", this.doc_id, this.comment_update, cb);
				}
			], done);
		});
		
		it("should push the doc into the pending updates list", function(done) {
			rclient.lrange("pending-updates-list", 0, -1, (error, ...rest) => {
				const [doc_id] = Array.from(rest[0]);
				doc_id.should.equal(`${this.project_id}:${this.doc_id}`);
				return done();
			});
			return null;
		});

		it("should push the update into redis", function(done) {
			rclient.lrange(redisSettings.documentupdater.key_schema.pendingUpdates({doc_id: this.doc_id}), 0, -1, (error, ...rest) => {
				let [update] = Array.from(rest[0]);
				update = JSON.parse(update);
				update.op.should.deep.equal(this.comment_update.op);
				update.meta.should.deep.equal({
					source: this.client.socket.sessionid,
					user_id: this.user_id
				});
				return done();
			});
			return null;
		});

		return after(function(done) {
			return async.series([
				cb => rclient.del("pending-updates-list", cb),
				cb => rclient.del("DocsWithPendingUpdates", `${this.project_id}:${this.doc_id}`, cb),
				cb => rclient.del(redisSettings.documentupdater.key_schema.pendingUpdates({doc_id: this.doc_id}), cb)
			], done);
		});
	});
});