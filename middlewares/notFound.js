const asyncHandler = require("./async.js");

const notFound = asyncHandler(async (req, res, next) => {
  res.status(404).send("Page not found!");
});

module.exports = notFound;
