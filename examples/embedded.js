var nomiku = require('..');

var client = new nomiku.User;
client.login(process.env.NOMIKU_TENDER_EMAIL,process.env.NOMIKU_TENDER_PASSWORD);
