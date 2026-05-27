const ApiUsage = require("../models/ApiUsage");

module.exports = async (req, res, next) => {
  const start = Date.now();

  res.on("finish", async () => {
    await ApiUsage.create({
      apiKey: req.apiKey._id,

      endpoint: req.originalUrl,

      method: req.method,

      statusCode: res.statusCode,

      responseTime: Date.now() - start,
    });
  });

  next();
};
