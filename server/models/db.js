const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, '..', 'data');

// Ensure database directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Database helper functions
const getFilePath = (collection) => path.join(DATA_DIR, `${collection}.json`);

const readCollection = (collection) => {
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    return [];
  }
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content || '[]');
  } catch (err) {
    console.error(`Error reading collection ${collection}:`, err);
    return [];
  }
};

const writeCollection = (collection, data) => {
  const filePath = getFilePath(collection);
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error(`Error writing collection ${collection}:`, err);
    return false;
  }
};

const db = {
  find: (collection, filter = {}) => {
    const items = readCollection(collection);
    return items.filter(item => {
      for (const key in filter) {
        if (item[key] !== filter[key]) return false;
      }
      return true;
    });
  },

  findOne: (collection, filter = {}) => {
    const items = readCollection(collection);
    return items.find(item => {
      for (const key in filter) {
        if (item[key] !== filter[key]) return false;
      }
      return true;
    }) || null;
  },

  create: (collection, data) => {
    const items = readCollection(collection);
    const newItem = {
      id: `${collection.substring(0, 3).toUpperCase()}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...data
    };
    items.push(newItem);
    writeCollection(collection, items);
    return newItem;
  },

  update: (collection, filter = {}, updateData = {}) => {
    const items = readCollection(collection);
    let updatedCount = 0;
    const updatedItems = items.map(item => {
      let matches = true;
      for (const key in filter) {
        if (item[key] !== filter[key]) {
          matches = false;
          break;
        }
      }
      if (matches) {
        updatedCount++;
        return {
          ...item,
          ...updateData,
          updatedAt: new Date().toISOString()
        };
      }
      return item;
    });

    if (updatedCount > 0) {
      writeCollection(collection, updatedItems);
    }
    return updatedCount;
  },

  delete: (collection, filter = {}) => {
    const items = readCollection(collection);
    const initialLength = items.length;
    const filteredItems = items.filter(item => {
      let matches = true;
      for (const key in filter) {
        if (item[key] !== filter[key]) {
          matches = false;
          break;
        }
      }
      return !matches;
    });

    const deletedCount = initialLength - filteredItems.length;
    if (deletedCount > 0) {
      writeCollection(collection, filteredItems);
    }
    return deletedCount;
  }
};

// Seed initial data
const seedDatabase = async () => {
  const users = readCollection('users');
  if (users.length === 0) {
    console.log('Seeding initial system users and mock records...');
    
    // Create Default Roles Passwords
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // 1. Admin
    const adminUser = db.create('users', {
      email: 'admin@company.com',
      password: hashedPassword,
      role: 'Admin',
      name: 'Sarah Jenkins'
    });

    // 2. HR
    const hrUser = db.create('users', {
      email: 'hr@company.com',
      password: hashedPassword,
      role: 'HR',
      name: 'Michael Scott'
    });

    // 3. Employee
    const employeeUser = db.create('users', {
      email: 'employee@company.com',
      password: hashedPassword,
      role: 'Employee',
      name: 'John Doe'
    });

    // Create Departments
    const itDept = db.create('departments', {
      name: 'IT',
      manager: 'Sarah Jenkins',
      budget: 150000,
      employeeCount: 1
    });

    const hrDept = db.create('departments', {
      name: 'Human Resources',
      manager: 'Michael Scott',
      budget: 80000,
      employeeCount: 1
    });

    const salesDept = db.create('departments', {
      name: 'Sales',
      manager: 'Dwight Schrute',
      budget: 120000,
      employeeCount: 0
    });

    // Create Employees Profile Data
    db.create('employees', {
      userId: adminUser.id,
      employeeId: 'EMP001',
      name: 'Sarah Jenkins',
      email: 'admin@company.com',
      phone: '+1 (555) 019-2834',
      department: 'IT',
      designation: 'IT Director / Systems Admin',
      salary: 110000,
      joiningDate: '2022-01-15',
      status: 'Active'
    });

    db.create('employees', {
      userId: hrUser.id,
      employeeId: 'EMP002',
      name: 'Michael Scott',
      email: 'hr@company.com',
      phone: '+1 (555) 014-9821',
      department: 'Human Resources',
      designation: 'HR Manager',
      salary: 75000,
      joiningDate: '2023-04-10',
      status: 'Active'
    });

    db.create('employees', {
      userId: employeeUser.id,
      employeeId: 'EMP003',
      name: 'John Doe',
      email: 'employee@company.com',
      phone: '+1 (555) 017-3829',
      department: 'IT',
      designation: 'Software Engineer',
      salary: 85000,
      joiningDate: '2024-06-01',
      status: 'Active'
    });

    // Add some default announcements
    db.create('announcements', {
      title: 'Welcome to the New EMS Portal!',
      content: 'We are thrilled to launch our new Employee Management System. You can now clock in/out, check leave balances, view performance goals, and download payslips directly from here.',
      author: 'Sarah Jenkins',
      date: new Date().toISOString().split('T')[0]
    });

    db.create('announcements', {
      title: 'Quarterly Review Cycle',
      content: 'All departments are requested to complete employee self-reviews by the end of the month. HR will schedule performance review alignment meetings shortly.',
      author: 'Michael Scott',
      date: new Date().toISOString().split('T')[0]
    });

    // Create leave balance records
    // Leave types: Casual, Sick, Paid, Unpaid
    const defaultLeaves = {
      'Casual Leave': { allowed: 12, used: 2 },
      'Sick Leave': { allowed: 10, used: 1 },
      'Paid Leave': { allowed: 15, used: 4 },
      'Unpaid Leave': { allowed: 30, used: 0 }
    };
    
    db.create('leave_balances', { userId: adminUser.id, employeeId: 'EMP001', balances: defaultLeaves });
    db.create('leave_balances', { userId: hrUser.id, employeeId: 'EMP002', balances: defaultLeaves });
    db.create('leave_balances', { userId: employeeUser.id, employeeId: 'EMP003', balances: defaultLeaves });
  }
};

// Execute seeding asynchronously
seedDatabase().catch(console.error);

module.exports = db;
