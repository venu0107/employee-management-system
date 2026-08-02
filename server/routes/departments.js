const express = require('express');
const db = require('../models/db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all departments
router.get('/', verifyToken, (req, res) => {
  const depts = db.find('departments');
  res.json(depts);
});

// Create department (Admin/HR only)
router.post('/', verifyToken, requireRole(['Admin', 'HR']), (req, res) => {
  const { name, manager, budget } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Department name is required' });
  }

  const existingDept = db.findOne('departments', { name });
  if (existingDept) {
    return res.status(400).json({ message: 'Department already exists' });
  }

  const newDept = db.create('departments', {
    name,
    manager: manager || 'TBD',
    budget: Number(budget) || 0,
    employeeCount: 0
  });

  res.status(201).json(newDept);
});

// Update department (Admin/HR only)
router.put('/:id', verifyToken, requireRole(['Admin', 'HR']), (req, res) => {
  const { name, manager, budget } = req.body;
  const dept = db.findOne('departments', { id: req.params.id });
  if (!dept) {
    return res.status(404).json({ message: 'Department not found' });
  }

  const updates = {};
  if (name) updates.name = name;
  if (manager !== undefined) updates.manager = manager;
  if (budget !== undefined) updates.budget = Number(budget);

  // If department name changes, update employees matching it
  if (name && name !== dept.name) {
    const employees = db.find('employees', { department: dept.name });
    employees.forEach(emp => {
      db.update('employees', { id: emp.id }, { department: name });
    });
  }

  db.update('departments', { id: dept.id }, updates);
  const updatedDept = db.findOne('departments', { id: dept.id });
  res.json(updatedDept);
});

// Delete department (Admin/HR only)
router.delete('/:id', verifyToken, requireRole(['Admin', 'HR']), (req, res) => {
  const dept = db.findOne('departments', { id: req.params.id });
  if (!dept) {
    return res.status(404).json({ message: 'Department not found' });
  }

  // Update employees under this department to 'General'
  const employees = db.find('employees', { department: dept.name });
  employees.forEach(emp => {
    db.update('employees', { id: emp.id }, { department: 'General' });
  });

  // Adjust General department count if it exists
  const generalDept = db.findOne('departments', { name: 'General' });
  if (generalDept) {
    db.update('departments', { id: generalDept.id }, { 
      employeeCount: (generalDept.employeeCount || 0) + employees.length 
    });
  }

  db.delete('departments', { id: dept.id });
  res.json({ message: 'Department deleted successfully. Employees reassigned to General.' });
});

module.exports = router;
