const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/recruitmentController');
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('admin'));

// Job Openings
router.route('/jobs').get(getAllJobOpenings).post(createJobOpening);
router.route('/jobs/:id').put(updateJobOpening).delete(deleteJobOpening);

// Candidates
router.route('/candidates').get(getAllCandidates).post(upload.single('resume'), addCandidate);
router.route('/candidates/:id').get(getCandidateById);
router.route('/candidates/:id/status').put(updateCandidateStatus);
router.route('/candidates/:id/interview').put(scheduleInterview);
router.route('/candidates/:id/feedback').put(addInterviewFeedback);
router.route('/candidates/:id/hire').put(hireCandidate);
router.route('/send-invite').post(sendApplicationInvite);

module.exports = router;
