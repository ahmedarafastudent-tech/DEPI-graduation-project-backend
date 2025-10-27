const express = require('express');
const router = express.Router();
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  moveToCart,
} = require('../controllers/wishlistController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, getWishlist);
router.post('/', protect, addToWishlist);
router.delete('/', protect, clearWishlist);
router.delete('/:productId', protect, removeFromWishlist);
router.post('/:productId/move-to-cart', protect, moveToCart);

module.exports = router;
