const express = require('express');
const router = express.Router();
const vrGalleryController = require('../controllers/vrGalleryController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/mine', authMiddleware, vrGalleryController.getUserGalleries);

router.post('/create', authMiddleware, vrGalleryController.createGallery);

router.put('/:id', authMiddleware, vrGalleryController.updateGallery);

router.delete('/:id', authMiddleware, vrGalleryController.deleteGallery);

router.get('/saved', authMiddleware, vrGalleryController.getSavedGalleries);

router.post('/save/:id', authMiddleware, vrGalleryController.saveGallery);
router.post('/unsave/:id', authMiddleware, vrGalleryController.unsaveGallery);

router.get('/name/:name', vrGalleryController.getGalleryByName);
router.get('/public', vrGalleryController.getAllPublicGalleries);
router.get('/user/:userId', vrGalleryController.getGalleriesByUserId);
router.get('/:id', vrGalleryController.getGalleryById);

module.exports = router;