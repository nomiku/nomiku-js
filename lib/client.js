const mqtt = require("./mqtt");
const EventEmitter = require("events").EventEmitter;
const api = require("./api");
const fetch = require("node-fetch");

/**
 * The Nomiku Client controls the connection to the Nomiku. Descends from
 * EventEmitter
 *
 * @constructor
 *
 * Options:
 *  - `email`, tender account email (for email, password login)
 *  - `password`, tender account password (for email, password login)
 *  - `userID`, ID of the user (for token login)
 *  - `token`, API token (for token login)
 *
 * Events:
 *  - `connect`, when connected;
 *  - `reconnect`, when reconnect starts;
 *  - `close`, when disconnected;
 *  - `error`, when cannot connect;
 *  - `state`, when a new state is received;
 *    the id and state are passed as parameters.
 *  - `push`, when a new push message is received;
 *    the id and message are passed as parameters.
 *
 * @param {Object} options The option object
 * @param {Function} callback The ready callback
 */

function Client(options, callback) {
  if (!(this instanceof Client)) {
    return new Client(options, callback);
  }

  EventEmitter.call(this);

  this.options = options;
  if (options) {
    this.userID = options.userID;
    this.apiToken = options.token;
  }

  this.clientId = "nomikujs/" + Math.random().toString(36).substr(2, 8);
  this.mqttClient = new mqtt.Client(
    api.MQTT_URL,
    api.MQTT_PORT,
    this.clientId
  );
}

Client.prototype = Object.create(EventEmitter.prototype);

/**
 * Connects to server for streaming data
 *
 * @method connect
 */
Client.prototype.connect = function connect() {
  if (!(this.userID && this.apiToken)) {
    this.auth(this.options)
      .then(this.connect)
      .catch(function (error) { });
  }
  var options = this.mqttClient.connect();
};

/**
 * Gets API token from tender
 *
 * @method auth
 * @param {object} options - Info needed to auth with Tender API (email/password)
 */
Client.prototype.auth = function auth(options) {
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
    return fetch(api.routes.auth, request)
        .then(function (response)  {
          return response.json();
        })
        .then(function(response) {
          if (response.hasOwnProperty("error")) {
            return Promise.reject(new Error(response.error));
          } else {
            this.userID = response.user_id;
            this.apiToken = response.api_token;
            return Promise.resolve(response);
          }
        })
};

module.exports = Client;
