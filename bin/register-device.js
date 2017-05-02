var _ = require('underscore');
var TwoNetAPI = require('../lib/twonet');
var config = require('../lib/config');

// default to sandbox environment
var env = 'sandbox';
if( process.argv[2] == 'production' ) {
	env = 'production';
}
var twoNetApi = new TwoNetAPI(config.customer_id, config[env].auth_key, env);

var SENSOR_TYPE = 'BTLE';
var device_list = {
	'STINGRAY' : ['F8:FE:5C:E0:00:6C']
};

console.log('Register a list of devices in ' + env + '\n');
var list_count = 0;
_.keys(device_list).forEach(function(device_type) {
	console.log('registering ' + device_type + 's...');
	device_list[device_type].forEach(function(mac) {
		list_count++;

		console.log('\tregistering device ID ' + mac);
		twoNetApi.createDevice(device_type, mac, SENSOR_TYPE, function(status, result) {
			if( status < 0 ) {
				console.log('ERROR : Failed to create device ' + device_type + '/' + mac);
				console.dir(status);
				console.dir(result);
			}

			if( --list_count === 0 ) {
				console.log('\ndone.');
				process.exit(0);
			}
		});
	});
});
