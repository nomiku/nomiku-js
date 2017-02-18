const mqtt = require("./mqtt");
const EventEmitter = require("events").EventEmitter;
const api = require("./api");
const constants = require("./constants")
const Device = require("./device")
const lodash = require("lodash")

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
 *  - `apiToken`, API token (for token login)
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
    this.apiToken = options.apiToken;
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

  this.devices={};
}

Client.prototype = Object.create(EventEmitter.prototype);

function callIf(test, callback) {
  //assert(typeof callback === 'function')
  if (test) return callback
  else return function(arg) {
    return Promise.resolve(arg);
  }
}

/**
 * Connects to server for streaming data
 *
 * @method connect
 */
Client.prototype.connect = function connect() {
  var that=this;
  return callIf(!(this.userID && this.apiToken), this.auth)(this.options)
    .then(function () {
      var options={
        onFailure:that._onFailure,
        onSuccess:that._onConnect,
        password:that.apiToken,
        userName:'user/'+that.userID,
        useSSL:api.MQTT_SSL,
      }
      return that.mqttClient.connect(options);
    })
    .catch(this._onFailure)
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
    return Promise.reject(new Error("Not authenticated"));
  }
  var that=this;
  return api.getDevices({userID:this.userID,apiToken:this.apiToken})
    .then(function (deviceList) {
      for (index in deviceList) {
        var id=deviceList[index].id.toString()
        that.devices[id]=new Device({
          hwid:deviceList[index].hardware_device_id,
          name:deviceList[index].name
        })
      }
      return that.devices
    })
};

/**
 * Gets default device from Tender
 *
 * @method getDefaultDevice
 */
Client.prototype.getDefaultDevice = function getDefaultDevice() {
  if (!(this.userID && this.apiToken)) {
    return Promise.reject(new Error("Not authenticated"));
  }
  var that=this;
  return api.getDefaultDeviceID({userID:this.userID,apiToken:this.apiToken})
    .then(function (defaultDevice) {
      that.defaultDevice = defaultDevice
      return defaultDevice
    })
};

/**
 * Listens for state on device
 *
 * @method listen
 * @param {string|number} id - Tender ID of nomiku to listen to
 */
Client.prototype.listen = function listen(id) {
  if (!(this.userID && this.apiToken)) {
    return Promise.reject(new Error("Not authenticated"));
  }
  id = id || this.defaultDevice
  var that=this;
  return callIf(!id,this.getDefaultDevice)()
    .then(callIf(lodash.isEmpty(this.devices),this.loadDevices))
    .then(function () {
      id = id || that.defaultDevice
      if (!(that.devices.hasOwnProperty(id.toString()))) {
        return Promise.reject(new Error("No such device found"))
      }

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
