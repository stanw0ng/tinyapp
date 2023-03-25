// generates random string for ID
const generateRandomString = () => {
  return Math.random().toString(36).substring(2, 8);
};

// checks if user exists with email param, returns false otherise
const findUserByEmail = (email, database) => {
  for (let id in database) {
    if (email === database[id].email) {
      return database[id];
    }
  }
  return;
};

// returns object with url objects based on userId
const urlsForUser = (id, database) => {
  const myUrls = {}
  for (let dbId in database) {
    if (id === database[dbId].userId) {
      myUrls[dbId] = database[dbId];
    }
  }
  return myUrls;
};

// validates if URL entry is a working link
const isValidUrl = function (url) {
  try {
    new URL(url);
    return true;
  } catch (err) {
    return false;
  }
}

module.exports = {
  generateRandomString,
  findUserByEmail,
  urlsForUser,
  isValidUrl
}