const express = require('express');
const router = express.Router();
const {
  createTicket,
  getTickets,
  getUserTickets,
  getTicketById,
  addMessage,
  updateTicketStatus,
  updateTicketPriority,
} = require('../controllers/supportTicketController');
const { protect, admin } = require('../middleware/authMiddleware');

router.post('/', protect, createTicket);
router.get('/', protect, admin, getTickets);
router.get('/my-tickets', protect, getUserTickets);
router.get('/:id', protect, getTicketById);
router.post('/:id/message', protect, addMessage);
router.put('/:id/status', protect, admin, updateTicketStatus);
router.put('/:id/priority', protect, admin, updateTicketPriority);

module.exports = router;
