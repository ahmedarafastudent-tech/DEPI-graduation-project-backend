const mongoose = require('mongoose');

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: {
      type: String,
      required: false,
    },
    subcategories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Subcategory',
      },
    ],
    image: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate slug and ensure isActive default
categorySchema.pre('validate', function (next) {
  if (this.name && !this.slug) {
    this.slug = this.name
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
  }
  if (this.isActive === undefined) {
    this.isActive = true;
  }
  next();
});

// Add slug and isActive to schema
categorySchema.add({
  slug: { type: String, unique: false },
  isActive: { type: Boolean, default: true },
});

module.exports = mongoose.model('Category', categorySchema);
