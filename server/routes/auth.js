const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db');
const { verifyToken, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// Register a new user (HR / Admin capability, or public for demo setup)
router.post('/register', async (req, res) => {
  const { email, password, role, name, phone, department, designation, salary } = req.body;

  if (!email || !password || !name || !role) {
    return res.status(400).json({ message: 'Email, password, name, and role are required' });
  }

  try {
    // Check if user already exists
    const existingUser = db.findOne('users', { email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const newUser = db.create('users', {
      email: email.toLowerCase(),
      password: hashedPassword,
      role,
      name
    });

    // Create Employee profile
    const empId = `EMP${Math.floor(100 + Math.random() * 900)}`;
    db.create('employees', {
      userId: newUser.id,
      employeeId: empId,
      name,
      email: email.toLowerCase(),
      phone: phone || '',
      department: department || 'General',
      designation: designation || 'Associate',
      salary: Number(salary) || 50000,
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    });

    // Update department counts if department is assigned
    if (department && department !== 'General') {
      const dept = db.findOne('departments', { name: department });
      if (dept) {
        db.update('departments', { id: dept.id }, { employeeCount: (dept.employeeCount || 0) + 1 });
      }
    }

    // Set default leave balances for the new employee
    const defaultLeaves = {
      'Casual Leave': { allowed: 12, used: 0 },
      'Sick Leave': { allowed: 10, used: 0 },
      'Paid Leave': { allowed: 15, used: 0 },
      'Unpaid Leave': { allowed: 30, used: 0 }
    };
    db.create('leave_balances', { userId: newUser.id, employeeId: empId, balances: defaultLeaves });

    // Generate Token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email, role: newUser.role, name: newUser.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
        name: newUser.name
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login User
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const user = db.findOne('users', { email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // Generate Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get current user details and profile
router.get('/me', verifyToken, (req, res) => {
  const employee = db.findOne('employees', { userId: req.user.id });
  res.json({
    user: req.user,
    employee
  });
});

module.exports = router;
