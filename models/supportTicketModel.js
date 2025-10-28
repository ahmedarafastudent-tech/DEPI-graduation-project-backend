const mongoose = require('mongoose');

const ticketSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed', 'awaiting_response'],
    default: 'open',
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
    required: true
  },
  category: {
    type: String,
    enum: ['order', 'product', 'shipping', 'technical', 'general', 'other'],
    required: true
  },
  messages: [{
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    message: {
      type: String,
      required: true
    },
    attachments: [{
      url: String,
      fileName: String,
      fileType: String
    }],
    timestamp: {
      type: Date,
      default: Date.now
    },
    isInternal: {
      type: Boolean,
      default: false
    }
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  relatedOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  },
  relatedProduct: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  notes: [{
    content: String,
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  resolution: {
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedAt: Date,
    solution: String
  },
  escalation: {
    isEscalated: {
      type: Boolean,
      default: false
    },
    escalatedAt: Date,
    escalatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reason: String
  }
}, { timestamps: true });

ticketSchema.pre('validate', function (next) {
  if (Array.isArray(this.messages)) {
    this.messages = this.messages.map(msg => {
      if ((!msg.content || msg.content === '') && msg.message) {
        msg.content = msg.message;
      }

      if ((!msg.message || msg.message === '') && msg.content) {
        msg.message = msg.content;
      }
      return msg;
    });
  }
  next();
});

ticketSchema.set('toJSON', {
  transform: function (doc, ret) {
    if (Array.isArray(ret.messages)) {
      ret.messages = ret.messages.map(m => {
        if (!m.message && m.content) m.message = m.content;
        return m;
      });
    }
    return ret;
  }
});

ticketSchema.index({ user: 1, status: 1 });
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ assignedTo: 1, status: 1 });

module.exports = mongoose.model('SupportTicket', ticketSchema);