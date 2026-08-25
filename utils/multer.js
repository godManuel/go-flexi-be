const multer = require("multer");
const path = require("path");

const storage = multer.memoryStorage();

const allowedTypes = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx"];

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedTypes.includes(ext)) return cb(null, true);
  cb(new Error("Unsupported file type for DWC document upload"));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

module.exports = upload;
