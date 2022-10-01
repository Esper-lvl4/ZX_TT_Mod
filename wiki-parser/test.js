const bot = require('nodemw');
const fs = require('fs');

const EXCLUDED_FIELDS = {
  jphira: true,
  altname: true,
  flavor_ja: true,
  flavor_en: true,
  illust: true,
};

const client = new bot({
  protocol: 'https',
  server: 'zxtcg.fandom.com',
  path: '',
  debug: false,
});

function isExcluded(field) {
  return EXCLUDED_FIELDS[field];
}

function getArticle(title) {
  return new Promise((resolve, reject) => {
      client.getArticle(title, (err, data) => {
          if (err) {
              reject(err);
              console.error(err);
              return;
          }
          // resolve(data);
          const fields = data.match(/\|\w+\s+=\s.+\n/g);
          console.log(fields);
          if (!fields) {
              resolve({});
              return;
          }
          let secondVariant = null;

          const mainVariant = fields.reduce((acc, field) => {
            const parts = field.split('=');
            const name = parts[0].replace(/[|\s]/g, '');

            if (isExcluded(name)) return acc;

            if (acc[name]) {
              if (!secondVariant) secondVariant = {};
              secondVariant[name] = parts[1].trim();
              if (parts.length > 2) {
                parts.forEach((part, index) => (index >= 2 ? secondVariant[name] += `=${part}` : null))
              }
              return acc;
            }

            acc[name] = parts[1].trim();
            if (parts.length > 2) {
              console.log(parts);
              parts.forEach((part, index) => (index >= 2 ? acc[name] += `=${part}` : null))
            }
            return acc;
          }, {})

          resolve(secondVariant ? [mainVariant, secondVariant] : mainVariant);
      });
  });
}


function read() {
  return new Promise((resolve, reject) => {
      fs.readFile('../global.lua', (err, file) => {
          if (err) {
              reject(err);
          }
          resolve(Buffer.from(file).toString());
      });
  });
}

async function run() {
  // getArticle('Shikigami Manipulator, Abe no Seimei').then(console.log);
  const luaScript = await read()
  console.log(JSON.stringify({ LuaScript: luaScript }));
}

run();
