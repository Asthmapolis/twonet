"use strict";

var async = require("async");
var _ = require("underscore");
var TwoNetAPI = require("../lib/twonet");
var config = require("../lib/config");
var localConfig = require("./local-cli-config");

var SENSOR_TYPE = "BTLE";
var hub_id = "QUALC00100000604";
var device_list = {
  STINGRAY: ["F8:FE:5C:E0:00:6C"]
};

function kill() {
  console.log("\nUsage : \n");
  console.log("npm run provision <hub-id> <region> <env>");
  console.log("    <hub-id> ID of the hub you would like to provision");
  console.log("    <region> region the hub is used in");
  console.log("    <env> optional environment declaration - production/sandbox. defaults to production");
  console.log("\n");
  process.exit(0);
}

if (process.argv.length < 4 || process.argv[2].toLowerCase().indexOf("help") >= 0) {
  kill();
} else {
  // default to production environment
  var env = "production";
  if (process.argv.length === 5) {
    var argv_env = process.argv[4];
    if (argv_env === "sandbox") {
      env = "sandbox";
    } else if (argv_env !== "production") {
      console.log("\nHmph. I don't recognize that environment, " + argv_env);
      kill();
    }
  }

  if (!Object.prototype.hasOwnProperty.call(config, process.argv[3])) {
    console.log("\nHmph. I don't recognize that region, " + process.argv[3]);
    kill();
  }

  hub_id = process.argv[2];
  var region = process.argv[3];
}
var twoNetApi = new TwoNetAPI(localConfig[region][env].customer_id, localConfig[region][env].auth_key, region, env);

// convenience function to add a sensor to a hub
//
var provision_hub = function(hub_id, macAddr, sensor_model, callback) {
  async.series(
    [
      function(cb) {
        console.log(macAddr + " - Registering device with 2net");
        twoNetApi.createDevice(sensor_model, macAddr, SENSOR_TYPE, function(statusCode, result) {
          if (statusCode < 0) {
            console.log(
              "Failed to create device " + macAddr + " through QLC. Likely already created so we will ignore this"
            );
          }
          return cb(null);
        });
      },
      function(cb) {
        console.log(macAddr + " - Activating device with 2net");
        twoNetApi.activateDevice(macAddr, SENSOR_TYPE, function(statusCode, activateRes) {
          if (statusCode < 0) {
            var error = "Failed to activate device " + macAddr + " through QLC";
            return cb(error);
          }
          return cb(null);
        });
      },
      function(cb) {
        console.log(macAddr + " - Registering device with hub " + hub_id);
        twoNetApi.registerDevice(hub_id, macAddr, SENSOR_TYPE, function(statusCode, registerRes) {
          if (statusCode < 0) {
            var error = "Failed to register device " + macAddr + " with hub " + hub_id + " through QLC";
            return cb(error);
          }
          console.log("Successfully registered device " + macAddr + " with hub " + hub_id + " through QLC");
          return cb(null);
        });
      }
    ],
    function(error) {
      if (error) {
        console.log(error);
        callback(error, false);
      } else {
        callback(null, true);
      }
    }
  );
};

console.log("\nProvisioning hub " + hub_id + " in " + env);

var list_count = 0;
_.keys(device_list).forEach(function(device_type) {
  device_list[device_type].forEach(function(mac) {
    console.log("registering " + device_type + "/" + mac);
    list_count++;

    provision_hub(hub_id, mac, device_type, function(error, success) {
      if (--list_count === 0) {
        console.log("\ndone.");
        process.exit(0);
      }
    });
  });
});
