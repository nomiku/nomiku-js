
var expect = require('chai').expect;
var sinon = require('sinon');
var proxyquire = require('proxyquire')
var api = require('../lib/api');
const fetchMock = require('fetch-mock')

describe('api', function() {

  var emailCredentials = {
    email:'email@example.com',
    password:'password'
  };

  afterEach(function() {
    fetchMock.restore();
  })

  describe('#authenticate', function() {


    it('should return error without email or password', function(done) {
      var auth = api.authenticate({}).catch( function(err) {
        expect(err).to.be.an('error');
        done()
      })
    })

    it('should supply the right arguments to fetch', function(done) {
      fetchMock.post(api.routes.auth, {error:'not found'})

      function checkFetch(arg) {
        var options=fetchMock.lastOptions()
        var body=JSON.parse(options.body)
        expect(body).to.deep.equal(emailCredentials)
        done()
      }
      api.authenticate(emailCredentials)
        .then(checkFetch)
        .catch(checkFetch)
    })

    it('should reject if fetch returns error', sinon.test(function(done) {
      fetchMock.post(api.routes.auth, {error:'not found'})

      api.authenticate(emailCredentials)
        .then((response) => {
          done(new Error('No error thrown'))
        })
        .catch((error) => {
          expect(error).to.be.an('error')
          done()
        })
    }))

    it('should return expected result', sinon.test(function(done) {
      var fetchResult={
        user_id:2,
        api_token:"hello"
      }
      var expectedResult={
        userID:fetchResult.user_id,
        apiToken:fetchResult.api_token
      }
      fetchMock.post(api.routes.auth, fetchResult)

      api.authenticate(emailCredentials)
        .then((response) => {
          expect(response).to.deep.equal(expectedResult)
          done()
        })
        .catch((error) => {
          done(error)
        })
    }))
  })
});
