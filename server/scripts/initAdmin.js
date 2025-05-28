const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

async function initAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/calendar-app');
    console.log('Connected to MongoDB');
    
    // First, remove any existing admin user
    console.log('Removing existing admin user...');
    await User.deleteOne({ username: 'admin' });
    console.log('Existing admin user removed');
    
    console.log('Creating new admin user...');
    const adminUser = new User({
      username: 'admin',
      password: 'admin123',
      isAdmin: true
    });

    await adminUser.save();
    console.log('Admin user created successfully');
    
    // Verify the user was created
    const savedUser = await User.findOne({ username: 'admin' });
    console.log('Verification - Admin user exists:', savedUser ? 'Yes' : 'No');
    if (savedUser) {
      console.log('Admin user details:', {
        username: savedUser.username,
        isAdmin: savedUser.isAdmin,
        id: savedUser._id
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

initAdmin(); 