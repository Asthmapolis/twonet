
console.log("\n")
console.log("This module has several utility functions for common tasks. \n\tnpm run <command> provides access to these.");
console.log("\n");
console.log("\t(1) Deactivate a list of hubs :");
console.log("\t  npm run deactivate <filename> <region> <env>");
console.log("\n");
console.log("\t(2) Find a specific sensor device : ");
console.log("\t  npm run find <sensor-id> <sensor-type> <region> <env>");
console.log("\n");
console.log("\t(3) Provision a list of hubs : ");
console.log("\t  npm run provision <hub-id> <region> <env>");
console.log("\t    * note that you must edit bin/provision.js with the list of devices you are provisioning");
console.log("\n");
console.log("\t(4) Register a list of devices on twonet");
console.log("\t  npm run register <region> <env>");
console.log("\t    * note that you must edit bin/register-device.js with the list of devices you are registering");
console.log("\n");
console.log("\t(5) Send a command to a device on a hub");
console.log("\t  npm run command <hub-id> <mac> <region> <env>");
console.log("\n");
console.log("\t(6) Get the status of a hub");
console.log("\t  npm run status <hub-id> <region> <env>");

console.log("\n");