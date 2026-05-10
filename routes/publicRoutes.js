const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const JobOpening = require('../models/JobOpening');
const Candidate = require('../models/Candidate');
const sendEmail = require('../utils/sendEmail');

// Multer config for resume uploads (same as recruitment)
const uploadsDir = path.join(__dirname, '..', 'uploads', 'resumes');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.doc', '.docx'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, DOCX files are allowed'));
    }
  },
});

// @desc    Get all open job openings (public)
// @route   GET /api/public/jobs
router.get('/jobs', async (req, res) => {
  try {
    const jobs = await JobOpening.find({ status: 'Open' }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Get single job opening (public)
// @route   GET /api/public/jobs/:id
router.get('/jobs/:id', async (req, res) => {
  try {
    const job = await JobOpening.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job opening not found' });
    res.json(job);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Submit job application (public - candidate fills the form)
// @route   POST /api/public/apply
router.post('/apply', upload.single('resume'), async (req, res) => {
  try {
    const { name, email, phone, skills, experience, jobOpening, coverLetter } = req.body;
    const resumePath = req.file ? `/uploads/resumes/${req.file.filename}` : '';

    // Validate job opening exists and is open
    const job = await JobOpening.findById(jobOpening);
    if (!job) return res.status(404).json({ message: 'Job opening not found' });
    if (job.status !== 'Open') return res.status(400).json({ message: 'This job is no longer accepting applications' });

    // Check if already applied with same email for same job
    const existing = await Candidate.findOne({ email: email.toLowerCase(), jobOpening });
    if (existing) {
      return res.status(400).json({ message: 'You have already applied for this position' });
    }

    const candidate = await Candidate.create({
      name,
      email,
      phone,
      resumePath,
      skills: typeof skills === 'string'
        ? skills.split(',').map((s) => s.trim()).filter(Boolean)
        : skills || [],
      experience,
      jobOpening,
      coverLetter: coverLetter || '',
      appliedVia: 'email_link',
    });

    // Send confirmation email to candidate
    try {
      await sendEmail({
        email: candidate.email,
        subject: `Application Received — ${job.title}`,
        html: `
          <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; color: #f1f5f9; border-radius: 12px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 2rem; text-align: center;">
              <h1 style="margin: 0; font-size: 1.5rem; color: white;">Application Received ✅</h1>
            </div>
            <div style="padding: 2rem;">
              <p>Hi <strong>${candidate.name}</strong>,</p>
              <p>Thank you for applying for the <strong>${job.title}</strong> position in the <strong>${job.department}</strong> department.</p>
              <p>Your application has been successfully received and is now under review. Our team will get back to you shortly.</p>
              <div style="background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3); border-radius: 8px; padding: 1rem; margin: 1.5rem 0;">
                <p style="margin: 0 0 0.5rem; color: #94a3b8; font-size: 0.875rem;">Application Summary</p>
                <p style="margin: 0;"><strong>Position:</strong> ${job.title}</p>
                <p style="margin: 0;"><strong>Department:</strong> ${job.department}</p>
                <p style="margin: 0;"><strong>Status:</strong> Applied</p>
              </div>
              <p style="color: #94a3b8; font-size: 0.875rem;">Best regards,<br/>HR Team</p>
            </div>
          </div>
        `,
      });
    } catch (emailErr) {
      console.error('Failed to send confirmation email:', emailErr.message);
    }

    res.status(201).json({ message: 'Application submitted successfully! You will receive a confirmation email shortly.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
