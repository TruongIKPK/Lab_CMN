const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.get('/', (req, res) => {
	if (req.session.user) {
		return res.redirect('/products');
	}
	res.redirect('/login');
});

// Login page
router.get('/login', authController.loginPage);

// Login process
router.post('/login', authController.login);

// Register page
router.get('/register', authController.registerPage);

// Register process
router.post('/register', authController.register);

// Logout
router.get('/logout', authController.logout);

module.exports = router;