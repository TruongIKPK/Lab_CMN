const categoryService = require('../services/category.service');

exports.list = async (req, res) => {
    try {
        const categories = await categoryService.listCategories();
        res.render('categories/index', { categories, error: null });
    } catch (error) {
        console.error('Load categories error:', error);
        res.render('categories/index', { categories: [], error: 'Khong the tai danh muc' });
    }
};

exports.createPage = (req, res) => {
    res.render('categories/form', { category: null, action: 'create', error: null });
};

exports.create = async (req, res) => {
    try {
        await categoryService.createCategory(req.body);
        res.redirect('/categories');
    } catch (error) {
        console.error('Create category error:', error);
        res.render('categories/form', {
            category: req.body,
            action: 'create',
            error: error.message || 'Khong the tao danh muc'
        });
    }
};

exports.editPage = async (req, res) => {
    try {
        const category = await categoryService.getCategoryForEdit(req.params.id);
        res.render('categories/form', { category, action: 'edit', error: null });
    } catch (error) {
        console.error('Edit category page error:', error);
        res.redirect('/categories');
    }
};

exports.update = async (req, res) => {
    try {
        await categoryService.updateCategory(req.params.id, req.body);
        res.redirect('/categories');
    } catch (error) {
        console.error('Update category error:', error);
        res.render('categories/form', {
            category: { ...req.body, categoryId: req.params.id },
            action: 'edit',
            error: error.message || 'Khong the cap nhat danh muc'
        });
    }
};

exports.delete = async (req, res) => {
    try {
        await categoryService.deleteCategory(req.params.id);
        res.redirect('/categories');
    } catch (error) {
        console.error('Delete category error:', error);
        res.render('error', { message: error.message || 'Khong the xoa danh muc' });
    }
};
