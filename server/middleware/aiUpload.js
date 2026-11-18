const multer = require('multer');
const path = require('path');
const fs = require('fs');

const tempUploadDir = path.join(__dirname, '..', 'uploads', 'temp-ai');

if (!fs.existsSync(tempUploadDir)) {
  fs.mkdirSync(tempUploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempUploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `ai-coin-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp'];

  if (allowedMimeTypes.includes(file.mimetype) && allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: ${file.originalname}. Only JPG, PNG, and WebP images are allowed.`
      ),
      false
    );
  }
};

const aiUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB per image
    files: 25, // Up to 25 images per bulk batch
  },
});

/**
 * Flexible upload handler supporting single or multiple files
 * uploaded under 'images', 'image', or any field name.
 */
const handleAiUpload = (maxFiles = 25) => {
  return (req, res, next) => {
    aiUpload.any()(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 10MB per image.' });
          }
          if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ message: `Too many files. Maximum allowed is ${maxFiles}.` });
          }
          return res.status(400).json({ message: `Upload error: ${err.message}` });
        }
        return res.status(400).json({ message: err.message || 'File upload failed' });
      }

      if (req.files && req.files.length > maxFiles) {
        return res.status(400).json({ message: `Too many files. Maximum allowed is ${maxFiles}.` });
      }

      next();
    });
  };
};

module.exports = {
  aiUpload,
  handleAiUpload,
  tempUploadDir,
};
