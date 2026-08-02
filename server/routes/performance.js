const express = require('express');
const db = require('../models/db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get performance reviews
router.get('/reviews', verifyToken, (req, res) => {
  const isHR = ['Admin', 'HR'].includes(req.user.role);
  let reviews;

  if (isHR) {
    reviews = db.find('performance_reviews');
  } else {
    reviews = db.find('performance_reviews', { userId: req.user.id });
  }

  reviews.sort((a, b) => new Date(b.reviewDate) - new Date(a.reviewDate));
  res.json(reviews);
});

// Submit performance review (Admin/HR only)
router.post('/review', verifyToken, requireRole(['Admin', 'HR']), (req, res) => {
  const { employeeId, rating, feedback, goalsSet } = req.body;

  if (!employeeId || !rating || !feedback) {
    return res.status(400).json({ message: 'Employee ID, rating (1-5), and feedback are required.' });
  }

  const employee = db.findOne('employees', { employeeId });
  if (!employee) {
    return res.status(404).json({ message: 'Employee not found.' });
  }

  const review = db.create('performance_reviews', {
    userId: employee.userId,
    employeeId,
    name: employee.name,
    rating: Number(rating),
    feedback,
    goalsSet: goalsSet || '',
    reviewerName: req.user.name,
    reviewDate: new Date().toISOString().split('T')[0]
  });

  // Notify employee
  db.create('notifications', {
    userId: employee.userId,
    title: 'Performance Review Published',
    message: `A new performance review has been published by ${req.user.name}. Rating: ${rating}/5. Check the Performance tab to view details.`,
    read: false
  });

  res.status(201).json({ message: 'Performance review submitted successfully.', review });
});

// Get user goals
router.get('/goals', verifyToken, (req, res) => {
  const goals = db.find('goals', { userId: req.user.id });
  res.json(goals);
});

// Create/Update employee goals
router.post('/goals', verifyToken, (req, res) => {
  const { goalText, targetDate, status } = req.body;

  if (!goalText || !targetDate) {
    return res.status(400).json({ message: 'Goal description and target date are required.' });
  }

  const newGoal = db.create('goals', {
    userId: req.user.id,
    goalText,
    targetDate,
    status: status || 'In Progress' // 'In Progress', 'Completed', 'Cancelled'
  });

  res.status(201).json(newGoal);
});

// Update goal status
router.put('/goals/:id', verifyToken, (req, res) => {
  const { status } = req.body;
  const goal = db.findOne('goals', { id: req.params.id, userId: req.user.id });
  
  if (!goal) {
    return res.status(404).json({ message: 'Goal not found.' });
  }

  db.update('goals', { id: goal.id }, { status });
  const updatedGoal = db.findOne('goals', { id: goal.id });
  res.json(updatedGoal);
});

module.exports = router;
