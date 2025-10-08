const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
// Support both CLOUDINARY_URL and individual env vars
if (process.env.CLOUDINARY_URL) {
  // Parse CLOUDINARY_URL: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
  const urlMatch = process.env.CLOUDINARY_URL.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
  if (urlMatch) {
    const config = {
      cloud_name: urlMatch[3],
      api_key: urlMatch[1],
      api_secret: urlMatch[2],
      secure: true,
    };
    cloudinary.config(config);
    console.log('✅ Cloudinary configured with cloud_name:', config.cloud_name);
  } else {
    console.error('❌ Invalid CLOUDINARY_URL format');
  }
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log('✅ Cloudinary configured with cloud_name:', process.env.CLOUDINARY_CLOUD_NAME);
}
/**
 * Upload image to Cloudinary
 * @param {string} filePath - Path to file or base64 string
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<object>} Upload result with secure_url
 */
const uploadImage = async (filePath, folder = 'manga') => {
  try {
    console.log('🔄 Uploading to Cloudinary, folder:', folder);
    console.log('📄 File data type:', typeof filePath);
    console.log('📄 File data preview:', filePath.substring(0, 100));
    
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'image',
      timeout: 120000, // 2 minutes timeout
      // Optimize for faster upload
      transformation: [
        { width: 2000, height: 2000, crop: 'limit' }, // Limit max dimensions
        { quality: 'auto:good' }, // Good quality but compressed
        { fetch_format: 'auto' }
      ],
      eager_async: true, // Process transformations in background
    });
    
    console.log('✅ Upload successful:', result.secure_url);
    return result;
  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    throw new Error(`Cloudinary upload failed: ${error.message || JSON.stringify(error)}`);
  }
};

/**
 * Upload multiple images
 * @param {Array<string>} filePaths - Array of file paths
 * @param {string} folder - Cloudinary folder name
 * @returns {Promise<Array<string>>} Array of secure URLs
 */
const uploadMultipleImages = async (filePaths, folder = 'manga') => {
  try {
    const uploadPromises = filePaths.map(file => uploadImage(file, folder));
    const results = await Promise.all(uploadPromises);
    return results.map(result => result.secure_url);
  } catch (error) {
    throw new Error(`Multiple upload failed: ${error.message}`);
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID of the image
 * @returns {Promise<object>} Deletion result
 */
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Cloudinary delete failed: ${error.message}`);
  }
};

module.exports = {
  cloudinary,
  uploadImage,
  uploadMultipleImages,
  deleteImage,
};
