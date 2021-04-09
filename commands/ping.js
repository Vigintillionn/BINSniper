const path = require("path");
const Command = require(path.join(process.cwd(), "util", "Command.js"));

module.exports = class PingCmd extends Command {
  constructor(client) {
    super(client, {
      name: "ping",
      aliases: [],
      description: "Test my ping!",
      category: "main"
    });
  }

  async run(message) {
    let start = Date.now();
    let msg = await message.channel.send(":ping_pong:");
    msg.edit(`:ping_pong: ${Math.round((Date.now()-start-this.client.ws.ping)*100)/100}ms\n:blue_heart: ${Math.round(this.client.ws.ping*100)/100}ms`);
  }
}