var _ = require('underscore');
var TwoNetAPI = require('../lib/twonet');
var config = require('../lib/config');
var localConfig = require('./local-cli-config');

var SENSOR_TYPE = 'BTLE';
var device_list = {
    'STINGRAY' : ['F8:FE:5C:E0:00:6C']
};

// default to production environment
var env = 'production';

function kill() {
    console.log("\nUsage : \n");
    console.log("npm run register <region> <env>\"");
    console.log("    <region> region the hub is used in");
    console.log("    <env> optional environment declaration - production/sandbox. defaults to production");
    console.log("\n");
    process.exit(0);
}

if( process.argv.length < 3 || process.argv[2].toLowerCase().indexOf('help') >= 0 ) {
    kill();
}

if( process.argv.length === 4 ) {
	var argv_env = process.argv[3];
	if( argv_env === 'sandbox' ) {
		env = 'sandbox';
	} else if( argv_env !== 'production' ) {
		console.log("\nHmph. I don't recognize that environment, " + argv_env);
		kill();
	}
}

if (!config.hasOwnProperty(process.argv[2])) {
    console.log("\nHmph. I don't recognize that region, " + process.argv[2]);
    kill();
}

var region = process.argv[2];

var twoNetApi = new TwoNetAPI(localConfig[region][env].customer_id, localConfig[region][env].auth_key, region, env);

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
