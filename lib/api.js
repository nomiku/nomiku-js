require('es6-promise').polyfill();
require('isomorphic-fetch');

module.exports.MQTT_URL = 'mq.nomiku.com';
module.exports.MQTT_PORT = 8883;
module.exports.MQTT_SSL = true;
const TENDER_URL = 'https://www.eattender.com/api';
const routes = {
  auth:TENDER_URL+'/users/auth',
  devices:TENDER_URL+'/devices',
  user:TENDER_URL+'/users'
}
module.exports.routes = routes

/**
 * Gets API token from tender
 *
 * @method authenticate
 * @param {object} options - Info needed to auth with Tender API (email/password)
 */
module.exports.authenticate = function authenticate(options) {
    if (!(options && options.email && options.password)) {
      return Promise.reject(new Error("Must provide email and password combo to authenticate"));
    }
    var authData = { email: options.email, password: options.password };
    var request = {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(authData)
    };
    return fetch(routes.auth, request)
        .then(function (response)  {
          return response.json();
        })
        .then(function(response) {
          if (response.hasOwnProperty("error")) {
            return Promise.reject(new Error(response.error));
          } else {
            var authData={userID:response.user_id,apiToken:response.api_token}
            return Promise.resolve(authData);
          }
        })
};

/**
 * Gets device list from Tender
 *
 * @method getDevices
 * @param {object} auth - Info needed to auth with Tender API (ID/token)
 */
module.exports.getDevices = function getDevices(auth) {
    if (!(auth && auth.userID && auth.apiToken)) {
      return Promise.reject(new Error("Must provide userID and token to authenticate"));
    }
    var request = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Api-Token':auth.apiToken
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
};


/**
 * Gets default device from Tender
 *
 * @method getDefaultDeviceID
 * @param {object} auth - Info needed to auth with Tender API (ID/token)
 */
module.exports.getDefaultDeviceID = function getDefaultDeviceID(auth) {
    if (!(auth && auth.userID && auth.apiToken)) {
      return Promise.reject(new Error("Must provide userID and token to authenticate"));
    }
    var request = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Api-Token': auth.apiToken
      },
    };
    return fetch(routes.user + "/" + auth.userID, request)
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
};
