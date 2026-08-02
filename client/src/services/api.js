const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getHeaders = () => {
  const token = localStorage.getItem('ems_token');
  const headers = {
    'Content-Type': 'application/json'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg = data.message || `Request failed with status ${response.status}`;
    throw new Error(errorMsg);
  }
  return data;
};

export const api = {
  // Authentication
  login: async (email, password) => {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('ems_token', data.token);
    }
    return data;
  },

  register: async (userData) => {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('ems_token', data.token);
    }
    return data;
  },

  getMe: async () => {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  logout: () => {
    localStorage.removeItem('ems_token');
  },

  // Employees
  getEmployees: async (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    const res = await fetch(`${API_BASE}/employees?${query}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getEmployee: async (id) => {
    const res = await fetch(`${API_BASE}/employees/${id}`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  createEmployee: async (data) => {
    const res = await fetch(`${API_BASE}/employees`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updateEmployee: async (id, data) => {
    const res = await fetch(`${API_BASE}/employees/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  deleteEmployee: async (id) => {
    const res = await fetch(`${API_BASE}/employees/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Departments
  getDepartments: async () => {
    const res = await fetch(`${API_BASE}/departments`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  createDepartment: async (data) => {
    const res = await fetch(`${API_BASE}/departments`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updateDepartment: async (id, data) => {
    const res = await fetch(`${API_BASE}/departments/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  deleteDepartment: async (id) => {
    const res = await fetch(`${API_BASE}/departments/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Attendance
  getAttendanceStatus: async () => {
    const res = await fetch(`${API_BASE}/attendance/status`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  clockIn: async () => {
    const res = await fetch(`${API_BASE}/attendance/clock-in`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  clockOut: async () => {
    const res = await fetch(`${API_BASE}/attendance/clock-out`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getAttendanceLogs: async () => {
    const res = await fetch(`${API_BASE}/attendance/logs`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getAttendanceReports: async () => {
    const res = await fetch(`${API_BASE}/attendance/reports`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Leaves
  getLeaveHistory: async () => {
    const res = await fetch(`${API_BASE}/leaves/history`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getLeaveBalance: async () => {
    const res = await fetch(`${API_BASE}/leaves/balance`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  applyLeave: async (data) => {
    const res = await fetch(`${API_BASE}/leaves/apply`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  getLeaveRequests: async () => {
    const res = await fetch(`${API_BASE}/leaves/requests`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  reviewLeave: async (id, status) => {
    const res = await fetch(`${API_BASE}/leaves/action/${id}`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  cancelLeave: async (id) => {
    const res = await fetch(`${API_BASE}/leaves/cancel/${id}`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Payroll
  getPayrollHistory: async () => {
    const res = await fetch(`${API_BASE}/payroll/history`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getAllPayroll: async () => {
    const res = await fetch(`${API_BASE}/payroll/all`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  runPayroll: async (month, overrides = {}) => {
    const res = await fetch(`${API_BASE}/payroll/run`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ month, ...overrides })
    });
    return handleResponse(res);
  },

  // Performance
  getPerformanceReviews: async () => {
    const res = await fetch(`${API_BASE}/performance/reviews`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  submitPerformanceReview: async (data) => {
    const res = await fetch(`${API_BASE}/performance/review`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  getGoals: async () => {
    const res = await fetch(`${API_BASE}/performance/goals`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  createGoal: async (data) => {
    const res = await fetch(`${API_BASE}/performance/goals`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },

  updateGoalStatus: async (id, status) => {
    const res = await fetch(`${API_BASE}/performance/goals/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  // Notifications & Announcements
  getNotifications: async () => {
    const res = await fetch(`${API_BASE}/notifications`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  readNotification: async (id) => {
    const res = await fetch(`${API_BASE}/notifications/read/${id}`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  readAllNotifications: async () => {
    const res = await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PUT',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  getAnnouncements: async () => {
    const res = await fetch(`${API_BASE}/notifications/announcements`, {
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  postAnnouncement: async (data) => {
    const res = await fetch(`${API_BASE}/notifications/announce`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  }
};
