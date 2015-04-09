var c = require('./constants');
var TwoNetAPI = require('../lib/twonet');

var hub_id = 'QUALC00100000xxx';
var mac = 'fixme';
var sensor_type = 'BTLE';
var environment = 'sandbox';


var commands = [
];

var COMMAND_SIZE = 17;
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

var api = new TwoNetAPI(c.customer_id, c.sandbox.auth_key, environment);
api.sendDeviceCommand(hub_id, mac, sensor_type, value, function(status, result) {
	console.log('status : ' + status);
	console.dir(result);
});