// const express = require('express');
// const router = express.Router();
// const multer = require('multer');
// const path = require('path');
// const { authenticate, isAdmin } = require('../middleware/auth');
// const { addVisitor, getVisitor, searchVisitorByPhone, verifyVisitor, receiveScannerInput, verifyVisitorFromScanner, editVisitor, deleteVisitor, getEvents, getVisitorsByEvent, deleteEvent } = require('../Controllers/visitorController');

// // Configure multer for file uploads
// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, process.env.UPLOAD_DIR || 'Uploads');
//   },
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
//     cb(null, uniqueSuffix + path.extname(file.originalname));
//   },
// });
// const upload = multer({ storage });

// router.post('/', authenticate, isAdmin, upload.single('image'), addVisitor); // POST /api/visitors - Admin only
// router.get('/:id', authenticate, getVisitor); // GET /api/visitors/:id
// router.get('/search', authenticate, searchVisitorByPhone); // GET /api/visitors/search
// router.get('/verifyVisitor/:id', authenticate, verifyVisitor); // GET /api/visitors/verifyVisitor/:id
// router.post('/receiveScannerInput', authenticate, receiveScannerInput); // POST /api/visitors/receiveScannerInput
// router.get('/verifyVisitorFromScanner/:qrCode', verifyVisitorFromScanner); // GET /api/visitors/verifyVisitorFromScanner/:qrCode - Public for scanning
// router.put('/:id', authenticate, isAdmin, upload.single('image'), editVisitor); // PUT /api/visitors/:id - Admin only
// router.delete('/:id', authenticate, isAdmin, deleteVisitor); // DELETE /api/visitors/:id - Admin only
// router.get('/events', authenticate, getEvents); // GET /api/visitors/events - Authenticated users
// router.get('/events/:eventId/visitors', authenticate, getVisitorsByEvent); // GET /api/visitors/events/:eventId/visitors - Authenticated users
// router.delete('/events/:id', authenticate, isAdmin, deleteEvent); // DELETE /api/visitors/events/:id - Admin only

// module.exports = router;



// routes/visitorRoutes.js
const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const visitorController = require('../Controllers/visitorController');

router.post('/', auth, authorize('admin'), visitorController.addVisitor);
router.put('/:id', auth, authorize('admin'), visitorController.editVisitor);
router.delete('/:id', auth, authorize('admin'), visitorController.deleteVisitor);
router.get('/event/:eventId', auth, visitorController.getVisitorsByEvent);
router.post('/verify-qr', auth, visitorController.verifyVisitorByQR);
router.get('/search', auth, visitorController.searchVisitor);
router.get('/', visitorController.getAllVisitors);
router.put('/:id/checkout', auth, visitorController.checkOutVisitor);
router.put('/:id/checkin', auth, visitorController.checkInVisitor);
router.put('/:id/verify', auth, visitorController.verifyVisitor);



module.exports = router;