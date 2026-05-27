const crypto = require("crypto");

const generateApiKey = () => {
  const rawKey = "sk_live_" + crypto.randomBytes(32).toString("hex");

  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

  return {
    rawKey,
    keyHash,
  };
};

module.exports = generateApiKey;
