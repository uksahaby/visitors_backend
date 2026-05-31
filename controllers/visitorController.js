// controllers/visitorController.js
const { Visitor, Event, User, Op } = require('../models');
const QRCode = require('qrcode');
const multer = require('multer');
const path = require('path');
const { logAction } = require('./auditController');

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

// Helper function to format visitor response
const formatVisitorResponse = (visitor) => {
  return {
    id: visitor.id,
    _id: visitor.id,
    name: visitor.name,
    phone: visitor.phone,
    address: visitor.address,
    eventId: visitor.eventId,
    verified: visitor.verified,
    checkInTime: visitor.checkInTime,
    checkOutTime: visitor.checkOutTime,
    image: visitor.image || null,
    qrCode: visitor.qrCode,
    createdAt: visitor.createdAt,
    updatedAt: visitor.updatedAt,
    createdByUsername: visitor.createdByUsername,
    verifiedByUsername: visitor.verifiedByUsername,
    checkedOutByUsername: visitor.checkedOutByUsername,
    visitHistory: (() => {
      try { return visitor.visitHistory ? JSON.parse(visitor.visitHistory) : []; } catch (_) { return []; }
    })(),
    ...(visitor.Event && { event: visitor.Event }),
    ...(visitor.AddedBy && { addedBy: visitor.AddedBy })
  };
};

// Add visitor (admin only)
exports.addVisitor = [
  upload.single('image'),
  async (req, res) => {
    console.log('=== ADD VISITOR REQUEST ===');
    console.log('Body:', req.body);
    console.log('File:', req.file);
    console.log('User:', req.user);

    const { name, phone, address, eventId, qrCode: clientQrCode } = req.body;

    try {
      // Validate required fields
      if (!name || !phone || !address || !eventId) {
        console.log('Validation failed - missing fields');
        return res.status(400).json({
          msg: 'All fields are required',
          missing: {
            name: !name,
            phone: !phone,
            address: !address,
            eventId: !eventId,
          },
        });
      }

      // Validate event exists
      const event = await Event.findByPk(eventId);
      if (!event) {
        console.log('Event not found:', eventId);
        return res.status(404).json({ msg: 'Event not found' });
      }

      const username = await getUsernameFromReq(req);
      // Create visitor first to get the auto-generated UUID id
      const visitor = await Visitor.create({
        name,
        phone,
        address,
        eventId,
        image: req.file ? req.file.filename : null,
        addedBy: req.user.id,
        createdByUsername: username,
      });

      // Use client-supplied QR code if provided, otherwise fall back to visitor's UUID
      const finalQrCode = (clientQrCode && clientQrCode.trim()) ? clientQrCode.trim() : visitor.id;
      await visitor.update({ qrCode: finalQrCode });

      console.log(`Visitor created: id=${visitor.id}, qrCode=${finalQrCode}`);

      // Reload with associations to return full data
      await visitor.reload({
        include: [
          { model: Event, as: 'Event', attributes: ['id', 'name', 'date'] },
          { model: User, as: 'AddedBy', attributes: ['id', 'username'] },
        ]
      });

      await logAction(req, 'VISITOR_CREATE', username, 'SUCCESS', {
        visitorId: visitor.id,
        name: visitor.name,
        eventName: visitor.Event ? visitor.Event.name : null,
      });

      res.json(formatVisitorResponse(visitor));

    } catch (err) {
      console.error('Server error in addVisitor:', err);
      res.status(500).json({
        msg: 'Server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined,
      });
    }
  },
];

// Edit visitor (admin only)
exports.editVisitor = async (req, res) => {
  const { name, phone, address } = req.body;

  try {
    const visitor = await Visitor.findByPk(req.params.id);
    if (!visitor) {
      return res.status(404).json({ msg: 'Visitor not found' });
    }

    await visitor.update({ name, phone, address });
    
    const operator = await getUsernameFromReq(req);
    await logAction(req, 'VISITOR_UPDATE', operator, 'SUCCESS', {
      visitorId: visitor.id,
      name: visitor.name,
    });
    
    // Return formatted response
    res.json(formatVisitorResponse(visitor));
  } catch (err) {
    console.error('Edit visitor error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Delete visitor (admin only)
exports.deleteVisitor = async (req, res) => {
  try {
    const visitorId = req.params.id.trim();
    if (!visitorId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      return res.status(400).json({ msg: 'Invalid visitor ID format' });
    }
    const visitor = await Visitor.findByPk(visitorId);
    if (!visitor) {
      return res.status(404).json({ msg: 'Visitor not found' });
    }
    
    const visitorName = visitor.name;
    await visitor.destroy();

    const operator = await getUsernameFromReq(req);
    await logAction(req, 'VISITOR_DELETE', operator, 'SUCCESS', {
      visitorId,
      name: visitorName,
    });

    res.json({ msg: 'Visitor deleted' });
  } catch (err) {
    console.error('Delete visitor error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get visitors by event
exports.getVisitorsByEvent = async (req, res) => {
  try {
    const visitors = await Visitor.findAll({
      where: { eventId: req.params.eventId },
      include: [
        { model: Event, as: 'Event', attributes: ['id', 'name', 'date'] },
        { model: User, as: 'AddedBy', attributes: ['id', 'username'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    
    // Format all visitors in response
    const formattedVisitors = visitors.map(visitor => formatVisitorResponse(visitor));
    res.json(formattedVisitors);
  } catch (err) {
    console.error('Get visitors by event error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Verify visitor by QR code — PURE LOOKUP (no modification)
exports.verifyVisitorByQR = async (req, res) => {
  const { qrCode } = req.body;

  if (!qrCode) {
    return res.status(400).json({ msg: 'qrCode is required' });
  }

  console.log(`[verify-qr] Received qrCode: "${qrCode}"`);

  try {
    // Search by qrCode field first
    let visitor = await Visitor.findOne({
      where: { qrCode: qrCode },
      include: [
        { model: Event, as: 'Event', attributes: ['id', 'name', 'date'] },
      ]
    });

    // Fallback: search by primary key if qrCode looks like a UUID
    if (!visitor) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(qrCode)) {
        visitor = await Visitor.findByPk(qrCode, {
          include: [
            { model: Event, as: 'Event', attributes: ['id', 'name', 'date'] },
          ]
        });
      }
    }

    if (!visitor) {
      console.log(`[verify-qr] No visitor found for: "${qrCode}"`);
      return res.status(404).json({ msg: 'Visitor not found' });
    }

    console.log(`[verify-qr] Visitor "${visitor.name}" found (read-only lookup).`);

    // Return visitor data WITHOUT modifying — check-in is a separate action
    res.json({
      msg: 'Visitor found',
      visitor: formatVisitorResponse(visitor)
    });
  } catch (err) {
    console.error('[verify-qr] Error:', err.message);
    res.status(500).json({ msg: 'Server error', detail: err.message });
  }
};

// Check-in visitor — supports multiple check-in/out cycles within 24h of event
exports.checkInVisitor = async (req, res) => {
  const id = (req.params.id || '').trim();
  console.log(`[checkin] id="${id}"`);

  if (!id) {
    return res.status(400).json({ msg: 'Visitor ID is required' });
  }

  try {
    const visitor = await Visitor.findByPk(id, {
      include: [{ model: Event, as: 'Event', attributes: ['id', 'name', 'date'] }]
    });

    if (!visitor) {
      return res.status(404).json({ msg: 'Visitor not found' });
    }

    // 24-hour validity check from event date
    if (visitor.Event && visitor.Event.date) {
      const eventDate = new Date(visitor.Event.date);
      const eventStart = new Date(eventDate);
      eventStart.setHours(0, 0, 0, 0);
      const eventEnd = new Date(eventStart.getTime() + 24 * 60 * 60 * 1000);
      const now = new Date();
      if (now < eventStart || now > eventEnd) {
        return res.status(400).json({
          msg: `QR code only valid on ${eventStart.toDateString()}.`
        });
      }
    }

    // Load visit history
    let visitHistory = [];
    try { visitHistory = visitor.visitHistory ? JSON.parse(visitor.visitHistory) : []; } catch (_) {}

    // Reject if visitor is already checked in (open visit entry exists)
    const lastVisit = visitHistory[visitHistory.length - 1];
    if (lastVisit && !lastVisit.checkOut) {
      return res.status(400).json({ msg: 'Visitor is already checked in. Check out first.' });
    }

    // Open new visit entry
    const now = new Date();
    visitHistory.push({ checkIn: now.toISOString(), checkOut: null });

    const username = await getUsernameFromReq(req);
    await visitor.update({
      verified: true,
      checkInTime: now,
      checkOutTime: null,
      visitHistory: JSON.stringify(visitHistory),
      verifiedByUsername: username,
    });

    await visitor.reload({ include: [{ model: Event, as: 'Event', attributes: ['id', 'name', 'date'] }] });

    await logAction(req, 'VISITOR_CHECK_IN', username, 'SUCCESS', {
      visitorId: visitor.id,
      name: visitor.name,
      visitNumber: visitHistory.length,
      eventName: visitor.Event ? visitor.Event.name : null,
    });

    console.log(`[checkin] Visitor "${visitor.name}" checked in (visit #${visitHistory.length}).`);
    res.json({
      msg: 'Visitor checked in',
      visitNumber: visitHistory.length,
      visitor: formatVisitorResponse(visitor)
    });
  } catch (err) {
    console.error('[checkin] ERROR:', err.message);
    res.status(500).json({ msg: 'Server error', detail: err.message });
  }
};

// Search visitors by name or phone
exports.searchVisitor = async (req, res) => {
  const { search } = req.query;

  try {
    if (!search || search.trim() === '') {
      return res.status(400).json({ msg: 'Search term is required' });
    }

    const searchTerm = search.trim();
    const visitors = await Visitor.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${searchTerm}%` } },
          { phone: { [Op.iLike]: `%${searchTerm}%` } },
        ],
      },
      include: [
        { model: Event, as: 'Event', attributes: ['id', 'name', 'date'] },
        { model: User, as: 'AddedBy', attributes: ['id', 'username'] },
      ],
      order: [['createdAt', 'DESC']],
    });
    
    // Format all visitors in response
    const formattedVisitors = visitors.map(visitor => formatVisitorResponse(visitor));
    res.json(formattedVisitors);
  } catch (err) {
    console.error('Search visitor error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Check-out visitor — allows re-check-in later within 24h window
exports.checkOutVisitor = async (req, res) => {
  const id = (req.params.id || '').trim();
  console.log(`[checkout] id="${id}"`);

  if (!id) {
    return res.status(400).json({ msg: 'Visitor ID is required' });
  }

  try {
    const visitor = await Visitor.findByPk(id, {
      include: [{ model: Event, as: 'Event', attributes: ['id', 'name', 'date'] }]
    });

    if (!visitor) {
      return res.status(404).json({ msg: 'Visitor not found' });
    }

    if (!visitor.checkInTime) {
      return res.status(400).json({ msg: 'Visitor has not checked in yet' });
    }

    // Close open visit entry in history
    let visitHistory = [];
    try { visitHistory = visitor.visitHistory ? JSON.parse(visitor.visitHistory) : []; } catch (_) {}

    const lastVisit = visitHistory[visitHistory.length - 1];
    const now = new Date();
    if (lastVisit && !lastVisit.checkOut) {
      lastVisit.checkOut = now.toISOString();
    }

    const username = await getUsernameFromReq(req);
    await visitor.update({
      checkOutTime: now,
      visitHistory: JSON.stringify(visitHistory),
      checkedOutByUsername: username,
    });
    await visitor.reload({ include: [{ model: Event, as: 'Event', attributes: ['id', 'name', 'date'] }] });

    await logAction(req, 'VISITOR_CHECK_OUT', username, 'SUCCESS', {
      visitorId: visitor.id,
      name: visitor.name,
      eventName: visitor.Event ? visitor.Event.name : null,
    });

    console.log(`[checkout] Visitor "${visitor.name}" checked out.`);
    res.json({
      msg: 'Visitor checked out successfully',
      totalCompletedVisits: visitHistory.filter(v => v.checkOut).length,
      visitor: formatVisitorResponse(visitor)
    });
  } catch (err) {
    console.error('[checkout] ERROR:', err.message);
    console.error(err.stack);
    res.status(500).json({ msg: 'Server error', detail: err.message });
  }
};

// Verify Visitor by ID (for button click in admin app)
exports.verifyVisitor = async (req, res) => {
  const id = (req.params.id || '').trim();
  console.log(`[verify-by-id] id="${id}"`);

  if (!id) {
    return res.status(400).json({ msg: 'Visitor ID is required' });
  }

  try {
    // Plain lookup first — avoid association errors causing 500
    const visitor = await Visitor.findByPk(id);

    if (!visitor) {
      console.log(`[verify-by-id] Visitor not found: "${id}"`);
      return res.status(404).json({ msg: 'Visitor not found' });
    }

    const username = await getUsernameFromReq(req);
    await visitor.update({
      verified: true,
      checkInTime: visitor.checkInTime || new Date(),  // don't overwrite existing check-in
      verifiedByUsername: username,
    });

    await visitor.reload({ include: [{ model: Event, as: 'Event', attributes: ['id', 'name', 'date'] }] });

    await logAction(req, 'VISITOR_CHECK_IN', username, 'SUCCESS', {
      visitorId: visitor.id,
      name: visitor.name,
      action: 'verified_manually',
      eventName: visitor.Event ? visitor.Event.name : null,
    });

    console.log(`[verify-by-id] Visitor "${visitor.name}" verified.`);
    res.json({
      msg: 'Visitor verified',
      visitor: formatVisitorResponse(visitor)
    });
  } catch (err) {
    console.error('[verify-by-id] ERROR:', err.message);
    console.error(err.stack);
    res.status(500).json({ msg: 'Server error', detail: err.message });
  }
};

// Get All Visitors with Pagination (This is the only getAllVisitors function)
exports.getAllVisitors = async (req, res) => {
  try {
    // Get page and limit from query parameters, set defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    const { count, rows: visitors } = await Visitor.findAndCountAll({
      include: [
        { model: Event, as: 'Event', attributes: ['id', 'name', 'date'] },
        { model: User, as: 'AddedBy', attributes: ['id', 'username'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: limit,
      offset: offset,
    });

    // Calculate total pages
    const totalPages = Math.ceil(count / limit);

    // Format all visitors in response
    const formattedVisitors = visitors.map(visitor => formatVisitorResponse(visitor));
    
    res.json({
      visitors: formattedVisitors,
      pagination: {
        currentPage: page,
        totalPages: totalPages,
        totalVisitors: count,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      }
    });
  } catch (err) {
    console.error('Get all visitors error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
};