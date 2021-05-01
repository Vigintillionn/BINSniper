const path = require("path");
const Command = require(path.join(process.cwd(), "util", "Command.js"));
const ms = require("ms")

module.exports = class PingCmd extends Command {
    constructor(client) {
      super(client, {
        name: "permit",
        aliases: [],
        description: "Add time to subscription!",
        category: "admin"
      });
    }

    async run(message, args) {
        if (message.author.id !== "259776081316282368" && message.author.id !== "183978195551387649") return;
        let user = message.mentions.members.first();

        let time = 0;
        if (args[1].toLowerCase() === "set") time = ms(args[2]);
        else time = ms(args[1]);

        let userData = this.client.db.ensureData(await this.client.db.get(`user-${user.id}`), this.client.config.userData, this.client.config);
        if (!userData.expire || userData.expire < Date.now() || args[1].toLowerCase() === "set") userData.expire = time + Date.now();
        else userData.expire += time;

        this.client.db.set(`user-${user.id}`, userData);
        message.channel.send(`${args[1].toLowerCase() === "test" ? `Set ${user}'s subscription to` : `Gave ${user} a subscription for`} ${this.client.moment.duration(time, 'milliseconds').format("d [day(s)] h [hour(s)] m [minute(s)]")}`)

        let flipRole = message.guild.roles.cache.get("829836255755501569");
        if (flipRole && !user.roles.cache.has(flipRole.id)) user.roles.add(flipRole);

        if (args[1].toLowerCase() === "test") return user.send(`Your subscription for the BIN Bot was just set to **${this.client.moment.duration(time, 'milliseconds').format("d [day(s)] h [hour(s)] m [minute(s)]")}**\nFor more information look at <#829784596475412480>\nGood luck sniping!`)
        else return user.send(`You just recieved a subscription to the BIN Bot for **${this.client.moment.duration(time, 'milliseconds').format("d [day(s)] h [hour(s)] m [minute(s)]")}**\nFor more information look at <#829784596475412480>\nGood luck sniping!`);
  }
}