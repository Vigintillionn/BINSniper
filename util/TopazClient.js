const { Client } = require("discord.js");
const chalk = require("chalk");
const fs = require("fs");
const path = require("path");
//const levenshtein = require("./levenshtein.js ")
const Database = require("./Database.js");
const Discord = require("discord.js");
const AuctionHandler = require(path.join(process.cwd(), "util", "AuctionHandler.js"));
const schedule = require("node-schedule");
const moment = require("moment")
const momentDuration = require("moment-duration-format");
const { values } = require("../blacklistedItems.js");

/**
 * The TopazClient
 * @class
 * @extends Client The Discord.js Client
 * @name TopazClient
 * @property {Object} config The botconfig
 * @property {Object} commands The loaded commands
 * @property {Object} aliases The aliases of commands
 * @property {Database} db The database
 */
class TopazClient extends Client {
  constructor(config, ...args) {
    super(...args);
    this.config = config;

    this.login(config.token);

    this.on("ready", this.readyHandler);
    this.on("message", this.messageHandler);

    this.commands = {};
    this.aliases = {};

    this.debugging = true;

    this.moment = moment;

    this.auctionHandler = new AuctionHandler(this)

    this.admins = ["259776081316282368"];

    this.db = new Database({
      development: false,
      name: "database",
      caching: true,
      compression: false,
      cwd: process.cwd()
    });
  }

  /**
   * @method TopazClient.generateUUID
   * @returns {String} The generated UUID
   * @description Generates a random UUID from a specific length
   */
  generateUUID(length = 16) {
    let s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    let output = "";
    for (let i = 0; i < Math.floor(length / 4 + 1); i++) {
      output += s4();
    }
    return output.substr(0, length);
  }

  getRandomMargin(x, y) {
    if (x === y) return x;

    if (!x || !y || isNaN(x) || isNaN(y) || x < 0 || y < 0) throw new TypeError("Please give up 2 values greater then 0.");
    if (x > y) throw new RangeError("The first integer needs to be smaller then the second.");

    return Math.floor(Math.random() * (y - x + 1)) + x;
  }

  /**
   * @method TopazClient.readyHandler
   * @returns {undefined}
   * @description Fire when the bot is ready.
   * @private
   */
  async readyHandler() {
    console.log(chalk.green("ONLINE") + " | Topaz RPG is ready for use.");
    this.user.setActivity(`with the Auction House`, { type: 'PLAYING' })
      //let auctionHandler = new AuctionHandler(this);

    let binScrape = schedule.scheduleJob('*/2 * * * *', async() => {
      console.log("Starting scrape")
      this.auctionHandler.scrape();
    });

    let cleaner = schedule.scheduleJob('0 */3 * * *', async() => {
      console.log("Clearing hidden flips")
      this.auctionHandler.activeFlips = {};
      this.auctionHandler.hideFlips = {};
    });

    let userChecker = schedule.scheduleJob('* * * * *', async() => {
      // Check all user's validity
      let users = await this.db.all();
      if (users && users.length > 0) {
        for (const user of users) {
          let u = await this.guilds.cache.get("592680139767152640").members.fetch(user.key.split("user-")[1]);

          if (!user || !user.value || !user.value.expire) continue;
          console.log(user.value.expire)
          if (user.value.expire <= Date.now()) {
            u.roles.remove(this.guilds.cache.get("592680139767152640").roles.cache.get("829785240658378752"));
            this.db.set(user.key, { expire: false, reminders: false });
          } else if (user.value.expire < Date.now() + 12 * 60 * 60 * 1000 && (!user.value.reminders || user.value.reminders === 3 || user.value.reminders < 3)) {
            u.send("Your subscription for the BIN Bot will end in **12 hours**!");
            user.value.reminders = 4;
            this.db.set(user.key, user.value);
          } else if (user.value.expire < Date.now() + 24 * 60 * 60 * 1000 && (!user.value.reminders || user.value.reminders === 2 || user.value.reminders < 2)) {
            u.send("Your subscription for the BIN Bot will end in **1 day**!");
            user.value.reminders = 3;
            this.db.set(user.key, user.value);;
          } else if (user.value.expire < Date.now() + 5 * 24 * 60 * 60 * 1000 && (!user.value.reminders || user.value.reminders === 1)) {
            u.send("Your subscription for the BIN Bot will end in **5 days**!");
            user.value.reminders = 2;
            this.db.set(user.key, user.value);;
          } else if (user.value.expire < Date.now() + 7 * 24 * 60 * 60 * 1000 && !user.value.reminders) {
            u.send("Your subscription for the BIN Bot will end in **7 days**!");
            user.value.reminders = 1;
            this.db.set(user.key, user.value);;
          } else continue;
        }
      }
    });
  }

  /**
   * @method TopazClient.messageHandler
   * @returns {undefined}
   * @description Fire when the bot recieves a message.
   * @private
   */
  async messageHandler(message) {
    if (message.author.bot || !message.guild) return;
    if (this.debugging) console.log(chalk.keyword("pink")("DEBUG") + " | Recieved a message!");

    message.embed = () => {
      let color = "#FFA500";
      let embed = new Discord.MessageEmbed().setColor(color);
      return embed;
    }

    let prefixes = ["bin!"];
    let prefix = false;
    for (const thisPrefix of prefixes) {
      if (message.content.toLowerCase().startsWith(thisPrefix.toLowerCase())) prefix = thisPrefix.toLowerCase();
    }

    message.author.settings = this.db.ensureData(await this.db.get(`user-${message.author.id}`), this.config.userData, this.config);

    if (this.debugging) console.log(chalk.keyword("pink")("DEBUG") + ` | Prefix: ${chalk.blue(prefix)}`);

    if (!prefix || !message.content.toLowerCase().startsWith(prefix)) return;
    let args = message.content.slice(prefix.length).trim().split(/ +/g);
    let command = args.shift().toLowerCase();

    if (this.debugging) console.log(chalk.keyword("pink")("DEBUG") + ` | Command: ${command} - ${this.commands[command] || this.aliases[command] ? chalk.green("Command exits!") : chalk.red("Command not found!")}`);

    let cmd = this.commands[command] || this.commands[this.aliases[command]];
    if (!cmd) return;
    await cmd.run(message, args);
  }

  /**
   * @method TopazClient.loadCommands
   * @returns {TopazClient}
   * @description Load all the commands in a folder!
   */
  loadCommands(dir, log = true) {
    let files = fs.readdirSync(dir, () => {
      if (error) return console.log(error);
    });

    let i = 0;
    for (let file of files) {

      if (!fs.lstatSync(path.join(dir, file)).isDirectory()) {
        let rawClass;
        try {
          rawClass = require(path.join(process.cwd(), dir, file));
        } catch (e) {
          console.log(`${chalk.red("ERROR")} | While loading ${chalk.blue(path.join(dir, file))}!`, e);
          continue;
        }

        let cmd;
        try {
          cmd = new rawClass(this);
        } catch (e) {
          if (e instanceof TypeError && e.toString().includes("is not a constructor")) console.log(`${chalk.red("ERROR")} | File ${chalk.blue(path.join(dir, file))} isn't a constructor!`);
          else console.log(`${chalk.red("ERROR")} | While constructing ${chalk.blue(path.join(dir, file))}!`, e);
          continue;
        }

        let cmdProps = Object.keys(cmd);
        if (!cmdProps.includes("client") || !cmdProps.includes("name") || !cmdProps.includes("aliases") || !cmdProps.includes("description") || typeof cmd.run !== "function") {
          console.log(chalk.red("ERROR") + ` | Invalid construction of ${chalk.blue(path.join(dir, file))}!`);
          continue;
        }

        this.commands[cmd.name] = cmd;
        for (let alias of cmd.aliases) {
          this.aliases[alias] = cmd.name;
        }
        console.log(chalk.keyword("orange")("INFO") + ` | Command ${cmd.name} has ${cmd.aliases.length} alias(es)!`);

        i++;
      } else i += this.loadCommands(path.join(dir, file), false);
    }
    if (!log) return i;

    console.log(chalk.keyword("orange")("INFO") + ` | ${i} commands loaded!`);
    return this;
  }

  mostSimilarModule(item, keys) {
    const resp = keys.sort((key1, key2) => {
      return levenshtein.levenshteinRatio(key2, item) - levenshtein.levenshteinRatio(key1, item);
    })[0];
    if (levenshtein.levenshteinRatio(resp.toLowerCase(), item) < 0.4) return false;
    return resp;
  }

  error(msg) {
    console.log(chalk.red("ERROR") + " | " + msg);
  }
}


module.exports = TopazClient;
this.auctionHandler.activeFlips = {};
