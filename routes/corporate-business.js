const express = require("express");
const router = express.Router();
const {
  getCorporateBusinesses,
  updateCorporateBusiness,
} = require("../controllers/corporate-business");
const { protect, authorize } = require("../middlewares/auth");
const advancedResults = require("../middlewares/advancedResults");
const CorporateBiz = require("../models/CorporateBiz");

router.get(
  "/",
  protect,
  // authorize("admin"),
  advancedResults(CorporateBiz),
  getCorporateBusinesses
);

router.put("/:id", protect, updateCorporateBusiness);

module.exports = router;
