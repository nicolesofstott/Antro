const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const fileController = require('../controllers/fileController');
const { uploadFile, uploadCV, uploadPortfolio } = require('../middleware/uploadMiddleware');


router.get('/', authMiddleware, fileController.getFiles);

router.post('/upload', authMiddleware, uploadFile, fileController.uploadFileHandler);
router.post('/uploadCV', authMiddleware, uploadCV, fileController.uploadCVHandler);
router.post('/uploadPortfolio', authMiddleware, uploadPortfolio, fileController.uploadPortfolioHandler);

router.delete('/:id', authMiddleware, fileController.deleteFile);

router.get('/user/:userId', fileController.getFilesByUserId);

router.post('/create-missing-records', authMiddleware, fileController.createMissingFileRecords);

module.exports = router;