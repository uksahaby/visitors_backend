const { Event, User, Visitor } = require('../models');
const { logAction } = require('./auditController');

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

// Create event (admin only)
exports.createEvent = async (req, res) => {
  const { name, date, description, location } = req.body;

  try {
    const username = await getUsernameFromReq(req);
    const event = await Event.create({
      name,
      date,
      description: description || null,
      location: location || null,
      createdBy: req.user.id,
      createdByUsername: username,
    });

    // Audit log for event creation
    await logAction(req, 'EVENT_CREATE', username, 'SUCCESS', { eventId: event.id, name: event.name });

    res.json(event);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get all events
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.findAll({
      include: [{ model: User, as: 'CreatedBy', attributes: ['id', 'username'] }],
    });
    res.json(events);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
};

// Get specific event with visitors
exports.getEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id, {
      include: [
        { model: User, as: 'CreatedBy', attributes: ['id', 'username'] },
        { model: Visitor, as: 'Visitors', include: [
          { model: User, as: 'AddedBy', attributes: ['id', 'username'] }
        ] }
      ],
    });
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Update event (admin only)
exports.updateEvent = async (req, res) => {
  const { name, date, description, location } = req.body;

  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }

    const username = await getUsernameFromReq(req);
    await event.update({
      name,
      date,
      description: description || null,
      location: location || null,
      updatedByUsername: username,
    });

    // Audit log for event updating
    await logAction(req, 'EVENT_UPDATE', username, 'SUCCESS', { eventId: event.id, name: event.name });

    res.json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};

// Delete event (admin only)
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ msg: 'Event not found' });
    }
    
    const visitors = await Visitor.findAll({ where: { eventId: req.params.id } });
    if (visitors.length > 0) {
      await Visitor.destroy({ where: { eventId: req.params.id } });
    }
    
    const eventName = event.name;
    await event.destroy();

    const username = await getUsernameFromReq(req);
    // Audit log for event deletion
    await logAction(req, 'EVENT_DELETE', username, 'SUCCESS', { eventId: req.params.id, name: eventName });

    res.json({ msg: 'Event deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: 'Server error' });
  }
};