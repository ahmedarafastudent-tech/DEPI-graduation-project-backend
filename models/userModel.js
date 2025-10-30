const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const { PASSWORD_PATTERN } = require('../constants/security');

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot be more than 50 characters long'],
      index: true, 
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please enter a valid email address',
      ],
      index: true, 
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false, 
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || /^https?:\/\/.+/.test(v);
        },
        message: 'Invalid URL format for avatar',
      },
    },
    verificationToken: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    lastLogin: {
      type: Date,
    },
    sessions: [
      {
        jti: { type: String, index: true },
        userAgent: String,
        ip: String,
        createdAt: { type: Date, default: Date.now },
        lastUsedAt: Date,
        revoked: { type: Boolean, default: false },
      },
    ],
    lastLogout: Date,
    loginAttempts: {
      type: Number,
      default: 0,
    },
    lockedUntil: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.password;
        delete ret.verificationToken;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        delete ret.loginAttempts;
        delete ret.lockedUntil;
        return ret;
      },
    },
  }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.generateToken = function () {
  const jwt = require('jsonwebtoken');
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET || 'testsecret123', {
    expiresIn: '30d',
  });
};

userSchema.methods.getVerificationToken = function () {
  const token = crypto.randomBytes(20).toString('hex');
  this.verificationToken = token;
  return token;
};

userSchema.methods.getResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(20).toString('hex');

  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; 

  return resetToken;
};

userSchema.methods.cleanupSessions = function() {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  this.sessions = (this.sessions || []).filter(s => 
    !s.revoked || (s.lastUsedAt && s.lastUsedAt > thirtyDaysAgo)
  );
  return this;
};

userSchema.methods.getSessionStats = function() {
  const sessions = this.sessions || [];
  return {
    active: sessions.filter(s => !s.revoked).length,
    revoked: sessions.filter(s => s.revoked).length,
    total: sessions.length
  };
};

userSchema.methods.pruneOldSessions = function(maxSessions = 50) {
  if (!this.sessions || this.sessions.length <= maxSessions) return this;
  
  const sorted = [...this.sessions].sort((a, b) => {
    const dateA = a.lastUsedAt || a.createdAt || new Date(0);
    const dateB = b.lastUsedAt || b.createdAt || new Date(0);
    return dateB - dateA;
  });

  this.sessions = sorted.slice(0, maxSessions);
  return this;
};


userSchema.index({ email: 1, isVerified: 1 });

module.exports = mongoose.model('User', userSchema);
