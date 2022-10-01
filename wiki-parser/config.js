module.exports = {
  CARD_LIST_NAME: 'card_list.json',
  SAVE_NAME: 'ZX_TT_Plugin (beta-v.1.0.0).json',
  XML_NAME: 'global-ui.xml',
  LUA_SCRIPT_NAME: 'global.lua',
  RESULTS_FOLDER: 'results/',

  EXCLUDED_KEYS: [
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
  }, {}),

  EXCLUDED_MATCHES: [
    'category',
    'illust',
    'illust_card'
  ].reduce((acc, field) => {
    acc[field] = true;
    return acc;
  }, {}),
};