const fs = require('fs');
const cliProgress = require('cli-progress');
const progressColors = require('ansi-colors');

const CARD_LIST_NAME = 'card_list.json';
const SAVE_NAME = 'ZX_TT_Plugin (alpha).json';
const XML_NAME = 'global-ui.xml';
const LUA_SCRIPT_NAME = 'global.lua';
const RESULTS_FOLDER = 'results/';
const EXCLUDED_KEYS = [
  'image',
  'name',
  'jpname',
  'phon',
  'text',
  'jptext',
  'jptex',
  'sets',
  'date',
  'card',
  'expire',
  'related',
  'flavor',
  'note',
  'flavor_je',
  'copyright',
  'gender',
  'age',
  'birthday',
  'nationality',
  'partner',
  'cv',
  'relatives',
  'affiliation',
].reduce((acc, field) => {
  acc[field] = true;
  return acc;
}, {});
const EXCLUDED_MATCHES = [
  'category',
  'illust',
  'illust_card'
].reduce((acc, field) => {
  acc[field] = true;
  return acc;
}, {});
const BAGS = new Map();
const RESERVED_HASHES = [
  '5e7847', 'd9c954', 'e5b75d', '84d9b3', '721653', '65cea8', 'da6d5e', '9c09d5',
  '70f02a', 'd27265', 'dc59e6', '0206f0', 'caddbe',
];
const usedHashes = new Set(RESERVED_HASHES);

function getSavePath() {
  return RESULTS_FOLDER + SAVE_NAME;
}

function getXMLPath() {
  return RESULTS_FOLDER + XML_NAME;
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

const colors = ['White', 'Blue', 'Red', 'Green', 'Black', 'Colorless'];
const types = ['Z/X', 'Event', 'Player', 'Z/X EX', 'EV EX', 'PL EX', 'Shift', 'Z/X OB', 'Marker', 'Token', 'Counter', 'LRIG', 'Any'];
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
    VectorLines: [
      {
        points3: [
          {
            x: -39,
            y: 0.97,
            z: 37.3,
          },
          {
            x: -39,
            y: 0.97,
            z: 4.8,
          }
        ],
        color: {
          r: 0.5,
          g: 0.0,
          b: 0.5
        },
        thickness: 0.3
      },
      {
        points3: [
          {
            x: -39,
            y: 0.97,
            z: 4.8,
          },
          {
            x: -75,
            y: 0.97,
            z: 4.8,
          }
        ],
        color: {
          r: 0.5,
          g: 0.0,
          b: 0.5
        },
        thickness: 0.3
      }
    ],
    SnapPoints: [
      // Top Deck
      {
        Position: {
          x: 20.33,
          y: 0.98,
          z: 10.27,
        }
      },

      // Top Trash
      {
        Position: {
          x: 20.33,
          y: 0.98,
          z: 17.74,
        }
      },

      // Top Dynamis
      {
        Position: {
          x: 19.52,
          y: 0.98,
          z: 3.7,
        },
        Rotation: {
          x: 0.0,
          y: 270,
          z: 0.0
        },
      },
      {
        Position: {
          x: 13,
          y: 0.98,
          z: 3.7,
        },
        Rotation: {
          x: 0.0,
          y: 270,
          z: 0.0
        },
      },

      // Bottom charge
      {
        Position: {
          x: 20.38,
          y: 0.98,
          z: -10.21,
        }
      },
      {
        Position: {
          x: 16,
          y: 0.98,
          z: -10.21,
        }
      },
      {
        Position: {
          x: 11.50,
          y: 0.98,
          z: -10.21,
        }
      },
      {
        Position: {
          x: 7,
          y: 0.98,
          z: -10.21,
        }
      },

      // Bottom Life
      {
        Position: {
          x: 20.38,
          y: 0.98,
          z: -17.78,
        }
      },
      {
        Position: {
          x: 16,
          y: 0.98,
          z: -17.78,
        }
      },
      {
        Position: {
          x: 11.50,
          y: 0.98,
          z: -17.78,
        }
      },
      {
        Position: {
          x: 7,
          y: 0.98,
          z: -17.78,
        }
      },

      // Bottom Resource
      {
        Position: {
          x: 26.88,
          y: 0.98,
          z: -17.78,
        }
      },
      {
        Position: {
          x: 31.33,
          y: 0.98,
          z: -17.78,
        }
      },
      {
        Position: {
          x: 35.78,
          y: 0.98,
          z: -17.78,
        }
      },
      {
        Position: {
          x: 40.23,
          y: 0.98,
          z: -17.78,
        }
      },
      {
        Position: {
          x: 44.68,
          y: 0.98,
          z: -17.78,
        }
      },
      {
        Position: {
          x: 49.13,
          y: 0.98,
          z: -17.78,
        }
      },
      {
        Position: {
          x: 26.88,
          y: 0.98,
          z: -24.27,
        }
      },
      {
        Position: {
          x: 31.33,
          y: 0.98,
          z: -24.27,
        }
      },
      {
        Position: {
          x: 35.78,
          y: 0.98,
          z: -24.27,
        }
      },
      {
        Position: {
          x: 40.23,
          y: 0.98,
          z: -24.27,
        }
      },
      {
        Position: {
          x: 44.68,
          y: 0.98,
          z: -24.27,
        }
      },
      {
        Position: {
          x: 49.13,
          y: 0.98,
          z: -24.27,
        }
      },

      // Bottom Trash
      {
        Position: {
          x: 55.69,
          y: 0.98,
          z: -17.78,
        }
      },

      // Bottom Deck
      {
        Position: {
          x: 55.69,
          y: 0.98,
          z: -10.22,
        }
      },

      // Bottom Dynamis
      {
        Position: {
          x: 56.48,
          y: 0.98,
          z: -3.71,
        },
        Rotation: {
          x: 0.0,
          y: 90,
          z: 0.0
        },
      },
      {
        Position: {
          x: 63.00,
          y: 0.98,
          z: -3.71,
        },
        Rotation: {
          x: 0.0,
          y: 90,
          z: 0.0
        },
      },

      // Top Charge
      {
        Position: {
          x: 55.69,
          y: 0.98,
          z: 10.31,
        }
      },
      {
        Position: {
          x: 60.19,
          y: 0.98,
          z: 10.31,
        }
      },
      {
        Position: {
          x: 64.69,
          y: 0.98,
          z: 10.31,
        }
      },
      {
        Position: {
          x: 69.19,
          y: 0.98,
          z: 10.31,
        }
      },

      // Top Life
      {
        Position: {
          x: 55.69,
          y: 0.98,
          z: 17.75,
        }
      },
      {
        Position: {
          x: 60.19,
          y: 0.98,
          z: 17.75,
        }
      },
      {
        Position: {
          x: 64.69,
          y: 0.98,
          z: 17.75,
        }
      },
      {
        Position: {
          x: 69.19,
          y: 0.98,
          z: 17.75,
        }
      },

      // Top Resource
      {
        Position: {
          x: 26.93,
          y: 0.98,
          z: 17.75,
        }
      },
      {
        Position: {
          x: 31.38,
          y: 0.98,
          z: 17.75,
        }
      },
      {
        Position: {
          x: 35.83,
          y: 0.98,
          z: 17.75,
        }
      },
      {
        Position: {
          x: 40.38,
          y: 0.98,
          z: 17.75,
        }
      },
      {
        Position: {
          x: 44.83,
          y: 0.98,
          z: 17.75,
        }
      },
      {
        Position: {
          x: 49.38,
          y: 0.98,
          z: 17.75,
        }
      },
      {
        Position: {
          x: 26.93,
          y: 0.98,
          z: 24.21,
        }
      },
      {
        Position: {
          x: 31.38,
          y: 0.98,
          z: 24.21,
        }
      },
      {
        Position: {
          x: 35.83,
          y: 0.98,
          z: 24.21,
        }
      },
      {
        Position: {
          x: 40.38,
          y: 0.98,
          z: 24.21,
        }
      },
      {
        Position: {
          x: 44.83,
          y: 0.98,
          z: 24.21,
        }
      },
      {
        Position: {
          x: 49.38,
          y: 0.98,
          z: 24.21,
        }
      },

      // Squares
      {
        Position: {
          x: 28.61,
          y: 0.98,
          z: 9.38,
        }
      },
      {
        Position: {
          x: 28.61,
          y: 0.98,
          z: 0,
        }
      },
      {
        Position: {
          x: 28.61,
          y: 0.98,
          z: -9.38,
        }
      },
      {
        Position: {
          x: 38,
          y: 0.98,
          z: 9.38,
        }
      },
      {
        Position: {
          x: 38,
          y: 0.98,
          z: 0,
        }
      },
      {
        Position: {
          x: 38,
          y: 0.98,
          z: -9.38,
        }
      },
      {
        Position: {
          x: 47.39,
          y: 0.98,
          z: 9.38,
        }
      },
      {
        Position: {
          x: 47.39,
          y: 0.98,
          z: 0,
        }
      },
      {
        Position: {
          x: 47.39,
          y: 0.98,
          z: -9.38,
        }
      },
    ],
    ObjectStates: [
      {
        GUID: "dc59e6",
        Name: "Custom_Tile",
        Transform: {
          posX: 38,
          posY: 0.86,
          posZ: 0,
          rotX: 0,
          rotY: 180,
          rotZ: 0,
          scaleX: 38,
          scaleY: 1.0,
          scaleZ: 38
        },
        Nickname: "",
        Description: "",
        GMNotes: "",
        ColorDiffuse: {
          "r": 1.0,
          "g": 1.0,
          "b": 1.0
        },
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
        CustomImage: {
          ImageURL: "http://cloud-3.steamusercontent.com/ugc/1740099311612045504/570B1651D2304439FC2960BC728CDBDB813D667F/",
          ImageSecondaryURL: "http://cloud-3.steamusercontent.com/ugc/1740099311612045504/570B1651D2304439FC2960BC728CDBDB813D667F/",
          ImageScalar: 1.0,
          WidthScale: 0.0,
          CustomTile: {
            Type: 0,
            Thickness: 0.1,
            Stackable: false,
            Stretch: true
          }
        },
        LuaScript: "",
        LuaScriptState: "",
        XmlUI: ""
      },
      {
        GUID: "d27265",
        Name: "Custom_Tile",
        Transform: {
          posX: -38, // -44.57,
          posY: 0.86,
          posZ: 0,
          rotX: 0,
          rotY: 180,
          rotZ: 0,
          scaleX: 38, // 37.8979,
          scaleY: 1.0,
          scaleZ: 38, // 37.4094734
        },
        Nickname: "",
        Description: "",
        GMNotes: "",
        ColorDiffuse: {
          r: 1.0,
          g: 1.0,
          b: 1.0
        },
        LayoutGroupSortIndex: 0,
        Value: 0,
        Locked: true,
        Grid: true,
        Snap: true,
        IgnoreFoW: true,
        MeasureMovement: false,
        DragSelectable: false,
        Autoraise: true,
        Sticky: true,
        Tooltip: true,
        GridProjection: false,
        HideWhenFaceDown: false,
        Hands: false,
        CustomImage: {
          ImageURL: "http://cloud-3.steamusercontent.com/ugc/1740099311612045504/570B1651D2304439FC2960BC728CDBDB813D667F/",
          ImageSecondaryURL: "http://cloud-3.steamusercontent.com/ugc/1740099311612045504/570B1651D2304439FC2960BC728CDBDB813D667F/",
          ImageScalar: 1.0,
          WidthScale: 0.0,
          CustomTile: {
            Type: 0,
            Thickness: 0.1,
            Stackable: false,
            Stretch: false,
          }
        },
        LuaScript: "",
        LuaScriptState: "",
        XmlUI: ""
      },
      {
        GUID: "70f02a",
        Name: "Custom_Tile",
        Transform: {
          posX: 38,
          posY: 0.87,
          posZ: 0.0,
          rotX: 0,
          rotY: 180,
          rotZ: 0,
          scaleX: 26,
          scaleY: 1,
          scaleZ: 26
        },
        Nickname: "",
        Description: "",
        GMNotes: "",
        ColorDiffuse: {
          r: 1.0,
          g: 1.0,
          b: 1.0
        },
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
        CustomImage: {
          ImageURL: "http://cloud-3.steamusercontent.com/ugc/1740099374797010757/90718E7DD0D4548FFBF3925BB1C6A9936CAFDC1D/",
          ImageSecondaryURL: "http://cloud-3.steamusercontent.com/ugc/1740099374797010757/90718E7DD0D4548FFBF3925BB1C6A9936CAFDC1D/",
          ImageScalar: 1.0,
          WidthScale: 0.0,
          CustomTile: {
            Type: 0,
            Thickness: 0.1,
            Stackable: false,
            Stretch: true
          }
        },
        LuaScript: "",
        LuaScriptState: "",
        XmlUI: ""
      },
      {
        GUID: "721653",
        Name: "HandTrigger",
        Transform: {
          posX: 38,
          posY: 4,
          posZ: -42,
          rotX: 0.0,
          rotY: 0.0,
          rotZ: 0.0,
          scaleX: 19,
          scaleY: 7,
          scaleZ: 9
        },
        Nickname: "",
        Description: "",
        GMNotes: "",
        ColorDiffuse: {
          r: 0.856,
          g: 0.09999997,
          b: 0.09399996,
          a: 0.0
        },
        LayoutGroupSortIndex: 0,
        Value: 0,
        Locked: true,
        Grid: false,
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
        FogColor: "Red",
        LuaScript: "",
        LuaScriptState: "",
        XmlUI: ""
      },
      {
        GUID: "65cea8",
        Name: "HandTrigger",
        Transform: {
          posX: 38,
          posY: 4,
          posZ: 42,
          rotX: 0.0,
          rotY: 180,
          rotZ: 0.0,
          scaleX: 19,
          scaleY: 7,
          scaleZ: 9
        },
        Nickname: "",
        Description: "",
        GMNotes: "",
        ColorDiffuse: {
          r: 0.117999978,
          g: 0.53,
          b: 1.0,
          a: 0.0
        },
        LayoutGroupSortIndex: 0,
        Value: 0,
        Locked: true,
        Grid: false,
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
        FogColor: "Blue",
        LuaScript: "",
        LuaScriptState: "",
        XmlUI: ""
      },
      {
        GUID: "65cea8",
        Name: "HandTrigger",
        Transform: {
          posX: -28,
          posY: 4,
          posZ: 42,
          rotX: 0.0,
          rotY: 180,
          rotZ: 0.0,
          scaleX: 19,
          scaleY: 7,
          scaleZ: 9
        },
        Nickname: "",
        Description: "",
        GMNotes: "",
        ColorDiffuse: {
          r: 0.117999978,
          g: 1.0,
          b: 0.53,
          a: 0.0
        },
        LayoutGroupSortIndex: 0,
        Value: 0,
        Locked: true,
        Grid: false,
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
        FogColor: "Green",
        LuaScript: "",
        LuaScriptState: "",
        XmlUI: ""
      },
      {
        GUID: "65cea8",
        Name: "HandTrigger",
        Transform: {
          posX: -54,
          posY: 4,
          posZ: 42,
          rotX: 0.0,
          rotY: 180,
          rotZ: 0.0,
          scaleX: 19,
          scaleY: 7,
          scaleZ: 9
        },
        Nickname: "",
        Description: "",
        GMNotes: "",
        ColorDiffuse: {
          r: 1.0,
          g: 0.117999978,
          b: 1.0,
          a: 0.0
        },
        LayoutGroupSortIndex: 0,
        Value: 0,
        Locked: true,
        Grid: false,
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
        FogColor: "Purple",
        LuaScript: "",
        LuaScriptState: "",
        XmlUI: ""
      },
      {
        GUID: "5e7847",
        Name: "FogOfWarTrigger",
        Transform: {
          posX: -17,
          posY: 3.515223,
          posZ: 31.8327522,
          rotX: 0.0,
          rotY: 0.0,
          rotZ: 0.0,
          scaleX: 36.3627625,
          scaleY: 5.1,
          scaleZ: 10.7926264
        },
        Nickname: "",
        Description: "",
        GMNotes: "",
        ColorDiffuse: {
          r: 0.24999997,
          g: 0.24999997,
          b: 0.24999997,
          a: 0.75
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
        FogColor: "Black",
        FogHidePointers: false,
        FogReverseHiding: false,
        FogSeethrough: true,
        LuaScript: "",
        LuaScriptState: "",
        XmlUI: ""
      },
      {
        GUID: "d9c954",
        Name: "ScriptingTrigger",
        Transform: {
          posX: -57,
          posY: 3.5,
          posZ: 20.8,
          rotX: 0.0,
          rotY: 0.0,
          rotZ: 0.0,
          scaleX: 36,
          scaleY: 5.1,
          scaleZ: 33
        },
        Nickname: "",
        Description: "",
        GMNotes: "",
        ColorDiffuse: {
          r: 1.0,
          g: 1.0,
          b: 1.0,
          a: 0.509803951
        },
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
        LuaScript: "",
        LuaScriptState: "",
        XmlUI: ""
      },
      {
        GUID: "e5b75d",
        Name: "ScriptingTrigger",
        Transform: {
          posX: -2.9,
          posY: 3.5,
          posZ: 9.38,
          rotX: 0.0,
          rotY: 0.0,
          rotZ: 0.0,
          scaleX: 8.67,
          scaleY: 5.1,
          scaleZ: 32.85
        },
        Nickname: "",
        Description: "",
        GMNotes: "",
        ColorDiffuse: {
          r: 1.0,
          g: 1.0,
          b: 1.0,
          a: 0.509803951
        },
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
        LuaScript: "",
        LuaScriptState: "",
        XmlUI: ""
      },
      {
        GUID: "84d9b3",
        Name: "ScriptingTrigger",
        Transform: {
          posX: -57,
          posY: 3.51,
          posZ: 0,
          rotX: 0.0,
          rotY: 0.0,
          rotZ: 0.0,
          scaleX: 1,
          scaleY: 1,
          scaleZ: 1
        },
        Nickname: "",
        Description: "",
        GMNotes: "",
        ColorDiffuse: {
          r: 1.0,
          g: 1.0,
          b: 1.0,
          a: 0.509803951
        },
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
        LuaScript: "",
        LuaScriptState: "",
        XmlUI: ""
      }
      ,
      {
        GUID: "da6d5e",
        Name: "ScriptingTrigger",
        Transform: {
          posX: -3,
          posY: 3.51,
          posZ: -19,
          rotX: 0.0,
          rotY: 0.0,
          rotZ: 0.0,
          scaleX: 8.15,
          scaleY: 5.1,
          scaleZ: 8.66
        },
        Nickname: "",
        Description: "",
        GMNotes: "",
        ColorDiffuse: {
          r: 1.0,
          g: 1.0,
          b: 1.0,
          a: 0.509803951
        },
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
        LuaScript: "",
        LuaScriptState: "",
        XmlUI: ""
      }
      ,
      {
        GUID: "9c09d5",
        Name: "ScriptingTrigger",
        Transform: {
          posX: -12.6,
          posY: 3.51,
          posZ: -19,
          rotX: 0.0,
          rotY: 0.0,
          rotZ: 0.0,
          scaleX: 8.15,
          scaleY: 5.1,
          scaleZ: 8.66
        },
        Nickname: "",
        Description: "",
        GMNotes: "",
        ColorDiffuse: {
          r: 1.0,
          g: 1.0,
          b: 1.0,
          a: 0.509803951
        },
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
        LuaScript: "",
        LuaScriptState: "",
        XmlUI: ""
      },
      {
        GUID: "caddbe",
        Name: "Custom_PDF",
        Transform: {
          posX: -63.0000076,
          posY: 0.9600006,
          posZ: -20.5000038,
          rotX: -9.43332346E-09,
          rotY: 179.999985,
          rotZ: -1.99338928E-08,
          scaleX: 8.0,
          scaleY: 1.0,
          scaleZ: 8.0
        },
        Nickname: "",
        Description: "",
        GMNotes: "",
        ColorDiffuse: {
          r: 1.0,
          g: 1.0,
          b: 1.0
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
        HideWhenFaceDown: false,
        Hands: false,
        CustomPDF: {
          PDFUrl: "http://cloud-3.steamusercontent.com/ugc/1831297655522928996/0EE47C67ED92FF1526610195448C4359D321E98F/",
          PDFPassword: "",
          PDFPage: 8,
          PDFPageOffset: 0
        },
        LuaScript: "",
        LuaScriptState: "",
        XmlUI: ""
      },
      {
        GUID: "0206f0",
        Name: "Infinite_Bag",
        Transform: {
          posX: 14.999999,
          posY: 0.9530005,
          posZ: -3.00000143,
          rotX: 4.0891955E-06,
          rotY: 270.0,
          rotZ: -1.68340307E-06,
          scaleX: 1.0,
          scaleY: 1.0,
          scaleZ: 1.0
        },
        Nickname: "Power Chip",
        Description: "",
        GMNotes: "",
        ColorDiffuse: {
          "r": 1.0,
          "g": 0.607784569,
          "b": 0.305881768
        },
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
        LuaScript: "",
        LuaScriptState: "",
        XmlUI: "",
        ContainedObjects: [
          {
            GUID: "0d932a",
            Name: "Custom_Model",
            Transform: {
              posX: 1.69704759,
              posY: 10.3046236,
              posZ: -23.8094,
              rotX: 359.591583,
              rotY: 180.000015,
              rotZ: 359.994049,
              scaleX: 0.350000441,
              scaleY: 0.350000441,
              scaleZ: 0.350000441
            },
            Nickname: "",
            Description: "",
            GMNotes: "",
            ColorDiffuse: {
              r: 1.0,
              g: 1.0,
              b: 1.0
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
            HideWhenFaceDown: false,
            Hands: false,
            CustomMesh: {
              MeshURL: "http://cloud-3.steamusercontent.com/ugc/1785133954065983269/A7810CBC1D9E3A3F0CB5A27FC6A99484CD2E3D42/",
              DiffuseURL: "http://cloud-3.steamusercontent.com/ugc/1785133954065984174/89303F483DB473B2512C51D4EF8E226DDE34F089/",
              NormalURL: "",
              ColliderURL: "",
              Convex: true,
              MaterialIndex: 1,
              TypeIndex: 5,
              CastShadows: true
            },
            LuaScript: "",
            LuaScriptState: "",
            XmlUI: ""
          }
        ]
      }
    ],
  };
}

function createXMLForPlayer(playerColor) {
  const spacing = '          ';
  const colorOptions = colors.reduce((acc, color) => acc + `${spacing}<Option>${color}</Option>\n`, '');
  const typeOptions = types.reduce((acc, type) => acc + `${spacing}<Option${type === 'Z/X' ? ' id="defaultType"' : ''}>${type}</Option>\n`, '');

  let tribeOptions = '';
  const tribeNameArray = Array.from(tribeNames);
  tribeNameArray.sort((option1, option2) => {
    return option1.toLowerCase() > option2.toLowerCase() ? 1 : -1;
  });
  for (const tribe of tribeNameArray) {
    tribeOptions += `${spacing}<Option>${tribe}</Option>\n`;
  }

  let playerOptions = '';
  const playerNamesArray = Array.from(playerNames);
  playerNamesArray.sort((option1, option2) => {
    return option1.toLowerCase() > option2.toLowerCase() ? 1 : -1;
  });
  for (const player of playerNamesArray) {
    playerOptions += `${spacing}<Option>${player.replace(/&/g, '&#38;')}</Option>\n`;
  }

  let iconOptions = '';
  for (const icon of iconNames.values()) {
    iconOptions += `${spacing}<Option>${icon}</Option>\n`;
  }

  return `
<Panel
  id="filters-root-${playerColor}"
  padding="15 15 15 15"
  width="50%"
  height="80%"
  showAnimation="Grow"
  hideAnimation="FadeOut"
  color="#eeeeee"
  active="false"
  visibility="${playerColor}"
>
  <VerticalLayout
    childAlignment="MiddleCenter"
  >
    <HorizontalLayout spacing="15" minWidth="40" preferredHeight="40" flexibleHeight="0">
      <VerticalLayout>
        <Text>Color:</Text>
        <Dropdown id="color-${playerColor}" onValueChanged="changeFilter">
          <Option id="defaultColor-${playerColor}">None</Option>
${colorOptions}
        </Dropdown>
      </VerticalLayout>
      <VerticalLayout>
        <Text>Type:</Text>
        <Dropdown id="type-${playerColor}" onValueChanged="changeFilter">
${typeOptions}
        </Dropdown>
      </VerticalLayout>
      <VerticalLayout>
        <Text>Icon:</Text>
        <Dropdown id="icon-${playerColor}" onValueChanged="changeFilter">
          <Option id="defaultIcon-${playerColor}">None</Option>
${iconOptions}
          <Option>No icon</Option>
        </Dropdown>
      </VerticalLayout>
    </HorizontalLayout>
    
    <HorizontalLayout spacing="15"  minWidth="40" preferredHeight="40" flexibleHeight="0">
      <VerticalLayout>
        <Text>Tribe:</Text>
        <Dropdown id="tribe-${playerColor}" onValueChanged="changeFilter">
          <Option id="defaultTribe-${playerColor}">None</Option>
${tribeOptions}
        </Dropdown>
      </VerticalLayout>
      <VerticalLayout>
        <Text>Player:</Text>
        <Dropdown id="player-${playerColor}" onValueChanged="changeFilter">
          <Option id="defaultPlayer-${playerColor}">None</Option>
${playerOptions}
        </Dropdown>
      </VerticalLayout>
    </HorizontalLayout>
    <VerticalLayout padding="0 0 15 15" spacing="15">
      <InputField
        id="powerSearch-${playerColor}"
        placeholder="Search by power"
        onValueChanged="changeSearch"
      ></InputField>
      <InputField
        id="costSearch-${playerColor}"
        placeholder="Search by cost"
        onValueChanged="changeSearch"
      ></InputField>
      <InputField
        id="nameSearch-${playerColor}"
        placeholder="Search by name"
        onValueChanged="changeSearch"
      ></InputField>
      <InputField
        id="textSearch-${playerColor}"
        placeholder="Search by effect text"
        onValueChanged="changeSearch"
      ></InputField>
    </VerticalLayout>
    <HorizontalLayout
      childAlignment="MiddleCenter"
      spacing="15"
      preferredHeight="28"
      flexibleHeight="0"
    >
      <Button
        alignment="MiddleCenter"
        onClick="applyFilters"
        color="#66ff66"
      >Apply</Button>
      <Button alignment="MiddleCenter" onClick="resetFilters">Reset</Button>
      <Button alignment="MiddleCenter" onClick="closeFilters">Close</Button>
    </HorizontalLayout>
  </VerticalLayout>
</Panel>
<Button
  width="200"
  height="100"
  rectAlignment="LowerRight"
  offsetXY="-100 30"
  alignment="MiddleCenter"
  fontSize="28"
  onClick="openFilters"
  visibility="${playerColor}"
>
  Filters
</Button>`
}

function createNewXML() {
  const redPlayerInterface = createXMLForPlayer('Red');
  const bluePlayerInterface = createXMLForPlayer('Blue');
  const greenPlayerInterface = createXMLForPlayer('Green');
  const purplePlayerInterface = createXMLForPlayer('Purple');

  const result = `
<Defaults>
  <Text fontSize="28" />
  <Dropdown fontSize="28" itemHeight="32" />
  <Button fontSize="28" />
  <InputField fontSize="28" />
</Defaults>
${redPlayerInterface}
${bluePlayerInterface}
${greenPlayerInterface}
${purplePlayerInterface}
`;

  return new Promise((resolve, reject) => {
    fs.writeFile(getXMLPath(), result, { flags: 'a'}, (err) => {
      if (err) {
        reject(err);
      }
      resolve(result);
    });
  });
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

  saveObject.XmlUI = await createNewXML();
  createNewSave(saveObject);
}

convertToSaveFile().catch(console.error);
