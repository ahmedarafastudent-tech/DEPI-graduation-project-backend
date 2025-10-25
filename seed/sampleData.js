const mongoose = require("mongoose");
const dotenv = require("dotenv");
const users = require("./data/users");
const products = require("./data/products");
const User = require("../models/userModel");
const Product = require("../models/productModel");
const connectDB = require("../config/db");

dotenv.config();
connectDB();

const importData = async () => {
  await User.deleteMany();
  await Product.deleteMany();
  const createdUsers = await User.insertMany(users);
  const adminUser = createdUsers[0]._id;
  const sampleProducts = products.map((p) => ({ ...p, user: adminUser }));
  await Product.insertMany(sampleProducts);
  console.log("Data Imported!");
  process.exit();
};

importData();
