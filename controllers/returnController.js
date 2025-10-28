const asyncHandler = require('express-async-handler');
const Return = require('../models/returnModel');
const Order = require('../models/orderModel');
const sendEmail = require('../utils/sendEmail');

const createReturn = asyncHandler(async (req, res) => {
  const {
    orderId,
    items,
    reason,
    description
  } = req.body;

  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  const orderDate = new Date(order.createdAt);
  const currentDate = new Date();
  const daysSinceOrder = Math.floor((currentDate - orderDate) / (1000 * 60 * 60 * 24));

  if (daysSinceOrder > 30) {
    res.status(400);
    throw new Error('Return period has expired (30 days)');
  }

  const returnRequest = await Return.create({
    order: orderId,
    user: req.user._id,
    items,
    reason,
    description,
    status: 'pending',
    createdAt: currentDate
  });

  await sendEmail({
    to: req.user.email,
    subject: 'Return Request Received',
    html: `
      <h1>Return Request Received</h1>
      <p>Your return request for order #${order._id} has been received and is being processed.</p>
      <p>Return ID: ${returnRequest._id}</p>
      <p>Status: Pending</p>
      <p>We will notify you once your return request has been reviewed.</p>
    `
  });

  res.status(201).json(returnRequest);
});


const getReturns = asyncHandler(async (req, res) => {
  const { status } = req.query;
  
  let query = {};
  if (status) {
    query.status = status;
  }

  const returns = await Return.find(query)
    .populate('user', 'name email')
    .populate('order')
    .sort('-createdAt');

  res.json(returns);
});


const getUserReturns = asyncHandler(async (req, res) => {
  const returns = await Return.find({ user: req.user._id })
    .populate('order')
    .sort('-createdAt');

  res.json(returns);
});

const getReturnById = asyncHandler(async (req, res) => {
  const returnRequest = await Return.findById(req.params.id)
    .populate('user', 'name email')
    .populate('order');

  if (returnRequest) {
    if (!req.user.isAdmin && returnRequest.user._id.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }
    res.json(returnRequest);
  } else {
    res.status(404);
    throw new Error('Return request not found');
  }
});


const updateReturnStatus = asyncHandler(async (req, res) => {
  const { status, adminNotes } = req.body;

  const returnRequest = await Return.findById(req.params.id)
    .populate('user', 'email')
    .populate('order');

  if (returnRequest) {
    returnRequest.status = status || returnRequest.status;
    returnRequest.adminNotes = adminNotes || returnRequest.adminNotes;
    returnRequest.updatedAt = Date.now();

    const updatedReturn = await returnRequest.save();

    const orderIdForEmail =
      returnRequest.order && returnRequest.order._id
        ? returnRequest.order._id
        : returnRequest.order || 'N/A';

    await sendEmail({
      email: returnRequest.user.email,
      subject: `Return Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your return request for order #${orderIdForEmail} has been ${status}. Return ID: ${returnRequest._id}`,
    });

    res.json(updatedReturn);
  } else {
    res.status(404);
    throw new Error('Return request not found');
  }
});

module.exports = {
  createReturn,
  getReturns,
  getUserReturns,
  getReturnById,
  updateReturnStatus
};