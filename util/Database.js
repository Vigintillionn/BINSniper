const path = require("path");
const sqlite3 = require("sqlite3");

class Database {
  constructor({ caching = false, cwd = __dirname, name = "database", compression = false } = {}) {
    this.compression = compression;
    this.caching = caching;

    this.memory = {};
    this.ready = false;
    this.sqlite = new sqlite3.Database(path.join(cwd, `${name}.sqlite`));

    let i = setInterval(() => {
      if (!this.sqlite.open) return;
      clearInterval(i);
      this.sqlite.run("CREATE TABLE IF NOT EXISTS BINSniper (key TEXT, value TEXT);", () => {
        if (!this.caching) return this.ready = true;

        this.sqlite.all("SELECT * FROM BINSniper;", (err, data) => {
          if (err) throw err;
          data.forEach(d => {
            this.memory[d.key] = this.desterilize(d.value);
          });
          this.ready = true;
        });

      });
    });
  }

  isReady() {
    return new Promise((res) => {
      let i = setInterval(() => {
        if (!this.ready) return;
        res();
        clearInterval(i);
      }, 10);
    })
  }

  get(key) {
    if (this.memory[key]) return this.memory[key];
    key = this.sterilizeKey(key);

    return new Promise((res) => {
      this.sqlite.all(`SELECT value FROM BINSniper WHERE key='${key}';`, [], (err, data) => {
        if (err) throw err;
        if (data.length === 0) return res(undefined);
        res(this.desterilize(data[0].value));
      });
    });
  }

  set(key, value) {
    if (this.caching) this.memory[key] = value;
    value = this.sterilize(value);
    key = this.sterilizeKey(key);

    return new Promise((res) => {
      this.sqlite.all(`SELECT * FROM BINSniper where key='${key}'`, [], (err, data) => {
        if (err) throw err;
        let sql = "";
        if (data.length === 0) sql = `INSERT INTO BINSniper (key, value) VALUES ('${key}', '${value}')`;
        else sql = `UPDATE BINSniper SET value='${value}' WHERE key='${key}'`;
        this.sqlite.all(sql, [], (err) => {
          if (err) throw err;
          res(true);
        });
      });
    });
  }

  delete(key) {
    delete this.memory[key];
    key = this.sterilizeKey(key);

    return new Promise((res) => {
      this.sqlite.all(`DELETE FROM BINSniper WHERE key='${key}'`, [], (err) => {
        if (err) throw err;
        res(true);
      });
    });
  }

  ensureData(data, defaultData, headObject) {
    if (!data) data = {};
    // console.log(data, defaultData);

    for (let i in defaultData) {
      if (defaultData[i] instanceof Array) { // When the data is an array
        if (!data[i]) data[i] = []; // If there isn't an array defined, create an empty one.

        // For == template with ANY
        if (defaultData[i].length === 1 && typeof defaultData[i][0] === "string" && defaultData[i][0].startsWith("=") && defaultData[i][0].endsWith("=")) {
          let name = defaultData[i][0].split(".")[0].toLowerCase().split("=").join(""); // Get the name

          // If everything is valid, ensure the data on the array
          if (defaultData[i][0].includes(".") && defaultData[i][0].split(".")[1].split("=").join("") === "ANY") data[i] = this.ensureDataArray(data[i], headObject[name], headObject);
          else if (data[0] instanceof Object) data[i][0] = this.ensureData(data[i][0], headObject[name], headObject);

        } else {
          // TODO: Loop and ensure!!! (Only Objects)
        }

        // If it is an object
      } else if (typeof defaultData[i] === "object") data[i] = this.ensureData(data[i], defaultData[i], headObject);

      // If it is a template
      if (typeof defaultData[i] === "string" && defaultData[i].startsWith("=") && defaultData[i].endsWith("=")) {
        let name = defaultData[i].split("=").join("");
        if (!data[i]) data[i] = {};
        data[i] = this.ensureData(data[i], headObject[name], headObject);
      }

      if (typeof data[i] === "undefined") data[i] = defaultData[i]; // When a variable isn't defined

    }

    // console.log(data);
    return data;
  }

  ensureDataArray(array, defaultData, headData) {
    // Loop array
    for (let i of array) {
      if (!(i instanceof Object)) continue;
      // If is is an object, ensure the data on it
      i = this.ensureData(i, defaultData, headData);
    }

    return array;
  }

  all() {
    return new Promise((res) => {
      this.sqlite.all(`SELECT * FROM BINSniper;`, [], (err, data) => {
        if (err) throw err;
        if (data.length === 0) return res(undefined);
        res(data.map(d => {
          let key = d.key;
          let value = this.desterilize(d.value);
          return { key, value }
        }));
      });
    });
  }

  sterilize(data) {
    try {
      data = data.split("'").join("''");
    } catch (e) {}
    data = JSON.stringify(data); // Make the data JSON
    if (!this.compression) return data;

    const lz = require("lzjs");
    return lz.compress(data);
  }

  desterilize(data) {
    if (!data) return undefined;
    if (this.compression) {
      const lz = require("lzjs");
      data = lz.decompress(data);
    }

    try {
      data = data.split("''").join("'");
    } catch (e) {}

    return JSON.parse(data); // Parse the JSON data
  }

  sterilizeKey(key) {
    return key.split("'").join("''");
  }
}

module.exports = Database;