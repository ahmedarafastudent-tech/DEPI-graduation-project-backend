const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const {
  createTaxRate,
  getTaxRates,
  getTaxRateById,
  updateTaxRate,
  deleteTaxRate,
  calculateTax,
} = require('../controllers/taxController');

// Public route for tax calculation
router.post('/calculate', calculateTax);

// Protected admin routes
router.use(protect);
router.use(admin);

router.route('/').post(createTaxRate).get(getTaxRates);
router.route('/:id').get(getTaxRateById).put(updateTaxRate).delete(deleteTaxRate);

module.exports = router;
