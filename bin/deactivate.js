var async = require('async');
var TwoNetAPI = require('../lib/twonet');
var config = require('../lib/config');

// default to sandbox environment
var env = 'sandbox';
if( process.argv[2] == 'production' ) {
	env = 'production';
}
var twoNetApi = new TwoNetAPI(config.customer_id, config[env].auth_key, env);

console.log('Deactivate a list of hubs on ' + env);
console.log('... from ' + process.argv[3]);

var fs = require('fs');
var hub_list = fs.readFileSync(process.argv[3]).toString().split("\n");

console.log('Deactivating...');
async.eachSeries(hub_list,function(hub_id,cb) {
	console.log('\t'+hub_id);
	twoNetApi.deactivateHub(hub_id, function(status, result) {
		if( status < 0 ) {
			console.log('ERROR : Failed to de-activate ' + hub_id);
			console.dir(result);
		}
		cb(null);
	});
},function(err) {
	console.log('\ndone.');
	process.exit(0);
});


