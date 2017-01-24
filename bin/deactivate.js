var TwoNetAPI = require('../lib/twonet');
var c = require('../lib/constants');

// default to sandbox environment
var env = 'sandbox';
if( process.argv[2] == 'production' ) {
	env = 'production';
}
var twoNetApi = new TwoNetAPI(config.customer_id, config[env].auth_key, env);

console.log('Deactivate a list of hubs on ' + env);
var hub_list = process.argv.slice(3);
hub_list.forEach(function(hub_id) {
	twoNetApi.deactivateHub(hub_id, function(status, result) {
		if( status < 0 ) {
			console.log('ERROR : Failed to de-activate ' + hub_id);
			console.dir(result);
		}

		if( --list_count === 0 ) {
			console.log('\ndone.');
			process.exit(0);
		}
	});
});
