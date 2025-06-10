const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/auth');
const slotRoutes = require('./routes/slots');
const dateTitleRoutes = require('./routes/dateTitles');
const deletedDateRoutes = require('./routes/deletedDates');
const User = require('./models/User');

dotenv.config();

const app = express();

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://calendar-app-two-lovat.vercel.app',  // Remove trailing slash
  process.env.FRONTEND_URL,
  'https://calendar-availability.vercel.app',
  'https://www.jackjack.cc',
  'https://jackjack.cc'
].filter(Boolean);

app.use(cors({
  origin: function(origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.use(express.json());

// Database connection with additional options
const connectDB = async () => {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      retryWrites: true,
      w: 'majority'
    });
    console.log('Connected to MongoDB');

    // Check for admin user and create or update if not exists
    let admin = await User.findOne({ username: 'jackjack' });
    if (!admin) {
      admin = new User({
        username: 'jackjack',
        password: 'jackjack123456',
        isAdmin: true
      });
      await admin.save();
      console.log('Admin user created successfully');
    } else {
      admin.password = 'jackjack123456';
      await admin.save();
      console.log('Admin user password updated successfully');
    }
  } catch (err) {
    console.error('MongoDB connection error:', err);
    if (err.name === 'MongoServerError' && err.code === 8000) {
      console.error('Authentication failed. Please check your MongoDB username and password.');
    }
    process.exit(1);
  }
};

connectDB();

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/slots', slotRoutes);
app.use('/api/date-titles', dateTitleRoutes);
app.use('/api/deleted-dates', deletedDateRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 