const TopazClient = require("./util/TopazClient.js");
const config = require("./config.js");

new TopazClient(config, {
  autoReconnect: true
})
.loadCommands("commands");