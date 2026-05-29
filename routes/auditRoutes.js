// routes/auditRoutes.js
const express = require('express');
const router = express.Router();
const auditController = require('../controllers/auditController');
const { auth, authorize } = require('../middleware/auth');

// Only allow admin users to fetch the audit log records
router.get('/', auth, authorize('admin'), auditController.getAuditLogs);

module.exports = router;
