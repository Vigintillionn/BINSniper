const path = require("path");
const Command = require(path.join(process.cwd(), "util", "Command.js"));

module.exports = class PingCmd extends Command {
  constructor(client) {
    super(client, {
      name: "ticket",
      aliases: [],
      description: "Create a ticket",
      category: "main"
    });
  }

  async run(message) {
    if (message.channel.id !== "829799182415298610") return;
    message.guild.channels.create(message.author.username, "text").then(async channel => {
      let category = message.guild.channels.cache.find(c => c.id === "829784231462305793" && c.type === "category");
      if (!category) throw new Error("Category channel does not exist!");
      channel.setParent(category.id);
      channel.overwritePermissions([{
        id: "592680139767152640",
        deny: ['VIEW_CHANNEL'],
      }, {
        id: "829785240658378752",
        deny: ['VIEW_CHANNEL'], 
      },{
        id: message.author.id,
        allow: ['VIEW_CHANNEL'],
      }, {
        id: "183978195551387649",
        allow: ['VIEW_CHANNEL'],
      }, {
        id: "259776081316282368",
        allow: ['VIEW_CHANNEL'],
      }]);
      channel.send(message.author, message.embed()
        .setTitle("Bin Sniper!")
        .setDescription("An admin will be here to help you soon!\nTake a look in <#829784596475412480> as you might find your answer there!\nNote: All admins are EU timezone!")
      );
      return message.channel.send(`Created a ticket for ${message.author}!`)
    });
  }
}