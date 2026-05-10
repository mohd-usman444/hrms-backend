const JobOpening = require('../models/JobOpening');
const Candidate = require('../models/Candidate');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Multer config for resume uploads
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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

// ===== JOB OPENINGS =====

// @desc    Create job opening
// @route   POST /api/recruitment/jobs
const createJobOpening = async (req, res) => {
  try {
    const { title, department, requiredSkills, experience, vacancies, description } = req.body;
    const job = await JobOpening.create({
      title,
      department,
      requiredSkills: typeof requiredSkills === 'string'
        ? requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
        : requiredSkills || [],
      experience,
      vacancies,
      description,
    });
    res.status(201).json({ message: 'Job opening created successfully', job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all job openings
// @route   GET /api/recruitment/jobs
const getAllJobOpenings = async (req, res) => {
  try {
    const { search, status } = req.query;
    let filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }
    const jobs = await JobOpening.find(filter).sort({ createdAt: -1 });

    // Attach candidate count to each job
    const jobsWithCounts = await Promise.all(
      jobs.map(async (job) => {
        const candidateCount = await Candidate.countDocuments({ jobOpening: job._id });
        return { ...job.toObject(), candidateCount };
      })
    );

    res.json(jobsWithCounts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update job opening
// @route   PUT /api/recruitment/jobs/:id
const updateJobOpening = async (req, res) => {
  try {
    const { title, department, requiredSkills, experience, vacancies, status, description } = req.body;
    const job = await JobOpening.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job opening not found' });

    if (title) job.title = title;
    if (department) job.department = department;
    if (requiredSkills) {
      job.requiredSkills = typeof requiredSkills === 'string'
        ? requiredSkills.split(',').map((s) => s.trim()).filter(Boolean)
        : requiredSkills;
    }
    if (experience !== undefined) job.experience = experience;
    if (vacancies) job.vacancies = vacancies;
    if (status) job.status = status;
    if (description !== undefined) job.description = description;

    await job.save();
    res.json({ message: 'Job opening updated successfully', job });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete job opening
// @route   DELETE /api/recruitment/jobs/:id
const deleteJobOpening = async (req, res) => {
  try {
    const job = await JobOpening.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job opening not found' });
    await JobOpening.findByIdAndDelete(req.params.id);
    // Also remove all candidates for this job
    await Candidate.deleteMany({ jobOpening: req.params.id });
    res.json({ message: 'Job opening deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===== CANDIDATES =====

// @desc    Add candidate (with resume upload)
// @route   POST /api/recruitment/candidates
const addCandidate = async (req, res) => {
  try {
    const { name, email, phone, skills, experience, jobOpening } = req.body;
    const resumePath = req.file ? `/uploads/resumes/${req.file.filename}` : '';

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
    });

    const populated = await Candidate.findById(candidate._id).populate('jobOpening', 'title department');
    res.status(201).json({ message: 'Candidate added successfully', candidate: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all candidates
// @route   GET /api/recruitment/candidates
const getAllCandidates = async (req, res) => {
  try {
    const { jobOpening, status, search } = req.query;
    let filter = {};
    if (jobOpening) filter.jobOpening = jobOpening;
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const candidates = await Candidate.find(filter)
      .populate('jobOpening', 'title department')
      .sort({ createdAt: -1 });

    res.json(candidates);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single candidate
// @route   GET /api/recruitment/candidates/:id
const getCandidateById = async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id).populate('jobOpening', 'title department');
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });
    res.json(candidate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update candidate status
// @route   PUT /api/recruitment/candidates/:id/status
const updateCandidateStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    candidate.status = status;
    await candidate.save();

    const populated = await Candidate.findById(candidate._id).populate('jobOpening', 'title department');
    res.json({ message: `Candidate status updated to ${status}`, candidate: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Schedule interview
// @route   PUT /api/recruitment/candidates/:id/interview
const scheduleInterview = async (req, res) => {
  try {
    const { date, time, interviewer } = req.body;
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    candidate.interview.date = date || candidate.interview.date;
    candidate.interview.time = time || candidate.interview.time;
    candidate.interview.interviewer = interviewer || candidate.interview.interviewer;

    if (candidate.status === 'Shortlisted') {
      candidate.status = 'Interview';
    }

    await candidate.save();
    const populated = await Candidate.findById(candidate._id).populate('jobOpening', 'title department');
    res.json({ message: 'Interview scheduled successfully', candidate: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add interview feedback
// @route   PUT /api/recruitment/candidates/:id/feedback
const addInterviewFeedback = async (req, res) => {
  try {
    const { rating, comments } = req.body;
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    candidate.interview.feedback.rating = rating;
    candidate.interview.feedback.comments = comments;
    await candidate.save();

    const populated = await Candidate.findById(candidate._id).populate('jobOpening', 'title department');
    res.json({ message: 'Feedback added successfully', candidate: populated });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Hire candidate (create employee)
// @route   PUT /api/recruitment/candidates/:id/hire
const hireCandidate = async (req, res) => {
  try {
    const { employeeId, password, department, joinDate } = req.body;
    const candidate = await Candidate.findById(req.params.id).populate('jobOpening', 'title department');
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    // Check if email or employeeId already exists
    const existing = await User.findOne({
      $or: [{ email: candidate.email }, { employeeId }],
    });
    if (existing) {
      return res.status(400).json({ message: 'Email or Employee ID already exists in the system' });
    }

    // Create employee
    await User.create({
      name: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      employeeId,
      password,
      department: department || candidate.jobOpening?.department || '',
      role: 'user',
      joinDate: joinDate || Date.now(),
    });

    candidate.status = 'Hired';
    await candidate.save();

    res.json({ message: `${candidate.name} has been hired and added as an employee!` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send application invite email to a candidate
// @route   POST /api/recruitment/send-invite
const sendApplicationInvite = async (req, res) => {
  try {
    const { email, jobId, candidateName } = req.body;

    if (!email || !jobId) {
      return res.status(400).json({ message: 'Email and job ID are required' });
    }

    const job = await JobOpening.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job opening not found' });

    // Build the public application link
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const applyLink = `${clientUrl}/careers/apply/${job._id}`;

    await sendEmail({
      email,
      subject: `You're Invited to Apply — ${job.title}`,
      html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f0f1a; color: #f1f5f9; border-radius: 12px; overflow: hidden;">
          <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 2.5rem 2rem; text-align: center;">
            <h1 style="margin: 0; font-size: 1.75rem; color: white;">Job Opportunity 🚀</h1>
            <p style="margin: 0.5rem 0 0; color: rgba(255,255,255,0.85); font-size: 1rem;">We'd love to have you on our team!</p>
          </div>
          <div style="padding: 2rem;">
            <p>Hi${candidateName ? ' <strong>' + candidateName + '</strong>' : ''},</p>
            <p>We have an exciting opening that matches your profile. We'd love for you to apply!</p>
            <div style="background: rgba(99,102,241,0.1); border: 1px solid rgba(99,102,241,0.3); border-radius: 8px; padding: 1.25rem; margin: 1.5rem 0;">
              <h2 style="margin: 0 0 0.5rem; font-size: 1.25rem; color: #6366f1;">${job.title}</h2>
              <p style="margin: 0 0 0.25rem;"><strong>Department:</strong> ${job.department}</p>
              ${job.experience ? '<p style="margin: 0 0 0.25rem;"><strong>Experience:</strong> ' + job.experience + '</p>' : ''}
              ${job.requiredSkills.length > 0 ? '<p style="margin: 0;"><strong>Skills:</strong> ' + job.requiredSkills.join(', ') + '</p>' : ''}
              ${job.description ? '<p style="margin: 0.5rem 0 0; color: #94a3b8; font-size: 0.875rem;">' + job.description + '</p>' : ''}
            </div>
            <div style="text-align: center; margin: 2rem 0;">
              <a href="${applyLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 0.875rem 2.5rem; border-radius: 8px; font-weight: 600; font-size: 1rem; box-shadow: 0 4px 15px rgba(99,102,241,0.3);">Apply Now →</a>
            </div>
            <p style="color: #94a3b8; font-size: 0.875rem;">Or copy this link: <a href="${applyLink}" style="color: #6366f1;">${applyLink}</a></p>
            <hr style="border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 1.5rem 0;" />
            <p style="color: #94a3b8; font-size: 0.8rem;">Best regards,<br/>HR Team</p>
          </div>
        </div>
      `,
    });

    res.json({ message: `Application invite sent to ${email}` });
  } catch (error) {
    console.error('Send invite error:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  upload,
  createJobOpening,
  getAllJobOpenings,
  updateJobOpening,
  deleteJobOpening,
  addCandidate,
  getAllCandidates,
  getCandidateById,
  updateCandidateStatus,
  scheduleInterview,
  addInterviewFeedback,
  hireCandidate,
  sendApplicationInvite,
};
