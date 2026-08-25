const { v4: uuidv4 } = require("uuid");

/**
 * Step 3: Internal USD account number generated on approval.
 */
function generateUsdAccountNumber() {
  const random = Math.floor(1000000000 + Math.random() * 8999999999);
  return `USD-${random}`;
}

/**
 * Step 6: Unique claim number issued when the claim button is clicked.
 */
function generateClaimNumber() {
  return `CLM-${uuidv4().split("-")[0].toUpperCase()}`;
}

/**
 * Step 8: One-time Withdrawal Authorization Code.
 */
function generateAuthCode() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit code
}

module.exports = {
  generateUsdAccountNumber,
  generateClaimNumber,
  generateAuthCode,
};
