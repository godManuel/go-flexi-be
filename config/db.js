const mongoose = require("mongoose");
require("dotenv").config();

// Mongoose Strict Query
mongoose.set("strictQuery", false);

// Connecting to MongoDB
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log(`MongoDB connected on: ${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

module.exports = connectDB;
