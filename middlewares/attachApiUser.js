const User = require("../models/User");

module.exports = async (req, res, next) => {
  try {
    const user = await User.findById(req.apiKey.user);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;

    next();
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
