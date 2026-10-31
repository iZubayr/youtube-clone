const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { users, newId } = require('../utils/store');
const storage = require('../utils/storage');
const serializeUser = require('../utils/serializeUser');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function signToken(user) {
  return jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

// POST /register
// JSON yoki multipart/form-data: username, password, [email], [avatar rasm — istalgan maydon nomi]
exports.register = async (req, res) => {
  const avatar = (req.files || [])[0];
  const fail = async (status, message) => {
    await storage.safeUnlink(avatar && avatar.path);
    return res.status(status).json({ message });
  };

  const { username, password, email } = req.body || {};

  if (!username || String(username).trim().length < 3) {
    return fail(400, 'username kamida 3 ta belgidan iborat bo\'lishi kerak');
  }
  if (!password || String(password).length < 4) {
    return fail(400, 'Parol kamida 4 ta belgidan iborat bo\'lishi kerak');
  }
  if (email && !EMAIL_RE.test(email)) {
    return fail(400, 'Email noto\'g\'ri');
  }

  const cleanName = String(username).trim();
  const cleanEmail = email ? String(email).toLowerCase().trim() : null;

  const exists = users.some(
    (u) =>
      u.username.toLowerCase() === cleanName.toLowerCase() ||
      (cleanEmail && u.email === cleanEmail)
  );
  if (exists) {
    return fail(409, 'Bu username yoki email band');
  }

  let saved = { url: null, publicId: null };
  try {
    if (avatar) saved = await storage.saveFile(avatar.path, 'image');
  } catch (err) {
    await storage.safeUnlink(avatar && avatar.path);
    throw err;
  }

  const user = {
    id: newId(),
    username: cleanName,
    email: cleanEmail,
    password: await bcrypt.hash(String(password), 10),
    avatarFileName: avatar ? avatar.filename : null,
    avatarUrl: saved.url,
    avatarPublicId: saved.publicId,
    createdAt: new Date().toISOString(),
  };
  users.push(user);

  res.status(201).json({
    message: 'Foydalanuvchi muvaffaqiyatli yaratildi',
    token: signToken(user),
    user: serializeUser(user, req, { withEmail: true }),
  });
};

// POST /login   body: { username, password }  (email ham qabul qilinadi)
exports.login = async (req, res) => {
  const { username, email, password } = req.body || {};
  const login = String(username || email || '').trim().toLowerCase();
  if (!login || !password) {
    return res.status(400).json({ message: 'Username va parol kiritilishi shart' });
  }

  const user = users.find((u) => u.username.toLowerCase() === login || u.email === login);
  const ok = user && (await bcrypt.compare(String(password), user.password));
  if (!ok) {
    return res.status(401).json({ message: 'Username yoki parol noto\'g\'ri' });
  }

  res.json({
    message: 'Muvaffaqiyatli kirildi',
    token: signToken(user),
    user: serializeUser(user, req, { withEmail: true }),
  });
};
