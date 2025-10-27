const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getCart,
  addItem,
  updateItemQty,
  removeItem,
  clearCart,
} = require('../controllers/cartController');

router
  .route('/')
  .get(protect, getCart)
  .post(protect, addItem)
  .delete(protect, clearCart);
router
  .route('/item/:productId')
  .put(protect, updateItemQty)
  .delete(protect, removeItem);

module.exports = router;
