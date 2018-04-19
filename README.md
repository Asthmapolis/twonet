# TwoNetAPI

An npm module that implements the Qualcomm Life 2net API. This implementation currently supports revision Y of the API.

## Methods

```js
	getHubs()
	getHub()
	activateHub()
	deactiveHub()
	activateHubStatus()
	activateDevice()
	deactivateDevice()
	getDevice()
	getDevices()
	createDevice()
	registerDevice()
	associateDevice()
	deviceCommand()
	deviceCommandStatus()
	updateDevicePassthrough()
```

## Installation

```shell
	npm install twonet
```

## Running utility scripts
The package provides several scripts for common tasks used with a fleet of hubs.

Create your local config file containing your customer id and auth key

Before using the CLI, create a your local config file `bin/local-cli-config.js`. Then add your customer_id and auth_key to the file like so:

```js
module.exports = {
	USA : {
		production: {
			customer_id : 'YOUR CUSTOMER ID',
			auth_key : 'YOUR AUTH KEY'
		},
		sandbox : {
			customer_id : 'YOUR CUSTOMER ID',
			auth_key : 'YOUR AUTH KEY'
		}
	},
	EU : {
		production: {
			customer_id : 'YOUR CUSTOMER ID',
			auth_key : 'YOUR AUTH KEY'
		}
	},
	FR : {
		production : {
			customer_id : 'YOUR CUSTOMER ID',
			auth_key : 'YOUR AUTH KEY'
		}
	}
};
```

A list of available CLI commands:
```shell
	npm run help
```

## Usage

```js
    var api = new TwoNetAPI(YOUR_CUST_ID, YOUR_AUTH_KEY, REGION, ENV);
    api.getHubs(function(status, hubs) {
        if( status < 0 ) {
            console.log('Failed api.getHubs() : ' + status);
        }
        hubs.forEach(function(h) {
            console.dir(h);
        });
    });
```
