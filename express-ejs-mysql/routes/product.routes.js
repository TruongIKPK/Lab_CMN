const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');

// Middleware check login
function requireLogin(req, res, next) {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
}

// Apply middleware cho tất cả routes
router.use(requireLogin);

// Home - List all products
router.get('/', productController.list);

// Add product
router.post('/add', productController.uploadMiddleware, productController.add);

// Edit page
router.get('/edit/:id', productController.editPage);

// Update product
router.post('/update/:id', productController.uploadMiddleware, productController.update);

// Delete product
router.post('/delete/:id', productController.delete);

module.exports = router;