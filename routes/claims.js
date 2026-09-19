const express = require("express");
const {
  getClaimStatus,
  createClaim,
  submitClaimDetails,
  listClaims,
  approveClaim,
  declineClaim,
} = require("../controllers/claims");
const { protect, authorize } = require("../middlewares/auth");

const router = express.Router();

router.use(protect);

router.get("/status", getClaimStatus);
router.post("/", createClaim);
router.post("/:id/submit", submitClaimDetails);
router.get("/", authorize("admin"), listClaims);
router.patch("/:id/approve", authorize("admin"), approveClaim);
router.patch("/:id/decline", authorize("admin"), declineClaim);

module.exports = router;
