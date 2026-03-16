var express = require('express');
var router = express.Router();
var productModel = require('../models/product');

/* GET home page. */
router.get('/', async function(req, res) {
    try {
        var products = await productModel.getAllProducts();
        res.render('index', {
            title: 'Product Dashboard',
            products: products,
        });
    } catch (error) {
        res.status(error.status || 500).render('error', {
            message: error.message || 'Failed to load home page',
            error: req.app.get('env') === 'development' ? error : {},
        });
    }
});

module.exports = router;