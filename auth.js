const validatePassword = (password) => {
  if (password !== process.env.MEMDB_CLONE_KEY) {
    return "Bad password.\n. Try again or Ctrl + c to quit.";
  } else {
    return true;
  }
};

module.exports = passwordPrompt = {
  type: "password",
  message: "Enter API key",
  name: "password",
  default: process.env.MEMDB_CLONE_KEY,
  validate: validatePassword,
};
