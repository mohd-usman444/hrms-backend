const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getMyAttendance,
  getAllAttendance,
} = require('../controllers/attendanceController');
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

router.use(protect);

// Employee routes
router.post('/mark', authorize('user'), markAttendance);
router.get('/my', authorize('user'), getMyAttendance);

// Admin routes
router.get('/all', authorize('admin'), getAllAttendance);

module.exports = router;
