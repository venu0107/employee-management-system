const express = require('express');
const db = require('../models/db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get all employees with optional search filter
router.get('/', verifyToken, (req, res) => {
  const { search, department, status } = req.query;
  let list = db.find('employees');

  if (search) {
    const q = search.toLowerCase();
    list = list.filter(emp => 
      emp.name.toLowerCase().includes(q) || 
      emp.employeeId.toLowerCase().includes(q) || 
      emp.designation.toLowerCase().includes(q) ||
      emp.email.toLowerCase().includes(q)
    );
  }

  if (department) {
    list = list.filter(emp => emp.department === department);
  }

  if (status) {
    list = list.filter(emp => emp.status === status);
  }

  res.json(list);
});

// Get a single employee details by ID
router.get('/:id', verifyToken, (req, res) => {
  const employee = db.findOne('employees', { id: req.params.id }) || db.findOne('employees', { employeeId: req.params.id });
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }
  res.json(employee);
});

// Create employee (Admin/HR only)
router.post('/', verifyToken, requireRole(['Admin', 'HR']), (req, res) => {
  const { name, email, phone, department, designation, salary, joiningDate, role } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ message: 'Name, email, and system role are required' });
  }

  // Check user accounts
  const existingUser = db.findOne('users', { email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({ message: 'User with this email already exists' });
  }

  // Create linked authentication user with default pass
  const bcrypt = require('bcryptjs');
  const salt = bcrypt.genSaltSync(10);
  const hashedPassword = bcrypt.hashSync('welcome123', salt); // Default placeholder password

  const newUser = db.create('users', {
    email: email.toLowerCase(),
    password: hashedPassword,
    role: role || 'Employee',
    name
  });

  const empId = `EMP${Math.floor(100 + Math.random() * 900)}`;
  const employee = db.create('employees', {
    userId: newUser.id,
    employeeId: empId,
    name,
    email: email.toLowerCase(),
    phone: phone || '',
    department: department || 'General',
    designation: designation || 'Staff',
    salary: Number(salary) || 45000,
    joiningDate: joiningDate || new Date().toISOString().split('T')[0],
    status: 'Active'
  });

  // Update department count
  if (department) {
    const dept = db.findOne('departments', { name: department });
    if (dept) {
      db.update('departments', { id: dept.id }, { employeeCount: (dept.employeeCount || 0) + 1 });
    }
  }

  // Set default leaves
  const defaultLeaves = {
    'Casual Leave': { allowed: 12, used: 0 },
    'Sick Leave': { allowed: 10, used: 0 },
    'Paid Leave': { allowed: 15, used: 0 },
    'Unpaid Leave': { allowed: 30, used: 0 }
  };
  db.create('leave_balances', { userId: newUser.id, employeeId: empId, balances: defaultLeaves });

  // Post system notification
  db.create('notifications', {
    userId: newUser.id,
    title: 'Welcome to the Company!',
    message: `Your employee profile has been created successfully. Default password is 'welcome123'. Please log in and change it in your settings.`,
    read: false
  });

  res.status(201).json(employee);
});

// Update employee (Admin/HR or Self-Update for minor profile fields)
router.put('/:id', verifyToken, (req, res) => {
  const { name, phone, department, designation, salary, status, role } = req.body;
  const isHR = ['Admin', 'HR'].includes(req.user.role);

  const employee = db.findOne('employees', { id: req.params.id });
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  // Prevent editing other's files unless HR or Admin
  if (!isHR && employee.userId !== req.user.id) {
    return res.status(403).json({ message: 'Forbidden: Cannot edit other profile details' });
  }

  const updates = {};
  if (name) updates.name = name;
  if (phone !== undefined) updates.phone = phone;

  // HR restricted updates
  if (isHR) {
    if (department && department !== employee.department) {
      // Adjust old department employee count
      const oldDept = db.findOne('departments', { name: employee.department });
      if (oldDept) {
        db.update('departments', { id: oldDept.id }, { employeeCount: Math.max(0, (oldDept.employeeCount || 0) - 1) });
      }
      // Adjust new department employee count
      const newDept = db.findOne('departments', { name: department });
      if (newDept) {
        db.update('departments', { id: newDept.id }, { employeeCount: (newDept.employeeCount || 0) + 1 });
      }
      updates.department = department;
    }
    if (designation) updates.designation = designation;
    if (salary) updates.salary = Number(salary);
    if (status) updates.status = status;

    // Update User Role if changed
    if (role) {
      db.update('users', { id: employee.userId }, { role, name: name || employee.name });
    }
  }

  // If user changed name, update linked User record
  if (name && name !== employee.name) {
    db.update('users', { id: employee.userId }, { name });
  }

  db.update('employees', { id: employee.id }, updates);

  const updatedEmployee = db.findOne('employees', { id: employee.id });
  res.json(updatedEmployee);
});

// Delete employee (Admin/HR only)
router.delete('/:id', verifyToken, requireRole(['Admin', 'HR']), (req, res) => {
  const employee = db.findOne('employees', { id: req.params.id });
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  // Reduce department counts
  if (employee.department) {
    const dept = db.findOne('departments', { name: employee.department });
    if (dept) {
      db.update('departments', { id: dept.id }, { employeeCount: Math.max(0, (dept.employeeCount || 0) - 1) });
    }
  }

  // Delete records
  db.delete('employees', { id: employee.id });
  db.delete('users', { id: employee.userId });
  db.delete('leave_balances', { userId: employee.userId });
  db.delete('attendance', { userId: employee.userId });
  db.delete('payroll', { userId: employee.userId });
  db.delete('notifications', { userId: employee.userId });

  res.json({ message: 'Employee and all associated records deleted successfully' });
});

module.exports = router;
