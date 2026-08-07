require("dotenv").config();
// Calling third-party packages
const cors = require("cors");
const hpp = require("hpp");
// const xss = require("xss-clean");
const helmet = require("helmet");
const express = require("express");

const app = express();

// Calling routes
const auth = require("./routes/auth");
const webhooks = require("./routes/webhooks");
const transfer = require("./routes/transfer");
const transactions = require("./routes/transactions");
const users = require("./routes/users");
const kyc = require("./routes/kyc");
const data = require("./routes/data");
const airtime = require("./routes/airtime");
const cableTv = require("./routes/cableTv");
const electricity = require("./routes/electricity");
const virtualCard = require("./routes/virtual-card");
const corporateBusiness = require("./routes/corporate-business");

const path = require("path");

// Calling built-in packages
const errorHandler = require("./middlewares/error");
const notFound = require("./middlewares/notFound");

// Assign PORT value
const PORT = process.env.PORT;

// import connectDB from "./config/db.js";
const connectDB = require("./config/db");
connectDB();

// CORS Middleware
app.use(cors());

// Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Set security headers
app.use(helmet());

// Prevent XSS attacks
// app.use(xss());

// Prevent HTTP Parameter attacks
app.use(hpp());

/*
|--------------------------------------------------------------------------
| Existing Internal Routes
|--------------------------------------------------------------------------
*/
app.use("/auth", auth);
app.use("/webhooks", webhooks);
app.use("/transfer", transfer);
app.use("/transactions", transactions);
app.use("/users", users);
app.use("/kyc", kyc);
// app.use("/data", data);
// app.use("/airtime", airtime);
app.use("/cable-subscription", cableTv);
app.use("/electricity", electricity);
app.use("/virtual-card", virtualCard);
app.use("/corporate-businesses", corporateBusiness);

/*
|--------------------------------------------------------------------------
| Developer API
|--------------------------------------------------------------------------
*/
app.use("/developer", require("./routes/developer"));
app.use("/developer/v1", require("./routes/public-api"));

// Mount Built-in middlewares
app.use(notFound);
app.use(errorHandler);

// Server startup
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
