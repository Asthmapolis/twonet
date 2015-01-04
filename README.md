#TwoNetAPI

An npm module that implements the Qualcomm Life 2net API. This implementation currently supports revision V of the API.

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
```

## Installation

```shell
	npm install twonet
```

## Running
A list of available CLI commands:
```shell
	npm run help
```

## Usage

```js
    var api = new TwoNetAPI(YOUR_CUST_ID, YOUR_AUTH_KEY, ENV);
    api.getHubs(function(status, hubs) {
        if( status < 0 ) {
            console.log('Failed api.getHubs() : ' + status);
        }
        hubs.forEach(function(h) {
            console.dir(h);
        });
    });
```