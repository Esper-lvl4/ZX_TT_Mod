colorFilter = 'None'
typeFilter = 'Z/X'
tribeFilter = 'None'
playerFilter = 'None'
iconFilter = 'None'
nameSearch = ''
textSearch = ''
powerSearch = ''
costSearch = ''

filterManagement = {}

function getObjects()
  local bagsZone = getObjectFromGUID('5e7847')
  bags = bagsZone.getObjects()
  deckEditorSelectZone = getObjectFromGUID('d9c954')
  deckEditorFilterZone = getObjectFromGUID('e5b75d')
  deckEditorPaginationZone = getObjectFromGUID('84d9b3')
  deckEditorDeckZone = getObjectFromGUID('da6d5e')
  deckEditorDynamisZone = getObjectFromGUID('9c09d5')

  leftBoard = getObjectFromGUID('d27265')
  rightBoard = getObjectFromGUID('dc59e6')
  fieldBoard = getObjectFromGUID('70f02a')

  leftBoard.interactable = false
  rightBoard.interactable = false
  fieldBoard.interactable = false
end

function prepareFiltersForPlayer()
  return {
    colorFilter = 'None',
    typeFilter = 'Z/X',
    tribeFilter = 'None',
    playerFilter = 'None',
    iconFilter = 'None',
    nameSearch = '',
    textSearch = '',
    powerSearch = '',
    costSearch = '',
  }
end


function setupFilters()
  local startX = -73
  local startY = 0.97
  local startZ = 34
  local xIncrement = 4.5
  local zIncrement = -6.5

  local totalPages = 1
  local currentPage = 1
  local cardsPerPage = 40
  local currentBag = nil
  
  local cards = {}

  function addCardToDeck(card)

  end

  function findCards()
    local foundCards = nil

    for _, bag in ipairs(bags) do
      if (bag.getName() == typeFilter) then
        currentBag = bag
        foundCards = bag.getObjects();
        break
      end
    end

    local result = {}

    for index, card in ipairs(foundCards) do
      local matches = {}
      for statWiki, value in string.gmatch(card.gm_notes, "%[([%w%d]+):%s([%w%.%/,%s]+)%]") do
        local stat = string.gsub(statWiki, '%d', '');
        if (matches[stat]) then 
          matches[stat] = matches[stat] .. '==' .. value
        else
          matches[stat] = value
        end
      end

      local correctColor = colorFilter == 'None' or string.match(matches.color, colorFilter)
      local correctType = typeFilter == 'Any' or (matches.type and string.match(matches.type, typeFilter)) or (typeFilter == 'No type' and not matches.type)
      local correctTribe = tribeFilter == 'None' or (matches.tribe and string.match(matches.tribe, tribeFilter))
      local correctPlayer = playerFilter == 'None' or (matches.player and matches.player == playerFilter) or string.match(card.description, playerFilter) or (card.name and string.match(card.name, playerFilter))
      local correctIcon = iconFilter == 'None' or (matches.icon and matches.icon == iconFilter) or (iconFilter == 'No icon' and not matches.icon)
      local hasNameMatch = nameSearch == '' or (card.name and string.match(card.name, nameSearch))
      local hasTextMatch = textSearch == '' or (card.description and string.match(card.description, textSearch))
      local hasPowerMatch = powerSearch == '' or (matches.power and matches.power == powerSearch)
      local hasCostMatch = costSearch == '' or (matches.cost and matches.cost == costSearch)

      -- handling exception for E☆2
      if string.match(tribeFilter, "E.2") then
        correctTribe = not not string.match(card.gm_notes, "tribe: E.2")
      end

      if correctColor and correctType and correctTribe and correctPlayer and correctIcon and hasTextMatch and hasNameMatch and hasPowerMatch and hasCostMatch then
        table.insert(result, card)
      end
    end

    resetPagination(result)
  end

  function clearSelectSpace()
    for _, card in ipairs(deckEditorSelectZone.getObjects()) do
      if card.type != 'Tile' then card.destruct() end
    end
  end

  function loadPage()
    clearSelectSpace()
    local finish = currentPage * cardsPerPage
    local start = finish - cardsPerPage
    local cardPosition = currentBag.getPosition()
    cardPosition.z = cardPosition.z - 3.5
    local bagClone = currentBag.clone({
      position = cardPosition
    })
    for i = 1,cardsPerPage,1 do
      local index = start + i
      if (cards[index]) then
        local z = math.floor((i - 1) / 8)
        local x = (i - 1) % 8
  
        bagClone.takeObject({
          position = { x = startX + x * xIncrement, y = startY, z = startZ + z * zIncrement},
          rotation = { x = 0, y = 180, z = 0 },
          guid = cards[index].guid,
          callback_function = function(spawnedCard)
            spawnedCard.setLock(false)
          end
        })
      end
    end
    bagClone.destruct()
  end

  function doNothing()
    return
  end

  function showCurrentPage()
    deckEditorPaginationZone.editButton({
      index = 0,
      label = 'Current: ' .. tostring(currentPage),
    })
    deckEditorPaginationZone.editButton({
      index = 1,
      label = 'Total: ' .. tostring(totalPages),
    })
  end

  function resetPagination(newCards)
    cards = newCards
    local length = rawlen(newCards)
    totalPages = math.ceil(length / cardsPerPage)
    currentPage = 1
    showCurrentPage()
  end

  function nextPage()
    local prev = currentPage
    currentPage = math.min(currentPage + 1, totalPages)
    if prev != currentPage then loadPage() end
    showCurrentPage()
  end

  function prevPage()
    local prev = currentPage
    currentPage = math.max(currentPage - 1, 1)
    if prev != currentPage then loadPage() end
    showCurrentPage()
  end

  function firstPage()
    local prev = currentPage
    currentPage = 1
    if prev != currentPage then loadPage() end
    showCurrentPage()
  end

  function lastPage()
    local prev = currentPage
    currentPage = totalPages
    if prev != currentPage then loadPage() end
    showCurrentPage()
  end

  deckEditorPaginationZone.createButton({
    click_function = 'doNothing',
    function_owner = self,
    label = 'Current: ' .. tostring(currentPage),
    position = {2, -2.55, 2},
    rotation = {0, 180, 0},
    scale = {7, 7, 7},
    width = 300,
    height = 100,
    font_size = 50,
    color = {1, 1, 1},
    font_color = {0, 0, 0},
    tooltip = 'Current page'
  })

  deckEditorPaginationZone.createButton({
    click_function = 'doNothing',
    function_owner = self,
    label = 'Total: ' .. tostring(totalPages),
    position = {-2, -2.55, 2},
    rotation = {0, 180, 0},
    scale = {7, 7, 7},
    width = 300,
    height = 100,
    font_size = 50,
    color = {1, 1, 1},
    font_color = {0, 0, 0},
    tooltip = 'Total pages'
  })

  deckEditorPaginationZone.createButton({
    click_function = 'nextPage',
    function_owner = self,
    label = 'Next page',
    position = {-2, -2.55, 0},
    rotation = {0, 180, 0},
    scale = {7, 7, 7},
    width = 300,
    height = 100,
    font_size = 50,
    color = {1, 1, 1},
    font_color = {0, 0, 0},
    tooltip = 'Show next page using current filters.'
  })

  deckEditorPaginationZone.createButton({
    click_function = 'prevPage',
    function_owner = self,
    label = 'Prev page',
    position = {2, -2.55, 0},
    rotation = {0, 180, 0},
    scale = {7, 7, 7},
    width = 300,
    height = 100,
    font_size = 50,
    color = {1, 1, 1},
    font_color = {0, 0, 0},
    tooltip = 'Show previous page using current filters.'
  })

  deckEditorPaginationZone.createButton({
    click_function = 'firstPage',
    function_owner = self,
    label = 'First page',
    position = {6, -2.55, 0},
    rotation = {0, 180, 0},
    scale = {7, 7, 7},
    width = 300,
    height = 100,
    font_size = 50,
    color = {1, 1, 1},
    font_color = {0, 0, 0},
    tooltip = 'Show first page using current filters.'
  })

  deckEditorPaginationZone.createButton({
    click_function = 'lastPage',
    function_owner = self,
    label = 'Last page',
    position = {-6, -2.55, 0},
    rotation = {0, 180, 0},
    scale = {7, 7, 7},
    width = 300,
    height = 100,
    font_size = 50,
    color = {1, 1, 1},
    font_color = {0, 0, 0},
    tooltip = 'Show last page using current filters.'
  })

  findCards()
  loadPage()

  filterManagement.findCards = findCards
  filterManagement.loadPage = loadPage
end

function changeFilter(player, value, id)
  local currentFilter = playerFilters[player.color]
  if id == 'color-'..player.color then currentFilter.colorFilter = value end
  if id == 'type-'..player.color then currentFilter.typeFilter = value end
  if id == 'tribe-'..player.color then currentFilter.tribeFilter = value end
  if id == 'player-'..player.color then currentFilter.playerFilter = value end
  if id == 'icon-'..player.color then currentFilter.iconFilter = value end
end

function changeSearch(player, value, id)
  local currentFilter = playerFilters[player.color]
  if id == 'nameSearch-'..player.color then currentFilter.nameSearch = value end
  if id == 'textSearch-'..player.color then currentFilter.textSearch = value end
  if id == 'powerSearch-'..player.color then currentFilter.powerSearch = value end
  if id == 'costSearch-'..player.color then currentFilter.costSearch = value end
end

function openFilters(player)
  UI.show('filters-root-'..player.color)
  UI.setAttribute('filters-root-'..player.color, 'visibility', player.color)
end

function closeFilters(player, color)
  UI.hide('filters-root-'..player.color)
end

function applyFilters(player)
  local currentFilter = playerFilters[player.color]
  colorFilter = currentFilter.colorFilter
  typeFilter = currentFilter.typeFilter
  tribeFilter = currentFilter.tribeFilter
  playerFilter = currentFilter.playerFilter
  iconFilter = currentFilter.iconFilter
  nameSearch = currentFilter.nameSearch
  textSearch = currentFilter.textSearch
  powerSearch = currentFilter.powerSearch
  costSearch = currentFilter.costSearch
  filterManagement.findCards()
  filterManagement.loadPage()
  closeFilters(player)
end

function resetFilters(player)
  local currentFilter = playerFilters[player.color]
  currentFilter.colorFilter = 'None'
  currentFilter.typeFilter = 'Z/X'
  currentFilter.tribeFilter = 'None'
  currentFilter.playerFilter = 'None'
  currentFilter.iconFilter = 'None'
  currentFilter.nameSearch = ''
  currentFilter.textSearch = ''
  currentFilter.powerSearch = ''
  currentFilter.costSearch = ''

  UI.setAttribute('color-'..player.color, 'value', 'defaultColor-'..player.color)
  UI.setAttribute('type-'..player.color, 'value', 'defaultType-'..player.color)
  UI.setAttribute('tribe-'..player.color, 'value', 'defaultTribe-'..player.color)
  UI.setAttribute('player-'..player.color, 'value', 'defaultPlayer-'..player.color)
  UI.setAttribute('icon-'..player.color, 'value', 'defaultIcon-'..player.color)
  UI.setAttribute('nameSearch-'..player.color, 'text', '')
  UI.setAttribute('textSearch-'..player.color, 'text', '')
  UI.setAttribute('powerSearch-'..player.color, 'text', '')
  UI.setAttribute('costSearch-'..player.color, 'text', '')
end

function onLoad()
  getObjects()
  setupFilters()
  playerFilters = {
    Red = prepareFiltersForPlayer(),
    Blue = prepareFiltersForPlayer(),
    Green = prepareFiltersForPlayer(),
    Purple = prepareFiltersForPlayer(),
  }

  Player.White.changeColor('Red')
end