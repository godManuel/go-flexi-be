const asyncHandler = require("../middlewares/async");
const ErrorResponse = require("../utils/errorResponse");
const axios = require("axios");

// exports.walletTransfer = asyncHandler(async (req, res, next) => {
//   const { amount, currency, receiver, note } = req.body;
//   if (!amount && !currency && !receiver && !note) {
//     return next(new ErrorResponse("Missing fields", 400));
//   }

//   const options = {
//     method: "GET",
//     url: "https://strowallet.com/api/users/transfer/",
//     headers: {
//       accept: "application/json",
//       "content-type": "application/json",
//     },
//     data: {
//       public_key: process.env.STROWALLET_PUBLIC_KEY,
//       amount,
//       currency,
//       receiver,
//       note,
//     },
//   };

//   try {
//     const response = await axios.request(options);
//     console.log(response.data);
//     return response.data;
//   } catch (error) {
//     console.error("Transfer failed:", error.response?.data || error.message);
//     throw error;
//   }
// });
