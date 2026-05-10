const User = require('../models/User');
const bcrypt = require('bcryptjs');

// @desc    Get all employees
// @route   GET /api/admin/employees
const getAllEmployees = async (req, res) => {
  try {
    const { search, department } = req.query;
    let filter = { role: 'user' };

    if (department) {
      filter.department = { $regex: department, $options: 'i' };
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { employeeId: { $regex: search, $options: 'i' } },
      ];
    }

    const employees = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 });

    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get single employee
// @route   GET /api/admin/employees/:id
const getEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id).select('-password');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add new employee
// @route   POST /api/admin/employees
const addEmployee = async (req, res) => {
  try {
    const { name, employeeId, email, phone, department, role, joinDate, password } = req.body;

    const existingUser = await User.findOne({
      $or: [{ email }, { employeeId }],
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'Email or Employee ID already exists' });
    }

    const user = await User.create({
      name,
      employeeId,
      email,
      phone,
      department,
      role: role || 'user',
      joinDate: joinDate || Date.now(),
      password,
    });

    const userResponse = await User.findById(user._id).select('-password');
    res.status(201).json({ message: 'Employee added successfully', employee: userResponse });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Remove employee
// @route   DELETE /api/admin/employees/:id
const removeEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Employee removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getAllEmployees, getEmployee, addEmployee, removeEmployee };
