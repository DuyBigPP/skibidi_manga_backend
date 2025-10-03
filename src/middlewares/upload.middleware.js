const multer = require('multer');
const path = require('path');
const { AppError } = require('./error.middleware');

// Configure multer for memory storage (for Cloudinary)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = /jpeg|jpg|png|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new AppError('Only image files (JPEG, PNG, WebP) are allowed!', 400));
  }
};

// Single file upload
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
  fileFilter: fileFilter,
});

// Multiple files upload
const uploadMultiple = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 50, // Max 50 files at once
  },
  fileFilter: fileFilter,
});

module.exports = {
  uploadSingle: upload.single('image'),
  uploadMultiple: uploadMultiple.array('images', 50),
  uploadFields: upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
  ]),
};

