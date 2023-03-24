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
  return null;
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

module.exports = {
  generateRandomString,
  findUserByEmail,
  urlsForUser,
}