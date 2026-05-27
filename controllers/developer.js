const ApiKey = require("../models/ApiKey");
const generateApiKey = require("../utils/generateApiKey");

exports.createApiKey = async (req, res) => {
  try {
    const { name } = req.body;

    const generated = generateApiKey();

    const apiKey = await ApiKey.create({
      user: req.user._id,
      name,
      keyHash: generated.keyHash,
    });

    res.status(201).json({
      success: true,

      message: "Copy your API key now. It will not be shown again.",

      data: {
        id: apiKey._id,
        apiKey: generated.rawKey,
      },
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getApiKeys = async (req, res) => {
  try {
    const apiKeys = await ApiKey.find({
      user: req.user._id,
    })
      .sort({ createdAt: -1 })
      .select("-keyHash");

    res.status(200).json({
      success: true,
      count: apiKeys.length,
      data: apiKeys,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.revokeApiKey = async (req, res) => {
  try {
    const apiKey = await ApiKey.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!apiKey) {
      return res.status(404).json({
        success: false,
        message: "API key not found",
      });
    }

    apiKey.active = false;

    await apiKey.save();

    res.status(200).json({
      success: true,
      message: "API key revoked successfully",
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
