// Calling third-party packages
const cors = require("cors");
const hpp = require("hpp");
// const xss = require("xss-clean");
const helmet = require("helmet");
const express = require("express");

const app = express();
require("dotenv").config();

// Calling routes
const auth = require("./routes/auth");
const webhooks = require("./routes/webhooks");

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

// Set security headers
app.use(helmet());

// Prevent XSS attacks
// app.use(xss());

// Prevent HTTP Parameter attacks
app.use(hpp());

// Mount routes
app.use("/auth", auth);
app.use("/webhooks", webhooks);

// Mount Built-in middlewares
app.use(notFound);
app.use(errorHandler);

// Server startup
app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
