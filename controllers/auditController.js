// controllers/auditController.js
const { AuditLog } = require('../models');

// Helper to log actions
exports.logAction = async (req, action, operator, status, details) => {
  try {
    let ipAddress = 'Unknown';
    if (req) {
      ipAddress = req.headers['x-forwarded-for'] || req.socket.remoteAddress || req.ip || 'Unknown';
      // Clean up IPv6 loopback representation if local
      if (ipAddress === '::1') {
        ipAddress = '127.0.0.1';
      }
    }
    
    await AuditLog.create({
      action,
      operator: operator || 'System',
      ipAddress,
      status: status || 'SUCCESS',
      details: typeof details === 'object' ? JSON.stringify(details) : details || null,
    });
  } catch (err) {
    console.error('Failed to log action in audit database:', err);
  }
};

// Get all audit logs (admin only)
exports.getAuditLogs = async (req, res) => {
  try {
    const logs = await AuditLog.findAll({
      order: [['createdAt', 'DESC']],
    });
    res.json(logs);
  } catch (err) {
    console.error('Error fetching audit logs:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};
