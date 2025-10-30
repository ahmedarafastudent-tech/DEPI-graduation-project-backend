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
      password: 'Admin@123',
      isAdmin: true,
      isVerified: true,
    },
    {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'User@123',
      isVerified: true,
    },
    {
      name: 'Jane Smith',
      email: 'jane@example.com',
      password: 'User@123',
      isVerified: true,
    },
  ];

  const createdUsers = await User.create(users);

  // Categories
  const categories = [
    { name: 'Electronics', description: 'Electronic gadgets and devices' },
    { name: 'Books', description: 'All kinds of books' },
    { name: 'Clothing', description: 'Apparel and accessories' },
    { name: 'Home & Kitchen', description: 'Home appliances and kitchenware' },
    { name: 'Sports', description: 'Sports equipment and accessories' },
    { name: 'Beauty', description: 'Beauty and personal care products' },
    { name: 'Toys', description: 'Toys and games for all ages' },
  ];

  const createdCategories = await Category.create(categories);

  // Products (reference categories)
  const products = [
    // Electronics
    {
      name: 'Premium Wireless Headphones',
      description: 'High-end noise-cancelling wireless headphones with 30-hour battery life',
      price: 299.99,
      basePrice: 349.99,
      countInStock: 50,
      category: createdCategories[0]._id,
      seller: createdUsers[0]._id,
      variants: [
        { sku: `WH-${Date.now()}-BLK`, attributes: { color: 'black' }, price: 299.99, countInStock: 30 },
        { sku: `WH-${Date.now()}-WHT`, attributes: { color: 'white' }, price: 299.99, countInStock: 20 }
      ],
    },
    {
      name: 'Smartphone Pro Max',
      description: '6.7-inch display, 256GB storage, triple camera system',
      price: 999.99,
      basePrice: 1099.99,
      countInStock: 30,
      category: createdCategories[0]._id,
      seller: createdUsers[0]._id,
      variants: [
        { sku: `SP-${Date.now()}-256-BLK`, attributes: { storage: '256GB', color: 'black' }, price: 999.99, countInStock: 15 },
        { sku: `SP-${Date.now()}-512-GLD`, attributes: { storage: '512GB', color: 'gold' }, price: 1199.99, countInStock: 15 }
      ],
    },
    // Books
    {
      name: 'Modern JavaScript Guide',
      description: 'Comprehensive guide to modern JavaScript development',
      price: 39.99,
      countInStock: 100,
      category: createdCategories[1]._id,
      seller: createdUsers[1]._id,
      variants: [
        { sku: `BK-${Date.now()}-PB`, attributes: { format: 'paperback' }, price: 39.99, countInStock: 50 },
        { sku: `BK-${Date.now()}-HB`, attributes: { format: 'hardcover' }, price: 49.99, countInStock: 50 }
      ],
    },
    {
      name: 'Business Leadership',
      description: 'Essential principles of modern business leadership',
      price: 24.99,
      countInStock: 75,
      category: createdCategories[1]._id,
      seller: createdUsers[1]._id,
      variants: [
        { sku: `BL-${Date.now()}-PB`, attributes: { format: 'paperback' }, price: 24.99, countInStock: 75 }
      ],
    },
    // Clothing
    {
      name: 'Premium Cotton T-Shirt',
      description: '100% organic cotton, comfortable fit',
      price: 29.99,
      countInStock: 200,
      category: createdCategories[2]._id,
      seller: createdUsers[2]._id,
      variants: [
        { sku: `TS-${Date.now()}-S-BLK`, attributes: { size: 'S', color: 'black' }, price: 29.99, countInStock: 40 },
        { sku: `TS-${Date.now()}-M-BLK`, attributes: { size: 'M', color: 'black' }, price: 29.99, countInStock: 40 },
        { sku: `TS-${Date.now()}-L-BLK`, attributes: { size: 'L', color: 'black' }, price: 29.99, countInStock: 40 }
      ],
    },
    // Home & Kitchen
    {
      name: 'Smart Coffee Maker',
      description: 'WiFi-enabled 12-cup coffee maker with programmable brewing',
      price: 149.99,
      basePrice: 179.99,
      countInStock: 40,
      category: createdCategories[3]._id,
      seller: createdUsers[0]._id,
      variants: [
        { sku: `CM-${Date.now()}-BLK`, attributes: { color: 'black' }, price: 149.99, countInStock: 20 },
        { sku: `CM-${Date.now()}-SS`, attributes: { color: 'stainless steel' }, price: 169.99, countInStock: 20 }
      ],
    },
    // Sports
    {
      name: 'Yoga Mat Pro',
      description: 'Extra thick eco-friendly yoga mat with carrying strap',
      price: 49.99,
      countInStock: 100,
      category: createdCategories[4]._id,
      seller: createdUsers[1]._id,
      variants: [
        { sku: `YM-${Date.now()}-BLU`, attributes: { color: 'blue' }, price: 49.99, countInStock: 50 },
        { sku: `YM-${Date.now()}-PUR`, attributes: { color: 'purple' }, price: 49.99, countInStock: 50 }
      ],
    },
    // Beauty
    {
      name: 'Vitamin C Serum',
      description: 'Advanced anti-aging serum with 20% Vitamin C',
      price: 34.99,
      countInStock: 150,
      category: createdCategories[5]._id,
      seller: createdUsers[2]._id,
      variants: [
        { sku: `VC-${Date.now()}-30`, attributes: { size: '30ml' }, price: 34.99, countInStock: 75 },
        { sku: `VC-${Date.now()}-50`, attributes: { size: '50ml' }, price: 54.99, countInStock: 75 }
      ],
    },
    // Toys
    {
      name: 'Educational Robot Kit',
      description: 'Build and program your own robot - perfect for learning STEM',
      price: 79.99,
      countInStock: 60,
      category: createdCategories[6]._id,
      seller: createdUsers[0]._id,
      variants: [
        { sku: `RB-${Date.now()}-BEG`, attributes: { level: 'beginner' }, price: 79.99, countInStock: 30 },
        { sku: `RB-${Date.now()}-ADV`, attributes: { level: 'advanced' }, price: 99.99, countInStock: 30 }
      ],
    }
  ];

  const createdProducts = await Product.create(products);

  // Subcategories (linked to categories)
  const subcategories = [
    // Electronics
    { name: 'Headphones', category: createdCategories[0]._id },
    { name: 'Smartphones', category: createdCategories[0]._id },
    { name: 'Laptops', category: createdCategories[0]._id },
    { name: 'Cameras', category: createdCategories[0]._id },
    // Books
    { name: 'Programming', category: createdCategories[1]._id },
    { name: 'Fiction', category: createdCategories[1]._id },
    { name: 'Business', category: createdCategories[1]._id },
    // Clothing
    { name: 'Men', category: createdCategories[2]._id },
    { name: 'Women', category: createdCategories[2]._id },
    { name: 'Kids', category: createdCategories[2]._id },
    // Home & Kitchen
    { name: 'Appliances', category: createdCategories[3]._id },
    { name: 'Cookware', category: createdCategories[3]._id },
    // Sports
    { name: 'Fitness', category: createdCategories[4]._id },
    { name: 'Outdoor', category: createdCategories[4]._id },
    // Beauty
    { name: 'Skincare', category: createdCategories[5]._id },
    { name: 'Haircare', category: createdCategories[5]._id },
    // Toys
    { name: 'Educational', category: createdCategories[6]._id },
    { name: 'Board Games', category: createdCategories[6]._id },
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
    {
      code: 'SUMMER25',
      type: 'percentage',
      value: 25,
      validFrom: new Date(Date.now()),
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 60),
      minimumPurchase: 100,
      maxUsage: 500,
    },
    {
      code: 'FREESHIP',
      type: 'fixed',
      value: 15,
      validFrom: new Date(Date.now()),
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 45),
      minimumPurchase: 75,
      maxUsage: 2000,
    },
    {
      code: 'FLASH50',
      type: 'percentage',
      value: 50,
      validFrom: new Date(Date.now()),
      validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24),
      minimumPurchase: 200,
      maxUsage: 100,
    }
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
    { name: 'Same Day Delivery', carrier: 'FastShip', estimatedDays: '0-1', baseRate: 25 },
    { name: 'International Standard', carrier: 'GlobalPost', estimatedDays: '7-14', baseRate: 20 },
    { name: 'International Express', carrier: 'GlobalExpress', estimatedDays: '3-5', baseRate: 35 }
  ];
  const createdShippings = await ShippingMethod.create(shippings);

  // Tax rules
  const taxes = [
    { 
      name: 'Egypt VAT',
      region: 'EG', 
      rate: 14, 
      type: 'vat', 
      isDefault: true 
    },
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
      paymentMethod: 'paytabs',
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
