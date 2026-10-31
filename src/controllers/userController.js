const { users, files } = require('../utils/store');
const serializeUser = require('../utils/serializeUser');

// GET /users  — chap menyudagi "kanallar" uchun (email ko'rsatilmaydi)
exports.listUsers = async (req, res) => {
  const list = [...users]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((u) => ({
      ...serializeUser(u, req),
      videosCount: files.filter((f) => f.ownerId === u.id).length,
    }));
  res.json({ total: list.length, data: list });
};
