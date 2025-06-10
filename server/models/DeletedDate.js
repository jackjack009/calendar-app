const mongoose = require('mongoose');

const deletedDateSchema = new mongoose.Schema({
  date: {
    type: String,
    required: true,
    unique: true,
  },
});

module.exports = mongoose.model('DeletedDate', deletedDateSchema); 