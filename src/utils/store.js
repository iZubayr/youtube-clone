const crypto = require('crypto');

// Hamma ma'lumot shu yerda, server xotirasida saqlanadi.
// Server o'chib-yonganda (uxlab uyg'onganda, qayta deploy) tozalanadi.
const users = [];
const files = [];

const newId = () => crypto.randomUUID();

module.exports = { users, files, newId };
