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
  res.send("Hello World!");
});
//=====================
//  Listener
//=====================
app.listen(port, () => {
  console.log(`Server running on port ${port}.`);
});
