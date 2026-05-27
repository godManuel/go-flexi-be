const mongoose = require("mongoose");

const apiUsageSchema = new mongoose.Schema(
  {
    apiKey: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ApiKey",
    },

    endpoint: String,

    method: String,

    statusCode: Number,

    responseTime: Number,
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("ApiUsage", apiUsageSchema);
