// Setup
const express = require("express");
const cookieParser = require('cookie-parser');
const app = express();
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true })); // essential to parse body
app.use(cookieParser()); // essential to parse cookie


// Databases
const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

// generates random string for ID
const generateRandomString = function() {
  return Math.random().toString(36).substring(2, 8);
};

// checks if user exists with email param, returns false otherise
const findUserByEmail = (email) => {
  for (let userId in users) {
    if (email === users[userId].email) {
      return users[userId];
    }
  }
  return false;
};

/* app.get("/", (req, res) => {
  res.send("Hello!");
}); */

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});

// generates json of urlDatabase
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// generates json of users, should have new registered entries if working
app.get('/users.json', (req, res) => {
  res.json(users);
});

// renders login page
app.get("/login", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  }

  const templateVars = { userId: null }
  res.render('login', templateVars);
});

// displays userID in header upon clicking login
app.post("/login", (req, res) => {
  //destructure req.body
  const { email, password } = req.body;
  
  //checks if user exists
  const user = findUserByEmail(email);

  // if user exists AND the password is the SAME as the password of the user in the users OBJECT
  if (user && user.password === password) {
    // set cookie with user id to the specific user's id
    res.cookie('user_id', user.id);
    // redirect to /urls
    res.redirect('/urls');
  }

  // otherwise, wrong credentials
  res.status(403).send('Sorry, wrong credentials. Please try again.');
});

// clears cookie upon log out
app.post("/logout", (req, res) => {
  res.clearCookie('user_id').redirect('/login')
});

// renders page with that displays urlDatabase
app.get("/register", (req, res) => {
  if (req.cookies["user_id"]) {
    res.redirect("/urls");
  }

  const templateVars = { userId: req.cookies['user_id'] }
  res.render("register", templateVars);
});

// renders page with that displays urlDatabase
app.post("/register", (req, res) => {
  // destructures email and password from req.body
  const { email, password } = req.body

  // verifies if user already exists, throws 403 if user is found
  user = findUserByEmail(email);
  if (user) {
    res.status(403).send('Sorry, that user already exists!');
  }

  if (email === '' || password === '') {
    res.status(400).send('Please fill out all fields before submitting!');
  }

  // OTHERWISE, create a new user and add it to users
  const userId = generateRandomString();
  users[userId] = {
    id: userId,
    email: email,
    password: password
  }

  // FINALLY, store userId in the cookies and redirect back to /urls
  res.cookie('user_id', userId).redirect('/urls')
});

// renders page with that displays urlDatabase
app.get("/urls", (req, res) => {
  const templateVars = { 
    userId: req.cookies["user_id"],
    urls: urlDatabase
   };
  res.render("urls_index", templateVars);
});

// renders a page for creating new entires, must go BEFORE /urls/:id
app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  
  if (!userId) {
    res.redirect("/login");
  }
  
  const templateVars = { userId };
  res.render("urls_new", templateVars);
});

// creates new url entries and redirects to individual pages after
app.post("/urls", (req, res) => {
  if (!req.cookies["user_id"]) {
    res.status(401).send('Sorry, not logged into Tinyapp!'); // this would only show up through something like cURL
  }

  const userId = req.cookies["user_id"];
  const uniqueId = generateRandomString();
  urlDatabase[uniqueId] = {
    longURL: req.body.longURL,
    userId: userId
  };
  res.redirect(`/urls/${uniqueId}`);
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
  const id = req.params.id;

  if (!urlDatabase[id]) {
    res.status(404).send('Shortened URL not found!');
  }

  const templateVars = { 
    id: id,
    longURL: urlDatabase[id],
    userId: req.cookies["user_id"]
  };
  res.render("urls_show", templateVars);
});

// redirects to longURL when clicking the uniqueID in individual page
app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL); //because urls/:id makes a longURL key value pair
});

/* // initial test page
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
}); */