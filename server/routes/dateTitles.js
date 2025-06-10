const express = require('express');
const router = express.Router();
const DateTitle = require('../models/DateTitle');
const { auth } = require('./auth');

// Get all date titles
router.get('/', async (req, res) => {
  try {
    const dateTitles = await DateTitle.find();
    res.json(dateTitles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Create or update a date title (Admin only)
router.post('/', auth, async (req, res) => {
  const { date, title } = req.body;
  console.log(`Received request to save date title for ${date}: ${title}`);

  try {
    let dateTitle = await DateTitle.findOne({ date });

    if (dateTitle) {
      // Update existing title
      dateTitle.title = title;
      await dateTitle.save();
      return res.json(dateTitle);
    } else {
      // Create new title
      dateTitle = new DateTitle({
        date,
        title,
      });
      await dateTitle.save();
      return res.status(201).json(dateTitle);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 