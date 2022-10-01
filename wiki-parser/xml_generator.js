const fs = require('fs');

const {
  XML_NAME,
  RESULTS_FOLDER,
} = require('./config');

const colors = ['White', 'Blue', 'Red', 'Green', 'Black', 'Colorless'];
const types = ['Z/X', 'Event', 'Player', 'Z/X EX', 'EV EX', 'PL EX', 'Shift', 'Z/X OB', 'Marker', 'Token', 'Counter', 'LRIG', 'Any'];

function getXMLPath() {
  return RESULTS_FOLDER + XML_NAME;
}

function createXMLForPlayer(playerColor, tribeNames, playerNames, iconNames) {
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

module.exports = function createNewXML(tribeNames, playerNames, iconNames) {
  const args = [tribeNames, playerNames, iconNames];
  const redPlayerInterface = createXMLForPlayer('Red', ...args);
  const bluePlayerInterface = createXMLForPlayer('Blue', ...args);
  const greenPlayerInterface = createXMLForPlayer('Green', ...args);
  const purplePlayerInterface = createXMLForPlayer('Purple', ...args);

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
};