const User = require('../models/User');

// @desc    Get own profile
// @route   GET /api/employee/profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update own profile
// @route   PUT /api/employee/profile
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Users can only update phone
    if (req.body.phone !== undefined) {
      user.phone = req.body.phone;
    }

    const updatedUser = await user.save();
    const userResponse = await User.findById(updatedUser._id).select('-password');
    res.json(userResponse);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProfile, updateProfile };
