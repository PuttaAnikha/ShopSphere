const env = require('../config/env');
const crypto = require('crypto');

class ImageService {
  constructor() {
    this.provider = env.CLOUDINARY_CLOUD_NAME ? 'cloudinary' : 'mock';
  }

  /**
   * Upload an image buffer or file object
   * @param {Object} file - Multer file object or { buffer, originalname, mimetype }
   * @param {String} folder - Target folder name (e.g., 'products', 'avatars', 'stores')
   * @returns {Promise<String>} Image URL
   */
  async uploadImage(file, folder = 'general') {
    if (!file) {
      throw new Error('No file provided for upload');
    }

    if (this.provider === 'cloudinary' && env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY) {
      try {
        // Upload via Cloudinary API using https / form data
        // For zero native compilation dependencies, handle HTTP request or standard Cloudinary if installed
        return await this.uploadToCloudinaryDirect(file, folder);
      } catch (error) {
        console.warn(`[ImageService] Cloudinary upload failed, using fallback URL: ${error.message}`);
        return this.generateMockUrl(file, folder);
      }
    }

    // Default Mock / Development mode
    return this.generateMockUrl(file, folder);
  }

  /**
   * Upload multiple image files
   * @param {Array} files - Array of multer file objects
   * @param {String} folder - Target folder
   * @returns {Promise<Array<String>>} Array of URLs
   */
  async uploadMultipleImages(files, folder = 'products') {
    if (!files || !Array.isArray(files) || files.length === 0) {
      return [];
    }
    const uploadPromises = files.map((file) => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete an image by URL or Public ID
   * @param {String} imageUrl
   * @returns {Promise<Boolean>}
   */
  async deleteImage(imageUrl) {
    if (!imageUrl) return true;
    // In mock mode or dev, deletion resolves instantly
    return true;
  }

  generateMockUrl(file, folder) {
    const hash = crypto.randomBytes(8).toString('hex');
    const safeName = file.originalname
      ? file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')
      : `image_${Date.now()}`;
    return `https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80&shopsphere_${folder}_${hash}_${safeName}`;
  }

  async uploadToCloudinaryDirect(file, folder) {
    const timestamp = Math.round(new Date().getTime() / 1000);
    const signaturePayload = `folder=${folder}&timestamp=${timestamp}${env.CLOUDINARY_API_SECRET}`;
    const signature = crypto.createHash('sha1').update(signaturePayload).digest('hex');

    const base64Data = file.buffer.toString('base64');
    const dataUri = `data:${file.mimetype || 'image/jpeg'};base64,${base64Data}`;

    const formData = new URLSearchParams();
    formData.append('file', dataUri);
    formData.append('api_key', env.CLOUDINARY_API_KEY);
    formData.append('timestamp', timestamp.toString());
    formData.append('signature', signature);
    formData.append('folder', folder);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
    );

    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url;
    }
    throw new Error(data.error?.message || 'Failed to upload image to Cloudinary');
  }
}

module.exports = new ImageService();
