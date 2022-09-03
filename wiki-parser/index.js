const bot = require('nodemw');
const cliProgress = require('cli-progress');
const colors = require('ansi-colors');
const fs = require('fs');

const REQUESTS_PER_CALL = 100;
const PAGE_LIST_NAME = 'page_list.json';
const CARD_LIST_NAME = 'card_list.json';
const CARD_LIST_INITIAL_NAME = 'card_list_initial.json';
const RESULTS_FOLDER = 'results/';
const EXCLUDED_FIELDS = {
    jphira: true,
    altname: true,
    flavor_ja: true,
    flavor_en: true,
    illust: true,
};

function getPageListPath() {
    return RESULTS_FOLDER + PAGE_LIST_NAME;
}

function getCardListPath() {
    return RESULTS_FOLDER + CARD_LIST_NAME;
}

function getCardListInitialPath() {
    return RESULTS_FOLDER + CARD_LIST_INITIAL_NAME;
}

function isExcluded(field) {
    return EXCLUDED_FIELDS[field];
}

const progress = new cliProgress.SingleBar({
    format: 'Downloading Cards from wiki |' + colors.cyan('{bar}') + '| {percentage}% || {value}/{total} Cards downloaded',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
});

const client = new bot({
    protocol: 'https',
    server: 'zxtcg.fandom.com',
    path: '',
    debug: false,
});

function checkPageList() {
    return new Promise((resolve, reject) => {
        fs.readFile(getPageListPath(), (err, file) => {
            if (err) {
                reject(err);
            }
            resolve(file);
        });
    });
}

function checkInitialCardList() {
    return new Promise((resolve, reject) => {
        fs.readFile(getCardListInitialPath(), (err, file) => {
            if (err) {
                reject(err);
            }
            resolve(file);
        });
    });
}

function getPageNames() {
    return new Promise((resolve, reject) => {
        client.getAllPages((err, data) => {
            if (err) {
                reject(err);
                return;
            }
            fs.writeFile(getPageListPath(), JSON.stringify(data, undefined, 2), { flags: 'a'}, (err) => {
                if (err) {
                    reject(err);
                }
                resolve(data);
            });
        });
    });
}

function getOneArticleInfo(title) {
    return new Promise((resolve, reject) => {
        client.getArticleInfo(title, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(data);
        });
    });
}

function getArticle(title) {
    return new Promise((resolve, reject) => {
        client.getArticle(title, (err, data) => {
            if (err) {
                reject(err);
                console.error(err);
                return;
            }
            if (!data) return resolve(null);
            const fields = data.match(/\|\w+\s+=\s.+\n/g);
            if (!fields) {
                resolve(null);
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
                parts.forEach((part, index) => (index >= 2 ? acc[name] += `=${part}` : null))
              }
              return acc;
            }, {})
  
            resolve(secondVariant ? [mainVariant, secondVariant] : mainVariant);
        });
    });
  }

function getImagesFromArticle(title) {
    return new Promise((resolve, reject) => {
        client.getImagesFromArticle(title, (err, data) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(data);
        });
    });
}

function getImageInfo(filename) {
    return new Promise((resolve, reject) => {
        client.getImageInfo(filename, (err, data) => {
            if (err) {
                reject(err);
                console.error(err);
                return;
            }
            resolve(data);
        });
    });
}

async function processAllCards(pageList, currentCap = REQUESTS_PER_CALL, callNumber = 0, result = []) {
    const promises = [];
    for (let i = callNumber * REQUESTS_PER_CALL; i < currentCap && i < pageList.length; i++) {
        promises.push(processOneCard(pageList[i]));
    }
    result = result.concat((await Promise.allSettled(promises)).map(res => res.value));

    if (currentCap >= pageList.length) return result;
    return processAllCards(pageList, currentCap + REQUESTS_PER_CALL, callNumber + 1, result);
}

async function processOneCard(card) {
    const article = await getArticle(card.title);

    if (Array.isArray(article)) {
        for (let i = 0; i < article.length; i++) {
            const item = article[i];
            if (!item?.image) continue;
            const imageInfo = await getImageInfo(`File:${item.image}`);
            if (imageInfo) item.image = imageInfo.url;
        }
    }

    if (article?.image) {
        const imageInfo = await getImageInfo(`File:${article.image}`);
        if (imageInfo) article.image = imageInfo.url;
    }
    progress.increment();
    return article;
}

async function runParser() {
    const pageListString = await checkPageList()
        .catch(() => {});
    const pageList = pageListString ? JSON.parse(pageListString) : await getPageNames();
    progress.start(pageList.length, 0, {
        speed: "N/A"
    });

    const initialCardList = await checkInitialCardList()
        .catch(err => null);
    const initialResult = initialCardList ? JSON.parse(initialCardList) : await processAllCards(pageList);

    const result = [];

    initialResult.forEach(item => {
        if (Array.isArray(item)) return item.forEach(subItem => result.push(subItem));
        if (!item?.name) return;
        result.push(item);
    });

    progress.stop();

    fs.writeFile(getCardListPath(), JSON.stringify(result, undefined, 2), { flags: 'a'}, (err) => {
        if (err) console.error(err);
    });

    fs.writeFile(getCardListInitialPath(), JSON.stringify(initialResult, undefined, 2), { flags: 'a'}, (err) => {
        if (err) console.error(err);
    });
}


runParser().catch(console.error);
