const express = require('express');
const db = require('../models/db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get leave history for logged in user
router.get('/history', verifyToken, (req, res) => {
  const history = db.find('leaves', { userId: req.user.id });
  history.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
  res.json(history);
});

// Get leave balances for logged in user
router.get('/balance', verifyToken, (req, res) => {
  const record = db.findOne('leave_balances', { userId: req.user.id });
  if (!record) {
    // If none exists, create default balances
    const defaultLeaves = {
      'Casual Leave': { allowed: 12, used: 0 },
      'Sick Leave': { allowed: 10, used: 0 },
      'Paid Leave': { allowed: 15, used: 0 },
      'Unpaid Leave': { allowed: 30, used: 0 }
    };
    const employee = db.findOne('employees', { userId: req.user.id });
    const empId = employee ? employee.employeeId : 'EMP_UNK';
    const newRecord = db.create('leave_balances', { userId: req.user.id, employeeId: empId, balances: defaultLeaves });
    return res.json(newRecord.balances);
  }
  res.json(record.balances);
});

// Apply for leave
router.post('/apply', verifyToken, (req, res) => {
  const { leaveType, startDate, endDate, reason } = req.body;

  if (!leaveType || !startDate || !endDate || !reason) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Calculate requested days
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (end < start) {
    return res.status(400).json({ message: 'End date cannot be earlier than start date.' });
  }
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  // Retrieve leave balances
  let balanceRecord = db.findOne('leave_balances', { userId: req.user.id });
  if (!balanceRecord) {
    const defaultLeaves = {
      'Casual Leave': { allowed: 12, used: 0 },
      'Sick Leave': { allowed: 10, used: 0 },
      'Paid Leave': { allowed: 15, used: 0 },
      'Unpaid Leave': { allowed: 30, used: 0 }
    };
    const employee = db.findOne('employees', { userId: req.user.id });
    const empId = employee ? employee.employeeId : 'EMP_UNK';
    balanceRecord = db.create('leave_balances', { userId: req.user.id, employeeId: empId, balances: defaultLeaves });
  }

  const category = balanceRecord.balances[leaveType];
  if (!category) {
    return res.status(400).json({ message: 'Invalid leave type chosen.' });
  }

  const remaining = category.allowed - category.used;
  if (diffDays > remaining) {
    return res.status(400).json({ 
      message: `Insufficient leave balance. Requested: ${diffDays} days, Remaining: ${remaining} days.` 
    });
  }

  const employee = db.findOne('employees', { userId: req.user.id });
  
  const leaveRequest = db.create('leaves', {
    userId: req.user.id,
    employeeId: employee ? employee.employeeId : 'EMP_UNK',
    name: req.user.name,
    leaveType,
    startDate,
    endDate,
    reason,
    days: diffDays,
    status: 'Pending'
  });

  res.status(201).json({ message: 'Leave request submitted successfully', leave: leaveRequest });
});

// Get all leave requests (HR/Admin only)
router.get('/requests', verifyToken, requireRole(['Admin', 'HR']), (req, res) => {
  const requests = db.find('leaves');
  requests.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(requests);
});

// HR review (Approve / Reject) leave
router.post('/action/:id', verifyToken, requireRole(['Admin', 'HR']), (req, res) => {
  const { status } = req.body; // 'Approved' or 'Rejected'
  
  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be Approved or Rejected.' });
  }

  const leave = db.findOne('leaves', { id: req.params.id });
  if (!leave) {
    return res.status(404).json({ message: 'Leave request not found.' });
  }

  if (leave.status !== 'Pending') {
    return res.status(400).json({ message: `Leave request has already been ${leave.status}.` });
  }

  db.update('leaves', { id: leave.id }, { status });

  if (status === 'Approved') {
    // Deduct leave balance
    const balanceRecord = db.findOne('leave_balances', { userId: leave.userId });
    if (balanceRecord && balanceRecord.balances[leave.leaveType]) {
      const balances = { ...balanceRecord.balances };
      balances[leave.leaveType].used += leave.days;
      db.update('leave_balances', { id: balanceRecord.id }, { balances });
    }
  }

  // Notify Employee
  db.create('notifications', {
    userId: leave.userId,
    title: `Leave Request ${status}`,
    message: `Your requested leave for ${leave.days} days (${leave.startDate} to ${leave.endDate}) has been ${status.toLowerCase()} by HR.`,
    read: false
  });

  res.json({ message: `Leave request ${status.toLowerCase()} successfully.` });
});

// Cancel Leave (Employee self-action if pending)
router.post('/cancel/:id', verifyToken, (req, res) => {
  const leave = db.findOne('leaves', { id: req.params.id, userId: req.user.id });
  if (!leave) {
    return res.status(404).json({ message: 'Leave request not found.' });
  }

  if (leave.status !== 'Pending') {
    return res.status(400).json({ message: `Cannot cancel leave request that is already ${leave.status}.` });
  }

  db.delete('leaves', { id: leave.id });
  res.json({ message: 'Leave request cancelled successfully.' });
});

module.exports = router;
