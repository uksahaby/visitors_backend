// const jwt = require('jsonwebtoken');
// require('dotenv').config();

// const authenticate = (req, res, next) => {
//   const authHeader = req.header('Authorization');
//   if (!authHeader || !authHeader.startsWith('Bearer ')) {
//     return res.status(401).json({ message: 'No valid Bearer token provided' });
//   }

//   const token = authHeader.replace('Bearer ', '').trim();
//   if (!token) {
//     return res.status(401).json({ message: 'No token provided' });
//   }

//   try {
//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     if (!decoded || typeof decoded !== 'object' || !decoded.id) {
//       return res.status(401).json({ message: 'Invalid token payload' });
//     }
//     req.user = decoded; // { id, username, role }
//     next();
//   } catch (error) {
//     console.error('Token verification error:', error.message);
//     res.status(401).json({ message: 'Invalid token' });
//   }
// };

// const isAdmin = (req, res, next) => {
//   if (!req.user || req.user.role !== 'admin') {
//     return res.status(403).json({ message: 'Admin access required' });
//   }
//   next();
// };

// module.exports = { authenticate, isAdmin };

// middleware/auth.js

// middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Authentication middleware (checks for Bearer token)
exports.auth = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Role authorization middleware (checks if user has the required role)
exports.authorize = (role) => (req, res, next) => {
  if (req.user.role !== role) {
    return res.status(403).json({ msg: 'Access denied' });
  }
  next();
};