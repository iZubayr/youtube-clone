const { users } = require('./store');
const serializeUser = require('./serializeUser');

// Saqlangan video yozuvini mijozga qaytariladigan ko'rinishga o'tkazadi
module.exports = function serializeFile(f, req) {
  const base = `${req.protocol}://${req.get('host')}`;
  const owner = users.find((u) => u.id === f.ownerId);

  return {
    id: f.id,
    title: f.title,
    description: f.description,
    fileName: f.fileName,
    originalName: f.originalName,
    mimeType: f.mimeType,
    size: f.size, // bayt
    // <video src="..."> uchun
    videoUrl: f.videoUrl || `${base}/download/${f.fileName}?inline=1`,
    thumbnailUrl:
      f.thumbnailUrl ||
      (f.thumbnailFileName ? `${base}/download/${f.thumbnailFileName}?inline=1` : null),
    // yuklab olish uchun
    downloadUrl: `${base}/download/${f.fileName}`,
    owner: owner ? serializeUser(owner, req) : null,
    createdAt: f.createdAt,
    updatedAt: f.updatedAt,
  };
};
