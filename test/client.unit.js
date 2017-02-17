
var expect = require('chai').expect;
var sinon = require('sinon');
var proxyquire = require('proxyquire');
var Client = require('../lib/client');
var Device = require('../lib/device');
var api = require('../lib/api');

describe('Client', function() {

  describe('@constructor', function() {

    it('should create an instance with the new keyword', function() {
      expect(new Client()).to.be.instanceOf(Client);
    });

    it('should create an instance without the new keyword', function() {
      expect(Client()).to.be.instanceOf(Client);
    });

  });


  var emailCredentials = {
    email:'email@example.com',
    password:'password'
  };

  var authCredentials = {
    userID:2,
    apiToken:'password'
  };

  describe('#connect', function() {

    it('should call auth if there is no userID/apiToken', function() {
      var client = new Client(emailCredentials);
      var auth = sinon.spy(client,'auth');
      client.connect();
      auth.restore();
      sinon.assert.calledOnce(auth);
    })

    it('should call mqttClient.connect', function() {
      var client = new Client(authCredentials);
      var auth = sinon.spy(client.mqttClient,'connect');
      client.connect();
      auth.restore();
      sinon.assert.calledOnce(auth);
    })

  });

  describe('#auth', function() {

    it('should call api.authenticate', sinon.test(function(done) {

      var client = new Client(emailCredentials);

      var authStub = this.stub(api,'authenticate');
      authStub.returns(Promise.resolve({}))
      function checkStub() {
        if (authStub.calledOnce) {
          done()
        } else {
          done(new Error("api.authenticate not called once"))
        }
      }
      client.auth(emailCredentials)
        .then(checkStub)
        .catch(checkStub);
    }))

    it('should set credentials in client', sinon.test(function(done) {

      var client = new Client(emailCredentials);

      var authStub = this.stub(api,'authenticate');
      var authResults = {
        apiToken:"1234",
        userId:2
      }
      authStub.returns(Promise.resolve(authResults))
      client.auth(emailCredentials)
        .then(function () {
          expect(client.apiToken).to.equal(authResults.apiToken)
          expect(client.userID).to.equal(authResults.userID)
          done()
        });
    }))
  })

  describe('#loadDevices', function() {

    it('should call auth if there is no userID/apiToken', function() {
      var client = new Client(emailCredentials);
      var auth = sinon.spy(client,'auth');
      client.loadDevices();
      auth.restore();
      sinon.assert.calledOnce(auth);
    })

    it('should call api.getDevices', sinon.test(function(done) {

      var client = new Client(authCredentials);

      var apiStub = this.stub(api,'getDevices');
      apiStub.returns(Promise.resolve({}))
      function checkStub() {
        if (apiStub.calledOnce) {
          done()
        } else {
          done(new Error("api.getDevices not called once"))
        }
      }
      client.loadDevices()
        .then(checkStub)
        .catch(checkStub);
    }))

    it('should add devices to client', sinon.test(function(done) {

      var client = new Client(authCredentials);

      var apiStub = this.stub(api,'getDevices');
      var apiResults = [
        {
          id:1,
          device_type:0,
          hardware_device_id:"asdf",
          name:"longname"
        }
      ]
      var expectDevice = {
          hwid:apiResults.hardware_device_id,
          name:apiResults.name
      }
      apiStub.returns(Promise.resolve(apiResults))
      client.loadDevices()
        .then(function () {
          expect(client.devices).to.have.ownProperty('1')
          expect(client.devices['1']).to.be.instanceof(Device)
          done()
        })
        .catch(function (err) {
          done(err)
        });
    }))
  })
});
