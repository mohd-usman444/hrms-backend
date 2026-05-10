const express = require('express');
const router = express.Router();
const { getProfile, updateProfile } = require('../controllers/employeeController');
const protect = require('../middleware/authMiddleware');

router.use(protect);

router.route('/profile').get(getProfile).put(updateProfile);

module.exports = router;
