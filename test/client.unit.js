
var expect = require('chai').expect;
var sinon = require('sinon');
var proxyquire = require('proxyquire');
var Client = require('../lib/client');

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

  describe('#connect', function() {

    var client = new Client(emailCredentials);

    it('should call auth if there is no userID/apiToken', function() {
      var auth = sinon.spy(client,'auth');
      client.connect();
      auth.restore();
      sinon.assert.calledOnce(auth);
    })

  });

  describe('#auth', function() {

    it('should set credentials in client', sinon.test(function(done) {

    }))
  })
});
