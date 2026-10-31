const multer = require('multer');

function notFound(req, res) {
  res.status(404).json({ message: `Topilmadi: ${req.method} ${req.originalUrl}` });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'Fayl juda katta (video uchun maksimum 100 MB, avatar uchun 5 MB)'
        : `Fayl yuklashda xato: ${err.message}`;
    return res.status(400).json({ message });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: 'Bunday ma\'lumot allaqachon mavjud' });
  }

  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({
    message: status >= 500 ? 'Serverda ichki xato' : err.message,
  });
}

module.exports = { notFound, errorHandler };
