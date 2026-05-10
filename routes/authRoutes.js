const express = require('express');
const router = express.Router();
const {
  adminSignup,
  adminSignin,
  userSignup,
  userSignin,
} = require('../controllers/authController');

router.post('/admin/signup', adminSignup);
router.post('/admin/signin', adminSignin);
router.post('/user/signup', userSignup);
router.post('/user/signin', userSignin);

module.exports = router;
