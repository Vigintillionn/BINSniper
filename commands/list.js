const path = require("path");
const { cpuUsage } = require("process");
const Command = require(path.join(process.cwd(), "util", "Command.js"));

module.exports = class PingCmd extends Command {
  constructor(client) {
    super(client, {
      name: "list",
      aliases: [],
      description: "Test my ping!",
      category: "admin"
    });
  }

  async run(message) {
    let users = await this.client.db.all();
    console.log(users)
    let string = "__List of Active Users__:\n";
    for (const user of users) {
      if (!user.value.expire) continue;
      const id = user.key.split("user-")[1];
      let u = await this.client.users.fetch(id) //message.guild.members.cache.get(id);
      string += `**${u.tag}**, Time Left: **${this.client.moment.duration(user.value.expire - Date.now(), 'milliseconds').format("d [day(s)] h [hour(s)] m [minute(s)]")}**\n`
    }
    message.channel.send(string)
  }
}