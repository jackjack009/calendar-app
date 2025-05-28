const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function initAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/calendar-app');
    
    // First, remove any existing admin user
    await User.deleteOne({ username: 'admin' });
    
    const adminUser = new User({
      username: 'admin',
      password: 'admin123',
      isAdmin: true
    });

    await adminUser.save();
    console.log('Admin user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

initAdmin(); 