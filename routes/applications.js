const express = require("express");
const {
  submitApplication,
  getMyApplications,
  approveApplication,
  rejectApplication,
  listApplications,
} = require("../controllers/applications");
const {
  protect,
  authorize,
  requireDwcMerchant,
} = require("../middlewares/auth");
const upload = require("../utils/multer");

const router = express.Router();

router.post(
  "/",
  protect,
  authorize("user"),
  requireDwcMerchant,
  upload.array("documents", 10),
  submitApplication,
);

router.get("/", listApplications);

router.get(
  "/me",
  protect,
  authorize("user"),
  requireDwcMerchant,
  getMyApplications,
);

router.patch("/:id/approve", protect, authorize("admin"), approveApplication);
router.patch("/:id/reject", protect, authorize("admin"), rejectApplication);

module.exports = router;
