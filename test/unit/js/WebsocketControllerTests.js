/* eslint-disable
    camelcase,
    no-return-assign,
    no-throw-literal,
    no-unused-vars,
*/
// TODO: This file was created by bulk-decaffeinate.
// Fix any style issues and re-enable lint.
/*
 * decaffeinate suggestions:
 * DS101: Remove unnecessary use of Array.from
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */
const chai = require('chai')
const should = chai.should()
const sinon = require('sinon')
const { expect } = chai
const modulePath = '../../../app/js/WebsocketController.js'
const SandboxedModule = require('sandboxed-module')
const tk = require('timekeeper')

describe('WebsocketController', function() {
  beforeEach(function() {
    tk.freeze(new Date())
    this.project_id = 'project-id-123'
    this.user = {
      _id: (this.user_id = 'user-id-123'),
      first_name: 'James',
      last_name: 'Allen',
      email: 'james@example.com',
      signUpDate: new Date('2014-01-01'),
      loginCount: 42
    }
    this.callback = sinon.stub()
    this.client = {
      id: (this.client_id = 'mock-client-id-123'),
      params: {},
      set: sinon.stub(),
      get(param, cb) {
        return cb(null, this.params[param])
      },
      join: sinon.stub(),
      leave: sinon.stub()
    }
    return (this.WebsocketController = SandboxedModule.require(modulePath, {
      requires: {
        './WebApiManager': (this.WebApiManager = {}),
        './AuthorizationManager': (this.AuthorizationManager = {}),
        './DocumentUpdaterManager': (this.DocumentUpdaterManager = {}),
        './ConnectedUsersManager': (this.ConnectedUsersManager = {}),
        './WebsocketLoadBalancer': (this.WebsocketLoadBalancer = {}),
        'logger-sharelatex': (this.logger = {
          log: sinon.stub(),
          error: sinon.stub(),
          warn: sinon.stub()
        }),
        'metrics-sharelatex': (this.metrics = {
          inc: sinon.stub(),
          set: sinon.stub()
        }),
        './RoomManager': (this.RoomManager = {})
      }
    }))
  })

  afterEach(function() {
    return tk.reset()
  })

  describe('joinProject', function() {
    describe('when authorised', function() {
      beforeEach(function() {
        this.client.id = 'mock-client-id'
        this.project = {
          name: 'Test Project',
          owner: {
            _id: (this.owner_id = 'mock-owner-id-123')
          }
        }
        this.privilegeLevel = 'owner'
        this.ConnectedUsersManager.updateUserPosition = sinon.stub().callsArg(4)
        this.isRestrictedUser = true
        this.WebApiManager.joinProject = sinon
          .stub()
          .callsArgWith(
            2,
            null,
            this.project,
            this.privilegeLevel,
            this.isRestrictedUser
          )
        this.RoomManager.joinProject = sinon.stub().callsArg(2)
        return this.WebsocketController.joinProject(
          this.client,
          this.user,
          this.project_id,
          this.callback
        )
      })

      it('should load the project from web', function() {
        return this.WebApiManager.joinProject
          .calledWith(this.project_id, this.user)
          .should.equal(true)
      })

      it('should join the project room', function() {
        return this.RoomManager.joinProject
          .calledWith(this.client, this.project_id)
          .should.equal(true)
      })

      it('should set the privilege level on the client', function() {
        return this.client.set
          .calledWith('privilege_level', this.privilegeLevel)
          .should.equal(true)
      })

      it("should set the user's id on the client", function() {
        return this.client.set
          .calledWith('user_id', this.user._id)
          .should.equal(true)
      })

      it("should set the user's email on the client", function() {
        return this.client.set
          .calledWith('email', this.user.email)
          .should.equal(true)
      })

      it("should set the user's first_name on the client", function() {
        return this.client.set
          .calledWith('first_name', this.user.first_name)
          .should.equal(true)
      })

      it("should set the user's last_name on the client", function() {
        return this.client.set
          .calledWith('last_name', this.user.last_name)
          .should.equal(true)
      })

      it("should set the user's sign up date on the client", function() {
        return this.client.set
          .calledWith('signup_date', this.user.signUpDate)
          .should.equal(true)
      })

      it("should set the user's login_count on the client", function() {
        return this.client.set
          .calledWith('login_count', this.user.loginCount)
          .should.equal(true)
      })

      it('should set the connected time on the client', function() {
        return this.client.set
          .calledWith('connected_time', new Date())
          .should.equal(true)
      })

      it('should set the project_id on the client', function() {
        return this.client.set
          .calledWith('project_id', this.project_id)
          .should.equal(true)
      })

      it('should set the project owner id on the client', function() {
        return this.client.set
          .calledWith('owner_id', this.owner_id)
          .should.equal(true)
      })

      it('should set the is_restricted_user flag on the client', function() {
        return this.client.set
          .calledWith('is_restricted_user', this.isRestrictedUser)
          .should.equal(true)
      })

      it('should call the callback with the project, privilegeLevel and protocolVersion', function() {
        return this.callback
          .calledWith(
            null,
            this.project,
            this.privilegeLevel,
            this.WebsocketController.PROTOCOL_VERSION
          )
          .should.equal(true)
      })

      it('should mark the user as connected in ConnectedUsersManager', function() {
        return this.ConnectedUsersManager.updateUserPosition
          .calledWith(this.project_id, this.client.id, this.user, null)
          .should.equal(true)
      })

      return it('should increment the join-project metric', function() {
        return this.metrics.inc
          .calledWith('editor.join-project')
          .should.equal(true)
      })
    })

    return describe('when not authorized', function() {
      beforeEach(function() {
        this.WebApiManager.joinProject = sinon
          .stub()
          .callsArgWith(2, null, null, null)
        return this.WebsocketController.joinProject(
          this.client,
          this.user,
          this.project_id,
          this.callback
        )
      })

      it('should return an error', function() {
        return this.callback
          .calledWith(new Error('not authorized'))
          .should.equal(true)
      })

      return it('should not log an error', function() {
        return this.logger.error.called.should.equal(false)
      })
    })
  })

  describe('leaveProject', function() {
    beforeEach(function() {
      this.DocumentUpdaterManager.flushProjectToMongoAndDelete = sinon
        .stub()
        .callsArg(1)
      this.ConnectedUsersManager.markUserAsDisconnected = sinon
        .stub()
        .callsArg(2)
      this.WebsocketLoadBalancer.emitToRoom = sinon.stub()
      this.RoomManager.leaveProjectAndDocs = sinon.stub()
      this.clientsInRoom = []
      this.io = {
        sockets: {
          clients: room_id => {
            if (room_id !== this.project_id) {
              throw 'expected room_id to be project_id'
            }
            return this.clientsInRoom
          }
        }
      }
      this.client.params.project_id = this.project_id
      this.client.params.user_id = this.user_id
      this.WebsocketController.FLUSH_IF_EMPTY_DELAY = 0
      return tk.reset()
    }) // Allow setTimeout to work.

    describe('when the project is empty', function() {
      beforeEach(function(done) {
        this.clientsInRoom = []
        return this.WebsocketController.leaveProject(this.io, this.client, done)
      })

      it('should end clientTracking.clientDisconnected to the project room', function() {
        return this.WebsocketLoadBalancer.emitToRoom
          .calledWith(
            this.project_id,
            'clientTracking.clientDisconnected',
            this.client.id
          )
          .should.equal(true)
      })

      it('should mark the user as disconnected', function() {
        return this.ConnectedUsersManager.markUserAsDisconnected
          .calledWith(this.project_id, this.client.id)
          .should.equal(true)
      })

      it('should flush the project in the document updater', function() {
        return this.DocumentUpdaterManager.flushProjectToMongoAndDelete
          .calledWith(this.project_id)
          .should.equal(true)
      })

      it('should increment the leave-project metric', function() {
        return this.metrics.inc
          .calledWith('editor.leave-project')
          .should.equal(true)
      })

      return it('should track the disconnection in RoomManager', function() {
        return this.RoomManager.leaveProjectAndDocs
          .calledWith(this.client)
          .should.equal(true)
      })
    })

    describe('when the project is not empty', function() {
      beforeEach(function() {
        this.clientsInRoom = ['mock-remaining-client']
        return this.WebsocketController.leaveProject(this.io, this.client)
      })

      return it('should not flush the project in the document updater', function() {
        return this.DocumentUpdaterManager.flushProjectToMongoAndDelete.called.should.equal(
          false
        )
      })
    })

    describe('when client has not authenticated', function() {
      beforeEach(function(done) {
        this.client.params.user_id = null
        this.client.params.project_id = null
        return this.WebsocketController.leaveProject(this.io, this.client, done)
      })

      it('should not end clientTracking.clientDisconnected to the project room', function() {
        return this.WebsocketLoadBalancer.emitToRoom
          .calledWith(
            this.project_id,
            'clientTracking.clientDisconnected',
            this.client.id
          )
          .should.equal(false)
      })

      it('should not mark the user as disconnected', function() {
        return this.ConnectedUsersManager.markUserAsDisconnected
          .calledWith(this.project_id, this.client.id)
          .should.equal(false)
      })

      it('should not flush the project in the document updater', function() {
        return this.DocumentUpdaterManager.flushProjectToMongoAndDelete
          .calledWith(this.project_id)
          .should.equal(false)
      })

      return it('should increment the leave-project metric', function() {
        return this.metrics.inc
          .calledWith('editor.leave-project')
          .should.equal(true)
      })
    })

    return describe('when client has not joined a project', function() {
      beforeEach(function(done) {
        this.client.params.user_id = this.user_id
        this.client.params.project_id = null
        return this.WebsocketController.leaveProject(this.io, this.client, done)
      })

      it('should not end clientTracking.clientDisconnected to the project room', function() {
        return this.WebsocketLoadBalancer.emitToRoom
          .calledWith(
            this.project_id,
            'clientTracking.clientDisconnected',
            this.client.id
          )
          .should.equal(false)
      })

      it('should not mark the user as disconnected', function() {
        return this.ConnectedUsersManager.markUserAsDisconnected
          .calledWith(this.project_id, this.client.id)
          .should.equal(false)
      })

      it('should not flush the project in the document updater', function() {
        return this.DocumentUpdaterManager.flushProjectToMongoAndDelete
          .calledWith(this.project_id)
          .should.equal(false)
      })

      return it('should increment the leave-project metric', function() {
        return this.metrics.inc
          .calledWith('editor.leave-project')
          .should.equal(true)
      })
    })
  })

  describe('joinDoc', function() {
    beforeEach(function() {
      this.doc_id = 'doc-id-123'
      this.doc_lines = ['doc', 'lines']
      this.version = 42
      this.ops = ['mock', 'ops']
      this.ranges = { mock: 'ranges' }
      this.options = {}

      this.client.params.project_id = this.project_id
      this.client.params.is_restricted_user = false
      this.AuthorizationManager.addAccessToDoc = sinon.stub()
      this.AuthorizationManager.assertClientCanViewProject = sinon
        .stub()
        .callsArgWith(1, null)
      this.DocumentUpdaterManager.getDocument = sinon
        .stub()
        .callsArgWith(
          3,
          null,
          this.doc_lines,
          this.version,
          this.ranges,
          this.ops
        )
      return (this.RoomManager.joinDoc = sinon.stub().callsArg(2))
    })

    describe('works', function() {
      beforeEach(function() {
        return this.WebsocketController.joinDoc(
          this.client,
          this.doc_id,
          -1,
          this.options,
          this.callback
        )
      })

      it('should check that the client is authorized to view the project', function() {
        return this.AuthorizationManager.assertClientCanViewProject
          .calledWith(this.client)
          .should.equal(true)
      })

      it('should get the document from the DocumentUpdaterManager with fromVersion', function() {
        return this.DocumentUpdaterManager.getDocument
          .calledWith(this.project_id, this.doc_id, -1)
          .should.equal(true)
      })

      it('should add permissions for the client to access the doc', function() {
        return this.AuthorizationManager.addAccessToDoc
          .calledWith(this.client, this.doc_id)
          .should.equal(true)
      })

      it('should join the client to room for the doc_id', function() {
        return this.RoomManager.joinDoc
          .calledWith(this.client, this.doc_id)
          .should.equal(true)
      })

      it('should call the callback with the lines, version, ranges and ops', function() {
        return this.callback
          .calledWith(null, this.doc_lines, this.version, this.ops, this.ranges)
          .should.equal(true)
      })

      return it('should increment the join-doc metric', function() {
        return this.metrics.inc.calledWith('editor.join-doc').should.equal(true)
      })
    })

    describe('with a fromVersion', function() {
      beforeEach(function() {
        this.fromVersion = 40
        return this.WebsocketController.joinDoc(
          this.client,
          this.doc_id,
          this.fromVersion,
          this.options,
          this.callback
        )
      })

      return it('should get the document from the DocumentUpdaterManager with fromVersion', function() {
        return this.DocumentUpdaterManager.getDocument
          .calledWith(this.project_id, this.doc_id, this.fromVersion)
          .should.equal(true)
      })
    })

    describe('with doclines that need escaping', function() {
      beforeEach(function() {
        this.doc_lines.push(['räksmörgås'])
        return this.WebsocketController.joinDoc(
          this.client,
          this.doc_id,
          -1,
          this.options,
          this.callback
        )
      })

      return it('should call the callback with the escaped lines', function() {
        const escaped_lines = this.callback.args[0][1]
        const escaped_word = escaped_lines.pop()
        escaped_word.should.equal('rÃ¤ksmÃ¶rgÃ¥s')
        // Check that unescaping works
        return decodeURIComponent(escape(escaped_word)).should.equal(
          'räksmörgås'
        )
      })
    })

    describe('with comments that need encoding', function() {
      beforeEach(function() {
        this.ranges.comments = [{ op: { c: 'räksmörgås' } }]
        return this.WebsocketController.joinDoc(
          this.client,
          this.doc_id,
          -1,
          { encodeRanges: true },
          this.callback
        )
      })

      return it('should call the callback with the encoded comment', function() {
        const encoded_comments = this.callback.args[0][4]
        const encoded_comment = encoded_comments.comments.pop()
        const encoded_comment_text = encoded_comment.op.c
        return encoded_comment_text.should.equal('rÃ¤ksmÃ¶rgÃ¥s')
      })
    })

    describe('with changes that need encoding', function() {
      it('should call the callback with the encoded insert change', function() {
        this.ranges.changes = [{ op: { i: 'räksmörgås' } }]
        this.WebsocketController.joinDoc(
          this.client,
          this.doc_id,
          -1,
          { encodeRanges: true },
          this.callback
        )

        const encoded_changes = this.callback.args[0][4]
        const encoded_change = encoded_changes.changes.pop()
        const encoded_change_text = encoded_change.op.i
        return encoded_change_text.should.equal('rÃ¤ksmÃ¶rgÃ¥s')
      })

      return it('should call the callback with the encoded delete change', function() {
        this.ranges.changes = [{ op: { d: 'räksmörgås' } }]
        this.WebsocketController.joinDoc(
          this.client,
          this.doc_id,
          -1,
          { encodeRanges: true },
          this.callback
        )

        const encoded_changes = this.callback.args[0][4]
        const encoded_change = encoded_changes.changes.pop()
        const encoded_change_text = encoded_change.op.d
        return encoded_change_text.should.equal('rÃ¤ksmÃ¶rgÃ¥s')
      })
    })

    describe('when not authorized', function() {
      beforeEach(function() {
        this.AuthorizationManager.assertClientCanViewProject = sinon
          .stub()
          .callsArgWith(1, (this.err = new Error('not authorized')))
        return this.WebsocketController.joinDoc(
          this.client,
          this.doc_id,
          -1,
          this.options,
          this.callback
        )
      })

      it('should call the callback with an error', function() {
        return this.callback.calledWith(this.err).should.equal(true)
      })

      return it('should not call the DocumentUpdaterManager', function() {
        return this.DocumentUpdaterManager.getDocument.called.should.equal(
          false
        )
      })
    })

    return describe('with a restricted client', function() {
      beforeEach(function() {
        this.ranges.comments = [{ op: { a: 1 } }, { op: { a: 2 } }]
        this.client.params.is_restricted_user = true
        return this.WebsocketController.joinDoc(
          this.client,
          this.doc_id,
          -1,
          this.options,
          this.callback
        )
      })

      return it('should overwrite ranges.comments with an empty list', function() {
        const ranges = this.callback.args[0][4]
        return expect(ranges.comments).to.deep.equal([])
      })
    })
  })

  describe('leaveDoc', function() {
    beforeEach(function() {
      this.doc_id = 'doc-id-123'
      this.client.params.project_id = this.project_id
      this.RoomManager.leaveDoc = sinon.stub()
      return this.WebsocketController.leaveDoc(
        this.client,
        this.doc_id,
        this.callback
      )
    })

    it('should remove the client from the doc_id room', function() {
      return this.RoomManager.leaveDoc
        .calledWith(this.client, this.doc_id)
        .should.equal(true)
    })

    it('should call the callback', function() {
      return this.callback.called.should.equal(true)
    })

    return it('should increment the leave-doc metric', function() {
      return this.metrics.inc.calledWith('editor.leave-doc').should.equal(true)
    })
  })

  describe('getConnectedUsers', function() {
    beforeEach(function() {
      this.client.params.project_id = this.project_id
      this.users = ['mock', 'users']
      this.WebsocketLoadBalancer.emitToRoom = sinon.stub()
      return (this.ConnectedUsersManager.getConnectedUsers = sinon
        .stub()
        .callsArgWith(1, null, this.users))
    })

    describe('when authorized', function() {
      beforeEach(function(done) {
        this.AuthorizationManager.assertClientCanViewProject = sinon
          .stub()
          .callsArgWith(1, null)
        return this.WebsocketController.getConnectedUsers(
          this.client,
          (...args) => {
            this.callback(...Array.from(args || []))
            return done()
          }
        )
      })

      it('should check that the client is authorized to view the project', function() {
        return this.AuthorizationManager.assertClientCanViewProject
          .calledWith(this.client)
          .should.equal(true)
      })

      it('should broadcast a request to update the client list', function() {
        return this.WebsocketLoadBalancer.emitToRoom
          .calledWith(this.project_id, 'clientTracking.refresh')
          .should.equal(true)
      })

      it('should get the connected users for the project', function() {
        return this.ConnectedUsersManager.getConnectedUsers
          .calledWith(this.project_id)
          .should.equal(true)
      })

      it('should return the users', function() {
        return this.callback.calledWith(null, this.users).should.equal(true)
      })

      return it('should increment the get-connected-users metric', function() {
        return this.metrics.inc
          .calledWith('editor.get-connected-users')
          .should.equal(true)
      })
    })

    describe('when not authorized', function() {
      beforeEach(function() {
        this.AuthorizationManager.assertClientCanViewProject = sinon
          .stub()
          .callsArgWith(1, (this.err = new Error('not authorized')))
        return this.WebsocketController.getConnectedUsers(
          this.client,
          this.callback
        )
      })

      it('should not get the connected users for the project', function() {
        return this.ConnectedUsersManager.getConnectedUsers.called.should.equal(
          false
        )
      })

      return it('should return an error', function() {
        return this.callback.calledWith(this.err).should.equal(true)
      })
    })

    return describe('when restricted user', function() {
      beforeEach(function() {
        this.client.params.is_restricted_user = true
        this.AuthorizationManager.assertClientCanViewProject = sinon
          .stub()
          .callsArgWith(1, null)
        return this.WebsocketController.getConnectedUsers(
          this.client,
          this.callback
        )
      })

      it('should return an empty array of users', function() {
        return this.callback.calledWith(null, []).should.equal(true)
      })

      return it('should not get the connected users for the project', function() {
        return this.ConnectedUsersManager.getConnectedUsers.called.should.equal(
          false
        )
      })
    })
  })

  describe('updateClientPosition', function() {
    beforeEach(function() {
      this.WebsocketLoadBalancer.emitToRoom = sinon.stub()
      this.ConnectedUsersManager.updateUserPosition = sinon
        .stub()
        .callsArgWith(4)
      this.AuthorizationManager.assertClientCanViewProjectAndDoc = sinon
        .stub()
        .callsArgWith(2, null)
      return (this.update = {
        doc_id: (this.doc_id = 'doc-id-123'),
        row: (this.row = 42),
        column: (this.column = 37)
      })
    })

    describe('with a logged in user', function() {
      beforeEach(function() {
        this.clientParams = {
          project_id: this.project_id,
          first_name: (this.first_name = 'Douglas'),
          last_name: (this.last_name = 'Adams'),
          email: (this.email = 'joe@example.com'),
          user_id: (this.user_id = 'user-id-123')
        }
        this.client.get = (param, callback) =>
          callback(null, this.clientParams[param])
        this.WebsocketController.updateClientPosition(this.client, this.update)

        return (this.populatedCursorData = {
          doc_id: this.doc_id,
          id: this.client.id,
          name: `${this.first_name} ${this.last_name}`,
          row: this.row,
          column: this.column,
          email: this.email,
          user_id: this.user_id
        })
      })

      it("should send the update to the project room with the user's name", function() {
        return this.WebsocketLoadBalancer.emitToRoom
          .calledWith(
            this.project_id,
            'clientTracking.clientUpdated',
            this.populatedCursorData
          )
          .should.equal(true)
      })

      it('should send the  cursor data to the connected user manager', function(done) {
        this.ConnectedUsersManager.updateUserPosition
          .calledWith(
            this.project_id,
            this.client.id,
            {
              _id: this.user_id,
              email: this.email,
              first_name: this.first_name,
              last_name: this.last_name
            },
            {
              row: this.row,
              column: this.column,
              doc_id: this.doc_id
            }
          )
          .should.equal(true)
        return done()
      })

      return it('should increment the update-client-position metric at 0.1 frequency', function() {
        return this.metrics.inc
          .calledWith('editor.update-client-position', 0.1)
          .should.equal(true)
      })
    })

    describe('with a logged in user who has no last_name set', function() {
      beforeEach(function() {
        this.clientParams = {
          project_id: this.project_id,
          first_name: (this.first_name = 'Douglas'),
          last_name: undefined,
          email: (this.email = 'joe@example.com'),
          user_id: (this.user_id = 'user-id-123')
        }
        this.client.get = (param, callback) =>
          callback(null, this.clientParams[param])
        this.WebsocketController.updateClientPosition(this.client, this.update)

        return (this.populatedCursorData = {
          doc_id: this.doc_id,
          id: this.client.id,
          name: `${this.first_name}`,
          row: this.row,
          column: this.column,
          email: this.email,
          user_id: this.user_id
        })
      })

      it("should send the update to the project room with the user's name", function() {
        return this.WebsocketLoadBalancer.emitToRoom
          .calledWith(
            this.project_id,
            'clientTracking.clientUpdated',
            this.populatedCursorData
          )
          .should.equal(true)
      })

      it('should send the  cursor data to the connected user manager', function(done) {
        this.ConnectedUsersManager.updateUserPosition
          .calledWith(
            this.project_id,
            this.client.id,
            {
              _id: this.user_id,
              email: this.email,
              first_name: this.first_name,
              last_name: undefined
            },
            {
              row: this.row,
              column: this.column,
              doc_id: this.doc_id
            }
          )
          .should.equal(true)
        return done()
      })

      return it('should increment the update-client-position metric at 0.1 frequency', function() {
        return this.metrics.inc
          .calledWith('editor.update-client-position', 0.1)
          .should.equal(true)
      })
    })

    describe('with a logged in user who has no first_name set', function() {
      beforeEach(function() {
        this.clientParams = {
          project_id: this.project_id,
          first_name: undefined,
          last_name: (this.last_name = 'Adams'),
          email: (this.email = 'joe@example.com'),
          user_id: (this.user_id = 'user-id-123')
        }
        this.client.get = (param, callback) =>
          callback(null, this.clientParams[param])
        this.WebsocketController.updateClientPosition(this.client, this.update)

        return (this.populatedCursorData = {
          doc_id: this.doc_id,
          id: this.client.id,
          name: `${this.last_name}`,
          row: this.row,
          column: this.column,
          email: this.email,
          user_id: this.user_id
        })
      })

      it("should send the update to the project room with the user's name", function() {
        return this.WebsocketLoadBalancer.emitToRoom
          .calledWith(
            this.project_id,
            'clientTracking.clientUpdated',
            this.populatedCursorData
          )
          .should.equal(true)
      })

      it('should send the  cursor data to the connected user manager', function(done) {
        this.ConnectedUsersManager.updateUserPosition
          .calledWith(
            this.project_id,
            this.client.id,
            {
              _id: this.user_id,
              email: this.email,
              first_name: undefined,
              last_name: this.last_name
            },
            {
              row: this.row,
              column: this.column,
              doc_id: this.doc_id
            }
          )
          .should.equal(true)
        return done()
      })

      return it('should increment the update-client-position metric at 0.1 frequency', function() {
        return this.metrics.inc
          .calledWith('editor.update-client-position', 0.1)
          .should.equal(true)
      })
    })
    describe('with a logged in user who has no names set', function() {
      beforeEach(function() {
        this.clientParams = {
          project_id: this.project_id,
          first_name: undefined,
          last_name: undefined,
          email: (this.email = 'joe@example.com'),
          user_id: (this.user_id = 'user-id-123')
        }
        this.client.get = (param, callback) =>
          callback(null, this.clientParams[param])
        return this.WebsocketController.updateClientPosition(
          this.client,
          this.update
        )
      })

      return it('should send the update to the project name with no name', function() {
        return this.WebsocketLoadBalancer.emitToRoom
          .calledWith(this.project_id, 'clientTracking.clientUpdated', {
            doc_id: this.doc_id,
            id: this.client.id,
            user_id: this.user_id,
            name: '',
            row: this.row,
            column: this.column,
            email: this.email
          })
          .should.equal(true)
      })
    })

    return describe('with an anonymous user', function() {
      beforeEach(function() {
        this.clientParams = {
          project_id: this.project_id
        }
        this.client.get = (param, callback) =>
          callback(null, this.clientParams[param])
        return this.WebsocketController.updateClientPosition(
          this.client,
          this.update
        )
      })

      it('should send the update to the project room with no name', function() {
        return this.WebsocketLoadBalancer.emitToRoom
          .calledWith(this.project_id, 'clientTracking.clientUpdated', {
            doc_id: this.doc_id,
            id: this.client.id,
            name: '',
            row: this.row,
            column: this.column
          })
          .should.equal(true)
      })

      return it('should not send cursor data to the connected user manager', function(done) {
        this.ConnectedUsersManager.updateUserPosition.called.should.equal(false)
        return done()
      })
    })
  })

  describe('applyOtUpdate', function() {
    beforeEach(function() {
      this.update = { op: { p: 12, t: 'foo' } }
      this.client.params.user_id = this.user_id
      this.client.params.project_id = this.project_id
      this.WebsocketController._assertClientCanApplyUpdate = sinon
        .stub()
        .yields()
      return (this.DocumentUpdaterManager.queueChange = sinon
        .stub()
        .callsArg(3))
    })

    describe('succesfully', function() {
      beforeEach(function() {
        return this.WebsocketController.applyOtUpdate(
          this.client,
          this.doc_id,
          this.update,
          this.callback
        )
      })

      it('should set the source of the update to the client id', function() {
        return this.update.meta.source.should.equal(this.client.id)
      })

      it('should set the user_id of the update to the user id', function() {
        return this.update.meta.user_id.should.equal(this.user_id)
      })

      it('should queue the update', function() {
        return this.DocumentUpdaterManager.queueChange
          .calledWith(this.project_id, this.doc_id, this.update)
          .should.equal(true)
      })

      it('should call the callback', function() {
        return this.callback.called.should.equal(true)
      })

      return it('should increment the doc updates', function() {
        return this.metrics.inc
          .calledWith('editor.doc-update')
          .should.equal(true)
      })
    })

    describe('unsuccessfully', function() {
      beforeEach(function() {
        this.client.disconnect = sinon.stub()
        this.DocumentUpdaterManager.queueChange = sinon
          .stub()
          .callsArgWith(3, (this.error = new Error('Something went wrong')))
        return this.WebsocketController.applyOtUpdate(
          this.client,
          this.doc_id,
          this.update,
          this.callback
        )
      })

      it('should disconnect the client', function() {
        return this.client.disconnect.called.should.equal(true)
      })

      it('should log an error', function() {
        return this.logger.error.called.should.equal(true)
      })

      return it('should call the callback with the error', function() {
        return this.callback.calledWith(this.error).should.equal(true)
      })
    })

    return describe('when not authorized', function() {
      beforeEach(function() {
        this.client.disconnect = sinon.stub()
        this.WebsocketController._assertClientCanApplyUpdate = sinon
          .stub()
          .yields((this.error = new Error('not authorized')))
        return this.WebsocketController.applyOtUpdate(
          this.client,
          this.doc_id,
          this.update,
          this.callback
        )
      })

      // This happens in a setTimeout to allow the client a chance to receive the error first.
      // I'm not sure how to unit test, but it is acceptance tested.
      // it "should disconnect the client", ->
      // 	@client.disconnect.called.should.equal true

      it('should log a warning', function() {
        return this.logger.warn.called.should.equal(true)
      })

      return it('should call the callback with the error', function() {
        return this.callback.calledWith(this.error).should.equal(true)
      })
    })
  })

  return describe('_assertClientCanApplyUpdate', function() {
    beforeEach(function() {
      this.edit_update = {
        op: [
          { i: 'foo', p: 42 },
          { c: 'bar', p: 132 }
        ]
      } // comments may still be in an edit op
      this.comment_update = { op: [{ c: 'bar', p: 132 }] }
      this.AuthorizationManager.assertClientCanEditProjectAndDoc = sinon.stub()
      return (this.AuthorizationManager.assertClientCanViewProjectAndDoc = sinon.stub())
    })

    describe('with a read-write client', function() {
      return it('should return successfully', function(done) {
        this.AuthorizationManager.assertClientCanEditProjectAndDoc.yields(null)
        return this.WebsocketController._assertClientCanApplyUpdate(
          this.client,
          this.doc_id,
          this.edit_update,
          error => {
            expect(error).to.be.null
            return done()
          }
        )
      })
    })

    describe('with a read-only client and an edit op', function() {
      return it('should return an error', function(done) {
        this.AuthorizationManager.assertClientCanEditProjectAndDoc.yields(
          new Error('not authorized')
        )
        this.AuthorizationManager.assertClientCanViewProjectAndDoc.yields(null)
        return this.WebsocketController._assertClientCanApplyUpdate(
          this.client,
          this.doc_id,
          this.edit_update,
          error => {
            expect(error.message).to.equal('not authorized')
            return done()
          }
        )
      })
    })

    describe('with a read-only client and a comment op', function() {
      return it('should return successfully', function(done) {
        this.AuthorizationManager.assertClientCanEditProjectAndDoc.yields(
          new Error('not authorized')
        )
        this.AuthorizationManager.assertClientCanViewProjectAndDoc.yields(null)
        return this.WebsocketController._assertClientCanApplyUpdate(
          this.client,
          this.doc_id,
          this.comment_update,
          error => {
            expect(error).to.be.null
            return done()
          }
        )
      })
    })

    return describe('with a totally unauthorized client', function() {
      return it('should return an error', function(done) {
        this.AuthorizationManager.assertClientCanEditProjectAndDoc.yields(
          new Error('not authorized')
        )
        this.AuthorizationManager.assertClientCanViewProjectAndDoc.yields(
          new Error('not authorized')
        )
        return this.WebsocketController._assertClientCanApplyUpdate(
          this.client,
          this.doc_id,
          this.comment_update,
          error => {
            expect(error.message).to.equal('not authorized')
            return done()
          }
        )
      })
    })
  })
})
