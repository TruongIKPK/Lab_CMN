const db = require('../db/dynamodb');
const { ScanCommand, GetCommand, PutCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE || 'Products';

function buildFilterExpression(filters = {}) {
    const expressions = [];
    const attributeValues = {};
    const attributeNames = {};

    expressions.push('(attribute_not_exists(isDeleted) OR isDeleted = :false)');
    attributeValues[':false'] = false;

    if (filters.categoryId) {
        expressions.push('categoryId = :categoryId');
        attributeValues[':categoryId'] = filters.categoryId;
    }

    if (typeof filters.minPrice === 'number') {
        expressions.push('price >= :minPrice');
        attributeValues[':minPrice'] = filters.minPrice;
    }

    if (typeof filters.maxPrice === 'number') {
        expressions.push('price <= :maxPrice');
        attributeValues[':maxPrice'] = filters.maxPrice;
    }

    if (filters.searchTerm) {
        expressions.push('contains(#name, :searchTerm)');
        attributeValues[':searchTerm'] = filters.searchTerm;
        attributeNames['#name'] = 'name';
    }

    const params = {};
    if (expressions.length > 0) {
        params.FilterExpression = expressions.join(' AND ');
        params.ExpressionAttributeValues = attributeValues;
    }
    if (Object.keys(attributeNames).length > 0) {
        params.ExpressionAttributeNames = attributeNames;
    }
    return params;
}

async function listProducts(filters = {}) {
    const params = {
        TableName: PRODUCTS_TABLE,
        ...buildFilterExpression(filters)
    };

    const result = await db.send(new ScanCommand(params));
    return result.Items || [];
}

async function getProduct(id) {
    if (!id) return null;
    const result = await db.send(new GetCommand({
        TableName: PRODUCTS_TABLE,
        Key: { id }
    }));
    return result.Item || null;
}

async function createProduct(product) {
    await db.send(new PutCommand({
        TableName: PRODUCTS_TABLE,
        Item: product
    }));
    return product;
}

async function updateProduct(id, updates) {
    const updateExpressions = [];
    const attributeNames = {};
    const attributeValues = {};

    if (updates.name !== undefined) {
        updateExpressions.push('#name = :name');
        attributeNames['#name'] = 'name';
        attributeValues[':name'] = updates.name;
    }
    if (updates.price !== undefined) {
        updateExpressions.push('price = :price');
        attributeValues[':price'] = Number(updates.price);
    }
    if (updates.quantity !== undefined) {
        updateExpressions.push('quantity = :quantity');
        attributeValues[':quantity'] = Number(updates.quantity);
    }
    if (updates.categoryId !== undefined) {
        updateExpressions.push('categoryId = :categoryId');
        attributeValues[':categoryId'] = updates.categoryId;
    }
    if (updates.imageUrl !== undefined) {
        updateExpressions.push('imageUrl = :imageUrl');
        attributeValues[':imageUrl'] = updates.imageUrl;
    }
    if (updates.isDeleted !== undefined) {
        updateExpressions.push('isDeleted = :isDeleted');
        attributeValues[':isDeleted'] = updates.isDeleted;
    }
    if (updates.deletedAt !== undefined) {
        updateExpressions.push('deletedAt = :deletedAt');
        attributeValues[':deletedAt'] = updates.deletedAt;
    }
    if (updates.updatedAt !== undefined) {
        updateExpressions.push('updatedAt = :updatedAt');
        attributeValues[':updatedAt'] = updates.updatedAt;
    }

    if (updateExpressions.length === 0) return null;

    const params = {
        TableName: PRODUCTS_TABLE,
        Key: { id },
        UpdateExpression: 'SET ' + updateExpressions.join(', '),
        ExpressionAttributeValues: attributeValues
    };

    if (Object.keys(attributeNames).length > 0) {
        params.ExpressionAttributeNames = attributeNames;
    }

    await db.send(new UpdateCommand(params));
    return { id, ...updates };
}

module.exports = {
    listProducts,
    getProduct,
    createProduct,
    updateProduct
};
