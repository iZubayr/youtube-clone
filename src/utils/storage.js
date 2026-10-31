const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Cloudinary sozlangan bo'lsa fayllar bulutda saqlanadi (Render uchun shart),
// aks holda lokal "uploads" papkasida (faqat kompyuterda test uchun).
const hasParts =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;
const useCloud = Boolean(process.env.CLOUDINARY_URL || hasParts);

if (hasParts) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

if (!useCloud) {
  console.warn(
    'Cloudinary sozlanmagan: videolar lokal "uploads" papkasida saqlanadi ' +
      '(server qayta ishga tushganda tozalanadi).'
  );
}

function safeUnlink(p) {
  if (!p) return Promise.resolve();
  return fs.promises.unlink(p).catch(() => {});
}

/**
 * Multer saqlagan faylni yakuniy joyga o'tkazadi.
 * Cloud rejimida Cloudinary'ga yuklab, lokal nusxani o'chiradi.
 */
async function saveFile(localPath, resourceType) {
  if (!useCloud) return { url: null, publicId: null };

  const result = await cloudinary.uploader.upload(localPath, {
    resource_type: resourceType, // 'video' | 'image'
    folder: 'youtube-clone',
  });
  await safeUnlink(localPath);
  return { url: result.secure_url, publicId: result.public_id };
}

async function removeCloud(publicId, resourceType) {
  if (!publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error('Cloudinary o\'chirishda xato:', err.message);
  }
}

/** Bazadagi File hujjatiga tegishli barcha fayllarni o'chiradi */
async function removeStored(doc) {
  await removeCloud(doc.videoPublicId, 'video');
  await removeCloud(doc.thumbnailPublicId, 'image');
  await safeUnlink(doc.fileName && path.join(UPLOAD_DIR, path.basename(doc.fileName)));
  if (doc.thumbnailFileName) {
    await safeUnlink(path.join(UPLOAD_DIR, path.basename(doc.thumbnailFileName)));
  }
}

module.exports = { UPLOAD_DIR, useCloud, saveFile, removeStored, safeUnlink };
