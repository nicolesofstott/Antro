const express = require('express');
const router = express.Router();
const vrGalleryController = require('../controllers/vrGalleryController');
const authMiddleware = require('../middleware/authMiddleware');

// Public routes
router.get('/public', vrGalleryController.getAllPublicGalleries);
router.get('/user/:userId', vrGalleryController.getGalleriesByUserId);
router.get('/:id', vrGalleryController.getGalleryById);

// Protected routes - require authentication
router.get('/mine', authMiddleware, vrGalleryController.getUserGalleries);
router.post('/create', authMiddleware, vrGalleryController.createGallery);
router.put('/:id', authMiddleware, vrGalleryController.updateGallery);
router.delete('/:id', authMiddleware, vrGalleryController.deleteGallery);

module.exports = router;