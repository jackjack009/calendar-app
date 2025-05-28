const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  hour: {
    type: Number,
    required: true,
    min: 10,
    max: 17
  },
  slotNumber: {
    type: Number,
    required: true,
    min: 0,
    max: 3
  },
  isAvailable: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });

// Compound index to ensure unique slots
timeSlotSchema.index({ date: 1, hour: 1, slotNumber: 1 }, { unique: true });

module.exports = mongoose.model('TimeSlot', timeSlotSchema); 