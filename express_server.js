const express = require("express");
var cookieParser = require('cookie-parser')
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true })); // essential to parse body
app.use(cookieParser()) // essential to parse cookie

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

/* // generates random string - random number is generated and converted to a string of base 36 representing all
alphanumerics characters and creates a new substring (skipping 0 and .) based off how many letters are required */
const generateRandomString = function() {
  return Math.random().toString(36).substring(2, 8);
};

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// generates json of urlDatabase
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// generates json of urlDatabase
app.post("/login", (req, res) => {
  res.cookie('username', req.body.username).redirect('/urls');
});


// renders page with that displays urlDatabase
app.get("/urls", (req, res) => {
  const templateVars = { 
    username: req.cookies["username"],
    urls: urlDatabase
   };
  res.render("urls_index", templateVars);
});

// renders a page for creating new entires, must go BEFORE /urls/:id
app.get("/urls/new", (req, res) => {
  res.render("urls_new");
});

// creates 6 random alphanumeric id and generates new entry to urlDatabase
app.post("/urls", (req, res) => {
  const uniqueID = generateRandomString();
  urlDatabase[uniqueID] = req.body.longURL;
  res.redirect(`/urls/${uniqueID}`);
});

// deleting entries and redirecting back to index
app.post("/urls/:id/delete", (req, res) => { // adds delete verb to the :id
  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

// edits long URL and redirects back to index
app.post("/urls/:id", (req, res) => { // adds delete verb to the :id
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect(`/urls`);
});

// renders page for each entry
app.get("/urls/:id", (req, res) => {
  const templateVars = { id: req.params.id, longURL: urlDatabase[req.params.id]};
  res.render("urls_show", templateVars);
});

// redirects to longURL when clicking the uniqueID
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL); //because urls/:id makes a longURL key value pair
});

// initial test page
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});