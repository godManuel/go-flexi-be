const crypto = require("crypto");
const ApiKey = require("../models/ApiKey");

module.exports = async (req, res, next) => {
  try {
    const apiKey = req.headers["x-api-key"];

    if (!apiKey) {
      return res.status(401).json({
        success: false,
        message: "API key missing",
      });
    }

    const hashedKey = crypto.createHash("sha256").update(apiKey).digest("hex");

    const keyDoc = await ApiKey.findOne({
      keyHash: hashedKey,
      active: true,
    });

    if (!keyDoc) {
      return res.status(403).json({
        success: false,
        message: "Invalid API key",
      });
    }

    req.apiKey = keyDoc;

    next();
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
