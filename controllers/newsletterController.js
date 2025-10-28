const asyncHandler = require('express-async-handler');
const Newsletter = require('../models/newsletterModel');
const sendEmail = require('../utils/sendEmail');


const subscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;
  let { preferences } = req.body;

  const normalizePreferences = (p) => {
    if (!p) return [];
    if (Array.isArray(p)) return p;
    if (typeof p === 'object') {
      return Object.entries(p).filter(([_, v]) => v).map(([k]) => k);
    }
    return [];
  };

  preferences = normalizePreferences(preferences);

  let subscriber = await Newsletter.findOne({ email });

  if (subscriber) {
    res.status(400);
    throw new Error('Email already subscribed');
  }

  subscriber = await Newsletter.create({
    email,
    preferences,
    isSubscribed: true
  });

  await sendEmail({
    to: email,
    subject: 'Welcome to Our Newsletter',
    text: 'Thank you for subscribing to our newsletter!',
    html: `
      <h1>Welcome to Our Newsletter!</h1>
      <p>Thank you for subscribing. You'll now receive updates about:</p>
      <ul>
        ${Object.entries(preferences)
          .filter(([_, enabled]) => enabled)
          .map(([pref]) => `<li>${pref}</li>`)
          .join('')}
      </ul>
      <p>You can unsubscribe at any time by clicking the unsubscribe link in our emails.</p>
    `
  });

  res.status(201).json({
    message: 'Successfully subscribed to newsletter',
    subscriber
  });
});


const unsubscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const subscriber = await Newsletter.findOne({ email });

  if (!subscriber) {
    res.status(404);
    throw new Error('Email not found in subscription list');
  }

  subscriber.isSubscribed = false;
  await subscriber.save();

  await sendEmail({
    to: email,
    subject: 'Unsubscribed from Newsletter',
    text: 'You have been successfully unsubscribed from our newsletter.',
    html: `
      <h1>Unsubscription Confirmed</h1>
      <p>You have been successfully unsubscribed from our newsletter.</p>
      <p>We're sorry to see you go. If you'd like to resubscribe in the future, please visit our website.</p>
    `
  });

  res.json({
    message: 'Successfully unsubscribed from newsletter',
    subscriber
  });
});

const updatePreferences = asyncHandler(async (req, res) => {
  const { email } = req.body;
  let { preferences } = req.body;

  const normalizePreferences = (p) => {
    if (!p) return [];
    if (Array.isArray(p)) return p;
    if (typeof p === 'object') {
      return Object.entries(p).filter(([_, v]) => v).map(([k]) => k);
    }
    return [];
  };

  preferences = normalizePreferences(preferences);

  const subscriber = await Newsletter.findOne({ email });

  if (!subscriber) {
    res.status(404);
    throw new Error('Email not found in subscription list');
  }

  subscriber.preferences = preferences;
  await subscriber.save();

  res.json({
    message: 'Successfully updated preferences',
    subscriber
  });
});


const getSubscribers = asyncHandler(async (req, res) => {
  const subscribers = await Newsletter.find({});
  res.json(subscribers);
});


const sendNewsletter = asyncHandler(async (req, res) => {
  const { subject, content, preferences = [] } = req.body;

  let query = { isSubscribed: true };
  if (preferences.length > 0) {
    query.preferences = { $in: preferences };
  }

  const subscribers = await Newsletter.find(query);

  const emailPromises = subscribers.map(subscriber => {
    return sendEmail({
      to: subscriber.email,
      subject,
      html: `
        ${content}
        <br><br>
        <small>
          <a href="${process.env.BASE_URL}/api/newsletter/unsubscribe?email=${subscriber.email}">
            Unsubscribe
          </a>
        </small>
      `
    });
  });

  await Promise.all(emailPromises);

  res.json({
    message: `Newsletter sent to ${subscribers.length} subscribers`,
    recipientCount: subscribers.length
  });
});

module.exports = {
  subscribe,
  unsubscribe,
  updatePreferences,
  getSubscribers,
  sendNewsletter
};