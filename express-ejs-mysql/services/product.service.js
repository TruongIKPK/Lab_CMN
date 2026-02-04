const { v4: uuid } = require('uuid');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const productRepository = require('../repositories/product.repository');
const categoryRepository = require('../repositories/category.repository');
const productLogRepository = require('../repositories/productLog.repository');

const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

function parseNumber(value) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? undefined : parsed;
}

function normalizeFilters(query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const pageSizeRaw = parseInt(query.pageSize, 10);
    const pageSize = Math.min(20, Math.max(5, Number.isNaN(pageSizeRaw) ? 10 : pageSizeRaw));

    const filters = {
        categoryId: query.categoryId || '',
        searchTerm: query.search ? query.search.trim() : '',
        minPrice: parseNumber(query.minPrice),
        maxPrice: parseNumber(query.maxPrice),
        page,
        pageSize
    };

    if (filters.minPrice !== undefined && filters.maxPrice !== undefined && filters.minPrice > filters.maxPrice) {
        [filters.minPrice, filters.maxPrice] = [filters.maxPrice, filters.minPrice];
    }

    return filters;
}

function paginate(items, page, pageSize) {
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const currentPage = Math.min(page, totalPages);
    const start = (currentPage - 1) * pageSize;
    const slice = items.slice(start, start + pageSize);
    return {
        items: slice,
        page: currentPage,
        pageSize,
        totalItems,
        totalPages,
        hasPrev: currentPage > 1,
        hasNext: currentPage < totalPages
    };
}

function buildInventoryStatus(quantity) {
    if (quantity <= 0) {
        return { label: 'Het hang', badge: 'bg-red-100 text-red-700' };
    }
    if (quantity < 5) {
        return { label: 'Sap het', badge: 'bg-yellow-100 text-yellow-700' };
    }
    return { label: 'Con hang', badge: 'bg-green-100 text-green-700' };
}

function validateProductPayload(payload) {
    if (!payload.name || !payload.name.trim()) {
        throw new Error('Ten san pham la bat buoc');
    }
    if (payload.price === undefined || Number.isNaN(Number(payload.price))) {
        throw new Error('Gia san pham khong hop le');
    }
    if (payload.quantity === undefined || Number.isNaN(Number(payload.quantity))) {
        throw new Error('So luong khong hop le');
    }
    if (!payload.categoryId) {
        throw new Error('Vui long chon danh muc');
    }
}

async function listProducts(query = {}) {
    const filters = normalizeFilters(query);
    const [rawProducts, categories] = await Promise.all([
        productRepository.listProducts(filters),
        categoryRepository.listCategories()
    ]);

    const categoryMap = categories.reduce((acc, category) => {
        acc[category.categoryId] = category;
        return acc;
    }, {});

    const normalizedProducts = rawProducts
        .map((product) => {
            const quantity = Number(product.quantity || 0);
            const price = Number(product.price || 0);
            const imageUrl = product.imageUrl || product.s3_truong || '';
            return {
                ...product,
                imageUrl,
                price,
                quantity,
                categoryName: categoryMap[product.categoryId]?.name || 'Khong xac dinh',
                status: buildInventoryStatus(quantity)
            };
        })
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    const pagination = paginate(normalizedProducts, filters.page, filters.pageSize);

    return {
        products: pagination.items,
        categories,
        filters,
        pagination
    };
}

async function getProductOrThrow(productId) {
    const product = await productRepository.getProduct(productId);
    if (!product || product.isDeleted) {
        const error = new Error('Product not found');
        error.status = 404;
        throw error;
    }
    if (!product.imageUrl && product.s3_truong) {
        product.imageUrl = product.s3_truong;
    }
    return product;
}

async function ensureCategoryExists(categoryId) {
    const category = await categoryRepository.getCategory(categoryId);
    if (!category) {
        const error = new Error('Category not found');
        error.status = 400;
        throw error;
    }
    return category;
}

async function uploadImage(file) {
    if (!file) return undefined;

    const bucket = process.env.AWS_S3_BUCKET || process.env.S3_BUCKET || 's3-truong';

    const ext = path.extname(file.originalname || '').toLowerCase();
    const key = `products/${uuid()}${ext}`;

    await s3.send(new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
    }));

    return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

async function logProductAction(productId, action, user) {
    const userId = user?.userId || 'system';
    await productLogRepository.createLog({
        logId: uuid(),
        productId,
        action,
        userId,
        time: new Date().toISOString()
    });
}

async function createProduct(payload, file, user) {
    validateProductPayload(payload);
    await ensureCategoryExists(payload.categoryId);
    const imageUrl = await uploadImage(file);
    const now = new Date().toISOString();

    const product = {
        id: uuid(),
        name: payload.name.trim(),
        price: Number(payload.price),
        quantity: Number(payload.quantity),
        categoryId: payload.categoryId,
        imageUrl: imageUrl || '',
        isDeleted: false,
        createdAt: now,
        updatedAt: now
    };

    await productRepository.createProduct(product);
    await logProductAction(product.id, 'CREATE', user);
}

async function getProductForEdit(productId) {
    const [product, categories] = await Promise.all([
        getProductOrThrow(productId),
        categoryRepository.listCategories()
    ]);
    return { product, categories };
}

async function updateProduct(productId, payload, file, user) {
    validateProductPayload(payload);
    await ensureCategoryExists(payload.categoryId);
    const existingProduct = await getProductOrThrow(productId);
    const updates = {
        name: payload.name.trim(),
        price: Number(payload.price),
        quantity: Number(payload.quantity),
        categoryId: payload.categoryId,
        updatedAt: new Date().toISOString()
    };

    const imageUrl = await uploadImage(file);
    if (imageUrl) {
        updates.imageUrl = imageUrl;
    }

    await productRepository.updateProduct(existingProduct.id, updates);
    await logProductAction(existingProduct.id, 'UPDATE', user);
}

async function softDeleteProduct(productId, user) {
    await getProductOrThrow(productId);
    await productRepository.updateProduct(productId, {
        isDeleted: true,
        deletedAt: new Date().toISOString()
    });
    await logProductAction(productId, 'DELETE', user);
}

module.exports = {
    listProducts,
    createProduct,
    getProductForEdit,
    updateProduct,
    softDeleteProduct
};
