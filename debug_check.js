const mongoose = require('mongoose');
const Notification = require('./models/Notification');
const Leave = require('./models/Leave');
const dotenv = require('dotenv');

dotenv.config();

const checkData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const notifs = await Notification.find().sort({ createdAt: -1 }).limit(5);
    console.log('Recent Notifications:', JSON.stringify(notifs, null, 2));

    const leaves = await Leave.find().sort({ updatedAt: -1 }).limit(5);
    console.log('Recent Leaves:', JSON.stringify(leaves, null, 2));

    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

checkData();
