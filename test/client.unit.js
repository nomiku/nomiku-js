
var expect = require('chai').expect;
var sinon = require('sinon');
var proxyquire = require('proxyquire')
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

    var clientEmailPw = new Client(emailCredentials);

    it('should call auth if there is no userID/apiToken', function() {
      var auth = sinon.spy(clientEmailPw,'auth');
      clientEmailPw.connect();
      auth.restore();
      sinon.assert.calledOnce(auth);
    })

  });

  describe('#auth', function() {
    before(function() {
      fetch = sinon.stub();
      proxyClient = proxyquire('../lib/client',{'node-fetch':fetch})
      client = new proxyClient(emailCredentials);
    })

    it('should return error without email or password', function(done) {
      var auth = client.auth({}).catch( function(err) {
        expect(err).to.be.an('error');
        done()
      })
    })

    it('should return error with bad credentials', sinon.test(function(done) {
      fetch.returns(Promise.resolve({json:() => {return {error:'not found'}}}));

      client.auth(emailCredentials)
        .then(function(result) {
          done(new Error('Did not throw error'))
        })
        .catch( function(err) {
          expect(err).to.be.an('error')
          done()
        })
    }))

    it('should set credentials in client', sinon.test(function(done) {
      var expectedEndpoint = api.routes.auth;
      var body = JSON.stringify({
          api_token: "12345",
          user_id: 2
      });
      fetch.withArgs(expectedEndpoint).returns(Promise.resolve({json:() => {return body}}));

      client.auth(emailCredentials)
        .then(function(result) {
          expect(client.apiToken).to.equal(body.api_token)
          expect(client.userId).to.equal(body.user_id)
          done()
        })
        .catch( function(err) {
          done(err)
        })
    }))
  })
});
