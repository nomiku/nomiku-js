'use strict'

var Device = require('./Device')

if (typeof fetch === 'undefined') {
  var fetch = require('node-fetch');
}

/**
 * Creates a new Nomiku user client
 * @constructor
 * @version 1.0.0
 */
function User() {
  var self = this;
  var baseUri = 'https://eattender.com/api'
  var auth = null;
  var routes = {
    user: baseUri +'/users',
    auth: baseUri+'/users/auth',
    devices: baseUri +'/devices',
  }
  var deviceList=[]

  /**
   * Login and save API credentials
   * @async
   * @public
   * @method login
   * @alias loginWithEmail
   * @param {string} email
   * @param {string} password
   */
  this.login = this.loginWithEmail = function(email, password) {
    if (email == null || password == null) {
      return Promise.reject(new Error('Must provide email and password combo to authenticate'))
    }
    var request = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        password: password,
      }),
    };
    return fetch(routes.auth, request)
      .then( (response) => { return response.json() } )
      .then( function(response) {
        if (response.hasOwnProperty('error')) {
          return Promise.reject(new Error(response.error));
        } else {
          auth = response;
          return Promise.resolve(auth);
        }
      })
  }

  this.getAuth = function() {
    // return the saved authorization data
    return auth;
  }

  function getDeviceList() {
    // get the user's device list
    if (auth.hasOwnProperty('api_token')) {
      var request = {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Api-Token':auth.api_token
        },
      };
      return fetch(routes.devices, request)
        .then( (response) => { return response.json() } )
        .then( function(response) {
          if (response.hasOwnProperty('error')) {
            return Promise.reject(new Error(response.error));
          } else if (response.hasOwnProperty('devices')) {
            //Filter for only Nomiku devices
            deviceList=response.devices.filter((a) => { return (a.device_type===0) })
            return Promise.resolve(deviceList);
          } else {
            return Promise.reject(new Error('No devices or invalid response'));
          }
        })
    } else {
      return Promise.reject(new Error('Must be authenticated to get devices'))
    }
  }
  this.getDeviceList = getDeviceList;

  function getDefaultDeviceID() {
    if (auth.hasOwnProperty('api_token')) {
      var request = {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Api-Token': auth.api_token
        },
      };
      return fetch(routes.user + "/" + auth.user_id, request)
        .then( (response) => { return response.json() } )
        .then( function(response) {
          if (response.hasOwnProperty('error')) {
            return Promise.reject(new Error(response.error));
          } else if (response.hasOwnProperty('user') &&
                      response.user.hasOwnProperty('default_device')) {
            return Promise.resolve(response.user['default_device']);
          } else {
            return Promise.reject(new Error('Authentication failed'))
          }
        })
    } else {
      return Promise.reject(new Error('Must be authenticated to get default device'))
    }
    return
  }
  this.getDefaultDeviceID = getDefaultDeviceID;

  this.testConnection = function() {
    // attempt to fetch restricted fields to see if authorization works
    return
  }

  function getDevice(objectOrID) {
    var id;
    if (typeof(objectOrID)=='number') {
      id=objectOrID
    } else if ((objectOrID===null) || typeof(objectOrID)=='undefined') {
      return getDefaultDeviceID().then(getDevice)
    }  else if (typeof(objectOrID)=='object' && objectOrID.hasOwnProperty('id')) {
      id=objectOrID.id
    } else {
      return Promise.reject(new Error('Cannot parse argument to getDevice'))
    }

    if (!auth.hasOwnProperty('api_token')) return Promise.reject(new Error('Please authenticate before getting a device'));

    var d=new Device(id, auth)
    deviceList.forEach(function (obj) { if (obj.id==id) { d.name=obj.name; }});
    return Promise.resolve(d.getSession());
  }
  this.getDevice = getDevice

  function getAllDevices() {
    return getDeviceList()
      .then( function(diList) {
        return Promise.all(diList.map( getDevice ))
      })
  }
  this.getAllDevices = getAllDevices;

}

module.exports = User;
