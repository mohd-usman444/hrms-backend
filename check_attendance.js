const mongoose = require('mongoose');
const Attendance = require('./models/Attendance');
const User = require('./models/User');


mongoose.connect('mongodb://localhost:27017/hrms')
  .then(async () => {
    console.log('Connected to DB');
    const attendance = await Attendance.find({}).populate('employeeId', 'name');
    console.log('All Attendance Records:');
    attendance.forEach(a => console.log(`- Date: ${a.date}, Employee: ${a.employeeId?.name}, Status: ${a.status}`));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
