var Client=require('../lib/client')
var nomiku=new Client()
nomiku.on('connect',function() {
  console.log("Connected!")
  nomiku.listen(1914)
})
nomiku.on('close',function() {
  console.log("Disconnected")
})
nomiku.on('error',function(err) {
  console.log("Error: "+err)
})
nomiku.on('state',function(state) {
  console.log("State: "+JSON.stringify(state))
})
console.log("Connecting to Nomiku...")
nomiku.connect({userID:process.env.TENDER_ID,
               apiToken:process.env.TENDER_TOKEN})

//or:
// nomiku.connect({email:process.env.TENDER_EMAIL,
//                password:process.env.TENDER_PASSWORD})
