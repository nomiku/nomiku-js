var firebase = require('firebase');

if (typeof fetch === 'undefined') {
  var fetch = require('node-fetch');
}

var config = {
  apiKey: "AIzaSyCz-hhzOpT0A2dBdSjpCYnezC-hWa6-BrI",
  authDomain: "nom-rts.firebaseapp.com",
  databaseURL: "https://nom-rts.firebaseio.com",
  storageBucket: "nom-rts.appspot.com",
};
firebase.initializeApp(config);

/**
 * Creates a new Nomiku device
 * @constructor
 * @version 1.0.0
 * @param {number} id - Device ID from Tender API
 * @param {object} auth - Authorization object from User API
 */
function Device(id,auth, name) {
  var baseUri = 'https://eattender.com/api'
  this.route = {
    get: baseUri +'/devices/'+id+'/session',
    set: baseUri +'/devices/'+id+'/set'
  }
  this.name = '';
  this._id = id;
  this._auth = auth;
  this._session = {};
}

/**
 * Get new session for device
 * @method getSession
 * @async
 * @since 1.0.0
 * @returns {Object}
 */
Device.prototype.getSession = function() {
  // create authorized Firebase credentials with Tender API
  // http://www.eattender.com/api/docs#!/devices/GET_api_devices_id_session_get_5
  var that=this;
  var request = {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Api-Token':this._auth.api_token
    },
  };
  return fetch(this.route.get, request)
    .then( (response) => { return response.json() } )
    .then( function(response) {
      if (response.hasOwnProperty('error')) {
        return Promise.reject(new Error('Unable to get device session: ' + response.error))
      } else {
        that._session=response
        return Promise.resolve(that)
      }
    });
}

/**
 * Get Nomiku device state
 * @method get
 * @async
 * @since 1.0.0
 * @param {string} [attribute] - Optional name of attribute to fetch from state server
 * @returns {Object}
 */
Device.prototype.get = function(attribute) {
  return fetch(this._session.session_base_url+this._session.session_path+"?auth="+this._session.session_token)
    .then( (res) => { return res.json() })
    .then( function (response) {
      if (response.hasOwnProperty('error')) {
        return Promise.reject(new Error('Error fetching data'))
      } else {
        if (typeof(attribute)==='undefined') {
          return Promise.resolve(response);
        } else if (response.hasOwnProperty(attribute)) {
          return Promise.resolve(response[attribute])
        } else {
          return Promise.reject(new Error('No such attribute'))
        }
      }
    })
}

/**
 * Listen for changes to device state (via Firebase)
 * @method listen
 * @async
 * @since 1.0.0
 * @param {string} [attribute] - Optional name of attribute to listen on
 * @callback refer to Firebase JS API
 */
Device.prototype.listen = function(attribute,callback) {
  // create a new Firebase reference and set the on change listener to the callback
  var api_path=this._session.session_path
  if (api_path.indexOf('.json')>0) api_path=api_path.slice(0,api_path.indexOf('.json'))
  if (typeof(attribute)==='string') api_path = api_path+"/"+attribute
  var ref=firebase.database().ref(api_path);
  var thisID=this._id
  firebase.auth().signInWithCustomToken(this._session.session_token)
    .then(ref.on('value',function(snapshot) { callback(snapshot.val(),thisID); }));
}


/**
 * Get water temperature in specified units
 * @method getTemperature
 * @async
 * @since 1.0.0
 * @param {string} units - 'F' or 'C'
 * @returns {number} temperature
 */
Device.prototype.getTemperature = function(units) {

}

/**
 * Get setpoint temperature in specified units
 * @method getTemperature
 * @async
 * @since 1.0.0
 * @param {string} units - 'F' or 'C'
 * @returns {number} temperature
 */
Device.prototype.getSetpoint = function(units) {

}

/**
 * Returns whether timer is 'paused' or 'running'
 * @method getTimerState
 * @async
 * @since 1.0.0
 * @return {string}
 */
Device.prototype.getTimerState = function() {
  // To set the timer, pass the value in seconds in the timer
  //   field of the state object.
  // The timer will start will start immediately if the value
  //   is greater than 360000s (4 days), using the value as the UNIX
  //   epoch timestamp when the timer should stop.
  // If the timer value is less than 360000s, the timer is paused
  //   and the value is stored as the time remaining in seconds.
}

/**
 * Set Nomiku device state
 * @method set
 * @async
 * @since 1.0.0
 * @param {Object} newState - Only included keys will be updated
 * @param {number} [newState[timer]] - Timer value in ms
 * @param {number} [newState[setpoint]] - New setpoint temperature in Celsius
 * @param {number} [newState[recipeId]] - Recipe ID from Tender, 0=custom recipe
 * @param {string} [newState[recipeTitle]] - Recipe title
 * @param {number} [newState[state]] - Heater state (0=off, 1=on)
 * @returns {Object}
 */
Device.prototype.set = function(newState) {
  // use Tender Set API with device ID
  // http://www.eattender.com/api/docs#!/devices/POST_api_devices_id_set_post_6
  var request = {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'X-Api-Token': this._auth.api_token
    },
    body: JSON.stringify({state:newState})
  };
  return fetch(this.route.set, request)
}

module.exports = Device;
