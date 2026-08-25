const streamifier = require("streamifier");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

const FOLDER =
  process.env.CLOUDINARY_UPLOAD_FOLDER || "dwc-merchant/applications";

function uploadBufferToCloudinary(buffer, originalName) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: FOLDER,
        resource_type: "auto",
        filename_override: originalName,
        use_filename: true,
        unique_filename: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      },
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
}

async function uploadDocuments(files) {
  const uploads = files.map(async (file) => {
    const result = await uploadBufferToCloudinary(
      file.buffer,
      file.originalname,
    );
    return {
      fileName: file.originalname,
      url: result.secure_url,
      publicId: result.public_id,
      resourceType: result.resource_type,
      mimeType: file.mimetype,
    };
  });

  return Promise.all(uploads);
}

function deleteDocument(publicId, resourceType = "auto") {
  return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
}

module.exports = { uploadBufferToCloudinary, uploadDocuments, deleteDocument };
