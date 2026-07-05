const mongoose = require('mongoose');

const wordSchema = new mongoose.Schema(
  {
    word: { type: String, required: true, trim: true, lowercase: true, index: true },
    category: { type: String, required: true, trim: true, lowercase: true, index: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  },
  { timestamps: true }
);

wordSchema.index({ word: 1, category: 1 }, { unique: true });

module.exports = mongoose.models.Word || mongoose.model('Word', wordSchema);
