// services/stroWalletService.js
const axios = require("axios");

exports.verifySessionId = async (sessionId, amount) => {
  const url = "https://strowallet.com/api/verifysessionid/";

  const response = await axios.get(url, {
    headers: {
      accept: "application/json",
    },
    params: {
      public_key: process.env.STROWALLET_PUBLIC_KEY,
      sessionId,
      amount,
    },
  });

  return response.data;
};
