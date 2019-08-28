# twonet

An npm module that implements the Qualcomm Life 2net API. This implementation currently supports revision Y of the API.

## Installation

Using NPM: `npm install -P -E @asthmapolis/twonet@latest`

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
deregisterDevice()
associateDevice()
deviceCommand()
deviceCommandStatus()
updateDevicePassthrough()
```

## Running utility scripts

The package provides several scripts for common tasks used with a fleet of hubs.

Before using the CLI, create a your local config file `bin/local-cli-config.js` and add your customer_id and auth_key like so:

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
	npm run local:help
```

## ChangeLog

See [`CHANGELOG.md`](https://github.com/Asthmapolis/twonet/blob/master/CHANGELOG.md)

## Development

See [`CONTRIBUTING.md`](https://github.com/Asthmapolis/twonet/blob/master/CONTRIBUTING.md)

* * *
