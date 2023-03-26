// SETUP
const { generateRandomString, findUserByEmail, urlsForUser, isValidUrl } = require('./helpers');
const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080;

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(cookieSession({
  name: 'session',
  keys: ['No cookies for you'],

  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));

// DATA
const urlDatabase = {
  'b2xVn2': {
    longUrl: "http://www.lighthouselabs.ca",
    userId: "default"
  },
  '9sm5xK': {
    longUrl: "http://www.google.com",
    userId: "default"
  },
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10),
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10),
  },
};

// ROUTES
app.listen(PORT, () => {
  console.log(`Tinyapp listening on port ${PORT}!`);
});

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect('/urls');
  }

  res.redirect('/login');
});

// renders login page
app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  }

  const templateVars = { userId: null };
  res.render('login', templateVars);
});

// displays userID in header upon clicking login
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = findUserByEmail(email, users);

  if (user && bcrypt.compareSync(password, user.password)) {
    req.session['user_id'] = user.id;
    return res.redirect('/urls'); // return is necessary here to prevent terminal error msg
  }

  if (!user) {
    return res.status(404).send('Not Found: User not found, are you a registered user?');
  }

  return res.status(403).send('Forbidden: You entered the wrong credentials. Please try again.');
});

// clears cookie upon log out
app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect('/login');
});

// renders page with that displays urlDatabase
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  }

  const templateVars = { userId: null };
  res.render("register", templateVars);
});

// renders page with that displays urlDatabase
app.post("/register", (req, res) => {
  const { email, password } = req.body;
  const user = findUserByEmail(email, users);

  if (user) {
    return res.status(403).send('Forbidden: Sorry, that user already exists!');
  }

  if (email === '' || password === '') {
    return res.status(400).send('Bad Request: Please fill out all fields before submitting!');
  }

  // creates new user
  const userId = generateRandomString();
  users[userId] = {
    id: userId,
    email: email,
    password: bcrypt.hashSync(password, 10)
  };

  req.session['user_id'] = userId;
  res.redirect('/urls');
});

// renders page with that displays urlDatabase
app.get("/urls", (req, res) => {
  const user = users[req.session.user_id];
  const email = user ? user.email : null;
  const myUrls = urlsForUser(req.session.user_id, urlDatabase);
  
  if (!req.session.user_id) {
    return res.status(401).send('Unauthorized: Sorry, you are not logged into Tinyapp!');
  }

  const templateVars = {
    userId: req.session.user_id,
    urlDb: myUrls,
    email
  };

  res.render("urls_index", templateVars);
});

// creates new url entries and redirects to individual pages after
app.post("/urls", (req, res) => {
  const userId = req.session.user_id;

  if (!userId) {
    return res.status(401).send('Unauthorized: Sorry, you are not logged into Tinyapp!'); // this would only show up through something like cURL
  }

  // creates new url entry
  const uniqueId = generateRandomString();
  urlDatabase[uniqueId] = {
    longUrl: req.body.longUrl,
    userId: userId
  };

  res.redirect(`/urls/${uniqueId}`);
});

// renders a page for creating new entires, must go BEFORE /urls/:id
app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  const email = user ? user.email : null;

  if (!userId) {
    res.redirect("/login");
  }

  const templateVars = { userId, email };
  res.render("urls_new", templateVars);
});

// renders page for each entry
app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  const user = users[req.session.user_id];
  const email = user ? user.email : null;

  if (!req.session.user_id) {
    return res.status(401).send('Unauthorized: Sorry, you are not logged into Tinyapp!');
  }

  if (!urlDatabase[id]) {
    return  res.status(404).send('Not Found: Shortened URL not found!');
  }

  if (urlDatabase[id].userId !== req.session.user_id) {
    return res.status(403).send('Forbidden: Sorry, this URL was not created by you!');
  }

  const templateVars = {
    id: id,
    longUrl: urlDatabase[id].longUrl,
    userId: req.session.user_id,
    email: email
  };

  res.render("urls_show", templateVars);
});

// edits long URL and redirects back to index
app.post("/urls/:id", (req, res) => {
  const id = req.params.id;
  const urlEntry = urlDatabase[id];

  if (!urlEntry) {
    return res.status(404).send('Not Found: URL ID not found!');// seen in terminal using cURL
  }

  if (!req.session.user_id) {
    return res.status(401).send('Unauthorized: Sorry, you are not logged into Tinyapp!');
  }

  if (urlDatabase[id].userId !== req.session.user_id) {
    return res.status(403).send('Forbidden: Sorry, this URL was not created by you!');
  }

  urlDatabase[req.params.id].longUrl = req.body.longUrl;
  res.redirect(`/urls`);
});

// redirects to longUrl when clicking the uniqueID in individual page
app.get("/u/:id", (req, res) => {
  const urlEntry = urlDatabase[req.params.id];
  const longUrl = urlEntry.longUrl;

  if (!urlEntry || !longUrl) {
    return res.status(404).send('Not Found: URL is undefined!');
  }

  if (!isValidUrl(longUrl)) {
    return res.status(400).send('Bad Request: Invalid URL!');
  }

  res.redirect(longUrl);
});

// deleting entries and redirecting back to index
app.post("/urls/:id/delete", (req, res) => {

  if (!urlDatabase[req.params.id]) {
    return res.status(404).send('Not Found: URL ID not found!');
  }

  if (!req.session.user_id) {
    return res.status(401).send('Unauthorized: Can not delete, you are not logged into Tinyapp!');
  }

  if (urlDatabase[req.params.id].userId !== req.session.user_id) {
    return res.status(403).send('Forbidden: Can not delete, this URL was not created by you!'); // can be seen in terminal using cURL and passing a cookie (this also wont work if cookies are encrypted)
  }

  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});