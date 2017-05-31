var async = require('async');
var _ = require('underscore');
var TwoNetAPI = require('../lib/twonet');
var config = require('../lib/config');

// default to sandbox environment
var env = 'production';
if( process.argv[2] == 'sandbox' ) {
	env = 'sandbox';
}
var twoNetApi = new TwoNetAPI(config.customer_id, config[env].auth_key, env);

var SENSOR_TYPE = 'BTLE';
var hub_id = 'QUALC00100000604';
var device_list = {
	'STINGRAY' : ['F8:FE:5C:E0:00:6C']
};

// convenience function to add a sensor to a hub
//
var provision_hub = function(hub_id, macAddr, sensor_model, callback) {

	async.series([
		function(cb) {
			console.log(macAddr + ' - Registering device with 2net');
			twoNetApi.createDevice(sensor_model, macAddr, SENSOR_TYPE, function(statusCode, result) {
				if (statusCode < 0) {
					error = 'Failed to create device ' + macAddr + ' through QLC. Likely already created so we will ignore this';
				}
				return cb(null);
			});
		},
		function(cb) {
			console.log(macAddr + ' - Activating device with 2net');
			twoNetApi.activateDevice(macAddr, SENSOR_TYPE, function(statusCode, activateRes) {
				if (statusCode < 0) {
					var error = 'Failed to activate device ' + macAddr + ' through QLC';
					return cb(error);
				}
				return cb(null);
			});
		},
		function(cb) {
			console.log(macAddr + ' - Registering device with hub ' + hub_id);
			twoNetApi.registerDevice(hub_id, macAddr, SENSOR_TYPE, function(statusCode,registerRes) {
				if (statusCode < 0) {
					var error = 'Failed to register device ' + macAddr + ' with hub ' + hub_id + ' through QLC';
					return cb(error);
				}
				console.log('Successfully registered device ' + macAddr + ' with hub ' + hub_id + ' through QLC');
				return cb(null);
			});
		}
	], function(error) {
		if (error) {
			console.log(error);
			callback(error,false);
		} else {
			callback(null,true);
		}
	});
	
};


console.log('Register a list of devices in ' + env + '\n');
var list_count = 0;
_.keys(device_list).forEach(function(device_type) {
	device_list[device_type].forEach(function(mac) {
		console.log('registering ' + device_type + '/' + mac);
		list_count++;

		provision_hub(hub_id, mac, device_type, function(error,success) {
			if( --list_count === 0 ) {
				console.log('\ndone.');
				process.exit(0);
			}
		});
	});
});
