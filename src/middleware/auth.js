const jwt = require('jsonwebtoken');
const { users } = require('../utils/store');
const config = require('../config');

module.exports = function auth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;
    if (!token) {
      return res.status(401).json({ message: 'Token topilmadi. Avval tizimga kiring.' });
    }

    const payload = jwt.verify(token, config.JWT_SECRET);
    const user = users.find((u) => u.id === payload.id);
    if (!user) {
      // Server qayta ishga tushgan bo'lsa, eski token egasi endi yo'q
      return res
        .status(401)
        .json({ message: 'Foydalanuvchi topilmadi (server qayta ishga tushgan bo\'lishi mumkin). Qayta ro\'yxatdan o\'ting.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token yaroqsiz yoki muddati tugagan' });
  }
};
