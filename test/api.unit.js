
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


  describe('#authenticate', function() {

    afterEach(function() {
      fetchMock.restore();
    })

    it('should return error without email or password', function(done) {
      var auth = api.authenticate({}).catch( function(err) {
        expect(err).to.be.an('error');
        done()
      })
    })

    it('should supply the right arguments to fetch', function(done) {
      fetchMock.post(api.routes.auth, {error:'not found'})

      function checkFetch(arg) {
        var body=JSON.parse(fetchMock.lastOptions().body)
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

    it('should return result from fetch', sinon.test(function(done) {
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


  var authCredentials = {
    userID:2,
    apiToken:'password'
  };


  describe('#getDevices', function() {

    afterEach(function() {
      fetchMock.restore();
    })

    it('should return error without userID or token', function(done) {
      var auth = api.getDevices({}).catch( function(err) {
        expect(err).to.be.an('error');
        done()
      })
    })

    it('should fetch the right endpoint', function(done) {
      fetchMock.get(api.routes.devices, {error:'not found'})

      function checkFetch(arg) {
        expect(fetchMock.called())
        done()
      }
      api.getDevices(authCredentials)
        .then(checkFetch)
        .catch(checkFetch)
    })

    it('should reject if fetch returns error', sinon.test(function(done) {
      fetchMock.get(api.routes.devices, {error:'not found'})

      api.getDevices(authCredentials)
        .then((response) => {
          done(new Error('No error thrown'))
        })
        .catch((error) => {
          expect(error).to.be.an('error')
          done()
        })
    }))

    it('should return result from fetch', sinon.test(function(done) {
      var fetchResult={
        devices:[
          {
            id:1,
            device_type:0,
            hardware_device_id:"asdf",
            name:"longname"
          },
          {
            id:2,
            device_type:1,
            hardware_device_id:"bbbb",
            name:"somename"
          }
        ]
      }
      var expectedResult=fetchResult.devices.filter((a) => { return (a.device_type===0) })
      fetchMock.get(api.routes.devices, fetchResult)

      api.getDevices(authCredentials)
        .then((response) => {
          expect(response).to.deep.equal(expectedResult)
          done()
        })
        .catch((error) => {
          done(error)
        })
    }))
  })


  describe('#getDefaultDeviceID', function() {

    var expectedRoute=api.routes.user + "/" + authCredentials.userID

    afterEach(function() {
      fetchMock.restore();
    })

    it('should return error without userID or token', function(done) {
      var auth = api.getDefaultDeviceID({}).catch( function(err) {
        expect(err).to.be.an('error');
        done()
      })
    })

    it('should fetch the right endpoint', function(done) {
      fetchMock.get(expectedRoute, {error:'not found'})

      function checkFetch(arg) {
        expect(fetchMock.called())
        done()
      }
      api.getDefaultDeviceID(authCredentials)
        .then(checkFetch)
        .catch(checkFetch)
    })

    it('should reject if fetch returns error', sinon.test(function(done) {
      fetchMock.get(expectedRoute, {error:'not found'})

      api.getDefaultDeviceID(authCredentials)
        .then((response) => {
          done(new Error('No error thrown'))
        })
        .catch((error) => {
          expect(error).to.be.an('error')
          done()
        })
    }))

    it('should return result from fetch', sinon.test(function(done) {
      var fetchResult={
        user:{
          default_device:12
        }
      }
      var expectedResult=fetchResult.user.default_device
      fetchMock.get(expectedRoute, fetchResult)

      api.getDefaultDeviceID(authCredentials)
        .then((response) => {
          expect(response).to.equal(expectedResult)
          done()
        })
        .catch((error) => {
          done(error)
        })
    }))
  })

  describe('#setDevice', function() {

    afterEach(function() {
      fetchMock.restore();
    })

    it('should return error without userID or token', function(done) {
      var auth = api.setDevice({},1,{}).catch( function(err) {
        expect(err).to.be.an('error');
        done()
      })
    })

    it('should fetch the right endpoint', function(done) {
      var expectedRoute = api.routes.devices + '/1/set'
      fetchMock.post(expectedRoute, {error:'not found'})

      function checkFetch(arg) {
        expect(fetchMock.called())
        done()
      }
      api.setDevice(authCredentials,1,{})
        .then(checkFetch)
        .catch(checkFetch)
    })

  })
});
