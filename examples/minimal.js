var NomikuClient = require("nomiku");

var nomiku = new NomikuClient();

nomiku.on("state", function({ state }) {
  console.log("State: " + JSON.stringify(state));
});

nomiku.connect({
  email: process.env.TENDER_EMAIL,
  password: process.env.TENDER_PASSWORD
});

nomiku.on("connect", function() {
  nomiku.set().on();
  nomiku.set().setpoint(55.0);
});
