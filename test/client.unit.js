
var expect = require('chai').expect;
var sinon = require('sinon');
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
  var clientEmailPw = new Client(emailCredentials);

  describe('#connect', function() {

    it('should call auth if there is no userID/apiToken', function() {
      var auth = sinon.spy(clientEmailPw,'auth');
      clientEmailPw.connect();
      auth.restore();
      sinon.assert.calledOnce(auth);
    })

  });

  describe('#auth', function() {
    it('should return error without email or password', function(done) {
      var auth = clientEmailPw.auth({}).catch( function(err) {
        expect(err).to.be.an('error');
        done()
      })
    })

    it('should call fetch with credentials', function(done) {
      var auth = clientEmailPw.auth(emailCredentials)
        .then(function(result) {
          done()
        })
        .catch( function(err) {
          done(err)
        })
    })
  })
});
