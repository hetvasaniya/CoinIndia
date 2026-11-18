const fs = require('fs');
const cloudinary = require('../config/cloudinary');

/**
 * Upload local file or buffer to Cloudinary
 * @param {string} localFilePath - Path on disk to the image
 * @param {string} folder - Cloudinary target folder (default: 'coin_india')
 */
const uploadToCloudinary = async (localFilePath, folder = 'coin_india') => {
  if (!fs.existsSync(localFilePath)) {
    throw new Error(`File not found for Cloudinary upload: ${localFilePath}`);
  }

  const result = await cloudinary.uploader.upload(localFilePath, {
    folder,
    resource_type: 'image',
  });

  // Clean up local temp file after successful upload
  try {
    fs.unlinkSync(localFilePath);
  } catch (err) {
    console.warn(`Failed to unlink temporary file: ${localFilePath}`, err.message);
  }

  return {
    url: result.secure_url,
    publicId: result.public_id,
  };
};

/**
 * Delete an asset from Cloudinary
 * @param {string} publicId
 */
const deleteFromCloudinary = async (publicId) => {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.warn(`Failed to delete Cloudinary asset ${publicId}:`, err.message);
  }
};

module.exports = {
  uploadToCloudinary,
  deleteFromCloudinary,
};
