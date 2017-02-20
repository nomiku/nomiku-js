
/**
 * The Device object manages the state of an individual device
 *
 * @constructor
 *
 * @param {object} config Object with {hwid,id,name} of device
 */

function Device(options) {
  if (!(this instanceof Device)) {
    return new Device(options);
  }
  this.id = options.id;
  this.hwid = options.hwid;
  this.name = options.name;

  this.state = {};
  this.confirmedState = {};
  this.provisional = {};
}

Device.prototype.getTopic = function getTopic() {
  return `nom2/${this.hwid}/get`
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

Device.prototype.isStateValid = function isStateValid() {
  var s=this.state.hasOwnProperty;
  return (s('temp') && s('setpoint') && s('showF') && s('state') && s('timerRunning') &&
          ((this.state.timerRunning && s('timerEnd')) || (!this.state.timerRunning && s('timerSecs'))))
}

Device.prototype.updateState = function updateState(topic, payload) {
  if (topic === 'json') {
    try {
      let parsedPayload = JSON.stringify(payload)
      let latestState;
      for (key in parsedPayload) {
        this.updateState(key, parsedPayload[key].toString())
      }
    } catch (err) {
      //state could not be parsed
      return new Error("Invalid payload: "+err);
    }
  }
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
  return {
    id:this.id,
    provisional:this.provisional,
    state:this.state,
    valid:this.isStateValid()
  }
}

const allowSet = ['timerRunning', 'timerSecs', 'timerEnd', 'setpoint', 'recipeID', 'recipeTitle', 'showF','state']

Device.prototype.setState = function setState(callback, stateChange) {
  for (key in stateChange) {
    if (allowSet.indexOf(key) > -1) {
      this.state[key]=stateChange[key]
      this.provisional[key]=true
    }
  }
  var fullState={
    id:this.id,
    provisional:this.provisional,
    state:this.state,
    valid:this.isStateValid()
  }
  callback(stateChange, fullState)
}

Device.prototype.set = function set(callback) {
  var setState=this.setState.bind(this,callback)
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
        recipeTitle:recipe.title,
        setpoint:recipe.temp,
        state:1,
        timerRunning:false,
        timerSecs:recipe.time,
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
