
var expect = require('chai').expect;
var sinon = require('sinon');
var proxyquire = require('proxyquire');
var Client = require('../lib/client');
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
});
