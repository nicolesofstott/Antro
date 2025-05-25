const express = require('express');
const router = express.Router();
const { 
  createOpportunity, 
  deleteOpportunity, 
  getAllOpportunities,
  saveOpportunity,
  unsaveOpportunity,
  getSavedOpportunities 
} = require('../controllers/opportunityController');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/', authMiddleware, createOpportunity);
router.get('/', getAllOpportunities);
router.delete('/:id', authMiddleware, deleteOpportunity);

router.post('/save', authMiddleware, saveOpportunity);
router.delete('/unsave/:id', authMiddleware, unsaveOpportunity);
router.get('/saved', authMiddleware, getSavedOpportunities);

module.exports = router;