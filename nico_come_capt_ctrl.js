const request = require('request');

let options = {
  uri: "http://localhost:12525/start",
  headers: {
    "Content-type": "application/json",
  },
  json: {
    "c_name": process.env.HALF_WIDTH_CHANNELNAME,
    "p_name": process.env.HALF_WIDTH_NAME,
    "s_time": process.env.STARTAT,
    "e_time": process.env.ENDAT,
    "p_url": process.argv[3]
  }
};
if(process.argv[2] == 'stop')options.uri = "http://localhost:12525/stop";
request.post(options, function(error, response, body){});