const dotenv = require('dotenv');
const mongoose = require('mongoose');
const path = require('path');

// Load .env file (falls back to defaults if not present)
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const User = require('../models/userModel');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');
const Order = require('../models/orderModel');
const Subcategory = require('../models/subcategoryModel');
const Coupon = require('../models/couponModel');
const Newsletter = require('../models/newsletterModel');
const ShippingMethod = require('../models/shippingModel');
const Tax = require('../models/taxModel');
const Cart = require('../models/cartModel');
const Wishlist = require('../models/wishlistModel');
const SupportTicket = require('../models/supportTicketModel');
const ReturnModel = require('../models/returnModel');
const Analytics = require('../models/analyticsModel');

const MONGO = process.env.MONGO_URI || 'mongodb://localhost:27017/your_database';

async function connect() {
  await mongoose.connect(MONGO, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
}

async function clearData() {
  console.log('Clearing existing data...');
  await Order.deleteMany();
  await Product.deleteMany();
  await Category.deleteMany();
  await Subcategory.deleteMany();
  await Coupon.deleteMany();
  await Newsletter.deleteMany();
  await ShippingMethod.deleteMany();
  await Tax.deleteMany();
  await Cart.deleteMany();
  await Wishlist.deleteMany();
  await SupportTicket.deleteMany();
  await ReturnModel.deleteMany();
  await Analytics.deleteMany();
  await User.deleteMany();
}

async function importData() {
  console.log('Importing sample data...');

  // Users
  const users = [
    {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      isAdmin: true,
      isVerified: true,
    },
    {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123',
      isVerified: true,
    },
    {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'password123',
      isVerified: true,
    },
  ];

  const createdUsers = await User.create(users);

  // Categories
  const categories = [
    { name: 'Electronics', description: 'Electronic gadgets and devices' },
    { name: 'Books', description: 'All kinds of books' },
    { name: 'Clothing', description: 'Apparel and accessories' },
  ];

  const createdCategories = await Category.create(categories);

  // Products (reference categories)
  const products = [
    {
      name: 'Wireless Headphones',
      description: 'Noise-cancelling wireless headphones',
      price: 99.99,
      basePrice: 120,
      countInStock: 25,
      category: createdCategories[0]._id,
      user: createdUsers[0]._id,
      variants: [
        { sku: `WH-${Date.now()}-1`, attributes: { color: 'black' }, price: 99.99, countInStock: 25 }
      ],
    },
    {
      name: 'JavaScript: The Good Parts',
      description: 'A classic book about JavaScript',
      price: 19.99,
      countInStock: 100,
      category: createdCategories[1]._id,
      user: createdUsers[1]._id,
      variants: [
        { sku: `JS-${Date.now()}-1`, attributes: { format: 'paperback' }, price: 19.99, countInStock: 100 }
      ],
    },
    {
      name: 'Plain T-Shirt',
      description: '100% cotton t-shirt',
      price: 9.99,
      countInStock: 200,
      category: createdCategories[2]._id,
      user: createdUsers[2]._id,
      variants: [
        { sku: `TS-${Date.now()}-1`, attributes: { size: 'M', color: 'white' }, price: 9.99, countInStock: 200 }
      ],
    },
  ];

  const createdProducts = await Product.create(products);

  // Subcategories (linked to categories)
  const subcategories = [
    { name: 'Headphones', category: createdCategories[0]._id },
    { name: 'Programming', category: createdCategories[1]._id },
    { name: 'Men', category: createdCategories[2]._id },
  ];

  const createdSubcategories = await Subcategory.create(subcategories);

  // Coupons
  const coupons = [
    {
      code: 'WELCOME10',
      type: 'percentage',
      value: 10,
      validFrom: new Date(Date.now() - 1000 * 60 * 60),
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      minimumPurchase: 0,
      maxUsage: 1000,
    },
  ];

  const createdCoupons = await Coupon.create(coupons);

  // Newsletters
  const newsletters = [
    { email: 'newsletter1@example.com' },
    { email: 'newsletter2@example.com' },
  ];
  const createdNewsletters = await Newsletter.create(newsletters);

  // Shipping methods
  const shippings = [
    { name: 'Standard Shipping', carrier: 'LocalPost', estimatedDays: '3-7', baseRate: 5 },
    { name: 'Express', carrier: 'FastShip', estimatedDays: '1-2', baseRate: 15 },
  ];
  const createdShippings = await ShippingMethod.create(shippings);

  // Tax rules
  const taxes = [
    { region: 'EG', rate: 14, type: 'vat', isDefault: true },
  ];
  const createdTaxes = await Tax.create(taxes);

  // Orders (simple example linking user and product)
  const orders = [
    {
      user: createdUsers[1]._id,
      orderItems: [
        {
          name: createdProducts[0].name,
          qty: 1,
          image: createdProducts[0].images && createdProducts[0].images[0] ? createdProducts[0].images[0].url : '',
          price: createdProducts[0].price || 99.99,
          product: createdProducts[0]._id,
        },
      ],
      shippingAddress: {
        address: '123 Main St',
        city: 'Cairo',
        postalCode: '11511',
        country: 'Egypt',
      },
      paymentMethod: 'PayTabs',
      itemsPrice: createdProducts[0].price || 99.99,
      taxPrice: 5.0,
      shippingPrice: 10.0,
      totalPrice: (createdProducts[0].price || 99.99) + 5.0 + 10.0,
      isPaid: false,
    },
  ];

  await Order.create(orders);

  // Create carts for users
  const carts = [
    {
      user: createdUsers[1]._id,
      items: [
        {
          product: createdProducts[1]._id,
          name: createdProducts[1].name,
          qty: 2,
          price: createdProducts[1].price || 19.99,
        },
      ],
      totalPrice: (createdProducts[1].price || 19.99) * 2,
    },
  ];
  const createdCarts = await Cart.create(carts);

  // Wishlists
  const wishlists = [
    { user: createdUsers[2]._id, items: [{ product: createdProducts[2]._id }] },
  ];
  const createdWishlists = await Wishlist.create(wishlists);

  // Support ticket example
  const tickets = [
    {
      user: createdUsers[1]._id,
      subject: 'Issue with order',
      category: 'order',
      messages: [
        { sender: createdUsers[1]._id, message: 'I have a problem with my order.' },
      ],
      relatedOrder: null,
    },
  ];
  const createdTickets = await SupportTicket.create(tickets);

  // Return example (if order exists)
  const createdOrder = await Order.findOne({ user: createdUsers[1]._id });
  if (createdOrder) {
    await ReturnModel.create({
      order: createdOrder._id,
      user: createdUsers[1]._id,
      items: [
        {
          product: createdProducts[0]._id,
          quantity: 1,
          reason: 'Not satisfied',
          condition: 'like-new',
        },
      ],
      status: 'pending',
    });
  }

  // Analytics events
  const analyticsEvents = [
    { eventType: 'product_view', product: createdProducts[0]._id, userId: createdUsers[1]._id },
    { eventType: 'product_purchase', product: createdProducts[0]._id, userId: createdUsers[1]._id, value: createdProducts[0].price },
  ];
  const createdAnalytics = await Analytics.create(analyticsEvents);

  console.log('Sample data imported successfully.');
  console.log(`Users: ${createdUsers.length}, Categories: ${createdCategories.length}, Subcategories: ${createdSubcategories.length}, Products: ${createdProducts.length}, Orders: ${orders.length}, Coupons: ${createdCoupons.length}, Newsletters: ${createdNewsletters.length}, Shippings: ${createdShippings.length}`);
}

async function run() {
  try {
    await connect();
    await clearData();
    await importData();
  } catch (err) {
    console.error('Seed error:', err);
    process.exit(1);
  } finally {
    mongoose.connection.close();
  }
}

run();
