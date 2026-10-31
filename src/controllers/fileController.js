const path = require('path');
const fs = require('fs');
const { files, users, newId } = require('../utils/store');
const storage = require('../utils/storage');
const serializeFile = require('../utils/serializeFile');

// id ni ?id=..., /files/:id yoki body ichidan oladi
function getId(req) {
  return req.params.id || req.query.id || (req.body && req.body.id);
}

function findOwnedFile(req, res) {
  const id = getId(req);
  if (!id) {
    res.status(400).json({ message: 'Video id yuborilmagan (?id=...)' });
    return null;
  }
  const doc = files.find((f) => f.id === String(id));
  if (!doc) {
    res.status(404).json({ message: 'Video topilmadi' });
    return null;
  }
  if (doc.ownerId !== req.user.id) {
    res.status(403).json({ message: 'Bu video sizga tegishli emas' });
    return null;
  }
  return doc;
}

// POST /files  (multipart/form-data)
exports.createFile = async (req, res) => {
  // Fayl maydoni nomi muhim emas: "thumbnail" dan boshqa har qanday fayl — video
  const all = req.files || [];
  const thumb = all.find((f) => f.fieldname === 'thumbnail');
  const video = all.find((f) => f.fieldname !== 'thumbnail');
  const title = (req.body.title || '').trim();

  const cleanup = async () => {
    await storage.safeUnlink(video?.path);
    await storage.safeUnlink(thumb?.path);
  };

  if (!title) {
    await cleanup();
    return res.status(400).json({ message: 'title kiritilishi shart' });
  }
  if (!video) {
    await cleanup();
    return res.status(400).json({ message: 'Video fayl yuborilmadi (maydon nomi: videoFile)' });
  }

  try {
    const v = await storage.saveFile(video.path, 'video');
    const t = thumb ? await storage.saveFile(thumb.path, 'image') : { url: null, publicId: null };
    const now = new Date().toISOString();

    const doc = {
      id: newId(),
      title,
      description: req.body.description || '',
      fileName: video.filename,
      originalName: video.originalname,
      mimeType: video.mimetype,
      size: video.size,
      videoUrl: v.url,
      videoPublicId: v.publicId,
      thumbnailFileName: thumb ? thumb.filename : null,
      thumbnailUrl: t.url,
      thumbnailPublicId: t.publicId,
      ownerId: req.user.id,
      createdAt: now,
      updatedAt: now,
    };
    files.push(doc);

    res.status(201).json({
      message: 'Video muvaffaqiyatli yuklandi',
      file: serializeFile(doc, req),
    });
  } catch (err) {
    await cleanup();
    throw err;
  }
};

// GET /files  (public) — ?page=1&limit=10&search=...
exports.listFiles = async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 100);
  const search = req.query.search ? String(req.query.search).toLowerCase() : '';
  const userId = req.query.userId || req.query.owner || '';

  const filtered = files
    .filter((f) => !search || f.title.toLowerCase().includes(search))
    .filter((f) => !userId || f.ownerId === String(userId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  const total = filtered.length;
  const slice = filtered.slice((page - 1) * limit, page * limit);

  res.json({
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    data: slice.map((d) => serializeFile(d, req)),
  });
};

// GET /files/my
exports.myFiles = async (req, res) => {
  const mine = files
    .filter((f) => f.ownerId === req.user.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  res.json({ total: mine.length, data: mine.map((d) => serializeFile(d, req)) });
};

// PUT /files?id=...  yoki  PUT /files/:id   body: { title, description }
exports.updateFile = async (req, res) => {
  const doc = findOwnedFile(req, res);
  if (!doc) return;

  const { title, description } = req.body || {};
  if (title !== undefined) {
    if (!String(title).trim()) {
      return res.status(400).json({ message: 'title bo\'sh bo\'lmasligi kerak' });
    }
    doc.title = String(title).trim();
  }
  if (description !== undefined) doc.description = String(description);
  doc.updatedAt = new Date().toISOString();

  res.json({ message: 'Video yangilandi', file: serializeFile(doc, req) });
};

// DELETE /files?id=...  yoki  DELETE /files/:id
exports.deleteFile = async (req, res) => {
  const doc = findOwnedFile(req, res);
  if (!doc) return;

  await storage.removeStored(doc);
  files.splice(files.indexOf(doc), 1);
  res.json({ message: 'Video muvaffaqiyatli o\'chirildi' });
};

// GET /download/:fileName  (public)
exports.downloadFile = async (req, res) => {
  const name = path.basename(req.params.fileName);
  const doc = files.find((f) => f.fileName === name || f.thumbnailFileName === name);

  // Avatar rasmlar ham shu endpoint orqali beriladi
  if (!doc) {
    const owner = users.find((u) => u.avatarFileName === name);
    if (!owner) return res.status(404).json({ message: 'Fayl topilmadi' });
    if (owner.avatarUrl) return res.redirect(owner.avatarUrl);
    const absAvatar = path.join(storage.UPLOAD_DIR, name);
    if (!fs.existsSync(absAvatar)) return res.status(404).json({ message: 'Fayl serverda topilmadi' });
    return res.sendFile(absAvatar);
  }

  const isThumb = doc.thumbnailFileName === name;
  const cloudUrl = isThumb ? doc.thumbnailUrl : doc.videoUrl;

  // Cloudinary: yo'naltiramiz
  if (cloudUrl) {
    if (req.query.inline) return res.redirect(cloudUrl);
    return res.redirect(cloudUrl.replace('/upload/', '/upload/fl_attachment/'));
  }

  // Lokal disk
  const abs = path.join(storage.UPLOAD_DIR, name);
  if (!fs.existsSync(abs)) {
    return res.status(404).json({ message: 'Fayl serverda topilmadi' });
  }
  if (req.query.inline) return res.sendFile(abs); // Range so'rovlarini qo'llaydi (video uchun)
  res.download(abs, isThumb ? name : doc.originalName || name);
};
