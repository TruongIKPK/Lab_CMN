const { v4: uuid } = require('uuid');
const categoryRepository = require('../repositories/category.repository');
const productRepository = require('../repositories/product.repository');

async function listCategories() {
    const [categories, products] = await Promise.all([
        categoryRepository.listCategories(),
        productRepository.listProducts({})
    ]);

    const activeProducts = products.filter((product) => !product.isDeleted);
    const counts = activeProducts.reduce((acc, product) => {
        acc[product.categoryId] = (acc[product.categoryId] || 0) + 1;
        return acc;
    }, {});

    return categories.map((category) => ({
        ...category,
        productCount: counts[category.categoryId] || 0
    }));
}

async function getCategoryOrThrow(categoryId) {
    const category = await categoryRepository.getCategory(categoryId);
    if (!category) {
        const error = new Error('Category not found');
        error.status = 404;
        throw error;
    }
    return category;
}

async function createCategory(payload) {
    if (!payload.name || !payload.name.trim()) {
        throw new Error('Ten danh muc la bat buoc');
    }
    const category = {
        categoryId: uuid(),
        name: payload.name.trim(),
        description: payload.description || '',
        createdAt: new Date().toISOString()
    };
    await categoryRepository.createCategory(category);
}

async function getCategoryForEdit(categoryId) {
    return getCategoryOrThrow(categoryId);
}

async function updateCategory(categoryId, payload) {
    if (!payload.name || !payload.name.trim()) {
        throw new Error('Ten danh muc la bat buoc');
    }
    await getCategoryOrThrow(categoryId);
    await categoryRepository.updateCategory(categoryId, {
        name: payload.name.trim(),
        description: payload.description || ''
    });
}

async function deleteCategory(categoryId) {
    await getCategoryOrThrow(categoryId);
    await categoryRepository.deleteCategory(categoryId);
}

module.exports = {
    listCategories,
    createCategory,
    getCategoryForEdit,
    updateCategory,
    deleteCategory
};
