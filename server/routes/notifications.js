const express = require('express');
const db = require('../models/db');
const { verifyToken, requireRole } = require('../middleware/auth');

const router = express.Router();

// Get user notifications
router.get('/', verifyToken, (req, res) => {
  const notifications = db.find('notifications', { userId: req.user.id });
  // Sort descending (latest first)
  notifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(notifications);
});

// Mark notification as read
router.put('/read/:id', verifyToken, (req, res) => {
  const note = db.findOne('notifications', { id: req.params.id, userId: req.user.id });
  if (!note) {
    return res.status(404).json({ message: 'Notification not found.' });
  }

  db.update('notifications', { id: note.id }, { read: true });
  res.json({ message: 'Notification marked as read' });
});

// Mark all as read
router.put('/read-all', verifyToken, (req, res) => {
  const count = db.update('notifications', { userId: req.user.id, read: false }, { read: true });
  res.json({ message: 'All notifications marked as read', count });
});

// Get recent announcements
router.get('/announcements', verifyToken, (req, res) => {
  const announcements = db.find('announcements');
  announcements.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(announcements);
});

// Post an announcement (Admin/HR only)
router.post('/announce', verifyToken, requireRole(['Admin', 'HR']), (req, res) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  const announcement = db.create('announcements', {
    title,
    content,
    author: req.user.name,
    date: new Date().toISOString().split('T')[0]
  });

  // Also add notifications for all users
  const users = db.find('users');
  users.forEach(user => {
    // Notify everyone except the announcer
    if (user.id !== req.user.id) {
      db.create('notifications', {
        userId: user.id,
        title: 'New Announcement',
        message: `Company Announcement: "${title}". Please read it on the dashboard.`,
        read: false
      });
    }
  });

  res.status(201).json({ message: 'Announcement published successfully.', announcement });
});

module.exports = router;
