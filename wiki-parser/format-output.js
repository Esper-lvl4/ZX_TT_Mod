const fs = require('fs');
const cliProgress = require('cli-progress');
const progressColors = require('ansi-colors');

const vectors = require('./saved_objects/vectors');
const snapPoints = require('./saved_objects/snap_points');
const tableReplacements = require('./saved_objects/table_replacement');
const field = require('./saved_objects/field');
const player_hands = require('./saved_objects/player_hands');
const zones = require('./saved_objects/zones');
const rules_pdf = require('./saved_objects/rules_pdf');
const power_chip_bag = require('./saved_objects/power_chip_bag');
const createNewXML = require('./xml_generator');

const {
  EXCLUDED_KEYS,
  EXCLUDED_MATCHES,
  CARD_LIST_NAME,
  SAVE_NAME,
  LUA_SCRIPT_NAME,
  RESULTS_FOLDER,
} = require('./config');


const BAGS = new Map();
const RESERVED_HASHES = [
  ...vectors.map(item => item.GUID),
  ...snapPoints.map(item => item.GUID),
  ...tableReplacements.map(item => item.GUID),
  ...field.map(item => item.GUID),
  ...player_hands.map(item => item.GUID),
  ...zones.map(item => item.GUID),
  ...rules_pdf.map(item => item.GUID),
  ...power_chip_bag.map(item => item.GUID),

];
const usedHashes = new Set(RESERVED_HASHES);

function getSavePath() {
  return RESULTS_FOLDER + SAVE_NAME;
}

function getCardListPath() {
  return RESULTS_FOLDER + CARD_LIST_NAME;
}

function isExcluded(field) {
  return EXCLUDED_KEYS[field] || EXCLUDED_MATCHES[field.replace(/\d/g, '')];
}

const CARD_COLORS = '(Red|Blue|White|Black|Green|Colorless|Black-Green)';

const progress = new cliProgress.SingleBar({
  format: 'Saving cards |' + progressColors.cyan('{bar}') + '| {percentage}% || {value}/{total} Cards saved',
  barCompleteChar: '\u2588',
  barIncompleteChar: '\u2591',
  hideCursor: true
});

let bagCounter = 0;
let cardCounter = 1;

const tribeNames = new Set();
const playerNames = new Set(['Miko']);
const iconNames = new Set();

function makeHash(length = 15) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  if (usedHashes.has(result)) return makeHash(length);
  usedHashes.add(result);
  return result;
}

function getFullCardList() {
  return new Promise((resolve, reject) => {
    fs.readFile(getCardListPath(), (err, file) => {
      if (err) {
        reject(err);
      }
      resolve(file);
    });
  });
}

function createNewSave(saveObject) {
  const json = JSON.stringify(saveObject, undefined, 2)

  return new Promise((resolve, reject) => {
    fs.writeFile(getSavePath(), json, { flags: 'a'}, (err) => {
        if (err) {
            reject(err);
        }
        resolve(json);
    });
  });
}

function convertOneCard(card) {
  const { name, text, image, color, type } = card;
  if (!image || (!color && !type) || name === 'Synchrotron') return;
  const tribes = [];
  let hasMikoPlayer = false;

  const GMNotes =  Object.keys(card).reduce((acc, key) => {
    if (isExcluded(key)) return acc;
    let currentValue = card[key];

    if (key.match('tribe')) {
      const resultTribe = currentValue
        .replace(/\[\[([\w\s\.\-☆]+)\]\]/g, '$1');
      tribes.push(resultTribe);
      tribeNames.add(resultTribe);
      currentValue = resultTribe;
    }

    if (key.match('icon')) {
      iconNames.add(currentValue);
    }

    if (key.match('player')) {
      let resultPlayer = currentValue
        .replace(/\[\[([\w\s\.\,]+)\|([\w\s\.\,]+)\]\]\s\(\W+\)/g, '$2')
        .replace(/\[\[([\w\s\.\,]+)\s\(card\)\|([\w\s\.\,]+)\]\]\s\(\W+\)/g, '$2')
        .replace(/\[\[([\w\s\.\,]+)\s\(card\)\|([\w\s\.\,]+)\s\(\W+\)\]\]/g, '$2')
        .replace(/\[\[([\w\s\.\,]+)\]\]\s\(\W+\)/g, '$1')
        .replace(/([\w\s\.\,]+)\s\(\W+\)/g, '$1');

      if (resultPlayer.match(/\s\/\sMiko/)) {
        resultPlayer = resultPlayer.replace(/\s\/\sMiko/, '');
        hasMikoPlayer = true;
      }
      playerNames.add(resultPlayer);
      currentValue = resultPlayer;
    }

    return `${acc}[${key}: ${currentValue}];`;
  }, '').slice(0, -1);

  const tribesText = tribes.length === 0
    ? ''
    : `(${tribes.reduce((acc, tribe) => acc + (acc ? ' | ' : '') + tribe, '')})\n `;
  
  const mikoPlayer = hasMikoPlayer ? ';[player: Miko]' : ''

  const index = (cardCounter++).toString();
  const cardID = +index * 100;

  return {
    GUID: makeHash(6),
    Name: "CardCustom",
    Transform: {
      posX: 0,
      posY: 0,
      posZ: 0,
      rotX: 0,
      rotY: 180,
      rotZ: 0,
      scaleX: 2.0,
      scaleY: 1.0,
      scaleZ: 2.0
    },
    CustomDeck: {
      [index]: {
        FaceURL: image,
        BackURL: 'https://static.wikia.nocookie.net/zxtcg/images/b/b9/Back.png/revision/latest?cb=20140122184422',
        NumWidth: 1,
        NumHeight: 1,
        BackIsHidden: true,
        UniqueBack: false,
        Type: 0,
      },
    },
    Nickname: convertName(name),
    Description: tribesText + convertText(text),
    GMNotes: GMNotes + mikoPlayer,
    ColorDiffuse: {
      r: 0.713235259,
      g: 0.713235259,
      b: 0.713235259,
    },
    LayoutGroupSortIndex: 0,
    Value: 0,
    Locked: false,
    Grid: true,
    Snap: true,
    IgnoreFoW: false,
    MeasureMovement: false,
    DragSelectable: true,
    Autoraise: true,
    Sticky: true,
    Tooltip: true,
    GridProjection: false,
    HideWhenFaceDown: true,
    Hands: true,
    SidewaysCard: false,
    CardID: cardID,
    LuaScript: "",
    LuaScriptState: "",
    XmlUI: ""
  }
}

function convertName(name) {
  return name.replace(/\<small\>([\w\-]+)\<\/small\>/g, '$1');
}

function convertText(text) {
  if (typeof text !== 'string') return '';
  const mainRegex = /\{\{([\w\s\|\,\?\-☆'"&\.\!\/]+)\}\}/g;
  return text
    .replace(/(\{\{Diagram.*(\}\}\}\}|\|\s\}\})\s*|\|notext|'''[\<\>]''')/g, '')
    .replace(/\{\{(◎|△|◇|⌂)\}\}/g, '$1')
    .replace(mainRegex, '[$1]')
    .replace(/<br>/g, '\n')
    .replace(/\"/g, "'")
    .replace(/\{\{Alt\|(Prism|Nu|Marie|Ugly|Pecteilis|Celaeno|Prayer|Oath|Pledge|Kasuga|Ange|Marie|Mysteries|Nameless|Pnakotic|R'lyeh|Yuri|\[\[Grimoire Princess\]\]|Arane|Enju|Cana|Prism|Hades|Apollon|Pecteilis|Iyoku|Kanemaru|Terashi|Uchida|Saito)\|(プリズム|ニュー|ミーリィ|アグリィ|ペクティリス|セレアノ|祈り|誓い|契り|カスガ|アンジュ|ミーリィ|ミステリア|ネムレ|ナトコ|ルルイユ|ユーリ|顕臨姫|アラネ|エンジュ|カナ|プリズムリィ|ハデス|アポロン|ペクティリスリィ|イヨク|カネマール|テラシ|ウチダ|サイトー)\|explain=yes\}\}/g, "$1")
    .replace(/\{\{Alt\|(Prism|Nu|Marie|Ugly|Pecteilis|Celaeno|Prayer|Oath|Pledge|Kasuga|Ange|Marie|Mysteries|Nameless|Pnakotic|R'lyeh|Yuri|\[\[Grimoire Princess\]\]|Arane|Enju|Cana|Prism|Hades|Apollon|Pecteilis|Iyoku|Kanemaru|Terashi|Uchida|Saito)\|(プリズム|ニュー|ミーリィ|アグリィ|ペクティリス|セレアノ|祈り|誓い|契り|カスガ|アンジュ|ミーリィ|ミステリア|ネムレ|ナトコ|ルルイユ|ユーリ|顕臨姫|アラネ|エンジュ|カナ|プリズムリィ|ハデス|アポロン|ペクティリスリィ|イヨク|カネマール|テラシ|ウチダ|サイトー)\}\}/g, '$1')
    .replace(/\{\{(Rewrite|Resurrection|Activate)\|\[Cost\|(Black|Green|Blue|Red|White|Colorless)\|(\d+)\](\|notext|\|newtext)*\}\}/g, '[$1: $2 $3]')
    .replace(/\{\{Tooltip\|([\w\s♥'@\,\-]+)\}\}/g, '$1')
    .replace(/\{\{Tooltip\|([\w\s♥'@\,\-]+)\s\(card\)\|([\w\s♥'@\,\-]+)\}\}/g, '$1')
    .replace(/\{\{([\w\s♥'@\,\-]+)\s\(card\)\|([\w\s♥'@\,\-]+)\}\}/g, '$2')
    .replace(/'\{\{Alt\|月\|(Moon\/Month)\}\}'/g, '($1 name)')
    .replace(/\{\{Alt\|(Prism)\|\|explain=yes\}\}/g, '$1')
    .replace(/\{\{(Advent Condition)\|(\d+)\|\[(E☆2)\]\|\d+\}\}/g, '$1: $2 $3')
    .replace(/\[Player\]\s\[Player\|/g, '[Player: ')
    .replace(/\[Icon\|(Red|Blue|White|Black|Green|Colorless)\]\[Cost\|(Red|Blue|White|Black|Green|Colorless)\|(\d{1,2})\]/g, '$3 [u]$1 or $2[/u]')
    .replace(new RegExp(`\\[Cost\\]\\s\\[Cost\\|${CARD_COLORS}\\|(\\d+)\\]`, 'g'), '[Cost] $1 $2')
    .replace(/\[Cost\]\s\[Cost\|(\w+)\]/g, '[Cost] $1')
    .replace(/\[Cost\|(Red|Blue|White|Black|Green|Colorless)\|(\d+)\]/g, '[Cost] $1 $2')
    .replace(/\[Cost\|(\w+)\]/g, '[Cost] $1')
    // .replace(/\[Icon\|(Black|Green|White|Red|Blue|Colorless)\]/g, '')
    .replace(/\[\[(Advent Condition)\]\]/g, '[$1]')
    .replace(/\[(Advent Condition)\|(\d+)\|(Red|Blue|White|Black|Green|Colorless)\s(Z\/X)\|*\d*\]/g, '[$1]: $2 $3 $4')
    .replace(/(Advent Condition) :\s(\d+)\s(Red|Blue|White|Black|Green|Colorless)\s(Z\/X)/g, '[$1]: $2 $3 $4')
    .replace(/\[(Tooltip|Alt|Tribe)\|([\w\s\,\.\'\-\&\?\!☆]+)\]/g, "$2")
    .replace(/\[(Tooltip|Alt)\|([\w\s\,\.\'\-\&\?\!]+)\|([\w\s\,\.\'\-\&\?\!]+)\]/g, "$2")
    .replace(/\'+\[\[(Life Recovery|Alter Break|Lightning Shadow|Install|Resurrection|Advent Condition|Void Bringer|Color Break)\]\]\'+/g, '[$1]')
    .replace(/\'+(Absolute Boundary|Resurrection|Range [\d∞]|Install|Genesis Rebuild|Life Recovery|Lightning Shadow)\'+/g, '[$1]')
    .replace(/\<small\>([\w\-]+)\<\/small\>/g, '$1')
    .replace(/\[\[Unaffected by Effect\|(unaffected by the effect|unaffected by card's effect)\]\]/g, "$1")
    .replace(/\[Text\|([\w\s]+)\]/g, '[$1]')
    .replace(/\[Turn\|All\|(\d)\]/g, '[b][$1/Turn][/b]')
    .replace(/\[Turn\|(Own|Opponent|Opp)\|(\d)\]/g, '[b][$2/Turn: $1][/b]')
    .replace(/\[Turn\|(Own|Opponent|Opp)\]/g, '[b][Turn: $1][/b]')
    .replace(/\[\[[\w\,\.\-\s]+\s\(card\)\|([\w\,\.\-\s]+)\]\]/g, '$1')
    .replace(/\[(Card|Player)\|([\w\,\.\-\s]+)\]/g, '$2')
    .replace(/\[Range\|(\d|∞)\|(nogroup|full|newtext|newtext\|full)\]/g, '[b]Range $1[/b]')
    .replace(/\[Range\|(\d|∞)\]/g, '[b]Range $1[/b]')
    .replace(/\[Range\|(\d|∞)\|(newtext|full)\]/g, '[b]Range $1[/b]')
    .replace(/\[Range\|infinity\]/g, '[b]Range ∞[/b]')
    .replace(/\[Range\|(infinity)\|(newtext|full)\]/g, '[b]Range ∞[/b]')
    .replace(/\[\[Ignition Overdrive\|Ignition\]\]/g, '[b]Ignition[/b]')
    .replace(/\[Void Bringer\|newtext\]/g, '[b]Void Bringer[/b]')
    .replace(/\[Icon\|Effect\]/g, '[Effect]')
    .replace(/\[Zero Optima\|(\d)\|short\]/g, '[b]Zero Optima $1[/b]')
    .replace(/\[Zero Optima\|(\d)\]/g, '[b]Zero Optima $1[/b]')
    .replace(/\[Dynamis\|R\]/g, '[b][Dynamis][/b]')
    .replace(/\[Dynamis\|F\]/g, '[b][Dynamis Up][/b]')
    .replace(/\[\[:Category:(Evol Seed|Ignition) Icon\|(Evol Seed|Ignition) Icon\]\]/g, '[b][$2] Icon[/b]')
    .replace(/\[Void Bringer\|newtext\|full\]/g, '[b]Void Bringer[/b]')
    .replace(/\[Life Recovery\|newtext\]/g , '[b]Life Recovery[/b]')
    .replace(/\[Evol Seed\|newtext\]/g, '[b][Evol Seed][/b]')
    .replace(/\[\[Break\|Broke\]\]/g, '[b]Broke[/b]')
    .replace(/\[Alter Force\|(\d)\]/g, '[b]Alter Force $1[/b]')
    .replace(/\[Cooperation\|([\w\s\,\.\']+)\]/g, '[b]Cooperation—$1[/b]')
    .replace(/\[\[Darkness Knights\|Darkness Knight\]\]/g, 'Darkness Knight')
    .replace(/\[Lightning Shadow\|(\d)\]/g, '[b]Lightning Shadow $1[/b]')
    .replace(/\[\[Remove Zone\|Remove\]\]/g, 'Remove')
    .replace(/\[(Symbol|Sublimation)\|([\w\s\,\.\']+)\]/g, '[b]$1 "$2"[/b]')
    .replace(/\[Sublimation\|([\w\s\,\.\']+)\|(\d)\]/g, '[b]Sublimation $2 "$1"[/b]')
    .replace(/\[Idealize Condition\|(\d)\|([\w\s]+)\]/g, '[b][Idealize Condition $1 $2][/b]')
    .replace(/\[Advent Condition\|(\d)\|([\w\s\/\,\-\']+)\|\d{1,2}\]/g, '[b][Advent Condition $1 $2][/b]')
    .replace(/\[\[Dragon Miko of the Beginning, Ea\|Ea\]\]/g, 'Ea')
    .replace(/\[\[([\w\s,]+)\]\]/g, '$1')
    .replace(/(\<nowiki\>\'\<\/nowiki\>\'\'\'\[\[Z\/Xtend Drive!\]\]\'\'\'\<nowiki\>\'\<\/nowiki\>|\'\'\'\'\[\[Z\/Xtend Drive\!\]\]\'\'\'\')/g, "'Z/Xtend Drive!'")
    .replace(/\[\[Moe Music Researcher, Masaya Koike \(4444ver\)\]\]/g, 'Moe Music Researcher, Masaya Koike (4444ver)')
    .replace(/\[\[Main Armament, Fire\!\]\]/g, 'Main Armament, Fire!')
    // .replace(/([\w\,\.\-\s]+) \/ Miko/g, '$1')

    // format colors and style. 
    .replace(/\[Auto\]/g, '[14A83B][b][Auto][/b][-]')
    .replace(/\[Special\]/g, '[DE0063][b][Special][/b][-]')
    .replace(/\[Always\]/g, '[00A0E9][b][Always][/b][-]')
    .replace(/\[(Effect|Valid|Trigger|Turn|Player|Cost)\]/g, '[00ffff][b][$1][/b][-]')
    .replace(/\[Boot\]/g, '[EA5302][b][Boot][/b][-]')
    .replace(/\[Event\]/g, '[FFFF00][b][Event][/b][-]')
    .replace(/\[(Alter Force|Absolute Boundary|Start Card)\]/g, '[b]$1[/b]')
    .replace(/\[(Alter Force|Absolute Boundary|Start Card)\|newtext\]/g, '[b]$1[/b]')
    .replace(/\[Alter Force\|(\d{1,2})\|(newtext|newtext\|short)\]/g, '[b]Alter Force $1[/b]')
    .replace(/\[(Level)\|(\d{1,2})\|([\w\s\.\,\-]+)\]/g, '[b][$1 $2 $3][/b]')
    .replace(/\[(Level)\|(\d{1,2})\|([\w\s\.\,\-]+)\|long\]/g, '[b][$1 $2 $3][/b]')
    .replace(/\[(Level)\|(\d{1,2})\|([\w\s\.\,\-]+)\|\]/g, '[b][$1 $2 $3][/b]')
    ;
}

function getBag(name) {
  if (!name) name = 'No type';
  let bag = BAGS.get(name);
  if (!bag) {
    bag = createBag(name)
    BAGS.set(name, bag);
  }
  return bag;
}

function createBag(name) {
  const counter = bagCounter++;
  return {
    GUID: makeHash(6),
    Name: 'Bag',
    Transform: {
      posX: -33 + (counter % 12) * 3,
      posY: 0.9,
      posZ: 32 + Math.floor(counter / 12) * 3,
      rotX: 0,
      rotY: 0,
      rotZ: 0,
      scaleX: 1.0,
      scaleY: 1.0,
      scaleZ: 1.0
    },
    Nickname: name,
    Description: "",
    GMNotes: "",
    ColorDiffuse: {
      r: 0.856,
      g: 0.0999994352,
      b: 0.09399942
    },
    Tags: [
      "hidden_zone"
    ],
    LayoutGroupSortIndex: 0,
    Value: 0,
    Locked: true,
    Grid: true,
    Snap: true,
    IgnoreFoW: false,
    MeasureMovement: false,
    DragSelectable: true,
    Autoraise: true,
    Sticky: true,
    Tooltip: true,
    GridProjection: false,
    HideWhenFaceDown: false,
    Hands: false,
    MaterialIndex: -1,
    MeshIndex: -1,
    Number: 0,
    Bag: {
      Order: 0
    },
    LuaScript: "",
    LuaScriptState: "",
    XmlUI: "",
    ContainedObjects: [],
  }
}

async function getSaveSceleton() {
  return {
    SaveName: "Z/X Tabletop Plugin (alpha)",
    GameMode: "Z/X Tabletop Plugin (alpha)",
    Date: "6/08/2022 2:44:18 PM",
    Gravity: 0.5,
    PlayArea: 0.5,
    Table: "Table_None",
    TableURL: "https://www.dropbox.com/s/epq3vvuxj7ls6q9/bck44btn.jpg?dl=1",
    Sky: "Sky_Forest",
    Note: "",
    Rules: "",
    PlayerTurn: "",
    TabStates: {
      "0": {
        title: "Rules",
        body: "",
        color: "Grey",
        visibleColor: {
          r: 0.5,
          g: 0.5,
          b: 0.5
        },
        id: 0
      },
      "1": {
        title: "White",
        body: "",
        color: "White",
        visibleColor: {
          r: 1.0,
          g: 1.0,
          b: 1.0
        },
        id: 1
      },
      "2": {
        title: "Red",
        body: "",
        color: "Red",
        visibleColor: {
          r: 0.856,
          g: 0.1,
          b: 0.094
        },
        id: 2
      },
      "3": {
        title: "Orange",
        body: "",
        color: "White",
        visibleColor: {
          r: 1.0,
          g: 1.0,
          b: 1.0
        },
        id: 3
      },
      "4": {
        title: "Yellow",
        body: "",
        color: "Yellow",
        visibleColor: {
          r: 0.905,
          g: 0.898,
          b: 0.172
        },
        id: 4
      },
      "5": {
        title: "Green",
        body: "",
        color: "Green",
        visibleColor: {
          r: 0.192,
          g: 0.701,
          b: 0.168
        },
        id: 5
      },
      "6": {
        title: "Blue",
        body: "",
        color: "Blue",
        visibleColor: {
          r: 0.118,
          g: 0.53,
          b: 1.0
        },
        id: 6
      },
      "7": {
        title: "Purple",
        body: "",
        color: "Purple",
        visibleColor: {
          r: 0.627,
          g: 0.125,
          b: 0.941
        },
        id: 7
      },
      "8": {
        title: "Pink",
        body: "",
        color: "Pink",
        visibleColor: {
          r: 0.96,
          g: 0.439,
          b: 0.807
        },
        id: 8
      },
      "9": {
        title: "Black",
        body: "",
        color: "White",
        visibleColor: {
          r: 1.0,
          g: 1.0,
          b: 1.0
        },
        id: 9
      }
    },
    Grid:
    {
        Type: 0,
        Lines: false,
        Color: {
          r: 0.0,
          g: 0.0,
          b: 0.0
        },
        Snapping: true,
        Offset: false,
        BothSnapping: false,
        xSize: 0.5,
        ySize: 0.5
    },
    Lighting: {
      LightIntensity: 0.54,
      LightColor: {
        r: 1.0,
        g: 0.9804,
        b: 0.8902
      },
      AmbientIntensity: 1.3,
      AmbientType: 0,
      AmbientSkyColor: {
        r: 0.5,
        g: 0.5,
        b: 0.5
      },
      AmbientEquatorColor: {
        r: 0.5,
        g: 0.5,
        b: 0.5
      },
      AmbientGroundColor: {
        r: 0.5,
        g: 0.5,
        b: 0.5
      },
      ReflectionIntensity: 1.0,
      LutIndex: 0,
      LutContribution: 1.0
    },
    Hands: {
      Enable: true,
      DisableUnused: true,
      Hiding: 0
    },
    ComponentTags: {
      labels: [
        {
          displayed: "hidden_zone",
          normalized: "hidden_zone"
        }
      ]
    },
    DrawImage: "",
    LuaScript: await getLuaScript(),
    VectorLines: vectors,
    SnapPoints: snapPoints,
    ObjectStates: [
      ...tableReplacements,
      ...field,
      ...player_hands,
      ...zones,
      ...rules_pdf,
      ...power_chip_bag,
    ],
  };
}

function getLuaScript() {
  return new Promise((resolve, reject) => {
      fs.readFile(`../${LUA_SCRIPT_NAME}`, (err, file) => {
          if (err) {
              reject(err);
          }
          resolve(Buffer.from(file).toString().replace(/\n/g, '\r\n'));
      });
  });
}

async function convertToSaveFile() {
  const cardListJSON = await getFullCardList();
  if (!cardListJSON) return;

  const cardList = JSON.parse(cardListJSON);
  const saveObject = await getSaveSceleton();

  progress.start(cardList.length, 0, {
      speed: "N/A"
  });

  for (const card of cardList) {
    const convertedCard = convertOneCard(card);
    progress.increment();
    if (!convertedCard) continue;

    const anyBag = getBag('Any');
    const bag = getBag(card.type);
    bag.ContainedObjects.push(convertedCard);
    anyBag.ContainedObjects.push(convertedCard);

    if (card.type2) {
      const bag = getBag(card.type2);
      bag.ContainedObjects.push(convertedCard);
    }
  }

  progress.stop();

  for (let [_, bag] of BAGS.entries()) {
    saveObject.ObjectStates.push(bag);
  }

  saveObject.XmlUI = await createNewXML(tribeNames, playerNames, iconNames);
  createNewSave(saveObject);
}

convertToSaveFile().catch(console.error);
