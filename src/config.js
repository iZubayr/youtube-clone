const crypto = require('crypto');

// Sozlamalar shu yerda qat'iy yozilgan, environment o'zgaruvchilari kerak emas.
module.exports = {
  // Server ishga tushganda tasodifiy kalit yaratiladi
  // (ma'lumotlar xotirada saqlangani uchun qayta ishga tushganda baribir tozalanadi).
  JWT_SECRET: crypto.randomBytes(32).toString('hex'),
  JWT_EXPIRES_IN: '7d',
  MAX_FILE_MB: 100,
  CORS_ORIGIN: '*',
};
