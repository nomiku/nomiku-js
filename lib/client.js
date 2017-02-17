const mqtt = require("./mqtt");
const EventEmitter = require("events").EventEmitter;
const api = require("./api");
const constants = require("./constants")

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
 */

function Client(options) {
  if (!(this instanceof Client)) {
    return new Client(options);
  }

  EventEmitter.call(this);

  this.options = options;
  if (options) {
    this.userID = options.userID;
    this.apiToken = options.token;
  }

  this.reconnectPeriod = constants.RECONNECT_PERIOD_MIN;
  this.clientId = "nomikujs/" + Math.random().toString(36).substr(2, 8);
  this.mqttClient = new mqtt.Client(
    api.MQTT_URL,
    api.MQTT_PORT,
    this.clientId
  );

  this.mqttClient.onConnectionLost = this._onDisconnected;
  this.mqttClient.onMessageArrived = this._onMessage;

  this.deviceInfo={};
  this.devices={};
}

Client.prototype = Object.create(EventEmitter.prototype);

/**
 * Connects to server for streaming data
 *
 * @method connect
 */
Client.prototype.connect = function connect() {
  if (!(this.userID && this.apiToken)) {
    return this.auth(this.options)
      .then(this.connect)
      .catch(this._onFailure);
  }
  var options={
    onFailure:this._onFailure,
    onSuccess:this._onConnect,
    password:this.apiToken,
    userName:'user/'+this.userID,
    useSSL:api.MQTT_SSL,
  }
  this.mqttClient.connect(options);
};

/**
 * Gets API token from tender
 *
 * @method auth
 * @param {object} options - Info needed to auth with Tender API (email/password)
 */
Client.prototype.auth = function auth(options) {
  let that=this;
  return api.authenticate(options)
    .then(function(response) {
      that.userID=response.userID;
      that.apiToken=response.apiToken;
      return response;
    })
};

/**
 * Gets device list from Tender
 *
 * @method loadDevices
 */
Client.prototype.loadDevices = function loadDevices() {
  if (!(this.userID && this.apiToken)) {
    return this.auth(this.options)
      .then(this.loadDevices);
  }
  api.getDevices({userID:this.userID,apiToken:this.apiToken})
    .then(function (deviceList) {
      console.log('deviceList: '+JSON.stringify(deviceList))
    })
};

/**
 * Called when MQTT is connected
 *
 * @method _onConnect
 */
Client.prototype._onConnect = function _onConnect() {
  this.emit('connect');
  this.reconnectPeriod = constants.RECONNECT_PERIOD_MIN;
  for (deviceID in this.devices) {
    var topic=this.devices[deviceID].getTopic()
    try {
      this.mqttClient.subscribe(topic);
    } catch (err) {
      //invalid state -- disconnected?
      console.log(`Subscribe to ${topic} failed, reason: ${err}`)
    }
  }
};

/**
 * Called when MQTT fails to connect
 *
 * @method _onFailure
 */
Client.prototype._onFailure = function _onFailure() {
  if (this.reconnectPeriod * 2 <= constants.RECONNECT_PERIOD_MAX) {
    this.reconnectPeriod *= 2;
  }
  this.reconnectTimer = setTimeout(this.connect, this.reconnectPeriod);
};


/**
 * Called when good MQTT connection is closed
 *
 * @method _onDisconnected
 */
Client.prototype._onDisconnected = function _onDisconnected() {
  this.emit('close')
  this.reconnectTimer = setTimeout(this.connect, this.reconnectPeriod);
};


/**
 * Called when MQTT message is received
 *
 * @method _onMessage
 */
Client.prototype._onMessage = function _onMessage(message) {

};


module.exports = Client;
