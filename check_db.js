const mongoose = require('mongoose');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/hrms')
  .then(async () => {
    console.log('Connected to DB');
    const users = await User.find({});
    console.log('All Users:');
    users.forEach(u => console.log(`- Role: ${u.role}, Email: ${u.email}, EmpID: ${u.employeeId}, Name: ${u.name}`));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
