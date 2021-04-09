const Discord = require("discord.js");

/**
 * The default command extender
 * @class
 * @name Command
 * @property {Discord.Client} client The discord.js client
 * @property {String} name The name of the command
 * @property {String} description The description of the command
 * @property {Array} aliases The aliases of the command
 */
class Command {
  constructor(client, { name, description = "_No description_", usage = false, aliases = [], category = "main", enabled = true } = {}) {
    this.client = client;

    this.name = name;
    this.description = description;
    this.usage = usage;
    this.aliases = aliases;
    this.category = category;
    this.enabled = enabled;
  }
}

module.exports = Command;