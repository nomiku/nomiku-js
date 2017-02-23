var Client=require('../lib/client')

var nomiku=new Client()

nomiku.on('state',function({state}) {
  //taking only the current state of the device
  console.log("State: "+JSON.stringify(state))
})

nomiku.connect({email:process.env.TENDER_EMAIL,
               password:process.env.TENDER_PASSWORD})

nomiku.on('connect', function() {
  nomiku.set().on();
  nomiku.set().setpoint(55.0);
})
