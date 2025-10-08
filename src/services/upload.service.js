const { uploadImage, uploadMultipleImages, deleteImage } = require('../config/cloudinary');
const { AppError } = require('../middlewares/error.middleware');

/**
 * Upload single image to Cloudinary
 */
const uploadSingleImage = async (file, folder = 'manga') => {
  try {
    if (!file) {
      throw new AppError('No file provided', 400);
    }

    // Check file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new AppError('Invalid file type. Only JPEG, PNG, and WebP are allowed', 400);
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new AppError('File too large. Maximum size is 10MB', 400);
    }

    // Prepare file for upload (support both disk storage and memory storage)
    let fileData;
    if (file.path) {
      // Disk storage
      fileData = file.path;
    } else if (file.buffer) {
      // Memory storage - convert to base64 with data URI
      const base64 = file.buffer.toString('base64');
      fileData = `data:${file.mimetype};base64,${base64}`;
    } else {
      throw new AppError('Invalid file data', 400);
    }

    // Upload to Cloudinary
    const result = await uploadImage(fileData, folder);
    
    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  } catch (error) {
    throw new AppError(error.message || 'Upload failed', error.statusCode || 500);
  }
};

/**
 * Upload multiple images to Cloudinary
 */
const uploadMultiple = async (files, folder = 'manga') => {
  try {
    if (!files || files.length === 0) {
      throw new AppError('No files provided', 400);
    }

    // Validate all files
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    for (const file of files) {
      if (!allowedTypes.includes(file.mimetype)) {
        throw new AppError(`Invalid file type: ${file.originalname}`, 400);
      }
      if (file.size > maxSize) {
        throw new AppError(`File too large: ${file.originalname}`, 400);
      }
    }

    // Prepare files for upload
    const filePaths = files.map(file => {
      if (file.path) {
        return file.path;
      } else if (file.buffer) {
        const base64 = file.buffer.toString('base64');
        return `data:${file.mimetype};base64,${base64}`;
      } else {
        throw new AppError(`Invalid file data: ${file.originalname}`, 400);
      }
    });

    const results = await uploadMultipleImages(filePaths, folder);
    
    return results;
  } catch (error) {
    throw new AppError(error.message || 'Upload failed', error.statusCode || 500);
  }
};

/**
 * Delete image from Cloudinary
 */
const deleteImageFromCloud = async (publicId) => {
  try {
    if (!publicId) {
      throw new AppError('Public ID is required', 400);
    }

    const result = await deleteImage(publicId);
    return result;
  } catch (error) {
    throw new AppError(error.message, error.statusCode || 500);
  }
};

/**
 * Extract public ID from Cloudinary URL
 */
const extractPublicId = (url) => {
  try {
    // Extract public_id from Cloudinary URL
    // Example: https://res.cloudinary.com/cloud/image/upload/v123/folder/image.jpg
    const parts = url.split('/');
    const uploadIndex = parts.indexOf('upload');
    if (uploadIndex === -1) return null;
    
    // Get everything after 'upload/v{version}/'
    const publicIdParts = parts.slice(uploadIndex + 2);
    const publicIdWithExt = publicIdParts.join('/');
    
    // Remove file extension
    const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.'));
    return publicId;
  } catch (error) {
    return null;
  }
};

module.exports = {
  uploadSingleImage,
  uploadMultiple,
  deleteImageFromCloud,
  extractPublicId,
};

