//=====================
//  Imports
//=====================
import express from "express";
import axios from "axios";
import "dotenv/config";
//=====================
//  Constants
//=====================
const app = express();
const port = process.env.PORT;
// const API_KEY = process.env.API_KEY;
//=====================
//  Middleware
//=====================
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
//=====================
// Variables
//=====================
let diceGameChoice = [
  {
    stringValue: "One",
    intValue: 1,
  },
  {
    stringValue: "Two",
    intValue: 2,
  },
  {
    stringValue: "Three",
    intValue: 3,
  },
  {
    stringValue: "Four",
    intValue: 4,
  },
];
let triviaGameChoice = [
  {
    stringValue: "Ten",
    intValue: 10,
  },
  {
    stringValue: "Twenty",
    intValue: 20,
  },
  {
    stringValue: "Thirty",
    intValue: 30,
  },
  {
    stringValue: "Fourty",
    intValue: 40,
  },
];
let triviaArray = [];
let isGameInitialized = false;
let currentQuestion = 0;
let playerScore = [{ name: 1, score: 0 }];
//=====================
//  Routes
//=====================
app.get("/", (req, res) => {
  try {
    res.render("index.ejs");
  } catch (error) {
    res.status(500).send("Something went wrong.");
    console.log(error);
  }
});
app.get("/navigation", (req, res) => {
  let games = [
    {
      id: 1,
      link: "dice",
      title: "Dice",
      alt: "Dice Image",
      description: "Test Your Lucks",
    },
    {
      id: 2,
      link: "flags",
      title: "Flags",
      alt: "Flags Image",
      description: "Test your Knowledge of Flags",
    },
    {
      id: 3,
      link: "trivia",
      title: "Trivia",
      alt: "Trivia Image",
      description: "Play Some Trivia",
    },
  ];
  try {
    res.render("navigation.ejs", { games: games });
  } catch (error) {
    res.status(500).send("Something went wrong.");
    console.log(error);
  }
});
app.get("/:game", async (req, res) => {
  let gameType = req.params.game;
  let startGame = false;
  if (gameType === "dice") {
    try {
      let gameChoice = diceGameChoice;
      let choiceQuestion = "Choose Number of Players";
      res.render("games.ejs", {
        gameType: gameType,
        gameChoice: gameChoice,
        choiceQuestion: choiceQuestion,
        startGame: startGame,
      });
    } catch (error) {
      res.status(500).send("Something went wrong.");
      console.log(error);
    }
  } else if (gameType === "trivia") {
    try {
      let gameChoice = triviaGameChoice;
      let choiceQuestion = "Choose Number of Questions";
      res.render("games.ejs", {
        gameType: gameType,
        gameChoice: gameChoice,
        choiceQuestion: choiceQuestion,
        startGame: startGame,
      });
      // For debugging, you can log the entire array
    } catch (error) {
      res.status(500).send("Something went wrong.");
      console.log(error);
    }
  }
});

app.post("/:game/play", async (req, res) => {
  let gameType = req.body.gameType;
  let choice = req.body.choice;
  let startGame = true;
  if (gameType === "dice") {
    try {
      let choiceQuestion = "Choose Number of Players";
      let gameQuestion = "Roll Dice";
      let gameChoice = diceGameChoice;
      let playerScore = [];
      let answers = [
        { name: "roll", value: "Roll" },
        { name: "reset", value: "Reset" },
      ];
      if (req.body.roll === "True") {
        rollDie(choice, playerScore);
        console.log(playerScore);
      }
      if (req.body.reset === "True") {
        startGame = false;
      }
      console.log(req.body);
      let winner = getWinner(playerScore);
      res.render("games.ejs", {
        answers: answers,
        choice: choice,
        choiceQuestion: choiceQuestion,
        gameChoice: gameChoice,
        gameQuestion: gameQuestion,
        gameType: gameType,
        playerScore: playerScore,
        startGame: startGame,
        winner: winner,
      });
    } catch (err) {
      res.status(500).send("Something went wrong.");
      console.log(err);
    }
  } else if (gameType === "trivia") {
    try {
      let gameType = req.body.gameType;
      let choice = req.body.choice;
      let startGame = true;

      if (gameType === "trivia") {
        let choice = parseInt(req.body.choice);
        let gameChoice = triviaGameChoice;
        let choiceQuestion = "Choose Your Answer";

        // Check if the reset button was pressed
        if (req.body.name === "Reset") {
          // isGameInitialized = false; // Set the game as not initialized
          return res.redirect(`/${gameType}`);
        }

        // Initialize game only if not initialized or reset
        if (!isGameInitialized) {
          let result = await axios.get(apiGen(choice));
          let results = result.data.results;
          triviaArray = createTriviaArray(results);
          isGameInitialized = true;
          currentQuestion = 0; // Reset current question index
          playerScore = [{ name: 1, score: 0 }]; // Reset player score
        }

        let correctAnswer =
          currentQuestion < triviaArray.length
            ? triviaArray[currentQuestion].correct_answer
            : "";
        let userAnswer = req.body.name;

        if (
          userAnswer &&
          userAnswer !== "Reset" &&
          currentQuestion < triviaArray.length
        ) {
          checkAnswer(correctAnswer, userAnswer, playerScore);
        }

        let winner = gameOver(triviaArray, currentQuestion, playerScore);
        let answers =
          currentQuestion < triviaArray.length
            ? getAnswers(triviaArray, currentQuestion)
            : [{ name: "reset", value: "Reset" }];
        let gameQuestion =
          currentQuestion < triviaArray.length
            ? getTriviaQuestion(triviaArray, currentQuestion)
            : "Game Over";

        console.log(correctAnswer);

        res.render("games.ejs", {
          answers: answers,
          choice: choice,
          choiceQuestion:
            currentQuestion < triviaArray.length ? "Choose Your Answer" : "",
          gameChoice: triviaGameChoice,
          gameQuestion: gameQuestion,
          gameType: gameType,
          playerScore: playerScore,
          startGame: startGame,
          winner: winner,
        });
      }
    } catch (err) {
      res.status(500).send("Something went wrong.");
      console.log(err);
    }
  }
});

function rollDie(numPlayers, playerScore) {
  for (let index = 1; index <= numPlayers; index++) {
    let die = Math.floor(Math.random() * 6) + 1;
    playerScore.push({ name: index, score: die });
  }
  return playerScore;
}
function getWinner(playerScore) {
  if (playerScore.length === 0) return null;
  let winner = playerScore[0];
  for (let i = 1; i < playerScore.length; i++) {
    if (playerScore[i].score > winner.score) {
      winner = playerScore[i];
    }
  }
  return winner;
}
// Add constructor function
function Trivia(id, question, correct_answer, incorrect_answers) {
  this.id = id;
  this.question = question;
  this.correct_answer = correct_answer;
  this.incorrect_answers = incorrect_answers;
}
function apiGen(numQuestions) {
  let apiKey;
  switch (numQuestions) {
    case 10:
      apiKey = process.env.API_KEY1;
      break;
    case 20:
      apiKey = process.env.API_KEY2;
      break;
    case 30:
      apiKey = process.env.API_KEY3;
      break;
    case 40:
      apiKey = process.env.API_KEY4;
      break;
    default:
      break;
  }
  return apiKey;
}
function createTriviaArray(results) {
  let triviaArray = [];

  for (let i = 0; i < results.length; i++) {
    let triviaObj = new Trivia(
      i + 1,
      Buffer.from(results[i].question, "base64").toString("ascii"),
      Buffer.from(results[i].correct_answer, "base64").toString("ascii"),
      results[i].incorrect_answers.map((answer) =>
        Buffer.from(answer, "base64").toString("ascii"),
      ),
    );
    triviaArray.push(triviaObj);
  }

  return triviaArray;
}
function getTriviaQuestion(triviaArray, currentQuestion) {
  let gameQuestion = triviaArray[currentQuestion].question;
  return gameQuestion;
}
function getTriviaAnswer(triviaArray, currentQuestion) {
  let gameQuestion = triviaArray[currentQuestion].correct_answer;
  return gameQuestion;
}
function getAnswers(triviaArray, currentQuestion) {
  let correctAnswer = triviaArray[currentQuestion].correct_answer;
  let incorrectAnswers = triviaArray[currentQuestion].incorrect_answers;
  let answers = [...incorrectAnswers, correctAnswer];

  // Shuffle the answers array
  for (let i = answers.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [answers[i], answers[j]] = [answers[j], answers[i]];
  }
  // Convert each answer to an object with name and value being the same
  let formattedAnswers = answers.map((answer) => ({
    name: answer,
    value: answer,
  }));
  return formattedAnswers;
}
function checkAnswer(correctAnswer, userAnswer, playerScore) {
  if (correctAnswer === userAnswer) {
    playerScore[0].score++; // Increment score for the player
  }
  currentQuestion++;
}
function gameOver(triviaArray, currentQuestion, playerScore) {
  if (currentQuestion >= triviaArray.length) {
    return `Player got ${playerScore[0].score} out of ${triviaArray.length}`;
  }
  return null;
}
//=====================
//  Listener
//=====================
app.listen(port, () => {
  console.log(`Server running on port ${port}.`);
});
