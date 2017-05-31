var config = require('../lib/config');
var TwoNetAPI = require('../lib/twonet');

// default to production environment
var env = 'production';
if( process.argv[2] == 'sandbox' ) {
    env = 'sandbox';
}

var sensor_id;
var sensor_type;
if( process.argv.length < 4 ) {
	console.log('Whoops. You need to pass in the sensor id and sensor type (ie :  B2:22:33 BTLE)');
	process.exit(0);
} else {
	sensor_id = 'F8:FE:5C:'+process.argv[2];
	sensor_type = process.argv[3];
}

var api = new TwoNetAPI(config.customer_id,config[env].auth_key,env);
api.getDevice(sensor_id, sensor_type, function(status, result) {
	console.log('status : ' + status);
	console.dir(result);
});
