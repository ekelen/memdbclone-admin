/**
 * Line up one-line console messages
 */
const logging = {
  print: (
    message = "",
    value = "",
    options = { messageWidth: 30, divider: true }
  ) => {
    const { messageWidth, divider } = options;
    try {
      const len = message.length;
      const needsNewLine = len >= messageWidth;
      const spaces = Array(needsNewLine ? messageWidth : messageWidth - len)
        .fill(" ")
        .join("");
      if (!needsNewLine) {
        console.log(`${message}:${spaces}`, value);
      } else {
        console.log(`${message}:`);
        console.log(`${spaces}`, value);
      }
    } catch (_) {
      console.log(`message:`, value);
    }
    divider && console.log("-----------------------------------");
  },
};

module.exports = { logging };
