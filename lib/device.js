
/**
 * The Device object manages the state of an individual device
 *
 * @constructor
 *
 * @param {object} config Object with {hwid,id,name} of device
 */

var lodash=require('lodash/core')

function Device(options) {
  if (!(this instanceof Device)) {
    return new Device(options);
  }
  this.id = options.id;
  this.hwid = options.hwid;
  this.name = options.name;

  this.lastState = {};
  this.state = {};
  this.confirmedState = {};
  this.provisional = {};
}


/**
 * Returns MQTT topic for device state
 *
 * @method getTopic
 */
Device.prototype.getTopic = function getTopic() {
  return `nom2/${this.hwid}/get/+`
}

const stateParser = {
  temp: parseFloat,
  setpoint: parseFloat,
  showF: (x) => { return (x==='1'); },
  state: parseInt,
  recipeID: parseInt,
  recipeTitle: (title) => { return title; },
  timerRunning: (x) => { return (x==='1'); },
  timerSecs: parseInt,
  timerEnd: parseInt
}

/**
 * Returns full state detail for device
 *
 * @method getState
 */
Device.prototype.getState = function getState() {
  var s=Object.hasOwnProperty.bind(this.state);
  var isValid=(s('temp') && s('setpoint') && s('showF') && s('state') && s('timerRunning') &&
          ((this.state.timerRunning && s('timerEnd')) || (!this.state.timerRunning && s('timerSecs'))));
  var isNew=!lodash.isEqual(this.lastState,this.state);
  return {
    id:this.id,
    new:isNew,
    provisional:this.provisional,
    state:this.state,
    valid:isValid
  }
}

/**
 * Update device state based on MQTT message on a topic with a payload
 *
 * @method updateState
 * @param {string} topic - Last part of split MQTT topic
 * @param {string} payload - Payload of message
 */
Device.prototype.updateState = function updateState(topic, payload) {
  this.lastState = lodash.clone(this.state);
  if (topic === 'timer') {
    let timerInt = parseInt(payload);
    if (timerInt>3000000) {
      //timer is running
      this.updateState('timerRunning', '1')
      this.updateState('timerEnd', payload)
    } else {
      //timer is not running
      this.updateState('timerRunning', '0')
      this.updateState('timerSecs', payload)
    }
  }
  if (stateParser.hasOwnProperty(topic)) {
    if (this.provisional.hasOwnProperty(topic) && this.provisional[topic]) {
      //topic is provisional, add to confirmedState object:
      this.confirmedState[topic]=stateParser[topic](payload)

      //then check if it confirms the latest provisional state
      if (this.confirmedState[topic]===this.state[topic]) {
        this.provisional[topic]=false;
      }
    } else {
      this.state[topic]=stateParser[topic](payload)
    }
  }
  return this.getState()
}

/**
 * Restore state to confirmed state
 *
 * @method endProvisional
 */
Device.prototype.endProvisional = function endProvisional() {
  this.lastState = lodash.clone(this.state);
  for (key in this.provisional) {
    if (this.provisional[key]) {
      this.state[key] = this.confirmedState[key];
      this.provisional[key] = false;
    }
  }
  return this.getState();
}

const allowSet = ['timerRunning', 'timerSecs', 'timerEnd', 'setpoint', 'recipeID', 'recipeTitle', 'showF','state']
const timerSet = ['timerRunning', 'timerSecs', 'timerEnd']

/**
 * Update device state based on set state change and return change
 *
 * @method _setState
 * @param {function} callback - Called with (updateState, fullState)
 * @param {object} stateChange - Changes to state
 */
Device.prototype._setState = function _setState(callback, stateChange) {
  this.lastState = lodash.clone(this.state);
  var setTimer=false
  var updateState={}
  for (key in stateChange) {
    if (allowSet.indexOf(key) > -1) {
      this.state[key]=stateChange[key]
      this.provisional[key]=true
      updateState[key]=stateChange[key]
    }
    if (timerSet.indexOf(key) > -1) {
      setTimer=true
    }
  }
  if (setTimer) {
    if (this.state.timerRunning) {
      updateState['timer']=this.state.timerEnd
    } else {
      updateState['timer']=this.state.timerSecs
    }
  }
  var fullState=this.getState();
  return callback(updateState, fullState)
}

/**
 * Functions to set the state. Mostly syntactic sugar on _setState.
 *
 * @method set
 * @param {function} callback - Called with (updateState, fullState)
 */
Device.prototype.set = function set(callback) {
  var setState=this._setState.bind(this,callback)
  return {
    off:() => {
      return setState({state:0})
    },
    on:() => {
      return setState({state:1})
    },
    recipe:(recipe) => {
      let newState={
        recipeID:recipe.id || 0,
        recipeTitle:recipe.title || "",
        setpoint:recipe.temp,
        state:1,
        timerRunning:false,
        timerSecs:recipe.time || 0
      }
      return setState(newState);
    },
    setpoint:(setpoint) => {
      return setState({setpoint:Math.round(setpoint*100)/100.0});
    },
    state:(state) => {
      return setState(state);
    },
    timer:{
      start:() => {
        let timerEnd=Math.round(Date.now()/1000)+this.state.timerSecs
        return setState({timerEnd:timerEnd,timerRunning:true})
      },
      stop:() => {
        let timerSecs=this.state.timerEnd - Math.round(Date.now()/1000)
        return setState({timerSecs:timerSecs,timerRunning:false});
      },
      set:(secs) => {
        return setState({timerSecs:secs,timerRunning:false});
      }
    },
    units: (unit) => {
      return setState({showF:(unit==='F')});
    }
  }
}

module.exports = Device
