const express = require('express');
const asyncHandler = require('../utils/asyncHandler');
const auth = require('../middleware/auth');
const { videoUpload, avatarUpload } = require('../middleware/upload');
const authCtrl = require('../controllers/authController');
const userCtrl = require('../controllers/userController');
const fileCtrl = require('../controllers/fileController');

const router = express.Router();

// Auth
router.post('/register', avatarUpload, asyncHandler(authCtrl.register));
router.post('/login', asyncHandler(authCtrl.login));

// Users
router.get('/users', asyncHandler(userCtrl.listUsers));

// Files
router.get('/files/my', auth, asyncHandler(fileCtrl.myFiles)); // /files/:id dan oldin turishi shart
router.get('/files', asyncHandler(fileCtrl.listFiles));
router.post('/files', auth, videoUpload, asyncHandler(fileCtrl.createFile));
router.put(['/files', '/files/:id'], auth, asyncHandler(fileCtrl.updateFile));
router.delete(['/files', '/files/:id'], auth, asyncHandler(fileCtrl.deleteFile));

// Download (public)
router.get('/download/:fileName', asyncHandler(fileCtrl.downloadFile));

module.exports = router;
