var async = require('async');
var TwoNetAPI = require('../lib/twonet');
var config = require('../lib/config');


function kill() {
    console.log("\nUsage : \n");
    console.log("npm run command <hub-id> <env>");
    console.log("    <hub-id> ID of the hub you would like to get status of");
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
    var hub_id = process.argv[2];
}

var timeCheck = function(list) {
    if( list && list.length > 0 ) {
        return new Date(list[0]);
    } else {
        return undefined;
    }
};
var api = new TwoNetAPI(config.customer_id, 
                        config[env].auth_key, 
                        env);
api.getHub(hub_id, function(err, details) {
    if( err < 0 ) {
        console.log('------- SKIP --------');
        return;
    }
    var hub = details.HubDetails;
    var db_details = {
        date   : new Date(),
        hub_id : hub_id,
        status : hub.status[0],
        dev_count : 0
    };

    db_details.software_id = hub.currentSoftwareId[0];
    db_details.firmware_id = hub.currentFirmwareId[0];
    db_details.software_version = hub.currentSoftwareVersion[0];
    db_details.firmware_version = hub.currentFirmwareVersion[0];
    db_details.app_version = hub.app_vers[0];
    db_details.model_name = hub.modelName[0];
    db_details.manufacture_date = timeCheck(hub.dateOfManufacture);
    db_details.activation_date = timeCheck(hub.activationTimestamp);
    db_details.last_communication_date = timeCheck(hub.lastCommTimestamp);
    db_details.last_data_upload_date = timeCheck(hub.lastDataUploadTimestamp);
    db_details.sms_trigger = (hub.triggerBySMS) ? (hub.triggerBySMS[0] === 'true') : undefined;
    db_details.devices = {
        last_heard_device : {},
        configured_devices : []
    };
    if( hub.lastDeviceCommToHub && hub.lastDeviceCommToHub.length > 0 ) {
        db_details.devices.last_heard_device.device_id = hub.lastDeviceCommToHub[0].deviceAddress[0];
        db_details.devices.last_heard_device.device_type = hub.lastDeviceCommToHub[0].airInterfaceType[0];
    }

    var device_details = details.DeviceByHubDetails;
    if( device_details && device_details.Device && device_details.Device.length > 0 ) {
        device_details.Device.forEach(function(device) {
            db_details.dev_count++;
            db_details.devices.configured_devices.push(device.deviceAddress[0] + ' :: ' + device.airInterfaceType[0]);
        });
    }
    console.dir(db_details);
});
