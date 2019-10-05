"use strict";

var logme = require("logme");
var async = require("async");
var request = require("request");
var xml2js = require("xml2js");
var parser = new xml2js.Parser({ explicitArray: true });
var config = require("./config");

var debug = function() {};
if (process.env.DEBUG) {
  try {
    debug = require("debug")("twonet");
  } catch (e) {
    console.log(
      "Notice: 'debug' module is not available. This should be installed with `npm install debug` to enable debug messages",
      e
    );
    debug = function() {};
  }
}

function TwoNetAPI(customer_id, auth_key, region, env) {
  var configuration = config[region][env];

  this.api_rev = "revY";
  this.xmlns = "urn:com.twonet.sp.cuc.revisiony";

  // user's auth settings
  this.customer_id = customer_id;
  this.auth_key = auth_key;

  // environment settings from config
  this.host_name = configuration.host_name;
  this.url_path = configuration.url_path;

  this.getHubGeneration = function(hubId) {
    var gen = -1;

    if (hubId.charAt(8) === "0") {
      gen = 1;
    } else if (hubId.charAt(8) === "T") {
      gen = 2;
    }

    return gen;
  };

  this.buildPath = function(command) {
    return this.url_path + this.api_rev + command;
  };

  this.call = function(command, method, write_object, callback) {
    var options = {
      url: "https://" + this.host_name + "/" + this.buildPath(command),
      headers: {
        authKey: this.auth_key,
        customerId: this.customer_id,
        "Content-Type": "application/xml"
      },
      method: method,
      body: write_object
    };
    debug("Call " + command);
    debug(options);
    debug(write_object);

    // wrap the http request call for the retry loop
    var api_method = function(done, results) {
      request(options, function(error, response, body) {
        if (error) {
          debug("Request error: " + error);
          done(-1, {});
        } else if (response.statusCode !== 200) {
          debug(response.statusCode);
          debug(response.headers);
          done(response.statusCode, response);
        } else {
          done(null, response);
        }
      });
    };

    // qualcomm will throttle us. this retry loop is intended
    // to mitigate this hazard.
    //
    async.retry({ times: 4, interval: 2000 }, api_method, function(status_code, response) {
      // retries complete because it either worked or we've
      // hit the max retry limit.
      if (status_code && status_code !== 200) {
        logme.error("Total fail making this call go through : " + command);
        callback(status_code, response.body);
      } else {
        callback(200, response.body);
      }
    });
  };

  this.parseQCLResults = function(status, result, callback) {
    if (!result || result.indexOf(this.xmlns) < 0) {
      if (status !== 200) {
        logme.error("QCL call failed with an empty return object : " + status);
        callback(-1, {});
      } else {
        callback(0, { result: result });
      }
      return;
    }
    parser.parseString(result, function(err, jsonResult) {
      // API Error state
      if (status !== 200) {
        if (err) {
          logme.error("Unable to parse the QCL error data. Impossible!");
        } else {
          debug("QCL call error : " + status);
          debug(jsonResult);
        }
        callback(-1, {});
      } else if (err) {
        // API success but parsing failed
        logme.error("Unable to parse QCL results : " + err);
        debug(jsonResult);
        callback(-1, {});
      } else {
        callback(0, jsonResult);
      }
    });
  };

  this.createDeviceByCustomerAndModelRequest = function(model) {
    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<DeviceByCustomerAndModel xmlns="' +
      this.xmlns +
      '">' +
      "<model>" +
      model +
      "</model>" +
      "<recordRange>" +
      "<startIndex>0</startIndex>" +
      "<numberOfRecords>100</numberOfRecords>" +
      "</recordRange></DeviceByCustomerAndModel>"
    );
  };

  this.hubRequest = function(hub_id) {
    var twonetId = undefined;
    var hubGeneration = this.getHubGeneration(hub_id);

    if (hubGeneration === 1) {
      twonetId = "TWONETID";
    } else if (hubGeneration === 2) {
      twonetId = "TWONET2ID";
    }

    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<HubHardware xmlns="' +
      this.xmlns +
      '">' +
      "<hardwareId>" +
      hub_id +
      "</hardwareId>" +
      "<hardwareIdType>" +
      twonetId +
      "</hardwareIdType>" +
      "</HubHardware>"
    );
  };

  this.hubCommandRequest = function(hub_id, priority) {
    var twonetId = undefined;
    var hubGeneration = this.getHubGeneration(hub_id);

    if (hubGeneration === 1) {
      twonetId = "TWONETID";
    } else if (hubGeneration === 2) {
      twonetId = "TWONET2ID";
    }

    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<HubHealthInfoMessage xmlns="' +
      this.xmlns +
      '">' +
      "<hubHardware>" +
      "<hardwareId>" +
      hub_id +
      "</hardwareId>" +
      "<hardwareIdType>" +
      twonetId +
      "</hardwareIdType>" +
      "</hubHardware>" +
      "<priority>" +
      priority +
      "</priority>" +
      "</HubHealthInfoMessage>"
    );
  };

  this.hubDevicesRequest = function(hub_id, start, count) {
    var twonetId = undefined;
    var hubGeneration = this.getHubGeneration(hub_id);

    if (hubGeneration === 1) {
      twonetId = "TWONETID";
    } else if (hubGeneration === 2) {
      twonetId = "TWONET2ID";
    }

    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<DeviceByHub xmlns="' +
      this.xmlns +
      '">' +
      "<hub>" +
      "<HubId>" +
      hub_id +
      "</HubId>" +
      "<HubIdType>" +
      twonetId +
      "</HubIdType>" +
      "</hub>" +
      "<recordRange><startIndex>" +
      start +
      "</startIndex>" +
      "<numberOfRecords>" +
      count +
      "</numberOfRecords>" +
      "</recordRange></DeviceByHub >"
    );
  };

  this.hubHardwareRequest = function(activate, hub_id) {
    var xml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

    var twonetId = undefined;
    var hubGeneration = this.getHubGeneration(hub_id);

    if (hubGeneration === 1) {
      twonetId = "TWONETID";
    } else if (hubGeneration === 2) {
      twonetId = "TWONET2ID";
    }

    if (activate) {
      xml += '<ActivateHub xmlns="' + this.xmlns + '">';
    }
    xml +=
      '<HubHardware xmlns="' +
      this.xmlns +
      '">' +
      "<hardwareId>" +
      hub_id +
      "</hardwareId>" +
      "<hardwareIdType>" +
      twonetId +
      "</hardwareIdType>" +
      "</HubHardware>";

    if (activate) {
      xml += "</ActivateHub>";
    }
    return xml;
  };

  this.deviceRequest = function(model_name) {
    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<DeviceByCustomerAndModel xmlns="' +
      this.xmlns +
      '">' +
      "<model>" +
      model_name +
      "</model>" +
      "<recordRange>" +
      "<startIndex>0</startIndex>" +
      "<numberOfRecords>100</numberOfRecords>" +
      "</recordRange></DeviceByCustomerAndModel>"
    );
  };

  this.createDeviceRequest = function(model_name, mac, sensor_type) {
    var result =
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<AddDevice xmlns="' +
      this.xmlns +
      '">' +
      "<deviceCustomer>" +
      this.customer_id +
      "</deviceCustomer>" +
      "<deviceSerialNumber>" +
      mac +
      "</deviceSerialNumber>" +
      "<airInterfaceType>" +
      sensor_type +
      "</airInterfaceType>" +
      "<softwareVersion>1.12</softwareVersion>" +
      "<deviceModelName>" +
      model_name +
      "</deviceModelName>" +
      "<deviceAddress>" +
      mac +
      "</deviceAddress>" +
      "<deviceCommType>DIRECT</deviceCommType>";

    if (sensor_type === "BLUETOOTH") {
      result +=
        "<specification><btSpecification>" +
        "<btPairingMode>SECURE</btPairingMode>" +
        "<btPasskey>1234</btPasskey>" +
        "</btSpecification></specification>";
    }
    result += "</AddDevice>";
    return result;
  };

  this.deviceIDRequest = function(mac, sensor_type) {
    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<DeviceIdentifier xmlns="' +
      this.xmlns +
      '">' +
      "<airInterfaceAndAddress>" +
      "<deviceAddress>" +
      mac +
      "</deviceAddress>" +
      "<airInterfaceType>" +
      sensor_type +
      "</airInterfaceType>" +
      "</airInterfaceAndAddress>" +
      "</DeviceIdentifier>"
    );
  };

  this.deviceRegisterRequest = function(hub_id, mac, sensor_type) {
    var twonetId = undefined;
    var hubGeneration = this.getHubGeneration(hub_id);

    if (hubGeneration === 1) {
      twonetId = "TWONETID";
    } else if (hubGeneration === 2) {
      twonetId = "TWONET2ID";
    }

    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<RegisterDevice xmlns="' +
      this.xmlns +
      '">' +
      "<deviceIdentifier><airInterfaceAndAddress>" +
      "<deviceAddress>" +
      mac +
      "</deviceAddress>" +
      "<airInterfaceType>" +
      sensor_type +
      "</airInterfaceType>" +
      "</airInterfaceAndAddress> </deviceIdentifier>" +
      "<hub>" +
      "<HubId>" +
      hub_id +
      "</HubId>" +
      "<HubIdType>" +
      twonetId +
      "</HubIdType>" +
      "</hub>" +
      "</RegisterDevice>"
    );
  };

  this.deviceDeregisterRequest = function(model_name, mac, sensor_type) {
    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<DeviceIdentifier xmlns="' +
      this.xmlns +
      '">' +
      "<serialNumberAndModel>" +
      "<deviceSerialNumber>" +
      mac +
      "</deviceSerialNumber>" +
      "<deviceModelName>" +
      model_name +
      "</deviceModelName>" +
      "</serialNumberAndModel>" +
      "<airInterfaceAndAddress>" +
      "<deviceAddress>" +
      mac +
      "</deviceAddress>" +
      "<airInterfaceType>" +
      sensor_type +
      "</airInterfaceType>" +
      "</airInterfaceAndAddress>" +
      "</DeviceIdentifier>"
    );
  };

  this.deviceAssociationRequest = function(action, hub_id, mac, sensor_type) {
    var twonetId = undefined;
    var hubGeneration = this.getHubGeneration(hub_id);

    if (hubGeneration === 1) {
      twonetId = "TWONETID";
    } else if (hubGeneration === 2) {
      twonetId = "TWONET2ID";
    }

    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<HubToDeviceAssociation xmlns="' +
      this.xmlns +
      '">' +
      "<action>" +
      action +
      "</action>" +
      "<hub>" +
      "<HubId>" +
      hub_id +
      "</HubId>" +
      "<HubIdType>" +
      twonetId +
      "</HubIdType>" +
      "</hub>" +
      "<hubAirInterface>" +
      "<airInterfaceType>" +
      sensor_type +
      "</airInterfaceType>" +
      "<hubDeviceAddressRange>" +
      "<fromRange>" +
      mac +
      "</fromRange>" +
      "<toRange>" +
      mac +
      "</toRange>" +
      "</hubDeviceAddressRange>" +
      "</hubAirInterface>" +
      "</HubToDeviceAssociation>"
    );
  };

  this.deviceMessageRequest = function(model_name, mac, command) {
    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<DeviceMessage xmlns="' +
      this.xmlns +
      '">' +
      "<deviceIdentifier>" +
      "<serialNumberAndModel>" +
      "<deviceSerialNumber>" +
      mac.replace(/:/gi, "") +
      "</deviceSerialNumber>" +
      "<deviceModelName>" +
      model_name +
      "</deviceModelName>" +
      "</serialNumberAndModel>" +
      "</deviceIdentifier>" +
      "<message>" +
      new Buffer.alloc(command).toString("base64") +
      "</message>" +
      "<priority>true</priority>" +
      "<toDA>true</toDA>" +
      "</DeviceMessage>"
    );
  };

  this.deviceCommandTrackingRequest = function(command_id) {
    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<DeviceCommandTrackingNumber xmlns="' +
      this.xmlns +
      '">' +
      "<trackingNumber>" +
      command_id +
      "</trackingNumber>" +
      "</DeviceCommandTrackingNumber>"
    );
  };

  this.devicePassthroughUpdateRequest = function(hub_id, mac, sensor_type, key, value) {
    var twonetId = undefined;
    var hubGeneration = this.getHubGeneration(hub_id);

    if (hubGeneration === 1) {
      twonetId = "TWONETID";
    } else if (hubGeneration === 2) {
      twonetId = "TWONET2ID";
    }

    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<DevicePassthroughs xmlns="' +
      this.xmlns +
      '">' +
      "<DevicePassthroughIdentifier>" +
      "<hub>" +
      "<HubId>" +
      hub_id +
      "</HubId>" +
      "<HubIdType>" +
      twonetId +
      "</HubIdType>" +
      "</hub>" +
      "<DeviceIdentifier>" +
      "<airInterfaceAndAddress>" +
      "<deviceAddress>" +
      mac +
      "</deviceAddress>" +
      "<airInterfaceType>" +
      sensor_type +
      "</airInterfaceType>" +
      "</airInterfaceAndAddress>" +
      "</DeviceIdentifier>" +
      "</DevicePassthroughIdentifier>" +
      "<Passthroughs>" +
      "<Passthrough>" +
      "<key>" +
      key +
      "</key>" +
      "<value>" +
      value +
      "</value>" +
      "</Passthrough>" +
      "</Passthroughs>" +
      "</DevicePassthroughs>"
    );
  };

  this.deviceCommandRequest = function(hub_id, mac, sensor_type, message) {
    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<DeviceMessage xmlns="' +
      this.xmlns +
      '">' +
      "<deviceIdentifier>" +
      "<airInterfaceAndAddress>" +
      "<deviceAddress>" +
      mac +
      "</deviceAddress>" +
      "<airInterfaceType>" +
      sensor_type +
      "</airInterfaceType>" +
      "</airInterfaceAndAddress>" +
      "</deviceIdentifier>" +
      "<message>" +
      message +
      "</message>" +
      "<priority>true</priority>" +
      "</DeviceMessage>"
    );
  };
}

TwoNetAPI.prototype.changeConfig = function(region, env) {
  var configuration = config[region][env];

  this.host_name = configuration.host_name;
  this.url_path = configuration.url_path;
};

TwoNetAPI.prototype.getHubs = function(callback) {
  var api = this;
  var hubs = [];
  var hub_index = 0;
  var hub_call_count = 100;

  var record_range = function(start, count) {
    return (
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
      '<RecordRange xmlns="urn:com.twonet.sp.cuc.revisiony">' +
      "<startIndex>" +
      start +
      "</startIndex>" +
      "<numberOfRecords>" +
      count +
      "</numberOfRecords>" +
      "</RecordRange>"
    );
  };

  var do_work = function(status, result) {
    parser.parseString(result, function(err, jsonResult) {
      if (err) {
        logme.error("error: " + err);
        callback("Failed to parse results");
      } else if (!jsonResult.HubByCustomerDetails) {
        logme.error("failed to find hub results");
        logme.inspect(jsonResult);
      }
      var total_hubs = parseInt(jsonResult.HubByCustomerDetails.totalHub[0], 10);
      hubs = hubs.concat(jsonResult.HubByCustomerDetails.hubAndStatus);
      hub_index += hub_call_count;
      debug("fetching from hub list...");
      if (hub_index <= total_hubs) {
        api.call("/hub/retrieveAll", "POST", record_range(hub_index, hub_call_count), do_work);
      } else {
        var results = [];
        hubs.forEach(function(h) {
          results.push({
            hub_type: h.hub[0].HubIdType[0],
            hub_id: h.hub[0].HubId[0],
            status: h.status[0]
          });
        });
        callback(0, hubs);
      }
    });
  };

  // initiate the API call for the first batch of hubs
  this.call("/hub/retrieveAll", "POST", record_range(hub_index, hub_call_count), do_work);
};

TwoNetAPI.prototype.getHub = function(hub_id, callback) {
  var that = this;

  async.parallel(
    {
      hub_details: function(done) {
        that.call("/hub/retrieve", "POST", that.hubRequest(hub_id), function(status, details) {
          that.parseQCLResults(status, details, done);
        });
      },

      device_list: function(done) {
        that.call("/device/registeredDevices/retrieve", "POST", that.hubDevicesRequest(hub_id, 0, 100), function(
          status,
          devices
        ) {
          that.parseQCLResults(status, devices, done);
        });
      }
    },
    function(status, results) {
      if (status) {
        logme.error("getHub() tasks failed : " + status);
        callback(-1, []);
        return;
      }
      var hub_details = {};
      hub_details.HubDetails = results.hub_details.HubDetails;
      hub_details.DeviceByHubDetails = results.device_list.DeviceByHubDetails;
      callback(0, hub_details);
    }
  );
};

TwoNetAPI.prototype.activateHub = function(hub_id, callback) {
  var that = this;
  this.call("/hub/activation", "PUT", this.hubHardwareRequest(true, hub_id), function(status, result) {
    that.parseQCLResults(status, result, callback);
  });
};

TwoNetAPI.prototype.deactivateHub = function(hub_id, callback) {
  var that = this;
  this.call("/hub/deactivation", "PUT", this.hubHardwareRequest(false, hub_id), function(status, result) {
    that.parseQCLResults(status, result, callback);
  });
};

TwoNetAPI.prototype.activateHubStatus = function(hub_id, callback) {
  var that = this;
  that.call("/hub/retrieve", "POST", that.hubRequest(hub_id), function(status, details) {
    that.parseQCLResults(status, details, callback);
  });
};

TwoNetAPI.prototype.activateDevice = function(mac, sensor_type, callback) {
  var that = this;
  this.call("/device/activation", "PUT", this.deviceIDRequest(mac, sensor_type), function(status, result) {
    that.parseQCLResults(status, result, callback);
  });
};

TwoNetAPI.prototype.deactivateDevice = function(mac, sensor_type, callback) {
  var that = this;
  this.call("/device/deactivation", "PUT", this.deviceIDRequest(mac, sensor_type), function(status, result) {
    that.parseQCLResults(status, result, callback);
  });
};

TwoNetAPI.prototype.getDevice = function(mac, sensor_type, callback) {
  var that = this;
  this.call("/device/retrieve", "POST", this.deviceIDRequest(mac, sensor_type), function(status, result) {
    that.parseQCLResults(status, result, callback);
  });
};

TwoNetAPI.prototype.getDevices = function(model_name, callback) {
  var that = this;
  // var devices = [];
  this.call("/device/model/device/retrieveAll", "POST", this.deviceRequest(model_name), function(status, result) {
    that.parseQCLResults(status, result, callback);
  });
};

TwoNetAPI.prototype.createDevice = function(model_name, mac, sensor_type, callback) {
  var that = this;
  this.call("/device/create", "PUT", this.createDeviceRequest(model_name, mac, sensor_type), function(status, result) {
    that.parseQCLResults(status, result, callback);
  });
};

TwoNetAPI.prototype.registerDevice = function(hub_id, mac, sensor_type, callback) {
  var that = this;
  this.call("/device/register", "POST", this.deviceRegisterRequest(hub_id, mac, sensor_type), function(status, result) {
    that.parseQCLResults(status, result, callback);
  });
};

TwoNetAPI.prototype.deregisterDevice = function(model_name, mac, sensor_type, callback) {
  var that = this;
  this.call("/device/deregister", "POST", this.deviceDeregisterRequest(model_name, mac, sensor_type), function(
    status,
    result
  ) {
    that.parseQCLResults(status, result, callback);
  });
};

TwoNetAPI.prototype.associateDevice = function(action, hub_id, mac, sensor_type, callback) {
  var that = this;
  this.call(
    "/hub/deviceAssociation/update",
    "POST",
    this.deviceAssociationRequest(action.toUpperCase(), hub_id, mac, sensor_type),
    function(status, result) {
      that.parseQCLResults(status, result, callback);
    }
  );
};

TwoNetAPI.prototype.deviceCommand = function(command, mac, model_name, callback) {
  var that = this;
  this.call("/device/command", "PUT", that.deviceMessageRequest(model_name, mac, command), function(status, result) {
    that.parseQCLResults(status, result, callback);
  });
};

TwoNetAPI.prototype.deviceCommandStatus = function(command_id, callback) {
  var that = this;
  this.call("/device/command/status", "POST", that.deviceCommandTrackingRequest(command_id), function(status, result) {
    that.parseQCLResults(status, result, callback);
  });
};

TwoNetAPI.prototype.updateDevicePassthrough = function(hub_id, mac, sensor_type, key, value, callback) {
  var that = this;
  this.call(
    "/device/passthroughs/update",
    "POST",
    that.devicePassthroughUpdateRequest(hub_id, mac, sensor_type, key, value),
    function(status, result) {
      that.parseQCLResults(status, result, callback);
    }
  );
};

TwoNetAPI.prototype.sendDeviceCommand = function(hub_id, mac, sensor_type, message, callback) {
  var that = this;
  this.call("/device/command", "PUT", that.deviceCommandRequest(hub_id, mac, sensor_type, message), function(
    status,
    result
  ) {
    that.parseQCLResults(status, result, callback);
  });
};
module.exports = TwoNetAPI;
