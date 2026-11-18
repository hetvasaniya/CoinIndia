const fs = require('fs');
const path = require('path');

let sharp = null;
try {
  sharp = require('sharp');
} catch (err) {
  console.warn('[ImageOptimizer] sharp module not loaded, falling back to uncompressed images:', err.message);
}

/**
 * Target image constraints for Gemini Vision API:
 * - Max dimension: 1600px (sufficient to resolve tiny mint marks, dates, and hair-strands)
 * - Format: JPEG, quality 85 with mozjpeg optimization
 * - Drastically reduces payload from ~10MB down to ~200-400KB (95%+ reduction)
 * - Preserves original image on disk for marketplace catalog/Cloudinary upload
 */
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 85;

/**
 * Optimizes a single coin photograph for AI analysis.
 *
 * @param {string} filePath - Absolute path to local image file
 * @param {string} originalMimetype - File mime type
 * @returns {Promise<{ buffer: Buffer, mimeType: string, durationMs: number, originalSize: number, optimizedSize: number }>}
 */
const optimizeImageForAi = async (filePath, originalMimetype = 'image/jpeg') => {
  const start = Date.now();

  if (!fs.existsSync(filePath)) {
    throw new Error(`Image file not found at: ${filePath}`);
  }

  const rawBuffer = await fs.promises.readFile(filePath);
  const originalSize = rawBuffer.length;

  // If sharp is not available or file is already very small (< 150KB), return as is
  if (!sharp || originalSize < 150 * 1024) {
    return {
      buffer: rawBuffer,
      mimeType: originalMimetype,
      durationMs: Date.now() - start,
      originalSize,
      optimizedSize: originalSize,
      compressed: false,
    };
  }

  try {
    const optimizedBuffer = await sharp(rawBuffer)
      .rotate() // Auto-orient based on EXIF
      .resize(MAX_DIMENSION, MAX_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .jpeg({
        quality: JPEG_QUALITY,
        mozjpeg: true,
      })
      .toBuffer();

    const durationMs = Date.now() - start;
    const optimizedSize = optimizedBuffer.length;
    const savingsPercent = Math.round(((originalSize - optimizedSize) / originalSize) * 100);

    console.log(
      `[ImageOptimizer] Optimized ${path.basename(filePath)} in ${durationMs}ms: ` +
      `${(originalSize / 1024).toFixed(1)}KB -> ${(optimizedSize / 1024).toFixed(1)}KB (-${savingsPercent}%)`
    );

    return {
      buffer: optimizedBuffer,
      mimeType: 'image/jpeg',
      durationMs,
      originalSize,
      optimizedSize,
      compressed: true,
    };
  } catch (sharpError) {
    console.warn(`[ImageOptimizer] Sharp processing failed for ${filePath}, using original:`, sharpError.message);
    return {
      buffer: rawBuffer,
      mimeType: originalMimetype,
      durationMs: Date.now() - start,
      originalSize,
      optimizedSize: originalSize,
      compressed: false,
    };
  }
};

/**
 * Optimizes multiple coin photographs concurrently.
 *
 * @param {Array<{ localPath: string, mimetype?: string }>} imageFiles
 * @returns {Promise<Array<{ buffer: Buffer, mimeType: string, durationMs: number }>>}
 */
const optimizeBatchImagesForAi = async (imageFiles) => {
  return Promise.all(
    imageFiles.map((file) => optimizeImageForAi(file.localPath, file.mimetype || 'image/jpeg'))
  );
};

module.exports = {
  optimizeImageForAi,
  optimizeBatchImagesForAi,
};
