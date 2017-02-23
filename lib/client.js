const mqtt = require("./mqtt");
const EventEmitter = require("events").EventEmitter;
const api = require("./api");
const constants = require("./constants")
const Device = require("./device")
const lodash = require("lodash/core")

/**
 * The Nomiku Client controls the connection to the Nomiku. Descends from
 * EventEmitter
 *
 * @constructor
 *
 * @param {Object} options - The option object. Can also be passed to connect.
 * @param {string} options.email - tender account email (for email, password login)
 * @param {string} options.password - tender account password (for email, password login)
 * @param {string} options.userID - ID of the user (for token login)
 * @param {string} options.apiToken - API token (for token login)
 */

function Client(options) {
  if (!(this instanceof Client)) {
    return new Client();
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

  //these are called by the Paho library so need to be bound
  this.connect = this.connect.bind(this)
  this.auth = this.auth.bind(this)
  this.listen = this.listen.bind(this)
  this.set = this.set.bind(this)
  this.getDefaultDevice = this.getDefaultDevice.bind(this)
  this.loadDevices = this.loadDevices.bind(this)
  this._subscribe = this._subscribe.bind(this)
  this._onFailure = this._onFailure.bind(this)
  this._onConnect = this._onConnect.bind(this)
  this._onMessage = this._onMessage.bind(this)
  this._onDisconnected = this._onDisconnected.bind(this)
  this._setState = this._setState.bind(this)
  this._clearProvisional = this._clearProvisional.bind(this)

  this.mqttClient.onConnectionLost = this._onDisconnected;
  this.mqttClient.onMessageArrived = this._onMessage;

  //map of Tender id to device (all known)
  this.devices={};
  //map of hwid to device (all listening)
  this.listening={};
  this.provisionalTimers={};
  this.verboseState=false;

  this.connected=false;
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
 * @param {Object} options The option object
 * Options:
 * @param {string} options.email - tender account email (for email, password login)
 * @param {string} options.password - tender account password (for email, password login)
 * @param {string} options.userID - ID of the user (for token login)
 * @param {string} options.apiToken - API token (for token login)
 * @param {string|number} options.defaultDevice - (optional) default device to connect to
 * @param {array} options.devices - (optional) array of devices, {hwid,id,name}
 * @param {boolean} options.verboseState - (optional) will send state event with every message
 */
Client.prototype.connect = function connect(options) {
  if (options) {
    this.userID = options.userID || this.userID;
    this.apiToken = options.apiToken || this.apiToken;
    this.defaultDevice = options.defaultDevice || this.defaultDevice;
    this.verboseState = options.verboseState || this.verboseState;
    if (options.devices) {
      for (index in options.devices) {
        let id=options.devices[index].id
        this.devices[id]=new Device(options.devices[index])
      }
    }
  }
  var that=this;
  return callIf(!(this.userID && this.apiToken), that.auth)(options)
    .then(callIf(!this.defaultDevice,this.getDefaultDevice))
    .then(callIf(lodash.isEmpty(this.devices),this.loadDevices))
    .then(function () {
      var mqttOptions={
        onFailure:that._onFailure.bind(that),
        onSuccess:that._onConnect.bind(that),
        password:that.apiToken,
        userName:'user/'+that.userID,
        useSSL:api.MQTT_SSL,
      }
      return that.mqttClient.connect(mqttOptions);
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
            id:id,
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
  id = id.toString()
  if (this.devices.hasOwnProperty(id)) {
    let hwid=this.devices[id].hwid;
    if (!this.listening.hasOwnProperty(hwid)) {
      //add to list
      this.listening[hwid]=this.devices[id]
      //then subscribe if connected
      if (this.connected) this._subscribe(this.devices[id])
    }
    return true;
  } else {
    return new Error("Unknown device id")
  }
};

/**
 * Set state on device
 *
 * @method set
 * @param {string|number} id - Tender ID of nomiku to set
 */
Client.prototype.set = function set(id) {
  if ((!id) && (!this.defaultDevice)) return new Error("Use an ID or get default device")
  var id=id ? id.toString() : this.defaultDevice.toString();

  if (this.devices.hasOwnProperty(id)) {
    if (this.provisionalTimers[id]) {
      this.provisionalTimers[id].clearTimeout()
    }
    this.provisionalTimers[id] = setTimeout(this._clearProvisional,
                                            constants.PROVISIONAL_TIMEOUT,
                                            id);
    return this.devices[id].set(this._setState)
  } else {
    return new Error("Device not found")
  }
};

/**
 * Called when MQTT is connected
 *
 * @method _onConnect
 * @private
 */
Client.prototype._onConnect = function _onConnect() {
  /**
  * Successfully connected
  *
  * @event Client#event:connect
  */
  this.emit('connect');
  this.connected=true;
  this.reconnectPeriod = constants.RECONNECT_PERIOD_MIN;
  if (this.devices.hasOwnProperty(this.defaultDevice)) {
    let hwid=this.devices[this.defaultDevice].hwid
    this.listening[hwid]=this.devices[this.defaultDevice]
  }
  for (key in this.listening) {
    this._subscribe(this.listening[key])
  }
};

/**
 * Called when MQTT fails to connect
 *
 * @method _onFailure
 * @private
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
 * @private
 */
Client.prototype._onDisconnected = function _onDisconnected() {
  /**
  * Connection is closed
  *
  * @event Client#event:close
  */
  this.emit('close')
  this.connected=false;
  this.reconnectTimer = setTimeout(this.connect, this.reconnectPeriod);
};

/**
 * Subscribe to device
 *
 * @method _subscribe
 * @private
 */
Client.prototype._subscribe = function _subscribe(device) {
  var topic=device.getTopic()
  try {
    this.mqttClient.subscribe(topic);
  } catch (err) {
    //invalid state -- disconnected?
    console.log(`Subscribe to ${topic} failed, reason: ${err}`)
    this.emit('error', err);
  }
};

/**
 * Called when MQTT message is received
 *
 * @method _onMessage
 * @private
 */
Client.prototype._onMessage = function _onMessage(message) {
  var topicArray=message.destinationName.split('/');
  if (this.listening.hasOwnProperty(topicArray[1])) {
    if (api.MQTT_TOPICS.indexOf(topicArray[3]) > -1) {
      let newState=this.listening[topicArray[1]].updateState(topicArray[3],message.payloadString);
      if (this.verboseState || (newState.valid && newState.new)) {
        /**
        * New state
        *
        * @event Client#event:state
        * @type {object}
        * @property {number} id - Tender ID of device
        * @property {boolean} new - Indicates whether the state has been emitted before
        * @property {object} state - Latest state
        * @property {object} provisional - Dict with same keys as state, key is true if it is unconfirmed
        * @property {boolean} valid - Indicates whether the state is valid
        */
        this.emit('state', newState);
      }
    }
  }
};


/**
 * Set the state through Tender API
 *
 * @method _setState
 * @private
 */
Client.prototype._setState = function _setState(stateChange, fullState) {
  var auth={userID:this.userID,apiToken:this.apiToken};
  var id=fullState.id;
  return api.setDevice(auth,id,stateChange);
};


/**
 * Clear provisional state
 *
 * @method _setState
 * @private
 */
Client.prototype._clearProvisional = function _clearProvisional(id) {
  if (this.devices.hasOwnProperty(id)) {
    var newState = this.devices[id].endProvisional()
    this.emit('state',newState);
  }
};

module.exports = Client;
