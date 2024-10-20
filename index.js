//=====================
//  Imports
//=====================
import express from "express";
import axios from "axios";
import "dotenv/config";
import pg from "pg";
//=====================
//  Constants
//=====================
const app = express();
const port = process.env.PORT;
const db = new pg.Client({
  user: process.env.USER,
  password: process.env.PASSWORD,
  host: process.env.HOST,
  database: process.env.DATABASE,
  port: process.env.DBPORT,
});
db.connect();
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
let flagGameChoice = [
  {
    stringValue: "Five",
    intValue: 5,
  },
  {
    stringValue: "Ten",
    intValue: 10,
  },
  {
    stringValue: "Fifteen",
    intValue: 15,
  },
  {
    stringValue: "Twenty",
    intValue: 20,
  },
];
let triviaArray = [];
let isGameInitialized = false;
let currentQuestion = 0;
let playerScore = [{ name: 1, score: 0 }];
let currentQuestionIndex = 0;
let questions = [];
//=====================
// Functions
//=====================
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
async function generateQuestions(choice) {
  // Fetch data from the database
  const result = await db.query("SELECT * FROM flags;");
  const usedIDs = new Set();
  const questions = [];

  for (let i = 0; i < choice; i++) {
    // Generate a unique random ID
    let randomID;
    do {
      randomID = Math.floor(Math.random() * result.rows.length) + 1;
    } while (usedIDs.has(randomID));

    usedIDs.add(randomID);

    // Get the data for the current question
    const currentFlag = result.rows.find((row) => row.id === randomID);
    if (!currentFlag) {
      continue; // Skip this iteration if no flag is found
    }

    const correctAnswer = currentFlag.name;

    // Get three incorrect answers
    const incorrectAnswers = [];
    while (incorrectAnswers.length < 3) {
      let incorrectID;
      do {
        incorrectID = Math.floor(Math.random() * result.rows.length) + 1;
      } while (
        incorrectID === randomID ||
        incorrectAnswers.includes(
          result.rows.find((row) => row.id === incorrectID)?.name,
        )
      );

      const incorrectFlag = result.rows.find((row) => row.id === incorrectID);
      if (incorrectFlag && incorrectFlag.name) {
        incorrectAnswers.push(incorrectFlag.name);
      }
    }

    // Create the question object
    let question = {
      question: `Which country's flag is this? '${currentFlag.flag}'`,
      correctAnswer: correctAnswer,
      answers: [
        { name: correctAnswer, value: correctAnswer },
        ...incorrectAnswers.map((answer) => ({ name: answer, value: answer })),
      ].sort(() => Math.random() - 0.5), // Randomize answers order
    };

    questions.push(question);
  }

  return questions;
}
async function initializeQuestions(choice) {
  questions = await generateQuestions(choice);
}

async function handleDiceGame(req, res) {
  let choiceQuestion = "Choose Number of Players";
  let gameQuestion = "Roll Dice";
  let gameChoice = diceGameChoice;
  let playerScore = [];
  let answers = [
    { name: "roll", value: "Roll" },
    { name: "reset", value: "Reset" },
  ];

  if (req.body.roll === "True") {
    rollDie(req.body.choice, playerScore);
    console.log(playerScore);
  }

  if (req.body.reset === "True") {
    return res.redirect(`/${req.body.gameType}`);
  }

  console.log(req.body);
  let winner = getWinner(playerScore);
  res.render("games.ejs", {
    answers: answers,
    choice: req.body.choice,
    choiceQuestion: choiceQuestion,
    gameChoice: gameChoice,
    gameQuestion: gameQuestion,
    gameType: req.body.gameType,
    playerScore: playerScore,
    startGame: true,
    winner: winner,
  });
}

async function handleTriviaGame(req, res) {
  let choice = parseInt(req.body.choice);
  let gameChoice = triviaGameChoice;
  let choiceQuestion = "Choose Your Answer";

  // Check if the reset button was pressed
  if (req.body.name === "Reset") {
    return res.redirect(`/${req.body.gameType}`);
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

  // console.log(triviaArray);
  res.render("games.ejs", {
    answers: answers,
    choice: choice,
    choiceQuestion:
      currentQuestion < triviaArray.length ? "Choose Your Answer" : "",
    gameChoice: gameChoice,
    gameQuestion: gameQuestion,
    gameType: req.body.gameType,
    playerScore: playerScore,
    startGame: true,
    winner: winner,
  });
}
// Flag game
async function handleFlagGame(req, res) {
  let choice = parseInt(req.body.choice);
  let gameChoice = flagGameChoice;
  let choiceQuestion = "Choose Your Answer";

  // Check if the reset button was pressed
  if (req.body.name === "Reset") {
    // Ensure all game states are reset
    isGameInitialized = false;
    questions = []; // Clear questions
    currentQuestionIndex = 0; // Reset current question index
    playerScore = [{ name: 1, score: 0 }]; // Reset player score
    return res.redirect(`/${req.body.gameType}`);
  }

  // Initialize game only if not initialized or reset
  if (!isGameInitialized) {
    questions = await generateQuestions(choice);
    isGameInitialized = true;
    currentQuestionIndex = 0; // Reset current question index
    playerScore = [{ name: 1, score: 0 }]; // Reset player score
  }

  let userAnswer = req.body.name;
  if (
    userAnswer &&
    userAnswer !== "Reset" &&
    currentQuestionIndex < questions.length
  ) {
    let currentQuestion = questions[currentQuestionIndex];
    if (userAnswer === currentQuestion.correctAnswer) {
      playerScore[0].score++; // Increment player score if correct
    }
    currentQuestionIndex++; // Move to the next question
  }

  // Determine if game is over
  let isGameOver = currentQuestionIndex >= questions.length;
  let answers = isGameOver
    ? [{ name: "reset", value: "Reset" }]
    : questions[currentQuestionIndex].answers;
  let gameQuestion = isGameOver
    ? "Game Over"
    : questions[currentQuestionIndex].question;
  let winner = isGameOver
    ? `Player got ${playerScore[0].score} out of ${questions.length}`
    : null;

  res.render("games.ejs", {
    answers: answers,
    choice: choice,
    choiceQuestion:
      currentQuestionIndex < questions.length ? "Choose Your Answer" : "",
    gameChoice: gameChoice,
    gameQuestion: gameQuestion,
    gameType: req.body.gameType,
    playerScore: playerScore,
    startGame: true,
    winner: winner,
  });
}
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
  } else if (gameType === "flags") {
    try {
      let gameChoice = flagGameChoice;
      let choiceQuestion = "Choose Number of Questions";
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
  }
});

app.post("/:game/play", async (req, res) => {
  let gameType = req.body.gameType;
  try {
    if (gameType === "dice") {
      await handleDiceGame(req, res);
    } else if (gameType === "trivia") {
      await handleTriviaGame(req, res);
    } else if (gameType === "flags") {
      if (!isGameInitialized) {
        await initializeQuestions(parseInt(req.body.choice));
        isGameInitialized = true;
      }
      await handleFlagGame(req, res);
    } else {
      res.status(400).send("Unsupported game type");
    }
  } catch (err) {
    res.status(500).send("Something went wrong.");
    console.log(err);
  }
});

//=====================
//  Listener
//=====================
app.listen(port, () => {
  console.log(`Server running on port ${port}.`);
});
