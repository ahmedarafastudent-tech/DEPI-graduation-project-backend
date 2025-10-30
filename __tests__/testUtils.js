
const mongoose = require('mongoose');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const request = (app) => global.request || require('supertest')(app);
const generateToken = require('../utils/generateToken');

async function createUserAndToken(app, { isAdmin = false, email = null, password = 'Test123!' } = {}) {
  const uniqueEmail = email || `test+${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
  // For admin users, ensure their ID ends with 'a'
  const userId = isAdmin 
    ? new mongoose.Types.ObjectId().toString().slice(0, -1) + 'a'
    : new mongoose.Types.ObjectId();
    
  const user = await User.create({
    _id: userId,
    name: isAdmin ? 'Admin User' : 'Test User',
    email: uniqueEmail,
    password,
    isAdmin,
    isVerified: true,
  });

  const token = generateToken(user._id);
  return { user, token };
}

async function createProduct(attrs = {}) {
  const defaults = {
    name: `Product ${Date.now()}`,
    description: 'Test Desc',
    price: 9.99,
    countInStock: 10,
    seller: mongoose.Types.ObjectId(),
  };
  const product = await Product.create({ ...defaults, ...attrs });
  return product;
}

module.exports = {
  createUserAndToken,
  createProduct,
  request,
};