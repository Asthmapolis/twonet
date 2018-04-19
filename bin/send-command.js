var config = require('../lib/config');
var localConfig = require('./local-cli-config');
var TwoNetAPI = require('../lib/twonet');

//
// Specify the command details here by 
// updating the commands array
//
var COMMAND_SIZE = 17;
var commands = [
];

function kill() {
	console.log("\nUsage : \n");
	console.log("npm run command <hub-id> <mac> <region> <env>");
	console.log("    <hub-id> ID of the hub you would like to send a command to");
	console.log("    <mac> MAC of the sensor you are targeting");
    console.log("    <region> region the hub is used in");
	console.log("    <env> optional environment declaration - production/sandbox. defaults to production");
	console.log("\n");
	process.exit(0);
}

//
// these values are assumed to come from the command line
var hub_id = 'fixme';
var mac = 'fixme';
var sensor_type = 'BTLE';
//

if( process.argv.length < 5 || process.argv[2].toLowerCase().indexOf('help') >= 0 ) {
	kill();
} else {
	// default to production environment
	var env = 'production';
	if( process.argv.length === 6 ) {
		var argv_env = process.argv[5];
		if( argv_env === 'sandbox' ) {
			env = 'sandbox';
		} else if( argv_env !== 'production' ) {
			console.log("\nHmph. I don't recognize that environment, " + argv_env);
			kill();
		}
	}

    if (!config.hasOwnProperty(process.argv[4])) {
        console.log("\nHmph. I don't recognize that region, " + process.argv[4]);
        kill();
    }

	hub_id = process.argv[2];
	mac = process.argv[3];
	var region = process.argv[4];
}

console.log('\nSending command to ' + mac + '@' + hub_id + '...');

var buf_size = commands.length * COMMAND_SIZE;
var buf = new Buffer(buf_size);
for (var k = 0; k < buf_size; k++) {
    buf.writeUInt8(0,k);
}
commands.forEach(function(c,c_index) {
    c.split(' ').forEach(function(b,i) {
        buf.writeUInt8(parseInt(b,16),(c_index*COMMAND_SIZE)+i);
    });
});
var value = buf.toString('base64');
console.log(value);

var api = new TwoNetAPI(localConfig[region][env].customer_id, localConfig[region][env].auth_key, region, env);
api.sendDeviceCommand(hub_id, mac, sensor_type, value, function(status, result) {
	console.log('status : ' + status);
	console.dir(result);
});