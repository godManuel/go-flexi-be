const express = require("express");
const {
  submitApplication,
  getMyApplications,
  approveApplication,
  rejectApplication,
  listApplications,
  getApprovedListPdf,
  getApprovedListStatus,
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
  upload.fields([
    { name: "signedGrantAcceptanceForm", maxCount: 1 },
    { name: "signedGrantAgreement", maxCount: 1 },
    { name: "signedBeneficiaryDeclaration", maxCount: 1 },
    { name: "signedCodeOfConductAgreement", maxCount: 1 },
    { name: "signedAntiFraudDeclaration", maxCount: 1 },
    { name: "signedConflictOfInterestDeclaration", maxCount: 1 },
    { name: "businessRegistrationDocuments", maxCount: 5 },
  ]),
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

router.get("/approved-list", getApprovedListPdf);
router.get("/approved-list/status", getApprovedListStatus);

router.patch("/:id/approve", protect, authorize("admin"), approveApplication);
router.patch("/:id/reject", protect, authorize("admin"), rejectApplication);

module.exports = router;
