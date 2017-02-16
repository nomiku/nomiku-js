
function getPahoMQTT() {
  if (!global.window) global.window=global
  if (!global.WebSocket) global.WebSocket = require('ws')
  if (!global.localStorage) {
    global.localStorage = {
      store: {},
      getItem: function (key) {
        return this.store[key]
      },
      setItem: function (key, value) {
        this.store[key] = value
      },
      removeItem: function (key) {
        delete this.store[key]
      }
    }
  }
  require('paho-mqtt');
  return Paho.MQTT
}

module.exports = getPahoMQTT()
