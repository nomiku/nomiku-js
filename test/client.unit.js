
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

    it('should call auth if there is no userID/apiToken', sinon.test(function(done) {
      var client = new Client();
      var auth = sinon.spy(client,'auth');
      client.connect(emailCredentials)
        .then(function() {
          auth.restore();
          sinon.assert.calledOnce(auth);
          done()
        })
        .catch(done)
    }))

    it('should call getDefaultDevice if not given', sinon.test(function(done) {
      var client = new Client();
      var apiSpy = sinon.spy(client,'getDefaultDevice');
      client.connect(authCredentials)
        .then(function() {
          apiSpy.restore();
          sinon.assert.calledOnce(apiSpy);
          done();
        })
        .catch(done)
    }))

    it('should call loadDevices if there are no devices', sinon.test(function(done) {
      var client = new Client();
      var connectOptions = {
        userID:2,
        apiToken:'password',
        defaultDevice:1
      };
      var apiSpy = sinon.spy(client,'loadDevices');
      client.connect(connectOptions)
        .then(function() {
          apiSpy.restore();
          sinon.assert.calledOnce(apiSpy);
          done()
        })
        .catch(done)
    }))

    it('should call mqttClient.connect', sinon.test(function(done) {
      var client = new Client();
      var connectOptions = {
        userID:2,
        apiToken:'password',
        defaultDevice:1,
        devices:{
          10:{
            hwid:1,
            name:"this little nom"
          }
        }
      };
      var connectSpy = sinon.spy(client.mqttClient,'connect');
      client.connect(connectOptions)
        .then(function() {
          connectSpy.restore();
          sinon.assert.calledOnce(connectSpy);
          done()
        })
        .catch(done)
    }))

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

    it('should throw error if there is no userID/apiToken', function(done) {
      var client = new Client(emailCredentials);
      client.loadDevices()
        .then(() => {
          done(new Error("no error thrown"))
        })
        .catch((err) => {
          expect(err).to.be.an('error')
          done()
        });
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


    describe('#getDefaultDevice', function() {

      it('should return error if there is no userID/apiToken', function(done) {
        var client = new Client(emailCredentials);
        client.getDefaultDevice()
          .then(() => {
            done(new Error("no error thrown"))
          })
          .catch((err) => {
            expect(err).to.be.an('error')
            done()
          });
      })

      it('should call api.getDefaultDeviceID', sinon.test(function(done) {

        var client = new Client(authCredentials);

        var apiStub = this.stub(api,'getDefaultDeviceID');
        apiStub.returns(Promise.resolve({}))
        function checkStub() {
          if (apiStub.calledOnce) {
            done()
          } else {
            done(new Error("api.getDefaultDeviceID not called once"))
          }
        }
        client.getDefaultDevice()
          .then(checkStub)
          .catch(checkStub);
      }))

      it('should add defaultDevice to client', sinon.test(function(done) {

        var client = new Client(authCredentials);

        var apiStub = this.stub(api,'getDefaultDeviceID');
        var defaultDevice = 55
        apiStub.returns(Promise.resolve(defaultDevice))
        client.getDefaultDevice()
          .then(function () {
            expect(client.defaultDevice).to.equal(defaultDevice)
            done()
          })
          .catch(function (err) {
            done(err)
          });
      }))
    })
});
