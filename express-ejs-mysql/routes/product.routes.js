const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const { ensureAuthenticated, ensureAdmin } = require('../middlewares/auth.middleware');

router.use(ensureAuthenticated);

// Home - List all products
router.get('/', productController.list);

// Add product
router.post('/add', ensureAdmin, productController.uploadMiddleware, productController.create);

// Edit page
router.get('/edit/:id', ensureAdmin, productController.editPage);

// Update product
router.post('/update/:id', ensureAdmin, productController.uploadMiddleware, productController.update);

// Delete product
router.post('/delete/:id', ensureAdmin, productController.delete);

module.exports = router;