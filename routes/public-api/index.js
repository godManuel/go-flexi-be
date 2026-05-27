const express = require("express");
const router = express.Router();

router.use("/airtime", require("./airtime"));
// router.use("/data", require("./data"));
// router.use("/electricity", require("./electricity"));
// router.use("/transfer", require("./transfer"));

module.exports = router;
