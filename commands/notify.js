const path = require("path");
const Command = require(path.join(process.cwd(), "util", "Command.js"));

module.exports = class NotifyCmd extends Command {
  constructor(client) {
    super(client, {
      name: "notify",
      aliases: [],
      description: "Test my ping!",
      category: "main"
    });
  }

  async run(message) {
    let role = message.guild.roles.cache.get("835166494438195250");
    console.log(1)

    if (message.member.roles.cache.has('835166494438195250')) {
      message.member.roles.remove(role).catch(console.error);
      message.channel.send("You will no longer be notified of 100M+ flips!");
    } else {
      message.member.roles.add(role).catch(console.error);
      message.channel.send("You will now be notified of 100M+ flips!");
    }
  }
}