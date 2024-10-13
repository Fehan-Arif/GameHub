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
app.get("/:game", (req, res) => {
  let gameType = req.params.game;
  if (gameType === "dice") {
    try {
      res.render("games.ejs", { gameType: gameType });
    } catch (error) {
      res.status(500).send("Something went wrong.");
      console.log(error);
    }
  } else {
    console.log(gameType);
  }
});
app.get("/flags", (req, res) => {
  try {
    res.render("flags.ejs");
  } catch (error) {
    res.status(500).send("Something went wrong.");
    console.log(error);
  }
});
app.get("/trivia", async (req, res) => {
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
});
//=====================
//  Listener
//=====================
app.listen(port, () => {
  console.log(`Server running on port ${port}.`);
});
