// routes/eventRoutes.js
const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const eventController = require('../controllers/eventController');

router.post('/', auth, authorize('admin'), eventController.createEvent);
router.get('/', auth, eventController.getEvents);
router.get('/:id', auth, eventController.getEvent);
router.delete('/:id', auth, authorize('admin'), eventController.deleteEvent);
router.put('/:id', auth, authorize('admin'), eventController.updateEvent);

module.exports = router;