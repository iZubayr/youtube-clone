const fs = require('fs');
const os = require('os');
const path = require('path');

// Avval loyiha ichidagi "uploads" papkasi sinab ko'riladi.
// Agar yozishga ruxsat bo'lmasa (masalan, konteynerda /app), tizimning vaqtinchalik papkasi (/tmp) ishlatiladi.
function resolveUploadDir() {
  const candidates = [
    path.join(__dirname, '..', '..', 'uploads'),
    path.join(os.tmpdir(), 'uploads'),
  ];
  for (const dir of candidates) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      fs.accessSync(dir, fs.constants.W_OK);
      return dir;
    } catch (err) {
      // keyingi variantni sinaymiz
    }
  }
  throw new Error('Yozish mumkin bo\'lgan uploads papkasi topilmadi');
}

const UPLOAD_DIR = resolveUploadDir();

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
