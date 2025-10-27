const asyncHandler = require('express-async-handler');
const Analytics = require('../models/analyticsModel');
const AppError = require('../utils/appError');

// @desc    Track event
// @route   POST /api/analytics/event
// @access  Private
const trackEvent = asyncHandler(async (req, res) => {
  const { eventType, metadata } = req.body;

  if (!eventType) {
    throw new AppError('Event type is required', 400);
  }

  const userId = req.user ? req.user._id : null;

  const event = await Analytics.create({
    eventType,
    userId,
    metadata: metadata || {},
    timestamp: new Date(),
  });

  res.status(201).json(event);
});

// @desc    Get analytics by date range
// @route   GET /api/analytics
// @access  Private/Admin
const getAnalytics = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    throw new AppError('Not authorized as admin', 401);
  }

  const { startDate, endDate, eventType } = req.query;
  let query = {};
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  if (startDate && endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);
    query.timestamp = { $gte: start, $lte: end };
  } else {
    // Default last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);
    query.timestamp = { $gte: thirtyDaysAgo, $lte: today };
  }

  if (eventType) {
    query.eventType = eventType;
  }

  const events = await Analytics.find(query)
    .sort({ timestamp: -1 })
    .populate('userId', 'name email');

  const aggregatedData = await Analytics.aggregate([
    { $match: query },
    { $group: { _id: '$eventType', count: { $sum: 1 } } },
  ]);

  res.status(200).json({
    success: true,
    totalEvents: events.length,
    summary: aggregatedData,
    events,
  });
});

// @desc    Get user activity
// @route   GET /api/analytics/user/:userId
// @access  Private/Admin
const getUserActivity = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    throw new AppError('Not authorized as admin', 401);
  }

  const events = await Analytics.find({ userId: req.params.userId })
    .sort({ timestamp: -1 })
    .populate('userId', 'name email');

  // Return plain array of events to match tests (normalize userId)
  const mappedEvents = events.map(event => {
    const plain = event.toObject();
    // If populated, keep only the id (tests expect userId to be an ObjectId)
    if (plain.userId && plain.userId._id) {
      plain.userId = plain.userId._id;
    }
    return plain;
  });

  res.status(200).json(mappedEvents);
});

// @desc    Get popular products
// @route   GET /api/analytics/products
// @access  Private/Admin
const getProductAnalytics = asyncHandler(async (req, res) => {
  if (!req.user.isAdmin) {
    throw new AppError('Not authorized as admin', 401);
  }

  const productViews = await Analytics.aggregate([
    { $match: { eventType: 'product_view' } },
    {
      $group: {
        _id: '$metadata.productId',
        views: { $sum: 1 },
        productName: { $first: '$metadata.productName' },
      },
    },
    { $sort: { views: -1 } },
    { $limit: 10 },
  ]);

  const productPurchases = await Analytics.aggregate([
    { $match: { eventType: 'purchase' } },
    { $unwind: '$metadata.products' },
    {
      $group: {
        _id: '$metadata.products.productId',
        purchases: { $sum: '$metadata.products.quantity' },
        productName: { $first: '$metadata.products.productName' },
      },
    },
    { $sort: { purchases: -1 } },
    { $limit: 10 },
  ]);

  const mostViewed = productViews.map((v) => ({
    productId: v._id,
    productName: v.productName || '',
    views: v.views || 0,
  }));

  const mostPurchased = productPurchases.map((p) => ({
    productId: p._id,
    productName: p.productName || '',
    purchases: p.purchases || 0,
  }));

  res.status(200).json({
    success: true,
    mostViewed,
    mostPurchased,
  });
});

module.exports = {
  trackEvent,
  getAnalytics,
  getUserActivity,
  getProductAnalytics,
};
