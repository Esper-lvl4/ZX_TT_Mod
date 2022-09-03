**Preparation:**
1) Install node.js (v16)
2) install yarn
3) cd wiki-parser
4) yarn install

**How to run wiki parser:**
1) From /wiki-parser/result remove card_list.json, card_list_initial.json, page_list.json files
2) cd wiki-parser
3) yarn parse
4) wait for parser to get all ~7k cards - the command line will have a progress bar. It may throw errors from time to time, but thats fine.
5) If it threw error and progressbar stopped completely, somthing went wrong - debug last error shown.

**How to generate Tabletop Simulator save**
1) cd wiki-parser
2) yarn save
3) save will be generated in a fine names ZX_TT_Plugin (alpha).json
4) move this save to C:\Users\*Your_user_name*\Documents\My Games\Tabletop Simulator\Saves
5) You can now load it as a save in Tabletop Simulator.

