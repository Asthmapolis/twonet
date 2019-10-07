"use strict";

const fs = require("fs");
const csv = require("csv-parser");
const async = require("async");
const config = require("../lib/config");
const localConfig = require("./local-cli-config");
const TwoNetAPI = require("../lib/twonet");

const sensor_type = "BTLE";

//
// Specify the command details here by
// updating the commands array
//
const COMMAND_SIZE = 17;
const commands = [];

function kill() {
  console.log("\nUsage : \n");
  console.log("npm run command-bulk <csv-file> <region> <env> <command>");
  console.log("    <csv-file> location of csv file to load. should have hub-id and mac columns");
  console.log("    <region> region the hub is used in");
  console.log("    <env> optional environment declaration - production/sandbox. defaults to production");
  console.log(
    "    <command> optional command in base64 to send to sensor. else set up the commands array in this file"
  );
  console.log("\n");
  process.exit(0);
}

//
// these values are assumed to come from the command line
let region = process.argv[3] ? process.argv[3] : "USA";
let env = process.argv[4] ? process.argv[4] : "production";
let command = process.argv[5] ? process.argv[5] : undefined;

if (process.argv.length < 5 || process.argv[2].toLowerCase().indexOf("help") >= 0) {
  kill();
} else {
  // region check
  if (!Object.keys(localConfig).includes(region)) {
    console.log(
      `\nHmph. I don't reconize ${region} from your local-cli-config file. Valid regions: ${Object.keys(localConfig)}`
    );
    kill();
  }

  // environment check
  if (!Object.keys(localConfig[region]).includes(env)) {
    console.log(
      `\nHmph. I don't reconize ${env} from your local-cli-config file. Valid regions: ${Object.keys(
        localConfig[region]
      )}`
    );
    kill();
  }

  // config + region check
  if (!Object.keys(config).includes(region)) {
    console.log(`\nHmph. ../lib/config.js and region mismatch. Please make sure that they match.`);
    kill();
  }

  let api = new TwoNetAPI(localConfig[region][env].customer_id, localConfig[region][env].auth_key, region, env);

  // compute base64 value here if need
  let value;

  if (command) {
    value = command;
  } else {
    let buf_size = commands.length * COMMAND_SIZE;
    let buf = new Buffer.alloc(buf_size);
    for (var k = 0; k < buf_size; k++) {
      buf.writeUInt8(0, k);
    }
    commands.forEach(function(c, c_index) {
      c.split(" ").forEach(function(b, i) {
        buf.writeUInt8(parseInt(b, 16), c_index * COMMAND_SIZE + i);
      });
    });
    value = buf.toString("base64");
  }

  if (!value) {
    console.log(`\nHmph. No value included or computed.`);
    kill();
  } else {
    console.log(`\nCommand in base64 = ${value}`);
  }

  let csv_file = process.argv[2];
  let hubs_macs = [];
  let successes = 0;
  let failures = 0;

  if (fs.existsSync(csv_file)) {
    fs.createReadStream(csv_file)
      .pipe(csv())
      .on("data", data => {
        hubs_macs.push(data);
      })
      .on("end", () => {
        async.eachLimit(
          hubs_macs,
          10,
          (hub_mac, next_hub_mac) => {
            let mac = hub_mac.mac;
            let hub_id = hub_mac.hub_id;

            console.log(`\nSending command to ${mac}@${hub_id}...`);

            api.sendDeviceCommand(hub_id, mac, sensor_type, value, function(status, result) {
              if (status === 0) {
                console.log(
                  `Sent! Tracking number for command: ${result.DeviceCommandTrackingNumber.trackingNumber[0]}`
                );
                successes++;
              } else {
                console.log(`Failed! Results below if any: `);
                if (Object.keys(result).length > 0) {
                  console.dir(result);
                }
                failures++;
              }

              next_hub_mac();
            });
          },
          err => {
            console.log(`\nFinished! Successes: ${successes} | Failures: ${failures}`);
            process.exit(0);
          }
        );
      });
  } else {
    console.log(`\nHmph. ${csv_file} does not exist.`);
    kill();
  }
}
