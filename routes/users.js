// Require express and the User model
const express = require("express");

const { getUser } = require("../controllers/users");
const { protect } = require("../middlewares/auth");
const router = express.Router();

router.get("/:id", protect, getUser);

module.exports = router;
