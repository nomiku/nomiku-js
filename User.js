'use strict'

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
        'Content-Type': 'application/json',
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
  
  this.getAllDevices = function() {
    var request = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    }
    // get the user's device list
  }
  
  this.getDefaultDevice = function() {
    return
  }
  
  this.testConnection = function() {
    // attempt to fetch restricted fields to see if authorization works
    return
  }
  
  this.getDevice = function(id) {
    
    // create authorized Firebase credentials with Tender API
    // http://www.eattender.com/api/docs#!/devices/GET_api_devices_id_session_get_5
    var session = null;
    
    return new Device(id, auth,session)
  }
  
}

module.exports = User;