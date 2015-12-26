var c = require('./constants');
var TwoNetAPI = require('../lib/twonet');

var env = 'sandbox';
var sensor_id;
var sensor_type;
console.log('process args : ' + process.argv.length);
if( process.argv.length < 4 ) {
	console.log('Whoops. You need to pass in the sensor id and sensor type (ie :  B2:22:33 BTLE)');
	process.exit(0);
} else {
	sensor_id = 'F8:FE:5C:'+process.argv[2];
	sensor_type = process.argv[3];
}

var api = new TwoNetAPI(c.customer_id, c.sandbox.auth_key, 'sandbox');
api.getDevice(sensor_id, sensor_type, function(status, result) {
	console.log('status : ' + status);
	console.dir(result);
});
