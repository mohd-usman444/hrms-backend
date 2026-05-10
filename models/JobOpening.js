const mongoose = require('mongoose');

const jobOpeningSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    department: {
      type: String,
      required: [true, 'Department is required'],
      trim: true,
    },
    requiredSkills: {
      type: [String],
      default: [],
    },
    experience: {
      type: String,
      trim: true,
      default: '',
    },
    vacancies: {
      type: Number,
      required: [true, 'Number of vacancies is required'],
      min: 1,
    },
    status: {
      type: String,
      enum: ['Open', 'Closed'],
      default: 'Open',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('JobOpening', jobOpeningSchema);
