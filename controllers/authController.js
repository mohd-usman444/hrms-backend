const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Register admin
// @route   POST /api/auth/admin/signup
const adminSignup = async (req, res) => {
  try {
    const { name, email, password, adminSecretKey } = req.body;

    if (adminSecretKey !== process.env.ADMIN_SECRET_KEY) {
      return res.status(403).json({ message: 'Invalid admin secret key' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // Generate a unique employee ID for admin
    const employeeId = 'ADMIN-' + Date.now().toString(36).toUpperCase();

    const user = await User.create({
      name,
      email,
      password,
      employeeId,
      role: 'admin',
      department: 'Management',
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login admin
// @route   POST /api/auth/admin/signin
const adminSignin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, role: 'admin' });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Register employee
// @route   POST /api/auth/user/signup
const userSignup = async (req, res) => {
  try {
    const { name, employeeId, email, password, department } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { employeeId }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'Email or Employee ID already registered' });
    }

    const user = await User.create({
      name,
      employeeId,
      email,
      password,
      department,
      role: 'user',
    });

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      employeeId: user.employeeId,
      role: user.role,
      department: user.department,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Login employee
// @route   POST /api/auth/user/signin
const userSignin = async (req, res) => {
  try {
    const { employeeId, password } = req.body;

    const user = await User.findOne({ employeeId, role: 'user' });
    if (!user) {
      return res
        .status(401)
        .json({ message: 'Invalid Employee ID or password' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: 'Invalid Employee ID or password' });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      employeeId: user.employeeId,
      role: user.role,
      department: user.department,
      token: generateToken(user._id, user.role),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { adminSignup, adminSignin, userSignup, userSignin };
