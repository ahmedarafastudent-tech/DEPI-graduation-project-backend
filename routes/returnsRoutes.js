const express = require('express');
const router = express.Router();
const {
  createReturn,
  getReturns,
  getUserReturns,
  getReturnById,
  updateReturnStatus,
} = require('../controllers/returnController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, createReturn);
router.get('/', protect, admin, getReturns);
router.get('/my-returns', protect, getUserReturns);
router.get('/:id', protect, getReturnById);
router.put('/:id', protect, admin, updateReturnStatus);

module.exports = router;
