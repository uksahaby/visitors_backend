// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const User = require('../models/User');
// require('dotenv').config();

// const login = async (req, res) => {
//   try {
//     const { username, password } = req.body;
//     if (!username || !password) {
//       return res.status(400).json({ message: 'Username and password are required' });
//     }
//     const user = await User.findOne({ where: { username } });
//     if (!user || !(await bcrypt.compare(password, user.password))) {
//       return res.status(401).json({ message: 'Invalid credentials' });
//     }
//     const token = jwt.sign(
//       { id: user.id, username: user.username, role: user.role }, // Include id for better security
//       process.env.JWT_SECRET,
//       { expiresIn: '1h' }
//     );
//     res.status(200).json({ token, name: user.name, role: user.role }); // Return name field
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// const createUser = async (req, res) => {
//   try {
//     const { username, name, phone, password, role = 'user' } = req.body;
//     if (!username || !name || !phone || !password) {
//       return res.status(400).json({ message: 'All fields are required' });
//     }
//     const existingUser = await User.findOne({ where: { username } });
//     if (existingUser) {
//       return res.status(409).json({ message: 'Username already exists' }); // 409 Conflict
//     }
//     const hashedPassword = await bcrypt.hash(password, 10);
//     const user = await User.create({ username, name, phone, password: hashedPassword, role });
//     res.status(201).json({ message: 'User created', userId: user.id });
//   } catch (error) {
//     if (error.name === 'SequelizeUniqueConstraintError') {
//       return res.status(409).json({ message: 'Username already exists' });
//     }
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// const getUsers = async (req, res) => {
//   try {
//     const users = await User.findAll({
//       attributes: ['id', 'username', 'name', 'phone', 'role'], // Include id
//       order: [['createdAt', 'DESC']], // Optional: sort by creation date
//     });
//     res.status(200).json(users);
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// const deleteUser = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const user = await User.findByPk(id);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
//     await user.destroy();
//     res.status(200).json({ message: 'User deleted' });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// const updateUserAccess = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { role } = req.body;
//     if (!role) {
//       return res.status(400).json({ message: 'Role is required' });
//     }
//     const user = await User.findByPk(id);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
//     await user.update({ role });
//     res.status(200).json({ message: 'User access updated', role: user.role });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// const changePassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;
//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({ message: 'Current and new passwords are required' });
//     }
//     const user = await User.findByPk(req.user.id); // Use authenticated user ID
//     if (!user || !(await bcrypt.compare(currentPassword, user.password))) {
//       return res.status(401).json({ message: 'Invalid current password' });
//     }
//     const hashedPassword = await bcrypt.hash(newPassword, 10);
//     await user.update({ password: hashedPassword });
//     res.status(200).json({ message: 'Password changed' });
//   } catch (error) {
//     res.status(500).json({ message: 'Server error', error: error.message });
//   }
// };

// module.exports = { login, createUser, getUsers, deleteUser, updateUserAccess, changePassword };


// controllers/userController.js

const { User } = require('../models');
const { logAction } = require('./auditController');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const fs = require('fs');
const uploadDir = path.join(__dirname, '..', 'Uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Helper to fetch username from request token or DB
const getUsernameFromReq = async (req) => {
  if (req.user && req.user.username) {
    return req.user.username;
  }
  if (req.user && req.user.id) {
    const user = await User.findByPk(req.user.id);
    if (user) {
      return user.username;
    }
  }
  return 'Unknown';
};

// Helper function to format user response
const formatUserResponse = (user) => {
  return {
    id: user.id,
    username: user.username,
    phone: user.phone,
    role: user.role,
    active: user.active,
    image: user.image || null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    createdBy: user.createdBy,
    updatedBy: user.updatedBy,
  };
};

// Get all users (admin only)
exports.getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'username', 'phone', 'role', 'active', 'image', 'createdAt', 'updatedAt', 'createdBy', 'updatedBy'],
    });
    res.json(users.map(user => formatUserResponse(user)));
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Create a user (admin only)
exports.createUser = [
  upload.single('image'),
  async (req, res) => {
    const { username, phone, password, role } = req.body;

    try {
      let user = await User.findOne({ where: { username } });
      if (user) {
        return res.status(400).json({ msg: 'User already exists' });
      }

      const creatorUsername = req.user ? await getUsernameFromReq(req) : null;
      const hashedPassword = await bcrypt.hash(password, 10);
      user = await User.create({
        username,
        phone,
        password: hashedPassword,
        role: role || 'user',
        image: req.file ? req.file.filename : null,
        createdBy: creatorUsername,
      });

      // Audit log for user creation
      await logAction(req, 'USER_CREATE', creatorUsername, 'SUCCESS', { targetUser: user.username, role: user.role });

      res.json(formatUserResponse(user));
    } catch (err) {
      console.error('Create user error:', err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
];

// Delete a user (admin only)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    const targetUsername = user.username;
    await user.destroy();

    const operator = req.user ? await getUsernameFromReq(req) : 'Admin';
    // Audit log for user deletion
    await logAction(req, 'USER_DELETE', operator, 'SUCCESS', { targetUser: targetUsername });

    res.json({ msg: 'User deleted' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Edit a user (admin only)
exports.editUser = [
  upload.single('image'),
  async (req, res) => {
    const { username, phone, password, role } = req.body;

    try {
      const user = await User.findByPk(req.params.id);
      if (!user) {
        return res.status(404).json({ msg: 'User not found' });
      }

      if (username) user.username = username;
      if (phone) user.phone = phone;
      if (password && password.trim() !== '') user.password = await bcrypt.hash(password, 10);
      if (role) user.role = role;
      if (req.file) user.image = req.file.filename;
      user.updatedBy = req.user ? await getUsernameFromReq(req) : null;

      await user.save();

      // Audit log for user edit
      await logAction(req, 'USER_UPDATE', user.updatedBy, 'SUCCESS', { targetUser: user.username, role: user.role });

      res.json(formatUserResponse(user));
    } catch (err) {
      console.error('Edit user error:', err);
      res.status(500).json({ msg: 'Server error' });
    }
  }
];

// Give/deny user access (toggle active status) (admin only)
exports.toggleUserAccess = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    user.active = !user.active;
    user.updatedBy = req.user ? await getUsernameFromReq(req) : null;
    await user.save();

    // Audit log for status toggle
    await logAction(req, 'USER_TOGGLE_ACCESS', user.updatedBy, 'SUCCESS', { targetUser: user.username, active: user.active });

    res.json({ msg: user.active ? 'Access granted' : 'Access denied',
      active: user.active,
      id: user.id,
      username: user.username,
      phone: user.phone,
      role: user.role,
      updatedBy: user.updatedBy,
      updatedAt: user.updatedAt,
     });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};