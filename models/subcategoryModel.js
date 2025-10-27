const mongoose = require('mongoose');

const subcategorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
      required: false,
    },
    description: {
      type: String,
      required: false,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
      index: true, // Index for faster queries
      validate: {
        validator: async function(v) {
          const Category = mongoose.model('Category');
          const category = await Category.findById(v);
          return category !== null;
        },
        message: 'Invalid category'
      }
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Subcategory', subcategorySchema);
