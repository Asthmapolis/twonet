var config = require('../lib/config');
var TwoNetAPI = require('../lib/twonet');

function kill() {
	console.log("\nUsage : \n");
	console.log("npm run find <sensor-id> <sensor-type> <env>");
	console.log("    <sensor-id> colon separated sensor ID you're searching for");
	console.log("    <sensor-type> sensor type (usually 'BTLE')");
	console.log("    <env> optional environment declaration - production/sandbox. defaults to production");
	console.log("\n");
	process.exit(0);
}

if( process.argv.length < 4 || process.argv[2].toLowerCase().indexOf('help') >= 0 ) {
	kill();
} else {
	// default to production environment
	var env = 'production';
	if( process.argv.length === 5 ) {
		var argv_env = process.argv[4];
		if( argv_env === 'sandbox' ) {
			env = 'sandbox';
		} else if( argv_env !== 'production' ) {
			console.log("\nHmph. I don't recognize that environment, " + argv_env);
			kill();
		}
	}
	var sensor_id = process.argv[2];
	var sensor_type = process.argv[3];
}

console.log("\nSearching for, " + sensor_id + "/" + sensor_type);

var api = new TwoNetAPI(config.customer_id,config[env].auth_key,env);
api.getDevice(sensor_id, sensor_type, function(status, result) {
	console.log('status : ' + status);
	console.dir(result);
});
