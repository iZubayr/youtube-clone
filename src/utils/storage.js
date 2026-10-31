const fs = require('fs');
const path = require('path');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Fayllar faqat serverdagi lokal "uploads" papkasida saqlanadi
// (server qayta ishga tushganda tozalanadi).
const useCloud = false;

function safeUnlink(p) {
  if (!p) return Promise.resolve();
  return fs.promises.unlink(p).catch(() => {});
}

/**
 * Multer saqlagan fayl lokal "uploads" papkasida qoladi.
 */
async function saveFile() {
  return { url: null, publicId: null };
}

/** Bazadagi File hujjatiga tegishli barcha fayllarni o'chiradi */
async function removeStored(doc) {
  await safeUnlink(doc.fileName && path.join(UPLOAD_DIR, path.basename(doc.fileName)));
  if (doc.thumbnailFileName) {
    await safeUnlink(path.join(UPLOAD_DIR, path.basename(doc.thumbnailFileName)));
  }
}

module.exports = { UPLOAD_DIR, useCloud, saveFile, removeStored, safeUnlink };
