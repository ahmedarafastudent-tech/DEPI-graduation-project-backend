const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const User = require('../models/userModel');

const optionalAuth = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    req.user = null;
    next();
    return;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'testsecret123'
    );

    const user = await User.findById(decoded.id);

    // Check global logout timestamp
    if (user) {
      if (user.lastLogout) {
        const lastLogoutSec = Math.floor(new Date(user.lastLogout).getTime() / 1000);
        if (decoded.iat <= lastLogoutSec) {
          req.user = null;
          return next();
        }
      }

      // If token has jti, ensure session not revoked
      if (decoded.jti) {
        const sessions = user.sessions || [];
        const matched = sessions.find((s) => s && (s.jti === decoded.jti));
        if (!matched || matched.revoked) {
          req.user = null;
          return next();
        }
      }

      // best-effort update lastUsedAt
      try {
        if (decoded.jti) {
          const idx = (user.sessions || []).findIndex((s) => s && s.jti === decoded.jti);
          if (idx !== -1) {
            user.sessions[idx].lastUsedAt = new Date();
            user.save().catch(() => {});
          }
        }
      } catch (e) {}

      req.user = user;
      try {
        res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.set('Pragma', 'no-cache');
        res.set('Expires', '0');
      } catch (e) {}
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    req.user = null;
    next();
  }
});

module.exports = optionalAuth;