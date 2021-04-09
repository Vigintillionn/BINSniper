const path = require("path");
//const axios = require("axios");
const fetch = require("node-fetch")
const Discord = require("discord.js");
const fs = require("fs");
const blackListed = require(path.join(process.cwd(), "blacklistedItems.js"));
const schedule = require("node-schedule");

module.exports = class AuctionHandler {
  constructor(client) {
    this.client = client;

    this.apiKeys = ["ae52b0e2-7a2f-4802-9d60-f184953a8557", "cc9fdfe3-844a-450e-92d9-85350acb371c", "58b11091-469c-4893-8e02-49b9033a177d", "994bb87c-fbcb-4898-ab6d-0c91de24cc05",
      "cdfcb25b-1fdf-4dcf-9e26-7172058d499c", "8b8b201a-c966-48fe-b338-4ba4b876f62a"
    ]
    this.currentIndex = 0;
    this.calls = 0;

    this.scrape()
  }

  scrape() {
    this.auctions = [];
    this.totalPages = 0;

    this.auctionList = {};
    this.flips = [];

    this.fiveHundredFlips = [];
    this.oneMillFlips = [];
    this.twoMillFlips = [];
    this.fiveMillFlips = [];
    this.tenMillFlips = [];
    this.twentyMillFlips = [];

    this.getTotalAuctions().then(num => {
      this.totalPages = num;
      this.getAuctions(this.totalPages).then(data => {
        if (data) console.log("length", this.auctions.length)
        this.filterAuctions().then(() =>
          this.comparePrices().then(() =>
            this.handleFlips()
          ));
      });
    })
  }

  comparePrices() {
    return new Promise(async(resolve, reject) => {
      for (const auc of Object.entries(this.auctionList)) {
        let auction = this.auctionList[auc[0]];
        if (auction.length <= 1) continue;

        let sortedAuction = auction.sort((a, b) => (a.starting_bid > b.starting_bid) ? 1 : -1);

        if (sortedAuction.length == 2) {
          let difference = (sortedAuction[1].starting_bid - sortedAuction[0].starting_bid) * 0.96;
          sortedAuction[0].diff = Math.floor((sortedAuction[1].starting_bid - sortedAuction[0].starting_bid) * 0.96);
          sortedAuction[0].next = sortedAuction[1].starting_bid;
          if (difference >= 500000 && difference < 1000000) this.fiveHundredFlips.push(sortedAuction[0]);
          else if (difference >= 1000000 && difference < 2000000) this.oneMillFlips.push(sortedAuction[0]);
          else if (difference >= 2000000 && difference < 5000000) this.twoMillFlips.push(sortedAuction[0]);
          else if (difference >= 5000000 && difference < 10000000) this.fiveMillFlips.push(sortedAuction[0]);
          else if (difference >= 10000000 && difference < 20000000) this.tenMillFlips.push(sortedAuction[0]);
          else if (difference >= 20000000) this.twentyMillFlips.push(sortedAuction[0]);
          else continue;
        } else {
          let average = (sortedAuction[1].starting_bid + sortedAuction[2].starting_bid) / 2;
          let difference = (average - sortedAuction[0].starting_bid) * 0.96;
          sortedAuction[0].diff = Math.floor((sortedAuction[1].starting_bid - sortedAuction[0].starting_bid) * 0.96);
          sortedAuction[0].next = sortedAuction[1].starting_bid;
          if (difference >= 500000 && difference < 1000000) this.fiveHundredFlips.push(sortedAuction[0]);
          else if (difference >= 1000000 && difference < 2000000) this.oneMillFlips.push(sortedAuction[0]);
          else if (difference >= 2000000 && difference < 5000000) this.twoMillFlips.push(sortedAuction[0]);
          else if (difference >= 5000000 && difference < 10000000) this.fiveMillFlips.push(sortedAuction[0]);
          else if (difference >= 10000000 && difference < 20000000) this.tenMillFlips.push(sortedAuction[0]);
          else if (difference >= 20000000) this.twentyMillFlips.push(sortedAuction[0]);
          else continue;
        }
      }
      resolve(true)
    })
  }

  async handleFlips() {
    let formatFiveH = "";
    this.fiveHundredFlips = this.fiveHundredFlips.sort((a, b) => (a.diff < b.diff) ? 1 : -1);
    let itFH = this.fiveHundredFlips.length > 10 ? 10 : this.fiveHundredFlips.length;
    for (let i = 0; i < itFH; i++) {
      let auc = this.fiveHundredFlips[i];
      formatFiveH += `🔸 ${auc.item_name}\n\`/viewauction ${this.turnToValidId(auc.uuid)}\`\n\`\`\`apache\nProfit: ${auc.diff.toLocaleString("en")}\nPrice: ${auc.starting_bid.toLocaleString("en")}\nNextBIN: ${auc.next.toLocaleString("en")}\nReturn: ${(Math.round(auc.diff/auc.starting_bid*100)*100)/100}% (tax included)\nRarity: ${auc.tier}\n\`\`\`\n`; //.toLocaleString("en")
    }

    let formatOneM = "";
    this.oneMillFlips = this.oneMillFlips.sort((a, b) => (a.diff < b.diff) ? 1 : -1);
    let itOM = this.oneMillFlips.length > 10 ? 10 : this.oneMillFlips.length;
    for (let i = 0; i < itOM; i++) {
      let auc = this.oneMillFlips[i];
      formatOneM += `🔸 ${auc.item_name}\n\`/viewauction ${this.turnToValidId(auc.uuid)}\`\n\`\`\`apache\nProfit: ${auc.diff.toLocaleString("en")}\nPrice: ${auc.starting_bid.toLocaleString("en")}\nNextBIN: ${auc.next.toLocaleString("en")}\nReturn: ${(Math.round(auc.diff/auc.starting_bid*100)*100)/100}% (tax included)\nRarity: ${auc.tier}\n\`\`\`\n`; //.toLocaleString("en")
    }

    let formatTwoM = "";
    this.twoMillFlips = this.twoMillFlips.sort((a, b) => (a.diff < b.diff) ? 1 : -1);
    let itTM = this.twoMillFlips.length > 10 ? 10 : this.twoMillFlips.length;
    for (let i = 0; i < itTM; i++) {
      let auc = this.twoMillFlips[i];
      formatTwoM += `🔸 ${auc.item_name}\n\`/viewauction ${this.turnToValidId(auc.uuid)}\`\n\`\`\`apache\nProfit: ${auc.diff.toLocaleString("en")}\nPrice: ${auc.starting_bid.toLocaleString("en")}\nNextBIN: ${auc.next.toLocaleString("en")}\nReturn: ${(Math.round(auc.diff/auc.starting_bid*100)*100)/100}% (tax included)\nRarity: ${auc.tier}\n\`\`\`\n`; //.toLocaleString("en")
    }

    let formatFiveM = "";
    this.fiveMillFlips = this.fiveMillFlips.sort((a, b) => (a.diff < b.diff) ? 1 : -1);
    let itFM = this.fiveMillFlips.length > 10 ? 10 : this.fiveMillFlips.length;
    for (let i = 0; i < itFM; i++) {
      let auc = this.fiveMillFlips[i];
      formatFiveM += `🔸 ${auc.item_name}\n\`/viewauction ${this.turnToValidId(auc.uuid)}\`\n\`\`\`apache\nProfit: ${auc.diff.toLocaleString("en")}\nPrice: ${auc.starting_bid.toLocaleString("en")}\nNextBIN: ${auc.next.toLocaleString("en")}\nReturn: ${(Math.round(auc.diff/auc.starting_bid*100)*100)/100}% (tax included)\nRarity: ${auc.tier}\n\`\`\`\n`; //.toLocaleString("en")
    }

    let formatTenM = "";
    this.tenMillFlips = this.tenMillFlips.sort((a, b) => (a.diff < b.diff) ? 1 : -1);
    let itTeM = this.tenMillFlips.length > 10 ? 10 : this.tenMillFlips.length;
    for (let i = 0; i < itTeM; i++) {
      let auc = this.tenMillFlips[i];
      formatTenM += `🔸 ${auc.item_name}\n\`/viewauction ${this.turnToValidId(auc.uuid)}\`\n\`\`\`apache\nProfit: ${auc.diff.toLocaleString("en")}\nPrice: ${auc.starting_bid.toLocaleString("en")}\nNextBIN: ${auc.next.toLocaleString("en")}\nReturn: ${(Math.round(auc.diff/auc.starting_bid*100)*100)/100}% (tax included)\nRarity: ${auc.tier}\n\`\`\`\n`; //.toLocaleString("en")
    }

    let formatTwentyM = "";
    this.twentyMillFlips = this.twentyMillFlips.sort((a, b) => (a.diff < b.diff) ? 1 : -1);
    let itTwM = this.twentyMillFlips.length > 10 ? 10 : this.twentyMillFlips.length;
    for (let i = 0; i < itTwM; i++) {
      let auc = this.twentyMillFlips[i];
      formatTwentyM += `🔸 ${auc.item_name}\n\`/viewauction ${this.turnToValidId(auc.uuid)}\`\n\`\`\`apache\nProfit: ${auc.diff.toLocaleString("en")}\nPrice: ${auc.starting_bid.toLocaleString("en")}\nNextBIN: ${auc.next.toLocaleString("en")}\nReturn: ${(Math.round(auc.diff/auc.starting_bid*100)*100)/100}% (tax included)\nRarity: ${auc.tier}\n\`\`\`\n`; //.toLocaleString("en")
    }

    let fiveHundredF = new Discord.MessageEmbed()
      .setTitle("New Flips!")
      .setDescription("Top 10 Flips -> 500k - 1M\n" + formatFiveH)
      .setFooter("Made by Vigintillion and Thundeee")
      .setColor("#FFA500")
    let oneMillF = new Discord.MessageEmbed()
      .setTitle("New Flips!")
      .setDescription("Top 10 Flips -> 1M - 2M\n" + formatOneM)
      .setFooter("Made by Vigintillion and Thundeee")
      .setColor("#FFA500")
    let twoMillF = new Discord.MessageEmbed()
      .setTitle("New Flips!")
      .setDescription("Top 10 Flips -> 2M - 5M\n" + formatTwoM)
      .setFooter("Made by Vigintillion and Thundeee")
      .setColor("#FFA500")
    let fiveMillF = new Discord.MessageEmbed()
      .setTitle("New Flips!")
      .setDescription("Top 10 Flips -> 5M+\n" + formatFiveM)
      .setFooter("Made by Vigintillion and Thundeee")
      .setColor("#FFA500")
    let tenMillF = new Discord.MessageEmbed()
      .setTitle("New Flips!")
      .setDescription("Top 10 Flips -> 10M+\n" + formatTenM)
      .setFooter("Made by Vigintillion and Thundeee")
      .setColor("#FFA500")
    let twentyMillF = new Discord.MessageEmbed()
      .setTitle("New Flips!")
      .setDescription("Top 10 Flips -> 20M+\n" + formatTwentyM)
      .setFooter("Made by Vigintillion and Thundeee")
      .setColor("#FFA500")

    await this.client.guilds.cache.get("816049008082550834").channels.cache.get("823953523057492029").bulkDelete(1).catch(console.error);
    await this.client.guilds.cache.get("816049008082550834").channels.cache.get("823953576891121674").bulkDelete(1).catch(console.error);
    await this.client.guilds.cache.get("816049008082550834").channels.cache.get("823953598995496991").bulkDelete(1).catch(console.error);
    await this.client.guilds.cache.get("816049008082550834").channels.cache.get("823953614941716531").bulkDelete(1).catch(console.error);
    await this.client.guilds.cache.get("816049008082550834").channels.cache.get("829782642919866428").bulkDelete(1).catch(console.error);
    await this.client.guilds.cache.get("816049008082550834").channels.cache.get("829782671017115648").bulkDelete(1).catch(console.error);

    await this.client.guilds.cache.get("816049008082550834").channels.cache.get("823953523057492029").send(fiveHundredF)
    await this.client.guilds.cache.get("816049008082550834").channels.cache.get("823953576891121674").send(oneMillF)
    await this.client.guilds.cache.get("816049008082550834").channels.cache.get("823953598995496991").send(twoMillF)
    await this.client.guilds.cache.get("816049008082550834").channels.cache.get("823953614941716531").send(fiveMillF)
    await this.client.guilds.cache.get("816049008082550834").channels.cache.get("829782642919866428").send(tenMillF)
    await this.client.guilds.cache.get("816049008082550834").channels.cache.get("829782671017115648").send(twentyMillF)

    await this.client.guilds.cache.get("816049008082550834").channels.cache.get("816049008082550837").send("The scrape took " + Math.floor((Date.now() - this.start) / 1000) + " seconds")
  }

  turnToValidId(string) {
    let arr = string.split("");
    arr.splice(8, 0, "-")
    arr.splice(13, 0, "-")
    arr.splice(18, 0, "-")
    arr.splice(23, 0, "-")
    return arr.join("")
  }

  filterAuctions() {
    return new Promise(async(resolve, reject) => {
      for (const auc of this.auctions) {
        if (auc.item_name.includes("✪")) auc.item_name = auc.item_name.replace(/✪+/g, "").replace(/ /g, " ").slice(0, -1);
        let itemName = auc.item_name;
        if (reforges.includes(itemName.split(" ")[0].toLowerCase())) auc.group = auc.item_name.substr(auc.item_name.indexOf(" ") + 1) + " " + auc.tier;
        else auc.group = itemName + " " + auc.tier;

        if (auc.item_lore.includes("§9")) {
          let enchants = auc.item_lore.split(/\\n+/g).join("").split("§9");
          for (const enchant of enchants) {
            for (const valuableEnchant of valuableEnchants) {
              if (enchant.includes(valuableEnchant)) auc.group += " " + valuableEnchant;
            }
          }
        }


        if (auc.group.includes("[Lvl ")) {
          let level = parseInt(auc.group.split("[Lvl ").join("").split("]")[0]);
          auc.group = itemName.replace(level.toString(), level < 50 ? "1" : level < 90 ? "50" : level < 97 ? "90" : "97") + " " + auc.tier;

          if (auc.item_lore.includes("§6Held Item: ")) {
            let item = auc.item_lore.split("§6Held Item: ")[1].split("\n")[0];
            if (valuablePetItems.includes(item)) auc.group += " " + item.replace(/[§][0-9]/g, "").split(" ").join("").toUpperCase();
          }
        }

        if (this.auctionList[auc.group]) this.auctionList[auc.group].push(auc);
        else this.auctionList[auc.group] = [{...auc }];
      }
      resolve(true);
    });
  }

  getTotalAuctions() {
    return new Promise(async(resolve, reject) => {
      //const response = await axios.get(`https://api.hypixel.net/skyblock/auctions?key=${this.apiKeys[this.currentIndex]}`);
      await fetch(`https://api.hypixel.net/skyblock/auctions?key=${this.apiKeys[this.currentIndex]}`)
        .then(response => {
          if (response.headers.get("RateLimit-Remaining") <= 20) this.currentIndex++;
          return response.json()
        })
        .then(data => {
          this.calls++;
          if (this.calls > 55) {
            this.currentIndex = this.currentIndex > this.apiKeys.length ? 0 : this.currentIndex + 1;
            this.calls = 0;
          }
          if (!data || !data.success) reject("There was no data.")
          else resolve(data.totalPages);
        })
    });
  }

  async getAuctions(pages) {
    this.start = Date.now();
    return new Promise(async(resolve, reject) => {
      for (let i = 1; i < pages; i++) {
        //const response = await axios.get(`https://api.hypixel.net/skyblock/auctions?key=${this.apiKeys[this.currentIndex]}&page=${i}`);
        await fetch(`https://api.hypixel.net/skyblock/auctions?key=${this.apiKeys[this.currentIndex]}&page=${i}`)
          .then(response => {
            if (response.headers.get("RateLimit-Remaining") <= 20) this.currentIndex++;
            return response.json()
          })
          .then(data => {
            this.calls++;
            if (this.calls > 55) {
              this.currentIndex = this.currentIndex > this.apiKeys.length ? 0 : this.currentIndex + 1;
              this.calls = 0;
            }
            if (!data || !data.success) reject("There was no data.")
            else {
              let auctions = data.auctions;
              let newArray = auctions.filter(auc => {
                return this.validAuction(auc);
              });
              this.auctions = this.auctions.concat(newArray);
            };
          })
      }
      resolve(true);
    });
  }

  validAuction(auc) {
    if (auc.item_name.toLowerCase() === "enchanted book") return auc.bin && !auc.claimed
    else return auc.bin &&
      !auc.claimed && ["RARE", "EPIC", "LEGENDARY", "MYTHIC"].includes(auc.tier) &&
      !auc.item_lore.toLowerCase().includes("cake soul") &&
      !blackListed.includes([...valuableReforges, ...reforges].includes(auc.item_name.split(" ")[0].toLowerCase()) ? auc.item_name.toLowerCase().substr(auc.item_name.indexOf(" ") + 1) : auc.item_name.toLowerCase())
  }
}

const reforges = ["bizzare", "ominous", "simple", "strange", "pleasant", "shiny", "vivid", "pretty", "itchy", "keen", "unpleasant", "superior",
  "forceful", "hurtful", "strong", "demonic", "zealous", "godly", "gentle", "odd", "fast", "epic", "sharp", "heroic", "spicy", "legendary",
  "awkward", "rich", "fine", "neat", "hasty", "grand", "rapid", "deadly", "unreal", "smart", "clean", "fierce", "heavy", "light", "mythic",
  "titanic", "wise", "pure", "extremely", "perfect", "absolutly", "very", "shaded", "sweet", "silky", "bloody", "candied", "reinforced", "cubic", "warped",
  "undead", "ridiculous", "necrotic", "spiked", "loving", "giant", "ancient", "moil", "headstrong",
  "precise", "fruitful", "magnetic", "fleet", "mithraic", "suspicious", "stellar", "jerry's", "dirty", "suspicious", "spiritual"
];

const valuableReforges = ["submerged", "renowned", "withered", "empowered", "blessed", "toil", "refined", "fabled", "gilded"];

const valuableEnchants = [
  "Chimera V" /*2.4b*/ , "Chimera IV" /*1.2b*/ , "Chimera III" /*600m*/ , "Chimera II" /*300m*/ , "Chimera I" /*150m*/ , "Growth VII" /*78m*/ ,
  "Critical VII" /*48.5m*/ , "Giant Killer VII" /*38.5m*/ , "Ender Slayer VII" /*33m*/ , "Power VII" /*30m*/ , "Smite VII" /*25m*/ , "Vicious V" /*24m*/ , "Protection VII" /*20.5m */ ,
  "Sharpness VII" /*20m*/ , "Legion V" /*20m */ , "Snipe IV ", "Soul Eater V", /*17.6m*/ , "Dragon Hunter V" /*14.4m*/ , "Overload V" /*12.8m */ , "Chance V " /*10m */ /*10m */ , "Legion IV" /*9.5m */ ,
  "Soul Eater IV" /*8.8m*/ , "Swarm V" /*8.8m*/ , "Dragon Hunter IV" /*7.2m*/ , "Overload IV" /*6.4m*/ , "Legion III" /*4.75m */ , "Growth VI" /*4.6M*/ , "Soul Eater III" /*4.4m*/ ,
  "Swarm IV" /*4.4m*/ , "Protection VI" /*3.7M*/ , "Dragon Hunter III" /*3.6m*/ , "Rend IV" /*3.2m*/ , "Ultimate Wise V" /*2.5m*/ , "Legion II" /*2.375m */ ,
  "Giant Killer VI" /*2.3m*/ , "Swarm III" /*2.2m*/ , "Soul Eater II" /*2.2m*/ , "Dragon Hunter II" /*1.8m*/ , "One For All I ", "Power VI" /*1.8m */ , "Overload II" /*1.6m*/ ,
  "Rend III" /*1.6m*/ , "Sharpness VI" /*1.5m*/ , "Ender Slayer VI" /*1.4m*/ , "Sugar Rush III" /*1.4M*/ , "Cultivating X" /*unknown*/ , "Cultivating IX" /*unknown*/ ,
  "Cultivating" /*1.3m */ , "Compact X" /*unknown*/ , "Compact IX" /*unknown*/ , "Compact" /*1.3m */ , "Expertise X" /*unknown*/ , "Expertise IX" /*unknown*/ ,
  "Expertise" /*1.2m*/ , "Legion I" /*1.18m */ , "Soul Eater I" /*1.1m*/ , "Dragon Hunter I" /*900k*/
];

const valuablePetItems = [ // Legendary: §6      Epic: §5       Rare: §3       Uncommon: §a     Common: §f 
  "§6Tier Boost", "§3Dwarf Turtle Shelmet", "§5Minos Relic", "§6Reaper Gem", "§5Lucky clover", "§5Combat Exp Boost", "§5Fishing Exp Boost",
];



// Mzk2OTg1Njk1NTA5Njc2MDQy.WkjHvQ.kUecwSC-QHccrqaByONX1-RLRFo


/* 
500k-flips 823953523057492029  
1m-flips 823953576891121674
2m-flips 823953598995496991
5m-flips 823953614941716531
*/