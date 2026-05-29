// const jwt = require('jsonwebtoken');
// const User = require('../models/User');

// const login = async (req, res) => {
//   try {
//     const { username, password } = req.body;
//     const user = await User.findOne({ where: { username, password } });
//     if (user) {
//       const token = jwt.sign({ username: user.username }, 'your_jwt_secret', { expiresIn: '1h' });
//       res.status(200).json({ token });
//     } else {
//       res.status(401).send('Invalid credentials');
//     }
//   } catch (error) {
//     res.status(500).send('Server error');
//   }
// };

// module.exports = { login };


// controllers/authController.js
const { User } = require('../models');
const { logAction } = require('./auditController');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Register a new user
exports.register = async (req, res) => {
  const { username, phone, password, role } = req.body;

  try {
    let user = await User.findOne({ where: { username } });
    if (user) {
      return res.status(400).json({ msg: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user = await User.create({
      username,
      phone,
      password: hashedPassword,
      role: role || 'user',
    });

    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    // Audit log for registration
    await logAction(req, 'USER_REGISTER', user.username, 'SUCCESS', { userId: user.id, role: user.role });

    res.json({ token });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Login user
exports.login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ where: { username } });
    if (!user) {
      await logAction(req, 'USER_LOGIN_FAILED', username || 'Anonymous', 'FAILURE', { reason: 'User not found' });
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await logAction(req, 'USER_LOGIN_FAILED', username, 'FAILURE', { reason: 'Password mismatch' });
      return res.status(400).json({ msg: 'Invalid credentials' });
    }

    if (!user.active) {
      await logAction(req, 'USER_LOGIN_FAILED', username, 'FAILURE', { reason: 'Account deactivated' });
      return res.status(403).json({ msg: 'Account deactivated' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    await logAction(req, 'USER_LOGIN', user.username, 'SUCCESS', { userId: user.id, role: user.role });

    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};