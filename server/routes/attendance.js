const express = require('express');
const db = require('../models/db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get check-in status for today
router.get('/status', verifyToken, (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const record = db.findOne('attendance', { userId: req.user.id, date: todayStr });
  res.json({ clockedIn: !!record, record });
});

// Clock-in endpoint
router.post('/clock-in', verifyToken, (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();
  
  // Verify double clock-in
  const existingRecord = db.findOne('attendance', { userId: req.user.id, date: todayStr });
  if (existingRecord) {
    return res.status(400).json({ message: 'Already clocked in for today.' });
  }

  const employee = db.findOne('employees', { userId: req.user.id });
  if (!employee) {
    return res.status(400).json({ message: 'Employee profile not found.' });
  }

  const checkInRecord = db.create('attendance', {
    userId: req.user.id,
    employeeId: employee.employeeId,
    name: employee.name,
    date: todayStr,
    checkIn: now.toISOString(),
    checkOut: null,
    workingHours: 0,
    overtime: 0,
    status: 'Present'
  });

  res.json({ message: 'Clocked in successfully', record: checkInRecord });
});

// Clock-out endpoint
router.post('/clock-out', verifyToken, (req, res) => {
  const todayStr = new Date().toISOString().split('T')[0];
  const now = new Date();

  const record = db.findOne('attendance', { userId: req.user.id, date: todayStr });
  if (!record) {
    return res.status(400).json({ message: 'You must clock in first before clocking out.' });
  }

  if (record.checkOut) {
    return res.status(400).json({ message: 'Already clocked out for today.' });
  }

  const checkInTime = new Date(record.checkIn);
  const diffMs = now - checkInTime;
  const rawHours = diffMs / (1000 * 60 * 60);
  const workingHours = Math.round(rawHours * 100) / 100; // Keep 2 decimals

  // 8 hours standard day
  const standardHours = 8;
  let overtime = 0;
  if (workingHours > standardHours) {
    overtime = Math.round((workingHours - standardHours) * 100) / 100;
  }

  db.update('attendance', { id: record.id }, {
    checkOut: now.toISOString(),
    workingHours,
    overtime
  });

  const updatedRecord = db.findOne('attendance', { id: record.id });
  res.json({ message: 'Clocked out successfully', record: updatedRecord });
});

// Get user logs
router.get('/logs', verifyToken, (req, res) => {
  const logs = db.find('attendance', { userId: req.user.id });
  // Sort logs by date descending
  logs.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(logs);
});

// Get aggregated monthly reports for Admin/HR
router.get('/reports', verifyToken, requireRole(['Admin', 'HR']), (req, res) => {
  const logs = db.find('attendance');
  logs.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json(logs);
});

module.exports = router;
