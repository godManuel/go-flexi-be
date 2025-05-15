require("dotenv").config();
const axios = require("axios");

exports.verifySessionId = async (sessionID, amount) => {
  const STRO_PUB_KEY = process.env.STROWALLET_PUBLIC_KEY;

  const url = "https://strowallet.com/api/verifysessionid/";

  const response = await axios.get(url, {
    headers: {
      accept: "application/json",
    },
    params: {
      public_key: STRO_PUB_KEY,
      sessionID,
      amount,
    },
  });

  return response.data;
};
