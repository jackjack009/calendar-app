const express = require('express');
const router = express.Router();
const DeletedDate = require('../models/DeletedDate');
const { auth } = require('./auth');

// Get all deleted dates
router.get('/', async (req, res) => {
  try {
    const deletedDates = await DeletedDate.find();
    res.json(deletedDates.map(item => item.date));
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Add a date to deleted list (Admin only)
router.post('/', auth, async (req, res) => {
  const { date } = req.body;

  try {
    let deletedDate = await DeletedDate.findOne({ date });

    if (deletedDate) {
      return res.status(400).json({ msg: 'Date already deleted' });
    }

    deletedDate = new DeletedDate({
      date,
    });

    await deletedDate.save();
    res.status(201).json(deletedDate);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Remove a date from deleted list (Admin only)
router.delete('/:date', auth, async (req, res) => {
  try {
    const date = req.params.date;
    const result = await DeletedDate.deleteOne({ date });

    if (result.deletedCount === 0) {
      return res.status(404).json({ msg: 'Date not found in deleted list' });
    }

    res.json({ msg: 'Date restored successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router; 