const Attendance = require('../models/Attendance');
const User = require('../models/User');

// @desc    Mark attendance (employee)
// @route   POST /api/attendance/mark
const markAttendance = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already marked today
    const existing = await Attendance.findOne({
      employeeId: req.user._id,
      date: today,
    });

    if (existing) {
      return res
        .status(400)
        .json({ message: 'Attendance already marked for today' });
    }

    const attendance = await Attendance.create({
      employeeId: req.user._id,
      date: today,
      checkIn: new Date(),
      status: 'Present',
    });

    res.status(201).json({ message: 'Attendance marked successfully', attendance });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get own attendance records
// @route   GET /api/attendance/my
const getMyAttendance = async (req, res) => {
  try {
    // Last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    thirtyDaysAgo.setHours(0, 0, 0, 0);

    const records = await Attendance.find({
      employeeId: req.user._id,
      date: { $gte: thirtyDaysAgo },
    }).sort({ date: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all attendance records (Admin)
// @route   GET /api/attendance/all
const getAllAttendance = async (req, res) => {
  try {
    const { search, department, fromDate, toDate } = req.query;
    
    // Normalize dates to full day in local time to ensure matching
    const start = new Date(fromDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(toDate || fromDate);
    end.setHours(23, 59, 59, 999);

    let filter = {
      date: { $gte: start, $lte: end }
    };

    let records = await Attendance.find(filter)
      .populate('employeeId', 'name employeeId department')
      .sort({ date: -1 });

    // Filter by search or department after populate
    if (search) {
      records = records.filter(
        (r) =>
          r.employeeId &&
          (r.employeeId.name.toLowerCase().includes(search.toLowerCase()) ||
            r.employeeId.employeeId
              .toLowerCase()
              .includes(search.toLowerCase()))
      );
    }

    if (department) {
      records = records.filter(
        (r) =>
          r.employeeId &&
          r.employeeId.department
            .toLowerCase()
            .includes(department.toLowerCase())
      );
    }

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { markAttendance, getMyAttendance, getAllAttendance };
