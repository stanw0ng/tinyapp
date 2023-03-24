
// Setup
const {  generateRandomString, findUserByEmail, urlsForUser } = require('./helpers');
const express = require("express");
const cookieSession = require('cookie-session');
const bcrypt = require("bcryptjs");
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true })); // essential to parse body
app.use(cookieSession({
  name: 'session',
  keys: ['I', 'love', 'cookies'],

  maxAge: 24 * 60 * 60 * 1000 // 24 hours
}));


// Databases
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
    password: bcrypt.hashSync("purple-monkey-dinosaur",10),
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
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

// generates json of users
app.get('/users.json', (req, res) => {
  res.json(users);
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
  //destructure req.body
  const { email, password } = req.body;
  
  //checks if user exists
  const user = findUserByEmail(email, users);

  // if user exists AND the input password is the SAME as the hashed password of the user in the users OBJECT
  if (user && bcrypt.compareSync(password, user.password)) {
    // set cookie with user id to the specific user's id
    req.session.user_id = user.id;
    // redirect to /urls
    res.redirect('/urls');
  }

  // otherwise, wrong credentials
  res.status(403).send('Forbidden: You entered the wrong credentials. Please try again.');
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

  const templateVars = { userId: req.session.user_id };
  res.render("register", templateVars);
});

// renders page with that displays urlDatabase
app.post("/register", (req, res) => {
  // destructures email and password from req.body
  const { email, password } = req.body;

  // verifies if user already exists, throws 403 if user is found
  const user = findUserByEmail(email, users);
  if (user) {
    res.status(403).send('Forbidden: Sorry, that user already exists!');
  }

  if (email === '' || password === '') {
    res.status(400).send('Bad Request: Please fill out all fields before submitting!');
  }

  // OTHERWISE, create a new user and add it to users
  const userId = generateRandomString();
  users[userId] = {
    id: userId,
    email: email,
    password: bcrypt.hashSync(password, 10)
  };

  // FINALLY, store userId in the cookies and redirect back to /urls
  req.session.user_id = userId;
  res.redirect('/urls');
});

// renders page with that displays urlDatabase
app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(401).send('Unauthorized: Sorry, you are not logged into Tinyapp!');
  }

  const myUrls = urlsForUser(req.session.user_id, urlDatabase);
  const templateVars = {
    userId: req.session.user_id,
    urlDb: myUrls
  };
  res.render("urls_index", templateVars);
});

// creates new url entries and redirects to individual pages after
app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    res.status(401).send('Unauthorized: Sorry, your are not logged into Tinyapp!'); // this would only show up through something like cURL
  }

  // updated urlDatabase structure
  const userId = req.session.user_id;
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
  
  if (!userId) {
    res.redirect("/login");
  }
  
  const templateVars = { userId };
  res.render("urls_new", templateVars);
});

// renders page for each entry
app.get("/urls/:id", (req, res) => {
  const id = req.params.id;
  
  if (!req.session.user_id) {
    res.status(401).send('Unauthorized: Sorry, you are not logged into Tinyapp!');
  }
  
  if (!urlDatabase[id]) {
    res.status(404).send('Not Found: Shortened URL not found!');
  }
  
  if (urlDatabase[id].userId !== req.session.user_id) {
    res.status(403).send('Forbidden: Sorry, this URL was not created by you!');
  }
  
  const templateVars = {
    id: id,
    longUrl: urlDatabase[id].longUrl,
    userId: req.session.user_id
  };
  
  res.render("urls_show", templateVars);
});

// edits long URL and redirects back to index
app.post("/urls/:id", (req, res) => {
  const myUrls = urlsForUser(req.session.user_id, urlDatabase);
  const id = req.params.id;
  
  if (!myUrls[req.params.id]) {
    res.status(404).send('Not Found: URL ID not found!');
  }

  if (!req.session.user_id) {
    res.status(401).send('Unauthorized: Sorry, you are not logged into Tinyapp!');
  }

  if (urlDatabase[id].userId !== req.session.user_id) {
    res.status(403).send('Forbidden: Sorry, this URL was not created by you!');
  }
  
  urlDatabase[req.params.id].longUrl = req.body.longUrl;
  res.redirect(`/urls`);
});

// deleting entries and redirecting back to index
app.post("/urls/:id/delete", (req, res) => {

  if (!urlDatabase[req.params.id]) {
    res.status(404).send('Not Found: URL ID not found!');
  }

  if (!req.session.user_id) {
    res.status(401).send('Unauthorized: Can not delete, you are not logged into Tinyapp!');
  }
  
  if (urlDatabase[req.params.id].userId !== req.session.user_id) {
    res.status(403).send('Forbidden: Can not delete, this URL was not created by you!'); // should work if you pass a cookie in curl mimicking cookie
  }

  delete urlDatabase[req.params.id];
  res.redirect(`/urls`);
});

// redirects to longUrl when clicking the uniqueID in individual page
app.get("/u/:id", (req, res) => {
  const longUrl = urlDatabase[req.params.id].longUrl;
  res.redirect(longUrl);
});

// initial test page
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});