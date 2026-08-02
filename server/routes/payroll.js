const express = require('express');
const db = require('../models/db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get employee's own payslips
router.get('/history', verifyToken, (req, res) => {
  const slips = db.find('payroll', { userId: req.user.id });
  slips.sort((a, b) => b.month.localeCompare(a.month));
  res.json(slips);
});

// Get all payslips (HR/Admin only)
router.get('/all', verifyToken, requireRole(['Admin', 'HR']), (req, res) => {
  const slips = db.find('payroll');
  slips.sort((a, b) => b.month.localeCompare(a.month) || b.employeeId.localeCompare(a.employeeId));
  res.json(slips);
});

// Run monthly payroll for all employees (HR/Admin only)
router.post('/run', verifyToken, requireRole(['Admin', 'HR']), (req, res) => {
  const { month, bonusOverrides = {}, deductionOverrides = {} } = req.body; // month format: '2026-08'

  if (!month) {
    return res.status(400).json({ message: 'Month designation is required (YYYY-MM).' });
  }

  // Check if payroll already run for this month
  const existingSlips = db.find('payroll', { month });
  if (existingSlips.length > 0) {
    return res.status(400).json({ message: `Payroll has already been processed for ${month}.` });
  }

  const employees = db.find('employees', { status: 'Active' });
  if (employees.length === 0) {
    return res.status(400).json({ message: 'No active employees found to process.' });
  }

  const processedSlips = [];

  employees.forEach(emp => {
    const basic = emp.salary;
    const allowance = Math.round(basic * 0.15 * 100) / 100; // 15% allowance
    const bonus = Number(bonusOverrides[emp.employeeId]) || Math.round(basic * 0.05 * 100) / 100; // 5% bonus default
    const deductions = Number(deductionOverrides[emp.employeeId]) || Math.round(basic * 0.02 * 100) / 100; // 2% deduction default

    const gross = basic + allowance + bonus;
    const tax = Math.round(gross * 0.10 * 100) / 100; // 10% tax rate
    const netSalary = Math.round((gross - deductions - tax) * 100) / 100;

    const slip = db.create('payroll', {
      userId: emp.userId,
      employeeId: emp.employeeId,
      name: emp.name,
      month,
      basic,
      allowance,
      bonus,
      deductions,
      tax,
      netSalary,
      processedDate: new Date().toISOString().split('T')[0]
    });

    processedSlips.push(slip);

    // Notify employee
    db.create('notifications', {
      userId: emp.userId,
      title: 'Salary Slip Released',
      message: `Your payslip for ${month} has been processed. Net Salary: $${netSalary.toLocaleString()}. You can view or print it from the Payroll portal.`,
      read: false
    });
  });

  res.status(201).json({
    message: `Successfully processed payroll for ${employees.length} employees for ${month}.`,
    slips: processedSlips
  });
});

module.exports = router;
