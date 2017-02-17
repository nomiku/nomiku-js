
var expect = require('chai').expect;
var sinon = require('sinon');
var proxyquire = require('proxyquire')
var api = require('../lib/api');

describe('api', function() {

  var emailCredentials = {
    email:'email@example.com',
    password:'password'
  };

  describe('#authenticate', function() {
    before(function() {
      fetch = sinon.stub();
      proxyAPI = proxyquire('../lib/api',{'node-fetch':fetch})
    })

    it('should return error without email or password', function(done) {
      var auth = proxyAPI.authenticate({}).catch( function(err) {
        expect(err).to.be.an('error');
        done()
      })
    })

    it('should return error with bad credentials', sinon.test(function(done) {
      fetch.returns(Promise.resolve({json:() => {return {error:'not found'}}}));

      proxyAPI.authenticate(emailCredentials)
        .then(function(result) {
          done(new Error('Did not throw error'))
        })
        .catch( function(err) {
          expect(err).to.be.an('error')
          done()
        })
    }))
  })
});
