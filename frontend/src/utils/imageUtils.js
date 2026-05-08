import imageCompression from 'browser-image-compression';

/**
 * Compresses an image file if it's larger than a certain size
 * @param {File} imageFile - The image file to compress
 * @returns {Promise<File>} - The compressed image file
 */
export const compressImage = async (imageFile) => {
  // If file is less than 1MB, don't compress (or set your own threshold)
  if (imageFile.size < 1024 * 1024) {
    return imageFile;
  }

  const options = {
    maxSizeMB: 1,            // Target size in MB
    maxWidthOrHeight: 1920, // Max dimensions
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(imageFile, options);
    console.log(`Original size: ${imageFile.size / 1024 / 1024} MB`);
    console.log(`Compressed size: ${compressedFile.size / 1024 / 1024} MB`);
    return compressedFile;
  } catch (error) {
    console.error('Image compression failed:', error);
    return imageFile; // Return original if compression fails
  }
};
