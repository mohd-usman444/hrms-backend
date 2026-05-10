const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone is required'],
      trim: true,
    },
    resumePath: {
      type: String,
      default: '',
    },
    skills: {
      type: [String],
      default: [],
    },
    experience: {
      type: String,
      trim: true,
      default: '',
    },
    coverLetter: {
      type: String,
      default: '',
    },
    appliedVia: {
      type: String,
      enum: ['admin', 'email_link'],
      default: 'admin',
    },
    jobOpening: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobOpening',
      required: [true, 'Job opening is required'],
    },
    status: {
      type: String,
      enum: ['Applied', 'Shortlisted', 'Interview', 'Selected', 'Rejected', 'Hired'],
      default: 'Applied',
    },
    interview: {
      date: { type: String, default: '' },
      time: { type: String, default: '' },
      interviewer: { type: String, default: '' },
      feedback: {
        rating: { type: Number, min: 1, max: 5, default: null },
        comments: { type: String, default: '' },
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Candidate', candidateSchema);
