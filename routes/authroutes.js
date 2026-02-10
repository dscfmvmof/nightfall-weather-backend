const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
router.post('/register', authController.register); // Register a new user
router.post('/login', authController.login);       // Authenticate user

module.exports = router;