var expect = require('chai').expect;
var sinon = require('sinon');
var Device = require('../lib/device');
var lodash = require('lodash/core')

describe('Device', function() {

  var options={id:1,hwid:'asdf',name:'nomiku'}
  var goodState={
    temp:55.1,
    setpoint:65.1,
    showF:false,
    state:1,
    timerRunning:false,
    timerSecs:3600
  }
  var d;

  beforeEach(function () {
    d=new Device(options)
  })

  describe('@constructor', function() {

    it('should create an instance with the new keyword', function() {
      expect(new Device(options)).to.be.instanceOf(Device);
    });

    it('should create an instance without the new keyword', function() {
      expect(Device(options)).to.be.instanceOf(Device);
    });

  });

  describe('#getTopic', function() {
    it('should return a string', function() {
      expect(d.getTopic()).to.be.a('string');
    });
  });

  describe('#getState', function() {
    it('should return the state', function() {
      d.state=goodState;
      expect(d.getState().state).to.deep.equal(goodState);
    });

    it('should return the id', function() {
      expect(d.getState().id).to.equal(options.id);
    });

    it('should return whether the state is valid', function() {
      expect(d.getState().valid).to.be.false;
      d.state=goodState;
      expect(d.getState().valid).to.be.true;
    })

    it('should return map of provisional state', function() {
      d.state=goodState;
      expect(d.getState().provisional).to.be.an('object');
    })
  });

  describe('#updateState', function() {

    it('should call itself with timer keys if topic is timer', function() {
      var spy=sinon.spy(d,'updateState')
      spy.reset()
      d.updateState("timer","300")
      expect(spy.callCount).to.equal(3)
      spy.reset()
      d.updateState("timer",Math.round(Date.now()/1000).toString())
      expect(spy.callCount).to.equal(3)
    });

    it('should update the state if it is not provisional', function() {
      var setValue=lodash.clone(goodState)

      //these are transmitted as a single char
      setValue.showF=goodState.showF ? '1' : '0'
      setValue.timerRunning=goodState.timerRunning ? '1' : '0'
      for (key in setValue) {
        d.updateState(key,setValue[key].toString())
      }

      expect(d.state).to.deep.equal(goodState);
    });

    it('should update the confirmedState if it is provisional', function() {
      d.provisional.setpoint=true
      var value=57.0
      d.updateState("setpoint",value.toString())
      expect(d.confirmedState.setpoint).to.equal(value)
    });

    it('should remove provisional if new state matches expected state', function() {
      d.provisional.setpoint=true
      var value=57.0
      d.state.setpoint=value
      d.updateState("setpoint",value.toString())
      expect(d.provisional.setpoint).to.be.false
    });
  });

  describe('#endProvisional', function() {
    it('should copy confirmedState to state where provisional is true', function() {
      d.confirmedState=goodState
      for (key in goodState) {
        d.provisional[key]=true;
      }
      d.endProvisional();
      expect(d.state).to.deep.equal(goodState)
    });

    it('should set all provisional to false', function() {
      d.confirmedState=goodState
      for (key in goodState) {
        d.provisional[key]=true;
      }
      d.endProvisional();
      for (key in goodState) {
        expect(d.provisional[key]).to.be.false
      }
    });
  });

  describe('#_setState', function() {

    var plainStateChange={
      setpoint:65.1,
      showF:false,
      state:1
    };
    var callback=sinon.spy();
    beforeEach(function() {
      callback.reset();
    })

    it('should change state based on stateChange', function() {
      d._setState(callback,plainStateChange)
      expect(d.state).to.deep.equal(plainStateChange)
    });
    it('should set provisional based on stateChange', function() {
      d._setState(callback,plainStateChange)
      for (key in plainStateChange) {
        expect(d.provisional[key]).to.be.true
      }
    });
    it('should call the callback with state change', function() {
      d._setState(callback,plainStateChange)
      sinon.assert.calledWith(callback,sinon.match(plainStateChange))
    });
    it('should set timer key if timer related key found', function() {
      var timerStateChange={
        timerRunning:false,
        timerSecs:300
      }
      d._setState(callback,timerStateChange);
      if (timerStateChange.timerRunning) {
        expect(callback.args[0][0].timer).to.equal(timerStateChange.timerEnd)
      } else {
        expect(callback.args[0][0].timer).to.equal(timerStateChange.timerSecs)
      }
    });

  });
});
