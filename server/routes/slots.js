const express = require('express');
const router = express.Router();
const TimeSlot = require('../models/TimeSlot');
const { auth, isAdmin } = require('./auth');

// Get slots for a specific week (auto-initialize if missing)
router.get('/week/:date', async (req, res) => {
  try {
    console.log('Backend: Received request for slots for date:', req.params.date);
    const date = new Date(req.params.date);
    // Find the Sunday of the week
    const sunday = new Date(date);
    sunday.setDate(date.getDate() - date.getDay());
    sunday.setHours(0, 0, 0, 0);

    // Find all slots for this Sunday
    console.log('Backend: Attempting to find existing slots for:', sunday.toISOString().split('T')[0]);
    let slots = await TimeSlot.find({
      date: {
        $gte: sunday,
        $lt: new Date(sunday.getTime() + 24 * 60 * 60 * 1000)
      }
    }).sort({ hour: 1, slotNumber: 1 });
    console.log('Backend: Found', slots.length, 'existing slots for', sunday.toISOString().split('T')[0]);

    // If slots don't exist, create them
    if (slots.length === 0) {
      console.log('Backend: Initializing new slots for:', sunday.toISOString().split('T')[0]);
      const newSlots = [];
      for (let hour = 10; hour <= 17; hour++) {
        for (let slotNumber = 0; slotNumber < 4; slotNumber++) {
          const slotDate = new Date(sunday);
          slotDate.setHours(hour, slotNumber * 15, 0, 0);
          newSlots.push({
            date: slotDate,
            hour,
            slotNumber,
            isAvailable: true
          });
        }
      }
      console.log('Backend: Attempting to insert new slots.');
      await TimeSlot.insertMany(newSlots);
      console.log('Backend: New slots inserted.');
      // Fetch again to return with _id fields
      console.log('Backend: Re-fetching newly inserted slots.');
      slots = await TimeSlot.find({
        date: {
          $gte: sunday,
          $lt: new Date(sunday.getTime() + 24 * 60 * 60 * 1000)
        }
      }).sort({ hour: 1, slotNumber: 1 });
      console.log('Backend: Newly initialized slots retrieved:', slots.length);
    }

    res.json(slots);
    console.log('Backend: Response sent for slots.');
  } catch (error) {
    console.error('Backend: Server error fetching/initializing slots:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get slots for a specific date (YYYY-MM-DD)
router.get('/', async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ message: 'Missing date parameter' });
    }
    const target = new Date(date);
    target.setHours(0, 0, 0, 0);
    const nextDay = new Date(target);
    nextDay.setDate(target.getDate() + 1);
    const slots = await TimeSlot.find({
      date: {
        $gte: target,
        $lt: nextDay
      }
    }).sort({ hour: 1, slotNumber: 1 });
    res.json(slots);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle slot availability (admin only)
router.patch('/:id', auth, isAdmin, async (req, res) => {
  try {
    const slot = await TimeSlot.findById(req.params.id);
    if (!slot) {
      return res.status(404).json({ message: 'Slot not found' });
    }

    slot.isAvailable = !slot.isAvailable;
    await slot.save();

    res.json(slot);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Initialize slots for a week (admin only) - can be removed if not needed
router.post('/initialize', auth, isAdmin, async (req, res) => {
  try {
    const { startDate } = req.body;
    const date = new Date(startDate);
    const slots = [];

    // Create slots for Sunday only
    for (let hour = 10; hour <= 17; hour++) {
      for (let slotNumber = 0; slotNumber < 4; slotNumber++) {
        const slotDate = new Date(date);
        slotDate.setHours(hour, slotNumber * 15, 0, 0);
        
        slots.push({
          date: slotDate,
          hour,
          slotNumber,
          isAvailable: true
        });
      }
    }

    await TimeSlot.insertMany(slots, { ordered: false });
    res.json({ message: 'Slots initialized successfully' });
  } catch (error) {
    if (error.code === 11000) {
      res.status(400).json({ message: 'Slots already exist for this week' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});

module.exports = router; 