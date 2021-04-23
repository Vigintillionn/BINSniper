const path = require("path");
const Command = require(path.join(process.cwd(), "util", "Command.js"));

module.exports = class PingCmd extends Command {
    constructor(client) {
      super(client, {
        name: "time",
        aliases: [],
        description: "Check how long you have left on subscription!",
        category: "main"
      });
    }

    async run(message) {
        let user = message.author;
        if (message.mentions.members.first()) user = message.mentions.members.first();
        let userData = this.client.db.ensureData(await this.client.db.get(`user-${user.id}`), this.client.config.userData, this.client.config);

        let expireDate = userData.expire;
        if ((!expireDate || expireDate < Date.now()) && !message.mentions.members.first()) return message.channel.send("How the frick are you here? You don't have a subscription!\n||<@259776081316282368>, <@183978195551387649>||");
        else if (message.mentions.members.first()) return message.channel.send("This person doesn't have an active subscription.");

        return message.channel.send(`${message.mentions.members.first() ? `${user}'s` : "Your"} subscription will end in **${this.client.moment.duration(expireDate - Date.now(), 'milliseconds').format("d [day(s)] h [hour(s)] m [minute(s)]")}**`);
  }
}