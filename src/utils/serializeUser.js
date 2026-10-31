// Foydalanuvchini mijozga qaytariladigan ko'rinishga o'tkazadi.
// Parol hech qachon qaytarilmaydi; email faqat o'zining javobida ko'rsatiladi.
module.exports = function serializeUser(u, req, { withEmail = false } = {}) {
  const base = `${req.protocol}://${req.get('host')}`;
  const out = {
    id: u.id,
    username: u.username,
    avatarUrl: u.avatarUrl || (u.avatarFileName ? `${base}/download/${u.avatarFileName}?inline=1` : null),
    createdAt: u.createdAt,
  };
  if (withEmail) out.email = u.email || null;
  return out;
};
