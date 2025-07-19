const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Rate limiting for login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit to 10 requests per IP
});

// MongoDB connection
mongoose.connect('mongodb://localhost/zentrafuge', { useNewUrlParser: true, useUnifiedTopology: true });

// Admin user schema
const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
});
const Admin = mongoose.model('Admin', AdminSchema);

// Metrics schema
const MetricsSchema = new mongoose.Schema({
  activeUsers: Number,
  apiCalls: Number,
  responseTime: Number,
  timestamp: { type: Date, default: Date.now },
});
const Metrics = mongoose.model('Metrics', MetricsSchema);

// Middleware to verify JWT and role
const authenticateAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, 'your-secret-key'); // Replace with env variable in production
    if (decoded.role !== 'admin') return res.status(403).json({ message: 'Unauthorized' });
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Login endpoint with redirect
app.post('/api/admin/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  try {
    const admin = await Admin.findOne({ username });
    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ username, role: admin.role }, 'your-secret-key', { expiresIn: '1h' });
    res.json({ token, redirect: '/admin/dashboard/secret-uuid-123456' }); // Non-discoverable redirect
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Dashboard data endpoint
app.get('/api/admin/dashboard', authenticateAdmin, async (req, res) => {
  try {
    const metrics = await Metrics.findOne().sort({ timestamp: -1 });
    const suggestions = [
      'Simplify checkout flow: 30% user drop-off detected',
      'Add gamification: 60% of users engage more with rewards',
      'Optimize API endpoint /user/profile: 200ms latency',
    ]; // Placeholder for Cael's suggestions
    res.json({ metrics: metrics || {}, suggestions });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Initialize admin user (run once)
async function initAdmin() {
  const username = 'admin';
  const password = await bcrypt.hash('supersecretpassword', 10); // Replace in production
  await Admin.findOneAndUpdate(
    { username },
    { username, password, role: 'admin' },
    { upsert: true }
  );
}
initAdmin();

app.listen(3000, () => console.log('Server running on port 3000'));
