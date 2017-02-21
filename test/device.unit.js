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
      var d=new Device(options)
      expect(d.getTopic()).to.be.a('string');
    });
  });

  describe('#getState', function() {
    it('should return the state', function() {
      var d=new Device(options)
      d.state=goodState;
      expect(d.getState().state).to.deep.equal(goodState);
    });

    it('should return the id', function() {
      var d=new Device(options)
      expect(d.getState().id).to.equal(options.id);
    });

    it('should return whether the state is valid', function() {
      var d=new Device(options)
      expect(d.getState().valid).to.be.false;
      d.state=goodState;
      expect(d.getState().valid).to.be.true;
    })

    it('should return map of provisional state', function() {
      var d=new Device(options)
      d.state=goodState;
      expect(d.getState().provisional).to.be.an('object');
    })
  });

  describe('#updateState', function() {
    it('should call itself with json keys if topic is json', function() {
      var d=new Device(options)
      var spy=sinon.spy(d,'updateState')
      spy.reset()
      var input={
        a:1,
        b:2
      }
      d.updateState("json",JSON.stringify(input))
      expect(spy.callCount).to.equal(1+Object.keys(input).length)
    });

    it('should call itself with timer keys if topic is timer', function() {
      var d=new Device(options)
      var spy=sinon.spy(d,'updateState')
      spy.reset()
      d.updateState("timer","300")
      expect(spy.callCount).to.equal(3)
      spy.reset()
      d.updateState("timer",Math.round(Date.now()/1000).toString())
      expect(spy.callCount).to.equal(3)
    });

    it('should update the state if it is not provisional', function() {
      var d=new Device(options)
      var setValue=lodash.clone(goodState)

      //these are transmitted as a single char
      setValue.showF=goodState.showF ? '1' : '0'
      setValue.timerRunning=goodState.timerRunning ? '1' : '0'

      d.updateState("json",JSON.stringify(setValue));

      expect(d.state).to.deep.equal(goodState);
    });

    it('should update the confirmedState if it is provisional', function() {
      var d=new Device(options)
      d.provisional.setpoint=true
      var value=57.0
      d.updateState("setpoint",value.toString())
      expect(d.confirmedState.setpoint).to.equal(value)
    });

    it('should remove provisional if new state matches expected state', function() {
      var d=new Device(options)
      d.provisional.setpoint=true
      var value=57.0
      d.state.setpoint=value
      d.updateState("setpoint",value.toString())
      expect(d.provisional.setpoint).to.be.false
    });
  });
});
