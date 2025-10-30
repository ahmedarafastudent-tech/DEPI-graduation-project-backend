
const asyncHandler = require('express-async-handler');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const generateToken = require('../utils/generateToken');
let sendEmail = require('../utils/sendEmail');

if (sendEmail && typeof sendEmail !== 'function' && typeof sendEmail.default === 'function') {
  sendEmail = sendEmail.default;
}

async function safeSendEmail(payload) {
  if (!sendEmail) return { success: false };
  try {
    return await sendEmail(payload);
  } catch (err) {
    return { success: false, error: err };
  }
}

const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('Email and password are required');
  }

  const existing = await User.findOne({ email });
  if (existing) {
    res.status(400);
    throw new Error('User already exists');
  }

  const sanitizedName = (name || '').replace(/<[^>]*>/g, '').replace(/[<>]/g, '');
  const user = await User.create({ name: sanitizedName, email, password });

  if (process.env.NODE_ENV !== 'test') {
    safeSendEmail({ email: user.email, subject: 'Welcome', message: `Welcome ${user.name || ''}` });
  }

  res.status(201).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    token: generateToken(user._id),
  });
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400);
    throw new Error('Please provide email and password');
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }

  const jti = crypto.randomBytes(16).toString('hex');
  user.sessions = user.sessions || [];
  user.sessions.push({
    jti,
    userAgent: req.headers['user-agent'] || '',
    ip: req.ip,
    createdAt: new Date(),
    lastUsedAt: new Date(),
  });

  user.cleanupSessions().pruneOldSessions(50);
  await user.save();

  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    token: generateToken(user._id, { jti }),
  });
});

const logoutUser = asyncHandler(async (req, res) => {
  let token = null;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    res.status(400);
    throw new Error('No token provided');
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'testsecret123');
  } catch (err) {
    res.status(401);
    throw new Error('Invalid token');
  }

  const userId = decoded && decoded.id ? decoded.id : null;
  const jti = decoded && decoded.jti ? decoded.jti : null;

  const user = await User.findById(userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  if (jti) {
    user.sessions = (user.sessions || []).map((s) => {
      if (s.jti === jti) {
        return Object.assign({}, s.toObject ? s.toObject() : s, {
          revoked: true,
          lastUsedAt: new Date()
        });
      }
      return s;
    });
  } else {
    user.sessions = (user.sessions || []).map((s) => 
      Object.assign({}, s.toObject ? s.toObject() : s, {
        revoked: true,
        lastUsedAt: new Date()
      })
    );
    user.lastLogout = Date.now() - 1000; 
  }

  await user.save();
  try {
    res.clearCookie('jwt');
  } catch (e) {}
  res.json({ message: 'Logged out successfully' });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400);
    throw new Error('Email required');
  }

  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const resetToken = user.getResetPasswordToken();
  await user.save();

  const resetUrl = `${req.protocol}://${req.get('host')}/api/auth/reset-password/${resetToken}`;
  const message = `Reset your password: ${resetUrl}`;

  if (process.env.NODE_ENV === 'test') {
    return res.json({ message: 'Email sent' });
  }

  const result = await safeSendEmail({ email: user.email, subject: 'Password Reset', message });
  if (!result || !result.success) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    res.status(500);
    throw new Error('Email could not be sent');
  }

  res.json({ message: 'Password reset email sent' });
});

const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  if (!token || !password) {
    res.status(400);
    throw new Error('Token and new password required');
  }

  const hashed = crypto.createHash('sha256').update(token).digest('hex');
  const user = await User.findOne({
    resetPasswordToken: hashed,
    resetPasswordExpires: { $gt: Date.now() },
  });
  if (!user) {
    res.status(400);
    throw new Error('Invalid or expired token');
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: 'Password reset successful' });
});

const listSessions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('sessions');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const sessions = (user.sessions || []).map((s) => (s.toObject ? s.toObject() : s));
  res.json({ sessions });
});

const revokeSession = asyncHandler(async (req, res) => {
  const { jti } = req.params;
  if (!jti) {
    res.status(400);
    throw new Error('Missing session id');
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  let found = false;
  user.sessions = (user.sessions || []).map((s) => {
    if (s.jti === jti) {
      found = true;
      return Object.assign({}, s.toObject ? s.toObject() : s, {
        revoked: true,
        lastUsedAt: new Date(),
      });
    }
    return s;
  });

  if (!found) {
    res.status(404);
    throw new Error('Session not found');
  }

  await user.save();
  res.json({ message: 'Session revoked' });
});

const revokeAllSessions = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.sessions = (user.sessions || []).map((s) =>
    Object.assign({}, s.toObject ? s.toObject() : s, { revoked: true }),
  );
  user.lastLogout = Date.now() - 1000;
  await user.save();
  res.json({ message: 'All sessions revoked' });
});

const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;
  if (!token) {
    res.status(400);
    throw new Error('Missing token');
  }
  const user = await User.findOne({ verificationToken: token });
  if (!user) {
    res.status(400);
    throw new Error('Invalid verification token');
  }
  user.isVerified = true;
  user.verificationToken = undefined;
  await user.save();
  res.json({ message: 'Email verified' });
});

const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    isVerified: user.isVerified,
    avatar: user.avatar,
    sessionStats: user.getSessionStats(),
  });
});

const updateUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  user.name = req.body.name || user.name;
  if (req.body.email && req.body.email !== user.email) {
    const exists = await User.findOne({ email: req.body.email });
    if (exists) {
      res.status(400);
      throw new Error('Email already in use');
    }
    user.email = req.body.email;
  }
  await user.save();
  res.json({
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    token: generateToken(user._id),
  });
});

const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400);
    throw new Error('Current and new password required');
  }
  const user = await User.findById(req.user._id).select('+password');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (!(await user.matchPassword(currentPassword))) {
    res.status(401);
    throw new Error('Current password is incorrect');
  }
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated successfully' });
});

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  forgotPassword,
  resetPassword,
  listSessions,
  revokeSession,
  revokeAllSessions,
  verifyEmail,
  getUserProfile,
  updateUserProfile,
  updatePassword,
};
