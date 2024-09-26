//=====================
//  Imports
//=====================
import express from "express";
//=====================
//  Constants
//=====================
const app = express(),
  port = 3000;
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
  try {
    res.render("navigation.ejs");
  } catch (error) {
    res.status(500).send("Something went wrong.");
    console.log(error);
  }
});
app.get("/dice", (req, res) => {
  try {
    res.render("dice.ejs");
  } catch (error) {
    res.status(500).send("Something went wrong.");
    console.log(error);
  }
});
app.get("/trivia", (req, res) => {
  try {
    res.render("trivia.ejs");
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
