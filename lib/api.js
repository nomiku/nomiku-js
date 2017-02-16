
module.exports.MQTT_URL = 'mq.nomiku.com';
module.exports.MQTT_PORT = 8883;
const TENDER_URL = 'https://www.eattender.com/api';
module.exports.routes = {
  auth:TENDER_URL+'/users/auth',
  devices:TENDER_URL+'/devices',
  user:TENDER_URL+'/users'
}
