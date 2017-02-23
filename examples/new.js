var NomikuClient = require("../lib/client");

//setting tokens at creation allows us to
//call the API without nomiku.connect()
var nomiku = new NomikuClient({
  userID: process.env.TENDER_ID,
  apiToken: process.env.TENDER_TOKEN
});

// for example:
nomiku.loadDevices().then(function() {
  nomiku.set(process.env.TENDER_DEVICE_ID).on();
});

nomiku.on("connect", function() {
  console.log("Connected!");
  nomiku.set().setpoint(52.0)
});

nomiku.on("close", function() {
  console.log("Disconnected");
});

nomiku.on("error", function(err) {
  console.log("Error: " + err);
});

nomiku.on("state", function(state) {
  console.log("State: " + JSON.stringify(state));
});

console.log("Connecting to Nomiku...");

//API tokens were set at construction, so we don't need any auth
//setting verboseState to true will deliver redundant or invalid
//states to the "state" event
nomiku.connect({
  verboseState: true
});
