//=====================
//  Imports
//=====================
import express from "express";
import axios from "axios";
//=====================
//  Constants
//=====================
const app = express();
const port = process.env.PORT;
const API_KEY = process.env.API_KEY;
//=====================
//  Middleware
//=====================
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
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
  if (gameType === "dice") {
    try {
      let gameChoice = [
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
      let startGame = false;
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
    // Add constructor function
    function Trivia(id, question, correct_answer, incorrect_answers) {
      this.id = id;
      this.question = question;
      this.correct_answer = correct_answer;
      this.incorrect_answers = incorrect_answers;
    }
    try {
      let result = await axios.get(API_KEY); // Create a buffer from the string
      let results = result.data.results; // This is an array with objects
      let triviaArray = []; // Array to hold all Trivia objects

      // Constructs
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

      // Send the array of Trivia objects as a single response
      res.render("trivia.ejs", { content: JSON.stringify(triviaArray) });

      // For debugging, you can log the entire array
      console.log(JSON.stringify(triviaArray));
    } catch (error) {
      res.status(500).send("Something went wrong.");
      console.log(error);
    }
  }
});

app.post("/:game/play", async (req, res) => {
  console.log(req.body);
  let gameType = req.body.gameType;
  let choice = req.body.choice;
  let startGame = true;
  let gameQuestion = "Roll Dice";
  let choiceQuestion = "Choose Number of Players";
  let gameChoice = [
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
  let answers = [
    { name: "roll", value: "Roll" },
    { name: "reset", value: "Reset" },
  ];
  if (req.body.roll === "True") {
    rollDie(choice);
  }
  if (req.body.reset === "True") {
    startGame = false;
  }
  // console.log(startGame);
  res.render("games.ejs", {
    gameType: gameType,
    choice: choice,
    startGame: startGame,
    gameQuestion: gameQuestion,
    answers: answers,
    choiceQuestion: choiceQuestion,
    gameChoice: gameChoice,
  });
});

function rollDie(numPlayers) {
  for (let index = 1; index <= numPlayers; index++) {
    console.log(`Player ${index} got:`);
  }
}

function resetGame() {
  let startGame = false;
  return startGame;
}

// app.get("/flags", (req, res) => {
//   try {
//     res.render("flags.ejs");
//   } catch (error) {
//     res.status(500).send("Something went wrong.");
//     console.log(error);
//   }
// });
// app.get("/trivia", async (req, res) => {
//   // Add constructor function
//   function Trivia(id, question, correct_answer, incorrect_answers) {
//     this.id = id;
//     this.question = question;
//     this.correct_answer = correct_answer;
//     this.incorrect_answers = incorrect_answers;
//   }
//   try {
//     let result = await axios.get(API_KEY); // Create a buffer from the string
//     let results = result.data.results; // This is an array with objects
//     let triviaArray = []; // Array to hold all Trivia objects
//
//     // Constructs
//     for (let i = 0; i < results.length; i++) {
//       let triviaObj = new Trivia(
//         i + 1,
//         Buffer.from(results[i].question, "base64").toString("ascii"),
//         Buffer.from(results[i].correct_answer, "base64").toString("ascii"),
//         results[i].incorrect_answers.map((answer) =>
//           Buffer.from(answer, "base64").toString("ascii"),
//         ),
//       );
//       triviaArray.push(triviaObj);
//     }
//
//     // Send the array of Trivia objects as a single response
//     res.render("trivia.ejs", { content: JSON.stringify(triviaArray) });
//
//     // For debugging, you can log the entire array
//     console.log(JSON.stringify(triviaArray));
//   } catch (error) {
//     res.status(500).send("Something went wrong.");
//     console.log(error);
//   }
// });
//=====================
//  Listener
//=====================
app.listen(port, () => {
  console.log(`Server running on port ${port}.`);
});
