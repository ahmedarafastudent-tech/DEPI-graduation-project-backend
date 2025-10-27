const asyncHandler = require('express-async-handler');
const SupportTicket = require('../models/supportTicketModel');
const sendEmail = require('../utils/sendEmail');

// @desc    Create support ticket
// @route   POST /api/support
// @access  Private
const createTicket = asyncHandler(async (req, res) => {
  const { subject, message, priority, category, orderId } = req.body;

  const ticket = await SupportTicket.create({
    user: req.user._id,
    subject,
    messages: [{
      sender: req.user._id,
      message: message,
      timestamp: new Date()
    }],
    status: 'open',
    priority,
    category,
    relatedOrder: orderId
  });

  // Send confirmation email
  try {
    await sendEmail({
      to: req.user.email,
      subject: `Support Ticket Created - ${ticket._id}`,
      html: `
        <h1>Support Ticket Created</h1>
        <p>Your support ticket has been created successfully.</p>
        <p><strong>Ticket ID:</strong> ${ticket._id}</p>
        <p><strong>Subject:</strong> ${subject}</p>
        <p><strong>Priority:</strong> ${priority}</p>
        <p>We will respond to your inquiry as soon as possible.</p>
      `
    });
  } catch (error) {
    // Log the error but don't fail the request
    console.error('Failed to send confirmation email:', error);
  }

  res.status(201).json(ticket);
});

// @desc    Get all tickets
// @route   GET /api/support
// @access  Private/Admin
const getTickets = asyncHandler(async (req, res) => {
  const { status, priority, category } = req.query;
  
  let query = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (category) query.category = category;

  const tickets = await SupportTicket.find(query)
    .populate('user', 'name email')
    .populate('messages.sender', 'name email isAdmin')
    .sort('-createdAt');

  res.json(tickets);
});

// @desc    Get user tickets
// @route   GET /api/support/my-tickets
// @access  Private
const getUserTickets = asyncHandler(async (req, res) => {
  const tickets = await SupportTicket.find({ user: req.user._id })
    .populate('messages.sender', 'name email isAdmin')
    .sort('-createdAt');

  res.json(tickets);
});

// @desc    Get ticket by ID
// @route   GET /api/support/:id
// @access  Private
const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await SupportTicket.findById(req.params.id)
    .populate('user', 'name email')
    .populate('messages.sender', 'name email isAdmin');

  if (ticket) {
    // Check if user is authorized to view this ticket
    if (!req.user.isAdmin && ticket.user._id.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }
    res.json(ticket);
  } else {
    res.status(404);
    throw new Error('Ticket not found');
  }
});

// @desc    Add message to ticket
// @route   POST /api/support/:id/message
// @access  Private
const addMessage = asyncHandler(async (req, res) => {
  const { message } = req.body;
  const ticket = await SupportTicket.findById(req.params.id)
    .populate('user', 'email');

  if (ticket) {
    // Check if user is authorized
    if (!req.user.isAdmin && ticket.user._id.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized');
    }

    ticket.messages.push({
      sender: req.user._id,
      message: message,
      timestamp: new Date()
    });

    ticket.status = req.user.isAdmin ? ticket.status : 'awaiting_response';
    const updatedTicket = await ticket.save();

    // Send email notification
    const emailRecipient = req.user.isAdmin ? ticket.user.email : process.env.SUPPORT_EMAIL;
    try {
      await sendEmail({
        to: emailRecipient,
        subject: `New Message on Ticket #${ticket._id}`,
        html: `
          <h1>New Support Message</h1>
          <p>A new message has been added to your support ticket.</p>
          <p><strong>Ticket ID:</strong> ${ticket._id}</p>
          <p><strong>Subject:</strong> ${ticket.subject}</p>
          <p><strong>Message:</strong> ${message}</p>
        `
      });
    } catch (error) {
      // Log the error but don't fail the request
      console.error('Failed to send notification email:', error);
    }

    res.json(updatedTicket);
  } else {
    res.status(404);
    throw new Error('Ticket not found');
  }
});

// @desc    Update ticket status
// @route   PUT /api/support/:id/status
// @access  Private/Admin
const updateTicketStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const ticket = await SupportTicket.findById(req.params.id)
    .populate('user', 'email');

  if (ticket) {
    ticket.status = status;
    const updatedTicket = await ticket.save();

    // Send email notification
    try {
      await sendEmail({
        to: ticket.user.email,
        subject: `Support Ticket Status Updated - ${ticket._id}`,
        html: `
          <h1>Ticket Status Updated</h1>
          <p>Your support ticket status has been updated.</p>
          <p><strong>Ticket ID:</strong> ${ticket._id}</p>
          <p><strong>Subject:</strong> ${ticket.subject}</p>
          <p><strong>New Status:</strong> ${status}</p>
        `
      });
    } catch (error) {
      // Log the error but don't fail the request
      console.error('Failed to send status update email:', error);
    }

    res.json(updatedTicket);
  } else {
    res.status(404);
    throw new Error('Ticket not found');
  }
});

// @desc    Update ticket priority
// @route   PUT /api/support/:id/priority
// @access  Private/Admin
const updateTicketPriority = asyncHandler(async (req, res) => {
  const { priority } = req.body;
  const ticket = await SupportTicket.findById(req.params.id);

  if (ticket) {
    ticket.priority = priority;
    const updatedTicket = await ticket.save();
    res.json(updatedTicket);
  } else {
    res.status(404);
    throw new Error('Ticket not found');
  }
});

module.exports = {
  createTicket,
  getTickets,
  getUserTickets,
  getTicketById,
  addMessage,
  updateTicketStatus,
  updateTicketPriority
};