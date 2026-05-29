// const express = require('express');
// const router = express.Router();
// const { login, createUser, getUsers, changePassword, deleteUser, updateUserAccess } = require('../Controllers/userController');
// const authenticate = require('../middleware/auth');

// router.post('/auth/login', login);
// router.post('/users', createUser);
// router.get('/users', authenticate, getUsers);
// router.patch('/users/change-password', authenticate, changePassword);
// router.delete('/users/:id', authenticate, deleteUser);
// router.patch('/users/:id/access', authenticate, updateUserAccess); // Endpoint to update user


// module.exports = router;


// routes/userRoutes.js

// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { auth, authorize } = require('../middleware/auth');
const userController = require('../controllers/userController');

router.get('/', auth, authorize('admin'), userController.getUsers);
router.post('/', auth, authorize('admin'), userController.createUser);
router.delete('/:id', auth, authorize('admin'), userController.deleteUser);
router.put('/:id', auth, authorize('admin'), userController.editUser);
router.patch('/:id/toggle-access', auth, authorize('admin'), userController.toggleUserAccess);

module.exports = router;