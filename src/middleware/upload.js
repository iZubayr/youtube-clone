const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const { UPLOAD_DIR } = require('../utils/storage');
const config = require('../config');

const maxMb = config.MAX_FILE_MB;

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    cb(null, `${unique}${ext}`);
  },
});

function reject(message) {
  const err = new Error(message);
  err.status = 400;
  return err;
}

// Video yuklash: "thumbnail" maydoni rasm, qolgan har qanday maydon video bo'lishi kerak.
// (.any() — frontend fayl maydoniga qanday nom bergan bo'lsa ham ishlaydi)
function videoFilter(req, file, cb) {
  const isThumb = file.fieldname === 'thumbnail';
  const ok = isThumb ? file.mimetype.startsWith('image/') : file.mimetype.startsWith('video/');
  if (!ok) {
    return cb(reject(isThumb ? 'Thumbnail faqat rasm bo\'lishi kerak' : 'Faqat video fayl yuklash mumkin'));
  }
  cb(null, true);
}

function imageFilter(req, file, cb) {
  if (!file.mimetype.startsWith('image/')) {
    return cb(reject('Avatar faqat rasm bo\'lishi kerak'));
  }
  cb(null, true);
}

const videoUpload = multer({
  storage,
  fileFilter: videoFilter,
  limits: { fileSize: maxMb * 1024 * 1024, files: 2 },
}).any();

// Ro'yxatdan o'tishdagi avatar (ixtiyoriy). JSON so'rovlarni multer o'tkazib yuboradi.
const avatarUpload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
}).any();

module.exports = { videoUpload, avatarUpload };
