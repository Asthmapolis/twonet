var c = require('./constants');
var TwoNetAPI = require('../lib/twonet');


var hub_id = 'QUALC00100000000';
var config = c.sandbox;
var config_env = 'sandbox';

var timeCheck = function(list) {
    if( list && list.length > 0 ) {
        return new Date(list[0]);
    } else {
        return undefined;
    }
};
var api = new TwoNetAPI(c.customer_id, config.auth_key, config_env);
api.getHub(hub_id, function(err, details) {
    if( err < 0 ) {
        console.log('------- SKIP --------');
        return;
    }
    //console.dir(details);

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
            db_details.devices.configured_devices.push({
                device_id : device.deviceAddress[0],
                device_type : device.airInterfaceType[0]
            });
        });
    }
    console.dir(db_details.hub_id);
});
