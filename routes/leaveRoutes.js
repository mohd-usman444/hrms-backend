const express = require('express');
const router = express.Router();
const {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
} = require('../controllers/leaveController');
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

router.use(protect);

// Employee routes
router.post('/apply', authorize('user'), applyLeave);
router.get('/my', authorize('user'), getMyLeaves);

// Admin routes
router.get('/all', authorize('admin'), getAllLeaves);
router.put('/:id/status', authorize('admin'), updateLeaveStatus);

module.exports = router;
