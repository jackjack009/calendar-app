const mongoose = require('mongoose');

const dateTitleSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model('DateTitle', dateTitleSchema); 