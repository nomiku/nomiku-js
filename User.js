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
    return auth;
  }
  
  this.getAllDevices = function() {
    var request = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
    },
  }
  
  this.getDefaultDevice = function(onSuccess, onFailure) {
    return
  }
  
  this.get = function(onSuccess, onFailure) {
    return
  }
  
  this.set = function(onSuccess, onFailure) {
    return
  }
  
  this.setProp = function(prop, value, onSuccess, onFailure) {
    return
  }
  
  
  this.getTokenWithEmail = function(email, password, onSuccess, onFailure) {
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
          throw(response.error);
        } else {
          var token = response.api_token;
          var id = response.user_id;
          onSuccess(token,id)
        }
      })
      .catch(onFailure)
  }
  
  this.testConnection = function() {
    return
  }
  
}

var user = new User;

module.exports = User;