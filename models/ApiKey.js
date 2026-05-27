const mongoose = require("mongoose");

const apiKeySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    name: String,

    keyHash: String,

    // plan: {
    //   type: String,
    //   enum: ["free", "pro", "enterprise"],
    //   default: "free",
    // },

    // permissions: [String],

    active: {
      type: Boolean,
      default: true,
    },

    lastUsedAt: Date,

    // requestsToday: {
    //   type: Number,
    //   default: 0,
    // },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("ApiKey", apiKeySchema);
