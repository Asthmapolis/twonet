var async = require('async');
var fs = require('fs');
var prompt = require('prompt');

var TwoNetAPI = require('../lib/twonet');
var config = require('../lib/config');

function kill() {
	console.log("\nUsage : \n");
	console.log("node bin/deactivate.js <hub-file> <env>");
	console.log("    <hub-file> is a text file containing hub IDs on each line");
	console.log("    <env> optional environment declaration - production/sandbox. defaults to production");
	console.log("\n");
	process.exit(0);
}

if( process.argv.length < 3 || process.argv[2].toLowerCase().indexOf('help') >= 0 ) {
	kill();
} else {
	// default to production environment
	var env = 'production';
	if( process.argv.length === 4 ) {
		var argv_env = process.argv[3];
		if( argv_env === 'sandbox' ) {
			env = 'sandbox';
		} else if( argv_env !== 'production' ) {
			console.log("\nHmph. I don't recognize that environment, " + argv_env);
			kill();
		}
	}
	var filename = process.argv[2];
	try {
        var hub_list = fs.readFileSync(filename).toString().split("\n");
    } catch( exception ) {
    	if( exception.code === 'ENOENT' ) {
            console.log('\nUnable to find and open, ' + exception.path);
    	} else {
    		console.dir(exception);
    	}
    	kill();
    }
}

console.log('\n*** You are about to deactivate ' + hub_list.length + ' hubs *** ');

prompt.start();
prompt.message = '';
prompt.delimiter = '';
prompt.get({
    properties: {
        
        // setup the dialog
        confirm: {
            // allow yes, no, y, n, YES, NO, Y, N as answer
            pattern: /^(yes|no|y|n)$/gi,
            description: 'Are you sure you want to *deactivate* these hubs?',
            message: 'Type yes/no',
            required: true,
            default: 'no'
        }
    }

}, function(err, result) {
	var twoNetApi = new TwoNetAPI(config.customer_id, config[env].auth_key, env);
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
	}
);




