const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller');
const { ensureAuthenticated, ensureAdmin } = require('../middlewares/auth.middleware');

router.use(ensureAuthenticated, ensureAdmin);

router.get('/', categoryController.list);
router.get('/create', categoryController.createPage);
router.post('/', categoryController.create);
router.get('/edit/:id', categoryController.editPage);
router.post('/update/:id', categoryController.update);
router.post('/delete/:id', categoryController.delete);

module.exports = router;
