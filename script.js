let $ = window.jQuery
let localStorage = window.localStorage

let boardOffsetY = -15

let wood = "darkgreen"
let wheat = "yellow"
let sheep = "lightgreen"
let brick = "maroon"
let ore = "gray"
let desert = "darkorange"

let players = []
let numPlayers

let boards

let rounds
let tables
let played
let seats

let leaderboard

let currentBoard = 0
let currentRound = 0
let scoreChanged = false

if (localStorage.getItem("players")) {
  $("#loadDiv").show()
  $("#loadPlayers").data("shown", true).click(loadPlayers).show()
}

if (localStorage.getItem("boards")) {
  $("#loadDiv").show()
  $("#loadBoards").data("shown", true).click(loadBoards).show()
}

if (localStorage.getItem("rounds")) {
  $("#loadDiv").show()
  $("#loadTables").data("shown", true).click(loadTables).show()
}

$("#playersButton").click(showPlayerInput)
$("#boardsButton").click(showBoards)
$("#playerInput").keydown(playerInputKeydown).focus()
$("#submit").click(submitPlayer)
$("#start").click(start)

function playerInputKeydown(event) {
  if (event.keyCode == 13) {
    submitPlayer()
  }
}

function submitPlayer() {
  let playerName = $("#playerInput").val().trim()

  if (playerName != "" && !playerExists(playerName)) {
    players.push(playerName)
    localStorage.setItem("players", JSON.stringify(players))
    showPlayers()
    $("#playerInput").val("")
  }

  $("#playerInput").focus()
}

function start() {
  if (players.length >= 8) {
    setTimeout(function () {
      generateRounds()
      addScoresToRounds()
      showRounds()
    }, 10)
  }
}

function playerExists(playerName) {
  for (let i = 0; i < players.length; i++) {
    if (players[i] == playerName) {
      return true
    }
  }

  return false
}

function showPlayers() {
  $("#loadPlayers").remove()

  if (!$("#loadBoards").data("shown") && !$("#loadTables").data("shown")) {
    $("#loadDiv").hide()
  }

  $("#players").empty()

  for (let i = 0; i < players.length; i++) {
    let $playersColumn

    if (i % 12 == 0) {
      $playersColumn = $("<div>")
      $playersColumn.addClass("playersColumn")
      $playersColumn.appendTo("#players")
    } else {
      $playersColumn = $(".playersColumn").last()
    }

    let $playerRow = $("<div>")
    $playerRow.addClass("playerRow")
    $playerRow.appendTo($playersColumn)

    let $playerNumber = $("<div>")
    $playerNumber.addClass("playerNumber")
    $playerNumber.text(i + 1)
    $playerNumber.appendTo($playerRow)

    let $playerName = $("<div>")
    $playerName.addClass("playerName")
    $playerName.text(players[i])
    $playerName.appendTo($playerRow)

    let $playerDelete = $("<a>")
    $playerDelete.attr("href", "#")
    $playerDelete.text("Delete")
    $playerDelete.click(deletePlayer)
    $playerDelete.appendTo($playerRow)
  }

  if (players.length < 8) {
    $("#minimumMessage").show()
    $("#start").hide()
  } else {
    $("#minimumMessage").hide()
    $("#start").show()
  }
}

function deletePlayer(event) {
  event.preventDefault()

  let playerNumber = $(this).siblings(".playerNumber").text()
  players.splice(playerNumber - 1, 1)
  localStorage.setItem("players", JSON.stringify(players))
  showPlayers()
  $("#playerInput").focus()
}

function showPlayerInput() {
  $("#playersButton").prop("disabled", true)
  $("#boardsButton").prop("disabled", false)

  if (
    $("#loadPlayers").data("shown") ||
    $("#loadBoards").data("shown") ||
    $("#loadTables").data("shown")
  ) {
    $("#loadDiv").show()
  }

  $("#playerInputDiv").show()
  $("#players").show()

  $("#previousNextBoardDiv").hide()
  $("#boards").hide()

  $("#playerInput").focus()
}

function showBoards() {
  $("#playersButton").prop("disabled", false)
  $("#boardsButton").prop("disabled", true)
  $("#tablesButton").prop("disabled", false)
  $("#leaderboardButton").prop("disabled", false)

  $("#loadBoards").remove()
  $("#loadDiv").hide()

  $("#playerInputDiv").hide()
  $("#players").hide()

  $("#previousNextBoardDiv").show()
  $("#boards").show()

  $("#previousNextDiv").hide()
  $("#rounds").hide()

  $("#leaderboard").hide()

  if (!boards) {
    populateBoards()
  }
}

function populateBoards() {
  boards = []

  for (let i = 0; i < 4; i++) {
    boards.push({
      colors: [
        wood,
        wood,
        wood,
        wood,
        wheat,
        wheat,
        wheat,
        wheat,
        sheep,
        sheep,
        sheep,
        sheep,
        brick,
        brick,
        brick,
        ore,
        ore,
        ore,
        desert,
      ],
      ports: ["wood", "wheat", "sheep", "brick", "ore", "?", "?", "?", "?"],
      numbers: [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12],
    })
  }

  for (let i = 0; i < boards.length; i++) {
    let board = boards[i]

    shuffle(board.colors)
    shuffle(board.ports)

    let boardBalanced = false

    while (!boardBalanced) {
      shuffle(board.numbers)
      boardBalanced = isBoardBalanced(board.colors, board.numbers)
    }

    let canvasId = "board" + (i + 1)

    drawBoard(canvasId, board.colors)
    drawPorts(canvasId, board.ports)
    drawNumbers(canvasId, board.colors, board.numbers)
  }

  localStorage.setItem("boards", JSON.stringify(boards))

  $("#previousBoard").click(showPreviousBoard)
  $("#nextBoard").click(showNextBoard)
}

function showPreviousBoard() {
  $(".board").eq(currentBoard).hide()
  currentBoard--
  $(".board").eq(currentBoard).show()

  if (currentBoard == 0) {
    $("#previousBoard").prop("disabled", true)
  } else {
    $("#previousBoard").blur()
  }

  $("#nextBoard").prop("disabled", false)
}

function showNextBoard() {
  $(".board").eq(currentBoard).hide()
  currentBoard++
  $(".board").eq(currentBoard).show()

  $("#previousBoard").prop("disabled", false)

  if (currentBoard == 3) {
    $("#nextBoard").prop("disabled", true)
  } else {
    $("#nextBoard").blur()
  }
}

function isBoardBalanced(colors, numbers) {
  let touches = [
    [1, 3, 4],
    [0, 2, 4, 5],
    [1, 5, 6],
    [0, 4, 7, 8],
    [0, 1, 3, 5, 8, 9],
    [1, 2, 4, 6, 9, 10],
    [2, 5, 10, 11],
    [3, 8, 12],
    [3, 4, 7, 9, 12, 13],
    [4, 5, 8, 10, 13, 14],
    [5, 6, 9, 11, 14, 15],
    [6, 10, 15],
    [7, 8, 13, 16],
    [8, 9, 12, 14, 16, 17],
    [9, 10, 13, 15, 17, 18],
    [10, 11, 14, 18],
    [12, 13, 17],
    [13, 14, 16, 18],
    [14, 15, 17],
  ]

  let numbersWithDesert = getBoardNumbersWithDesert(colors, numbers)

  for (let i = 0; i < numbersWithDesert.length; i++) {
    let number = numbersWithDesert[i]

    if (number == 6 || number == 8) {
      for (let j = 0; j < touches[i].length; j++) {
        let neighbor = touches[i][j]
        let neighborNumber = numbersWithDesert[neighbor]

        if (neighborNumber == 6 || neighborNumber == 8) {
          return false
        }
      }
    }
  }

  return true
}

function drawBoard(canvasId, colors) {
  let diameter = 100
  let sideLength = diameter / Math.sqrt(3)
  let context = document.getElementById(canvasId).getContext("2d")
  let index = 0

  for (let x = 2 * diameter; x <= 4 * diameter; x += diameter) {
    drawHexagon(context, x, diameter + boardOffsetY, diameter, colors[index])
    index++
  }

  for (let x = 1.5 * diameter; x <= 4.5 * diameter; x += diameter) {
    drawHexagon(context, x, diameter + sideLength * 1.5 + boardOffsetY, diameter, colors[index])
    index++
  }

  for (let x = diameter; x <= 5 * diameter; x += diameter) {
    drawHexagon(context, x, diameter + sideLength * 3 + boardOffsetY, diameter, colors[index])
    index++
  }

  for (let x = 1.5 * diameter; x <= 4.5 * diameter; x += diameter) {
    drawHexagon(context, x, diameter + sideLength * 4.5 + boardOffsetY, diameter, colors[index])
    index++
  }

  for (let x = 2 * diameter; x <= 4 * diameter; x += diameter) {
    drawHexagon(context, x, diameter + sideLength * 6 + boardOffsetY, diameter, colors[index])
    index++
  }
}

function drawPorts(canvasId, ports) {
  let diameter = 100
  let context = document.getElementById(canvasId).getContext("2d")
  let index = 0

  drawPort(context, 1.5 * diameter, 0.4 * diameter + boardOffsetY, ports[index])
  index++

  drawPort(context, 3.5 * diameter, 0.4 * diameter + boardOffsetY, ports[index])
  index++

  drawPort(context, 5 * diameter, 1.2 * diameter + boardOffsetY, ports[index])
  index++

  drawPort(context, 5.9 * diameter, 2.8 * diameter + boardOffsetY, ports[index])
  index++

  drawPort(context, 5 * diameter, 4.35 * diameter + boardOffsetY, ports[index])
  index++

  drawPort(context, 3.5 * diameter, 5.2 * diameter + boardOffsetY, ports[index])
  index++

  drawPort(context, 1.5 * diameter, 5.2 * diameter + boardOffsetY, ports[index])
  index++

  drawPort(context, 0.5 * diameter, 3.5 * diameter + boardOffsetY, ports[index])
  index++

  drawPort(context, 0.5 * diameter, 2.1 * diameter + boardOffsetY, ports[index])
  index++
}

function drawNumbers(canvasId, colors, numbers) {
  let diameter = 100
  let sideLength = diameter / Math.sqrt(3)
  let context = document.getElementById(canvasId).getContext("2d")
  let numbersWithDesert = getBoardNumbersWithDesert(colors, numbers)
  let index = 0

  for (let x = 2 * diameter; x <= 4 * diameter; x += diameter) {
    drawNumber(context, x, diameter + boardOffsetY, diameter / 4, numbersWithDesert[index])
    index++
  }

  for (let x = 1.5 * diameter; x <= 4.5 * diameter; x += diameter) {
    drawNumber(
      context,
      x,
      diameter + sideLength * 1.5 + boardOffsetY,
      diameter / 4,
      numbersWithDesert[index]
    )
    index++
  }

  for (let x = diameter; x <= 5 * diameter; x += diameter) {
    drawNumber(
      context,
      x,
      diameter + sideLength * 3 + boardOffsetY,
      diameter / 4,
      numbersWithDesert[index]
    )
    index++
  }

  for (let x = 1.5 * diameter; x <= 4.5 * diameter; x += diameter) {
    drawNumber(
      context,
      x,
      diameter + sideLength * 4.5 + boardOffsetY,
      diameter / 4,
      numbersWithDesert[index]
    )
    index++
  }

  for (let x = 2 * diameter; x <= 4 * diameter; x += diameter) {
    drawNumber(
      context,
      x,
      diameter + sideLength * 6 + boardOffsetY,
      diameter / 4,
      numbersWithDesert[index]
    )
    index++
  }
}

function drawHexagon(context, xCenter, yCenter, diameter, color) {
  let numSides = 6
  let sideLength = diameter / Math.sqrt(3)
  let rotation = Math.PI / 2

  context.beginPath()
  context.moveTo(
    xCenter + sideLength * Math.cos(rotation),
    yCenter + sideLength * Math.sin(rotation)
  )

  for (let i = 1; i <= numSides; i++) {
    context.lineTo(
      xCenter + sideLength * Math.cos(rotation + (i * 2 * Math.PI) / numSides),
      yCenter + sideLength * Math.sin(rotation + (i * 2 * Math.PI) / numSides)
    )
  }

  context.stroke()
  context.fillStyle = color
  context.fill()
  context.closePath()
}

function drawPort(context, x, y, port) {
  context.fillStyle = "black"
  context.font = port == "?" ? "30px Arial" : "20px Arial"
  context.textAlign = "center"
  context.fillText(port, x, y)
}

function drawNumber(context, xCenter, yCenter, circleDiameter, number) {
  if (number != 0) {
    context.beginPath()
    context.arc(xCenter, yCenter, circleDiameter, 0, 2 * Math.PI)
    context.stroke()
    context.fillStyle = "khaki"
    context.fill()
    context.closePath()

    context.fillStyle = number == 6 || number == 8 ? "red" : "black"
    context.font = "25px Arial"
    context.textAlign = "center"
    context.fillText(number, xCenter, yCenter + 9)
  }
}

function getBoardNumbersWithDesert(colors, numbers) {
  let numbersWithDesert = []

  for (let i = 0; i < numbers.length; i++) {
    numbersWithDesert.push(numbers[i])
  }

  for (let i = 0; i < colors.length; i++) {
    if (colors[i] == desert) {
      numbersWithDesert.splice(i, 0, 0)
    }
  }

  return numbersWithDesert
}

function generateRounds() {
  numPlayers = players.length
  addPhantomPlayers()

  let roundsPreset = presetRounds()

  if (roundsPreset) {
    return
  }

  let playersPlaced = false

  while (!playersPlaced) {
    init()

    for (let i = 0; i < 3; i++) {
      playersPlaced = placePlayers()

      if (!playersPlaced) {
        break
      }

      rounds.push([])

      for (let j = 0; j < tables.length; j++) {
        let table = tables[j]

        rounds[i].push(table)
      }
    }
  }
}

function addScoresToRounds() {
  for (let i = 0; i < rounds.length; i++) {
    let round = rounds[i]

    for (let j = 0; j < round.length; j++) {
      let table = round[j]

      for (let k = 0; k < table.length; k++) {
        let player = table[k]

        rounds[i][j][k] = {
          player: player,
        }
      }
    }
  }

  localStorage.setItem("roundsPlayers", JSON.stringify(players))
  localStorage.setItem("numPlayers", numPlayers)
  localStorage.setItem("rounds", JSON.stringify(rounds))
}

function showRounds() {
  $("#playersButton").remove()
  $("#boardsButton").prop("disabled", false)
  $("#tablesButton").prop("disabled", true).show().click(showTables)
  $("#leaderboardButton").show().click(showLeaderboard)

  $("#loadTables").remove()
  $("#loadDiv").hide()

  $("#playerInputDiv").remove()
  $("#players").remove()

  $("#previousNextBoardDiv").hide()
  $("#boards").hide()

  $("#previousNextDiv").show()
  $("#previous").click(showPreviousRound)
  $("#next").click(showNextRound)
  $("#rounds").show()

  for (let i = 0; i < rounds.length; i++) {
    let $round = $("<div>")
    $round.addClass("round")

    if (i > 0) {
      $round.hide()
    }

    $round.appendTo("#rounds")

    let $roundHeading = $("<h2>")
    $roundHeading.text("Round " + (i + 1))
    $roundHeading.appendTo($round)

    let roundTables = rounds[i]

    for (let j = 0; j < roundTables.length; j++) {
      let $tablesColumn

      if (j % 9 == 0) {
        $tablesColumn = $("<div>")
        $tablesColumn.addClass("tablesColumn")
        $tablesColumn.appendTo($round)
      } else {
        $tablesColumn = $(".tablesColumn").last()
      }

      let $table = $("<div>")
      $table.addClass("tableRow")
      $table.appendTo($tablesColumn)

      let $tableHeading = $("<h3>")
      $tableHeading.text("Table " + (j + 1))
      $tableHeading.appendTo($table)

      let tablePlayers = roundTables[j]

      for (let k = 0; k < tablePlayers.length; k++) {
        let player = tablePlayers[k]

        if (isPhantom(player.player)) {
          let $empty = $("<div>")
          $empty.addClass("player")
          $empty.text("Empty")
          $empty.appendTo($table)
        } else {
          let $select = $("<select>")
          $select.addClass("player")
          $select.data("round", i).data("table", j).data("seat", k)

          for (let optionValue = 0; optionValue <= 11; optionValue++) {
            let $option = $("<option>")
            $option.attr("value", optionValue)

            let optionText = optionValue

            if (optionValue == 0) {
              optionText = player.player
            } else if (optionValue == 1) {
              optionText = "Drop"
            } else if (optionValue == 11) {
              optionText = "Win"
            }

            $option.text(optionText)
            $option.appendTo($select)
          }

          $select.change(updateRounds).appendTo($table)
        }
      }
    }
  }
}

function showTables() {
  $("#boardsButton").prop("disabled", false)
  $("#tablesButton").prop("disabled", true)
  $("#leaderboardButton").prop("disabled", false)

  $("#previousNextBoardDiv").hide()
  $("#boards").hide()

  $("#previousNextDiv").show()
  $("#rounds").show()

  $("#leaderboard").hide()
}

function showLeaderboard() {
  $("#boardsButton").prop("disabled", false)
  $("#tablesButton").prop("disabled", false)
  $("#leaderboardButton").prop("disabled", true)

  $("#previousNextBoardDiv").hide()
  $("#boards").hide()

  $("#previousNextDiv").hide()
  $("#rounds").hide()

  $("#leaderboard").show()

  if (!leaderboard || scoreChanged) {
    generateLeaderboard()
    populateLeaderboard()

    scoreChanged = false
  }
}

function showPreviousRound() {
  $(".round").eq(currentRound).hide()
  currentRound--
  $(".round").eq(currentRound).show()

  if (currentRound == 0) {
    $("#previous").prop("disabled", true)
  } else {
    $("#previous").blur()
  }

  $("#next").prop("disabled", false)
}

function showNextRound() {
  $(".round").eq(currentRound).hide()
  currentRound++
  $(".round").eq(currentRound).show()

  $("#previous").prop("disabled", false)

  if (currentRound == 2) {
    $("#next").prop("disabled", true)
  } else {
    $("#next").blur()
  }
}

function updateRounds() {
  let round = $(this).data("round")
  let table = $(this).data("table")
  let seat = $(this).data("seat")
  let selectedValue = parseInt($(this).val(), 10)

  let player = rounds[round][table][seat]

  if (selectedValue == 0) {
    delete player.score
  } else {
    player.score = selectedValue
  }

  localStorage.setItem("rounds", JSON.stringify(rounds))
  scoreChanged = true

  highlightCompletedRounds($(this))
}

function highlightCompletedRounds($select) {
  let $tableRow = $select.parent()
  let numNoSelections = 0
  let numDrops = 0
  let numWins = 0

  $tableRow.find("select").each(function () {
    let selectedValue = parseInt($(this).val(), 10)

    if (selectedValue == 0) {
      numNoSelections++
    } else if (selectedValue == 1) {
      numDrops++
    } else if (selectedValue == 11) {
      numWins++
    }
  })

  if (numNoSelections == 0 && numDrops <= 1 && numWins == 1) {
    $tableRow.find("h3").addClass("tableRowDone")
  } else {
    $tableRow.find("h3").removeClass("tableRowDone")
  }

  let $round = $tableRow.closest(".round")
  let allTablesDone = true

  $round.find("h3").each(function () {
    let $h3 = $(this)

    if (!$h3.hasClass("tableRowDone")) {
      allTablesDone = false
    }
  })

  if (allTablesDone) {
    $round.find("h2").addClass("roundDone")
  } else {
    $round.find("h2").removeClass("roundDone")
  }
}

function generateLeaderboard() {
  leaderboard = {}

  for (let i = 0; i < numPlayers; i++) {
    let playerName = players[i]

    leaderboard[playerName] = {
      wins: 0,
      points: 0,
      pop: 0,
    }
  }

  for (let i = 0; i < rounds.length; i++) {
    let round = rounds[i]

    for (let j = 0; j < round.length; j++) {
      let table = round[j]
      let everybodyHasScore = true
      let totalPlayers = 0
      let totalScore = 0

      for (let k = 0; k < table.length; k++) {
        let player = table[k]

        if (player.score) {
          if (player.score >= 2) {
            totalPlayers++
            totalScore += Math.min(player.score, 10)
          }
        } else {
          if (!isPhantom(player.player)) {
            everybodyHasScore = false
          }
        }
      }

      if (everybodyHasScore) {
        if (totalPlayers == 3) {
          let averageScore = totalScore / 3
          totalScore += averageScore
        }

        for (let k = 0; k < table.length; k++) {
          player = table[k]

          if (!isPhantom(player.player) && player.score >= 2) {
            let score = player.score

            if (player.score == 11) {
              score = 10
              leaderboard[player.player].wins++
            }

            leaderboard[player.player].points += score
            leaderboard[player.player].pop += score / totalScore
          }
        }
      }
    }
  }

  let leaderboardArray = []

  for (let playerName in leaderboard) {
    leaderboardArray.push({
      ranking: null,
      player: playerName,
      wins: leaderboard[playerName].wins,
      points: leaderboard[playerName].points,
      pop: leaderboard[playerName].pop,
    })
  }

  leaderboard = leaderboardArray.sort(function (player1, player2) {
    if (player1.wins == player2.wins) {
      if (player1.points == player2.points) {
        if (player1.pop == player2.pop) {
          return player1.player.localeCompare(player2.player)
        } else {
          return player2.pop - player1.pop
        }
      } else {
        return player2.points - player1.points
      }
    } else {
      return player2.wins - player1.wins
    }
  })

  for (let i = 0; i < leaderboard.length; i++) {
    if (
      i > 0 &&
      leaderboard[i].wins == leaderboard[i - 1].wins &&
      leaderboard[i].points == leaderboard[i - 1].points &&
      leaderboard[i].pop == leaderboard[i - 1].pop
    ) {
      leaderboard[i].ranking = leaderboard[i - 1].ranking
    } else {
      leaderboard[i].ranking = i + 1
    }
  }
}

function populateLeaderboard() {
  $("#leaderboard").empty()

  for (let i = 0; i < leaderboard.length; i++) {
    let $leaderboardTable

    if (i % 12 == 0) {
      $leaderboardTable = $("<table>")
      $leaderboardTable.append("<th>Ranking</th>")
      $leaderboardTable.append("<th>Player</th>")
      $leaderboardTable.append("<th>Wins</th>")
      $leaderboardTable.append("<th>Points</th>")
      $leaderboardTable.append("<th>PoP</th>")
      $leaderboardTable.appendTo("#leaderboard")
    } else {
      $leaderboardTable = $("table").last()
    }

    let player = leaderboard[i]

    let $leaderboardRow = $("<tr>")
    $leaderboardRow.append("<td>" + player.ranking + "</td>")
    $leaderboardRow.append("<td>" + player.player + "</td>")
    $leaderboardRow.append("<td>" + player.wins + "</td>")
    $leaderboardRow.append("<td>" + player.points + "</td>")
    $leaderboardRow.append("<td>" + player.pop.toFixed(4) + "</td>")
    $leaderboardRow.appendTo($leaderboardTable)
  }
}

function addPhantomPlayers() {
  let numPhantomPlayers = (4 - (players.length % 4)) % 4

  for (let i = 1; i <= numPhantomPlayers; i++) {
    players.push("phantom" + i)
  }
}

function init() {
  rounds = []
  tables = []
  played = {}
  seats = {}

  for (let i = 0; i < players.length; i++) {
    let player = players[i]

    if (i % 4 == 0) {
      tables.push([])
    }

    played[player] = []
    seats[player] = []
  }
}

function placePlayers() {
  let numFailures = 0
  let playersPlaced = false

  while (!playersPlaced) {
    clearTables()

    for (let i = players.length - 1; i >= 0; i--) {
      let player = players[i]
      let availableTablesAndSeats = getAvailableTablesAndSeats(player)

      if (availableTablesAndSeats.length == 0) {
        numFailures++
        playersPlaced = false

        break
      } else {
        let tableAndSeats =
          availableTablesAndSeats[Math.floor(Math.random() * availableTablesAndSeats.length)]
        let table = tableAndSeats.table
        let seat = tableAndSeats.seats[Math.floor(Math.random() * tableAndSeats.seats.length)]

        table[seat] = player
        playersPlaced = true
      }
    }

    if (playersPlaced) {
      updatePlayed()
      updateSeats()

      if (!isBalanced()) {
        rollbackPlayed()
        rollbackSeats()

        numFailures++
        playersPlaced = false
      }
    }

    if (numFailures == 5000) {
      return false
    }
  }

  return true
}

function clearTables() {
  for (let i = 0; i < tables.length; i++) {
    tables[i] = [undefined, undefined, undefined, undefined]
  }
}

function getAvailableTablesAndSeats(player) {
  let availableTablesAndSeats = []

  for (let i = 0; i < tables.length; i++) {
    let table = tables[i]

    if (playerAllowedAtTable(player, table)) {
      let availableSeats = getAvailableSeats(player, table)

      if (availableSeats.length > 0) {
        availableTablesAndSeats.push({
          table: table,
          seats: availableSeats,
        })
      }
    }
  }

  return availableTablesAndSeats
}

function isBalanced() {
  let mostPhantoms = null
  let leastPhantoms = null
  let mostRepeatPlays = 0
  let totalRepeatPlays = 0

  for (let i = 0; i < players.length; i++) {
    let player = players[i]

    if (!isPhantom(player)) {
      let numPhantoms = getNumPhantoms(player)

      if (mostPhantoms == null || numPhantoms > mostPhantoms) {
        mostPhantoms = numPhantoms
      }

      if (leastPhantoms == null || numPhantoms < leastPhantoms) {
        leastPhantoms = numPhantoms
      }

      if (numPlayers <= 14 || numPlayers == 17) {
        let numRepeatPlays = getNumRepeatPlays(player)
        totalRepeatPlays += numRepeatPlays

        if (mostRepeatPlays == null || numRepeatPlays > mostRepeatPlays) {
          mostRepeatPlays = numRepeatPlays
        }
      }
    }
  }

  return (
    mostPhantoms - leastPhantoms <= 1 &&
    mostRepeatPlays <= getRepeatPlaysThreshold() &&
    totalRepeatPlays <= getTotalRepeatPlaysThreshold()
  )
}

function updatePlayed() {
  for (let i = 0; i < tables.length; i++) {
    let table = tables[i]

    for (let j = 0; j < table.length; j++) {
      let player = table[j]

      for (let k = 0; k < table.length; k++) {
        if (table[k] != player) {
          played[player].push(table[k])
        }
      }
    }
  }
}

function updateSeats() {
  for (let i = 0; i < tables.length; i++) {
    let table = tables[i]

    for (let j = 0; j < table.length; j++) {
      let player = table[j]

      seats[player].push(j)
    }
  }
}

function rollbackPlayed() {
  for (let player in played) {
    let playerArray = played[player]

    playerArray.length = playerArray.length - 3
  }
}

function rollbackSeats() {
  for (let player in seats) {
    let seatArray = seats[player]

    seatArray.length = seatArray.length - 1
  }
}

function playerAllowedAtTable(player, table) {
  for (let i = 0; i < table.length; i++) {
    let otherPlayer = table[i]

    if (otherPlayer !== undefined) {
      if (isPhantom(player) && isPhantom(otherPlayer)) {
        return false
      }

      if (isPhantom(player) || isPhantom(otherPlayer)) {
        continue
      }

      let numPlayed = 0

      for (let j = 0; j < played[player].length; j++) {
        if (played[player][j] == otherPlayer) {
          numPlayed++
        }
      }

      if (!withinPlayedThreshold(player, numPlayed)) {
        return false
      }
    }
  }

  return true
}

function getAvailableSeats(player, table) {
  let availableSeats = []

  for (let j = 0; j < table.length; j++) {
    if (table[j] === undefined) {
      let numSeats = 0

      if (!isPhantom(player)) {
        for (let k = 0; k < seats[player].length; k++) {
          if (seats[player][k] == j) {
            numSeats++
          }
        }
      }

      if (numSeats == 0) {
        availableSeats.push(j)
      }
    }
  }

  return availableSeats
}

function withinPlayedThreshold(player, numPlayed) {
  if (numPlayers <= 14 || numPlayers == 17) {
    if (numPlayed == 0) {
      return true
    } else if (numPlayed == 1) {
      return getNumRepeatPlays(player) <= getRepeatPlaysThreshold() - 1
    } else {
      return false
    }
  } else {
    return numPlayed == 0
  }
}

function isPhantom(player) {
  return player == "phantom1" || player == "phantom2" || player == "phantom3"
}

function getNumPhantoms(player) {
  let numPhantoms = 0

  for (let j = 0; j < played[player].length; j++) {
    if (isPhantom(played[player][j])) {
      numPhantoms++
    }
  }

  return numPhantoms
}

function getNumRepeatPlays(player) {
  let totalPlays = {}

  for (let i = 0; i < played[player].length; i++) {
    let otherPlayer = played[player][i]

    if (!isPhantom(otherPlayer)) {
      if (totalPlays[otherPlayer]) {
        totalPlays[otherPlayer]++
      } else {
        totalPlays[otherPlayer] = 1
      }
    }
  }

  let numRepeatPlays = 0

  for (let otherPlayer in totalPlays) {
    if (totalPlays[otherPlayer] >= 2) {
      numRepeatPlays++
    }
  }

  return numRepeatPlays
}

function getRepeatPlaysThreshold() {
  if (numPlayers == 8) {
    return 3
  } else if (numPlayers == 10) {
    return 2
  } else if (numPlayers == 11) {
    return 2
  } else if (numPlayers == 12) {
    return 2
  } else if (numPlayers == 13) {
    return 1
  } else if (numPlayers == 14) {
    return 1
  } else if (numPlayers == 17) {
    return 1
  } else {
    return 0
  }
}

function getTotalRepeatPlaysThreshold() {
  if (numPlayers == 8) {
    return 24
  } else if (numPlayers == 10) {
    return 16
  } else if (numPlayers == 11) {
    return 18
  } else if (numPlayers == 12) {
    return 18
  } else if (numPlayers == 13) {
    return 12
  } else if (numPlayers == 14) {
    return 8
  } else if (numPlayers == 17) {
    return 8
  } else {
    return 0
  }
}

function presetRounds() {
  if (numPlayers == 13) {
    init()
    shuffle(players, numPlayers)

    rounds[0] = []
    rounds[0].push([players[3], players[2], players[15], players[4]])
    rounds[0].push([players[0], players[5], players[10], players[11]])
    rounds[0].push([players[8], players[12], players[14], players[9]])
    rounds[0].push([players[1], players[7], players[6], players[13]])

    rounds[1] = []
    rounds[1].push([players[14], players[0], players[2], players[1]])
    rounds[1].push([players[12], players[4], players[3], players[7]])
    rounds[1].push([players[10], players[13], players[9], players[5]])
    rounds[1].push([players[6], players[11], players[8], players[15]])

    rounds[2] = []
    rounds[2].push([players[11], players[3], players[0], players[15]])
    rounds[2].push([players[4], players[6], players[5], players[14]])
    rounds[2].push([players[2], players[9], players[1], players[8]])
    rounds[2].push([players[7], players[10], players[13], players[12]])

    return true
  } else if (numPlayers == 17) {
    init()
    shuffle(players, numPlayers)

    rounds[0] = []
    rounds[0].push([players[16], players[11], players[10], players[19]])
    rounds[0].push([players[7], players[13], players[15], players[18]])
    rounds[0].push([players[3], players[1], players[0], players[5]])
    rounds[0].push([players[12], players[17], players[9], players[14]])
    rounds[0].push([players[4], players[2], players[6], players[8]])

    rounds[1] = []
    rounds[1].push([players[18], players[4], players[11], players[3]])
    rounds[1].push([players[0], players[19], players[2], players[6]])
    rounds[1].push([players[17], players[5], players[8], players[1]])
    rounds[1].push([players[14], players[12], players[16], players[13]])
    rounds[1].push([players[10], players[9], players[7], players[15]])

    rounds[2] = []
    rounds[2].push([players[2], players[3], players[18], players[9]])
    rounds[2].push([players[1], players[17], players[4], players[16]])
    rounds[2].push([players[15], players[19], players[14], players[0]])
    rounds[2].push([players[13], players[6], players[5], players[10]])
    rounds[2].push([players[11], players[8], players[12], players[7]])

    return true
  } else if (numPlayers == 18) {
    init()
    shuffle(players, numPlayers)

    rounds[0] = []
    rounds[0].push([players[15], players[5], players[13], players[7]])
    rounds[0].push([players[4], players[10], players[0], players[14]])
    rounds[0].push([players[11], players[17], players[16], players[19]])
    rounds[0].push([players[8], players[3], players[2], players[6]])
    rounds[0].push([players[9], players[12], players[1], players[18]])

    rounds[1] = []
    rounds[1].push([players[10], players[1], players[15], players[16]])
    rounds[1].push([players[17], players[0], players[8], players[12]])
    rounds[1].push([players[6], players[9], players[11], players[5]])
    rounds[1].push([players[3], players[7], players[18], players[4]])
    rounds[1].push([players[2], players[13], players[14], players[19]])

    rounds[2] = []
    rounds[2].push([players[5], players[8], players[19], players[10]])
    rounds[2].push([players[14], players[16], players[12], players[3]])
    rounds[2].push([players[13], players[4], players[17], players[9]])
    rounds[2].push([players[0], players[18], players[6], players[15]])
    rounds[2].push([players[1], players[11], players[7], players[2]])

    return true
  } else if (numPlayers == 21) {
    init()
    shuffle(players, numPlayers)

    rounds[0] = []
    rounds[0].push([players[19], players[15], players[3], players[8]])
    rounds[0].push([players[7], players[2], players[18], players[23]])
    rounds[0].push([players[4], players[1], players[0], players[10]])
    rounds[0].push([players[22], players[20], players[12], players[14]])
    rounds[0].push([players[5], players[6], players[9], players[13]])
    rounds[0].push([players[16], players[17], players[21], players[11]])

    rounds[1] = []
    rounds[1].push([players[10], players[14], players[17], players[2]])
    rounds[1].push([players[12], players[16], players[19], players[18]])
    rounds[1].push([players[11], players[7], players[20], players[5]])
    rounds[1].push([players[9], players[22], players[1], players[15]])
    rounds[1].push([players[3], players[0], players[21], players[6]])
    rounds[1].push([players[8], players[13], players[23], players[4]])

    rounds[2] = []
    rounds[2].push([players[17], players[19], players[22], players[7]])
    rounds[2].push([players[20], players[9], players[4], players[3]])
    rounds[2].push([players[14], players[18], players[6], players[1]])
    rounds[2].push([players[13], players[11], players[15], players[0]])
    rounds[2].push([players[23], players[10], players[5], players[16]])
    rounds[2].push([players[21], players[8], players[2], players[12]])

    return true
  } else if (numPlayers == 22) {
    init()
    shuffle(players, numPlayers)

    rounds[0] = []
    rounds[0].push([players[7], players[21], players[17], players[11]])
    rounds[0].push([players[18], players[22], players[13], players[14]])
    rounds[0].push([players[9], players[4], players[23], players[5]])
    rounds[0].push([players[8], players[6], players[12], players[15]])
    rounds[0].push([players[0], players[16], players[10], players[19]])
    rounds[0].push([players[2], players[3], players[20], players[1]])

    rounds[1] = []
    rounds[1].push([players[21], players[8], players[22], players[16]])
    rounds[1].push([players[6], players[18], players[9], players[10]])
    rounds[1].push([players[15], players[2], players[14], players[7]])
    rounds[1].push([players[17], players[20], players[19], players[23]])
    rounds[1].push([players[5], players[0], players[3], players[13]])
    rounds[1].push([players[4], players[1], players[11], players[12]])

    rounds[2] = []
    rounds[2].push([players[12], players[23], players[7], players[0]])
    rounds[2].push([players[19], players[13], players[8], players[4]])
    rounds[2].push([players[20], players[14], players[16], players[9]])
    rounds[2].push([players[1], players[15], players[21], players[18]])
    rounds[2].push([players[10], players[17], players[5], players[2]])
    rounds[2].push([players[3], players[11], players[6], players[22]])

    return true
  } else if (numPlayers == 25) {
    init()
    shuffle(players, numPlayers)

    rounds[0] = []
    rounds[0].push([players[5], players[20], players[4], players[11]])
    rounds[0].push([players[27], players[21], players[16], players[12]])
    rounds[0].push([players[1], players[13], players[2], players[0]])
    rounds[0].push([players[15], players[24], players[26], players[18]])
    rounds[0].push([players[23], players[8], players[22], players[9]])
    rounds[0].push([players[19], players[3], players[6], players[7]])
    rounds[0].push([players[25], players[17], players[10], players[14]])

    rounds[1] = []
    rounds[1].push([players[3], players[0], players[27], players[8]])
    rounds[1].push([players[16], players[4], players[15], players[2]])
    rounds[1].push([players[24], players[22], players[21], players[17]])
    rounds[1].push([players[11], players[14], players[1], players[6]])
    rounds[1].push([players[9], players[19], players[26], players[20]])
    rounds[1].push([players[12], players[18], players[7], players[10]])
    rounds[1].push([players[13], players[5], players[25], players[23]])

    rounds[2] = []
    rounds[2].push([players[20], players[7], players[26], players[1]])
    rounds[2].push([players[18], players[9], players[17], players[13]])
    rounds[2].push([players[22], players[6], players[27], players[4]])
    rounds[2].push([players[21], players[10], players[23], players[19]])
    rounds[2].push([players[2], players[25], players[11], players[3]])
    rounds[2].push([players[0], players[15], players[12], players[5]])
    rounds[2].push([players[8], players[16], players[14], players[24]])

    return true
  } else if (numPlayers == 29) {
    init()
    shuffle(players, numPlayers)

    rounds[0] = []
    rounds[0].push([players[28], players[26], players[20], players[14]])
    rounds[0].push([players[6], players[5], players[15], players[31]])
    rounds[0].push([players[0], players[30], players[8], players[1]])
    rounds[0].push([players[12], players[3], players[29], players[4]])
    rounds[0].push([players[21], players[24], players[16], players[18]])
    rounds[0].push([players[19], players[17], players[13], players[2]])
    rounds[0].push([players[27], players[10], players[22], players[25]])
    rounds[0].push([players[23], players[9], players[11], players[7]])

    rounds[1] = []
    rounds[1].push([players[22], players[16], players[26], players[31]])
    rounds[1].push([players[17], players[23], players[30], players[10]])
    rounds[1].push([players[2], players[14], players[4], players[0]])
    rounds[1].push([players[25], players[11], players[24], players[8]])
    rounds[1].push([players[3], players[6], players[28], players[27]])
    rounds[1].push([players[20], players[19], players[18], players[29]])
    rounds[1].push([players[9], players[15], players[21], players[13]])
    rounds[1].push([players[7], players[12], players[1], players[5]])

    rounds[2] = []
    rounds[2].push([players[26], players[18], players[12], players[15]])
    rounds[2].push([players[8], players[20], players[6], players[23]])
    rounds[2].push([players[14], players[21], players[25], players[29]])
    rounds[2].push([players[5], players[0], players[19], players[22]])
    rounds[2].push([players[16], players[4], players[17], players[11]])
    rounds[2].push([players[10], players[1], players[9], players[3]])
    rounds[2].push([players[13], players[28], players[7], players[30]])
    rounds[2].push([players[24], players[2], players[27], players[31]])

    return true
  } else if (numPlayers == 33) {
    init()
    shuffle(players, numPlayers)

    rounds[0] = []
    rounds[0].push([players[34], players[26], players[18], players[28]])
    rounds[0].push([players[19], players[32], players[22], players[30]])
    rounds[0].push([players[12], players[1], players[15], players[0]])
    rounds[0].push([players[24], players[33], players[21], players[23]])
    rounds[0].push([players[17], players[20], players[6], players[13]])
    rounds[0].push([players[35], players[16], players[8], players[7]])
    rounds[0].push([players[27], players[29], players[31], players[25]])
    rounds[0].push([players[10], players[14], players[5], players[9]])
    rounds[0].push([players[11], players[3], players[2], players[4]])

    rounds[1] = []
    rounds[1].push([players[8], players[24], players[4], players[1]])
    rounds[1].push([players[25], players[21], players[13], players[22]])
    rounds[1].push([players[0], players[10], players[28], players[2]])
    rounds[1].push([players[3], players[30], players[34], players[5]])
    rounds[1].push([players[15], players[17], players[33], players[32]])
    rounds[1].push([players[6], players[31], players[7], players[12]])
    rounds[1].push([players[9], players[35], players[11], players[29]])
    rounds[1].push([players[26], players[23], players[16], players[20]])
    rounds[1].push([players[18], players[27], players[14], players[19]])

    rounds[2] = []
    rounds[2].push([players[32], players[7], players[3], players[26]])
    rounds[2].push([players[31], players[13], players[10], players[35]])
    rounds[2].push([players[14], players[22], players[12], players[34]])
    rounds[2].push([players[23], players[8], players[29], players[17]])
    rounds[2].push([players[2], players[5], players[1], players[18]])
    rounds[2].push([players[20], players[19], players[25], players[11]])
    rounds[2].push([players[28], players[6], players[24], players[16]])
    rounds[2].push([players[30], players[15], players[9], players[21]])
    rounds[2].push([players[4], players[0], players[27], players[33]])

    return true
  } else if (numPlayers == 37) {
    init()
    shuffle(players, numPlayers)

    rounds[0] = []
    rounds[0].push([players[24], players[23], players[28], players[27]])
    rounds[0].push([players[32], players[14], players[31], players[38]])
    rounds[0].push([players[3], players[6], players[16], players[4]])
    rounds[0].push([players[11], players[19], players[0], players[7]])
    rounds[0].push([players[9], players[34], players[36], players[21]])
    rounds[0].push([players[8], players[37], players[25], players[29]])
    rounds[0].push([players[17], players[10], players[13], players[30]])
    rounds[0].push([players[33], players[18], players[26], players[15]])
    rounds[0].push([players[12], players[22], players[5], players[1]])
    rounds[0].push([players[20], players[39], players[2], players[35]])

    rounds[1] = []
    rounds[1].push([players[27], players[36], players[32], players[20]])
    rounds[1].push([players[38], players[7], players[12], players[9]])
    rounds[1].push([players[19], players[31], players[35], players[28]])
    rounds[1].push([players[26], players[37], players[6], players[24]])
    rounds[1].push([players[0], players[16], players[1], players[10]])
    rounds[1].push([players[13], players[33], players[11], players[14]])
    rounds[1].push([players[21], players[17], players[22], players[25]])
    rounds[1].push([players[4], players[30], players[39], players[5]])
    rounds[1].push([players[2], players[8], players[15], players[3]])
    rounds[1].push([players[34], players[29], players[23], players[18]])

    rounds[2] = []
    rounds[2].push([players[10], players[32], players[34], players[12]])
    rounds[2].push([players[30], players[11], players[3], players[31]])
    rounds[2].push([players[29], players[15], players[4], players[0]])
    rounds[2].push([players[22], players[35], players[14], players[26]])
    rounds[2].push([players[18], players[27], players[38], players[16]])
    rounds[2].push([players[23], players[39], players[21], players[19]])
    rounds[2].push([players[1], players[28], players[37], players[17]])
    rounds[2].push([players[25], players[24], players[33], players[2]])
    rounds[2].push([players[7], players[5], players[8], players[36]])
    rounds[2].push([players[6], players[20], players[9], players[13]])

    return true
  } else if (numPlayers == 41) {
    init()
    shuffle(players, numPlayers)

    rounds[0] = []
    rounds[0].push([players[20], players[21], players[12], players[18]])
    rounds[0].push([players[26], players[6], players[4], players[13]])
    rounds[0].push([players[8], players[33], players[24], players[41]])
    rounds[0].push([players[15], players[25], players[19], players[43]])
    rounds[0].push([players[27], players[17], players[32], players[42]])
    rounds[0].push([players[1], players[0], players[2], players[3]])
    rounds[0].push([players[11], players[22], players[39], players[34]])
    rounds[0].push([players[14], players[28], players[29], players[10]])
    rounds[0].push([players[7], players[31], players[9], players[35]])
    rounds[0].push([players[36], players[38], players[5], players[40]])
    rounds[0].push([players[30], players[23], players[37], players[16]])

    rounds[1] = []
    rounds[1].push([players[5], players[7], players[17], players[25]])
    rounds[1].push([players[21], players[43], players[28], players[39]])
    rounds[1].push([players[3], players[12], players[16], players[32]])
    rounds[1].push([players[42], players[40], players[14], players[30]])
    rounds[1].push([players[38], players[10], players[13], players[19]])
    rounds[1].push([players[29], players[26], players[31], players[0]])
    rounds[1].push([players[6], players[35], players[8], players[2]])
    rounds[1].push([players[18], players[36], players[33], players[15]])
    rounds[1].push([players[22], players[27], players[23], players[24]])
    rounds[1].push([players[4], players[34], players[41], players[1]])
    rounds[1].push([players[37], players[9], players[20], players[11]])

    rounds[2] = []
    rounds[2].push([players[39], players[16], players[36], players[17]])
    rounds[2].push([players[10], players[15], players[27], players[31]])
    rounds[2].push([players[41], players[13], players[11], players[23]])
    rounds[2].push([players[9], players[8], players[3], players[38]])
    rounds[2].push([players[35], players[32], players[1], players[28]])
    rounds[2].push([players[0], players[4], players[7], players[33]])
    rounds[2].push([players[24], players[19], players[40], players[21]])
    rounds[2].push([players[12], players[29], players[22], players[42]])
    rounds[2].push([players[34], players[30], players[26], players[5]])
    rounds[2].push([players[2], players[20], players[25], players[14]])
    rounds[2].push([players[43], players[37], players[18], players[6]])

    return true
  } else {
    return false
  }
}

function shuffle(array, length) {
  for (let i = 0; i < 1000; i++) {
    let r1 = Math.floor(Math.random() * (length || array.length))
    let r2 = Math.floor(Math.random() * (length || array.length))

    let temp = array[r1]
    array[r1] = array[r2]
    array[r2] = temp
  }
}

function loadPlayers() {
  players = JSON.parse(localStorage.getItem("players"))
  showPlayers()
  $("#playerInput").focus()
}

function loadBoards() {
  boards = JSON.parse(localStorage.getItem("boards"))
  showBoards()

  for (let i = 0; i < boards.length; i++) {
    let board = boards[i]
    let canvasId = "board" + (i + 1)

    drawBoard(canvasId, board.colors)
    drawPorts(canvasId, board.ports)
    drawNumbers(canvasId, board.colors, board.numbers)
  }

  $("#previousBoard").click(showPreviousBoard)
  $("#nextBoard").click(showNextBoard)
}

function loadTables() {
  players = JSON.parse(localStorage.getItem("roundsPlayers"))
  numPlayers = parseInt(localStorage.getItem("numPlayers"), 10)
  rounds = JSON.parse(localStorage.getItem("rounds"))
  showRounds()

  for (let i = 0; i < rounds.length; i++) {
    let round = rounds[i]

    for (let j = 0; j < round.length; j++) {
      let table = round[j]

      for (let k = 0; k < table.length; k++) {
        let player = table[k]

        if (player.score) {
          let $select = $(".round").eq(i).find(".tableRow").eq(j).find(".player").eq(k)

          $select.val(player.score)
          highlightCompletedRounds($select)
        }
      }
    }
  }
}
