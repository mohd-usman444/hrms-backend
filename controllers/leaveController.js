const Leave = require('../models/Leave');
const User = require('../models/User');
const Notification = require('../models/Notification');
const sendEmail = require('../utils/sendEmail');

// @desc    Apply for leave
// @route   POST /api/leave/apply
const applyLeave = async (req, res) => {
  try {
    const { leaveType, fromDate, toDate, reason } = req.body;

    const leave = await Leave.create({
      employeeId: req.user._id,
      leaveType,
      fromDate,
      toDate,
      reason,
    });

    res.status(201).json({ message: 'Leave applied successfully', leave });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get logged-in user's leaves
// @route   GET /api/leave/my
const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ employeeId: req.user._id }).sort({
      appliedAt: -1,
    });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all leave requests (Admin)
// @route   GET /api/leave/all
const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find()
      .populate('employeeId', 'name employeeId department')
      .sort({ appliedAt: -1 });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update leave status (Admin)
// @route   PUT /api/leave/:id/status
const updateLeaveStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    leave.status = status;
    await leave.save();

    const updatedLeave = await Leave.findById(leave._id).populate(
      'employeeId',
      'name employeeId department email'
    );

    // Send email notification to employee
    try {
      const message = `Dear ${updatedLeave.employeeId.name},

Your leave request for ${updatedLeave.leaveType} from ${new Date(updatedLeave.fromDate).toLocaleDateString()} to ${new Date(updatedLeave.toDate).toLocaleDateString()} has been ${status.toLowerCase()}.

Status: ${status}

Best regards,
HR Management System`;

      await sendEmail({
        email: updatedLeave.employeeId.email,
        subject: `Leave Request ${status}`,
        message,
        html: `
          <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
            <h2 style="color: ${status === 'Approved' ? '#10b981' : '#ef4444'};">Leave Request ${status}</h2>
            <p>Dear <strong>${updatedLeave.employeeId.name}</strong>,</p>
            <p>Your leave request has been processed.</p>
            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Leave Type:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${updatedLeave.leaveType}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Duration:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;">${new Date(updatedLeave.fromDate).toLocaleDateString()} - ${new Date(updatedLeave.toDate).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Status:</strong></td>
                <td style="padding: 10px; border-bottom: 1px solid #eee;"><span style="color: ${status === 'Approved' ? '#10b981' : '#ef4444'}; font-weight: bold;">${status}</span></td>
              </tr>
            </table>
            <p style="margin-top: 20px;">You can check more details on your <a href="http://localhost:5173/user/leave-status">dashboard</a>.</p>
            <p>Best regards,<br>HR Management System</p>
          </div>
        `,
      });
    } catch (emailError) {
      console.error('Email could not be sent:', emailError.message);
    }

    // Create In-App Notification
    try {
      await Notification.create({
        recipient: updatedLeave.employeeId._id,
        title: `Leave Request ${status}`,
        message: `Your leave request for ${updatedLeave.leaveType} has been ${status.toLowerCase()}.`,
        type: 'Leave',
        link: '/user/leave-status'
      });
    } catch (notifError) {
      console.error('Notification could not be created:', notifError.message);
    }

    res.json({ message: `Leave ${status.toLowerCase()} successfully`, leave: updatedLeave });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { applyLeave, getMyLeaves, getAllLeaves, updateLeaveStatus };
