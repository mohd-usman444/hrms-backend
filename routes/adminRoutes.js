const express = require('express');
const router = express.Router();
const {
  getAllEmployees,
  getEmployee,
  addEmployee,
  removeEmployee,
} = require('../controllers/adminController');
const protect = require('../middleware/authMiddleware');
const authorize = require('../middleware/roleMiddleware');

router.use(protect);
router.use(authorize('admin'));

router.route('/employees').get(getAllEmployees).post(addEmployee);
router.route('/employees/:id').get(getEmployee).delete(removeEmployee);

module.exports = router;
