const cloudinary = require('cloudinary').v2;
const AppError = require('./appError');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadImage = async (file) => {
  try {
    if (!file.mimetype.startsWith('image')) {
      throw new AppError('Please upload an image file', 400);
    }

    const maxSize = 1024 * 1024; // 1MB
    if (file.size > maxSize) {
      throw new AppError('Image must be smaller than 1MB', 400);
    }

    const result = await cloudinary.uploader.upload(file.tempFilePath, {
      folder: 'ecommerce',
      width: 1000,
      crop: 'scale',
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    throw new AppError(
      error.message || 'Error uploading image to cloud storage',
      500
    );
  }
};

const deleteImage = async (publicId) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    throw new AppError('Error deleting image from cloud storage', 500);
  }
};

module.exports = {
  uploadImage,
  deleteImage,
};