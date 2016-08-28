var nomiku = require('..');

var client = new nomiku.User;
var device;
client.login(process.env.NOMIKU_TENDER_EMAIL,process.env.NOMIKU_TENDER_PASSWORD)
  .then(
    function() {
      return client.getDevice();
    })
  .then(
    function(d) {
      device=d; d.listen('temp',console.log)
    });
