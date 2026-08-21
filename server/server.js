const express = require('express');
const cors = require('cors');
const path = require('path');

const authRouter = require('./routes/auth');
const employeesRouter = require('./routes/employees');
const departmentsRouter = require('./routes/departments');
const attendanceRouter = require('./routes/attendance');
const leavesRouter = require('./routes/leaves');
const payrollRouter = require('./routes/payroll');
const performanceRouter = require('./routes/performance');
const notificationsRouter = require('./routes/notifications');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS — allow GitHub Pages and local development
const allowedOrigins = [
  'https://venu0107.github.io',
  'http://localhost:5173',
  'http://localhost:4173',
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. mobile apps, curl, Render health checks)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`CORS policy: origin ${origin} not allowed`));
    }
  },
  credentials: true,
}));
app.use(express.json());

// Logger middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/departments', departmentsRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/leaves', leavesRouter);
app.use('/api/payroll', payrollRouter);
app.use('/api/performance', performanceRouter);
app.use('/api/notifications', notificationsRouter);

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Handle undefined routes
app.use((req, res) => {
  res.status(404).json({ message: 'API Endpoint Not Found' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`==================================================`);
  console.log(`🚀 Employee Management System Server running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🔒 Authentication: JWT Enabled`);
  console.log(`==================================================`);
});
