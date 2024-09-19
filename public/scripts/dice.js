// Globals
const playersButton = document.querySelectorAll(".playersButton");
const beginContent = document.querySelector(".begin-content");
const playContent = document.querySelector(".play-content");
const scoreBoard = document.querySelector(".scoreboard-container");
const btnRoll = document.querySelector(".btn-roll");
const resetButton = document.querySelector(".btn-restart");

// Players Array
let players = [];

// Constructor Function Number of Players
function Player(id, name, hasRolled, score) {
  this.id = id;
  this.name = name;
  this.hasRolled = hasRolled;
  this.score = score;
  this.rollDie = function() {
    return Math.floor(Math.random() * 6) + 1;
  };
  this.createScoreBoard = function() {
    // create a new div element
    const resultDiv = document.createElement("div");

    resultDiv.classList.add("results");
    // and give it some content
    resultDiv.innerHTML =
      "<h3>" + name + " : <span> " + this.score + "</span></h3>";
    // add the text node to the newly created div
    scoreBoard.appendChild(resultDiv);
  };
}

// Use Players Button to Get Number of players
function getPlayers() {
  for (let i = 0; i < playersButton.length; i++) {
    // Get Clicked button
    playersButton[i].addEventListener("click", function() {
      // Get Number from buttons
      let buttonNumber = i + 1;
      for (let j = 1; j <= buttonNumber; j++) {
        // Create Objects Based on number
        var player1 = new Player(j, "Player " + j, false, 0);
        players.push(player1);
        player1.createScoreBoard();
      }
      beginContent.style.display = "none";
      playContent.style.display = "block";
      scoreBoard.style.visibility = "visible";
    });
  }
}

// Roll Die For Each Player
function rollDie() {
  btnRoll.addEventListener("click", function() {
    let maxValue = -Infinity;
    let maxObject = null;
    for (let i = 0; i < players.length; i++) {
      const element = players[i];
      element.score = element.rollDie();
      console.log(element.score);
      if (element.score > maxValue) {
        maxValue = element.score;
        maxObject = element.name;
      }
      const deleteNode = document.querySelector(".results");
      deleteNode.remove();
      // element.createScoreBoard();
      const resultDiv = document.createElement("div");
      resultDiv.classList.add("results");
      // and give it some content
      resultDiv.innerHTML =
        "<h3>" +
        element.name +
        ": <span> " +
        element.score +
        "</span></h3>";
      // add the text node to the newly created div
      scoreBoard.appendChild(resultDiv);
    }
    if (maxObject) {
      // console.log(`Object with highest value: ${maxObject} (Value: ${maxValue})`);
      document.querySelector(".banner-content").innerHTML =
        `<h1>${maxObject} wins!</h1>`;
    } else {
      console.log("No objects found.");
    }
  });
}

// Reset Game
function resetGame() {
  resetButton.addEventListener("click", function() {
    beginContent.style.display = "block";
    playContent.style.display = "none";
    players.splice(0, players.length);
    const deleteNode = document.querySelectorAll(".results");
    for (let i = 0; i < deleteNode.length; i++) {
      deleteNode[i].remove();
    }
  });
}

// Game Start
function playDice() {
  getPlayers();
  rollDie();
  resetGame();
}
playDice();
