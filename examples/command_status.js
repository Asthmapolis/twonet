var c = require('./constants');
var TwoNetAPI = require('../lib/twonet');


var tracking_number;
console.log('process args : ' + process.argv.length);
if( process.argv.length < 3 ) {
	console.log('Whoops. You need to pass in the request identifier number');
	process.exit(0);
} else {
	tracking_number = process.argv[2];
}

var api = new TwoNetAPI(c.customer_id, c.sandbox.auth_key, 'sandbox');
api.deviceCommandStatus(tracking_number, function(status, result) {
	console.log('status : ' + status);
	console.dir(result);
});