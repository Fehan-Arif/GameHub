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
