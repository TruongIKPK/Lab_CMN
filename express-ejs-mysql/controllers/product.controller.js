const multer = require('multer');
const productService = require('../services/product.service');
const upload = multer({ storage: multer.memoryStorage() });
exports.uploadMiddleware = upload.single('image');

exports.list = async (req, res) => {
    try {
        const data = await productService.listProducts(req.query);
        console.log('Fetched products:', data.products.length);
        res.render('products', {
            products: data.products,
            categories: data.categories,
            filters: data.filters,
            pagination: data.pagination,
            error: null
        });
    } catch (err) {
        console.error('Fetch products error:', err);
        res.render('products', {
            products: [],
            categories: [],
            filters: { categoryId: '', searchTerm: '', minPrice: undefined, maxPrice: undefined, pageSize: 10 },
            pagination: { page: 1, totalPages: 1, totalItems: 0, pageSize: 10, hasPrev: false, hasNext: false },
            error: 'Khong the tai danh sach san pham'
        });
    }
};

exports.create = async (req, res) => {
    try {
        await productService.createProduct(req.body, req.file, req.session.user);
        console.log('Product created:', req.body.name);
        res.redirect('/products');
    } catch (err) {
        console.error('Add product error:', err);
        res.render('error', { message: err.message || 'Khong the them san pham' });
    }
};

exports.editPage = async (req, res) => {
    try {
        const data = await productService.getProductForEdit(req.params.id);
        res.render('edit', data);
    } catch (err) {
        console.error('Edit page error:', err);
        res.render('error', { message: err.message || 'Khong tim thay san pham' });
    }
};

exports.update = async (req, res) => {
    try {
        await productService.updateProduct(req.params.id, req.body, req.file, req.session.user);
        console.log('Product updated:', req.params.id);
        res.redirect('/products');
    } catch (err) {
        console.error('Update product error:', err);
        res.render('error', { message: err.message || 'Khong the cap nhat san pham' });
    }
};

exports.delete = async (req, res) => {
    try {
        await productService.softDeleteProduct(req.params.id, req.session.user);
        console.log('Product deleted (soft):', req.params.id);
        res.redirect('/products');
    } catch (err) {
        console.error('Delete product error:', err);
        res.render('error', { message: err.message || 'Khong the xoa san pham' });
    }
};
