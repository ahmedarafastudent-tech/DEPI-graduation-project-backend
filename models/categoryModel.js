const mongoose = require('mongoose');

const categorySchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    required: true
  },
  subcategories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subcategory'
  }],
  image: {
    type: String
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Category', categorySchema);

module.exports = mongoose.model('Category', categorySchema);