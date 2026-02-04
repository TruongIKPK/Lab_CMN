const db = require('../db/dynamodb');
const { ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const CATEGORIES_TABLE = process.env.CATEGORIES_TABLE || 'Categories';

async function listCategories() {
    const result = await db.send(new ScanCommand({ TableName: CATEGORIES_TABLE }));
    const items = result.Items || [];
    return items.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

async function getCategory(categoryId) {
    if (!categoryId) return null;
    const result = await db.send(new GetCommand({
        TableName: CATEGORIES_TABLE,
        Key: { categoryId }
    }));
    return result.Item || null;
}

async function createCategory(category) {
    await db.send(new PutCommand({
        TableName: CATEGORIES_TABLE,
        Item: category
    }));
    return category;
}

async function updateCategory(categoryId, data) {
    await db.send(new UpdateCommand({
        TableName: CATEGORIES_TABLE,
        Key: { categoryId },
        UpdateExpression: 'SET #name = :name, description = :description',
        ExpressionAttributeNames: {
            '#name': 'name'
        },
        ExpressionAttributeValues: {
            ':name': data.name,
            ':description': data.description || ''
        }
    }));
}

async function deleteCategory(categoryId) {
    await db.send(new DeleteCommand({
        TableName: CATEGORIES_TABLE,
        Key: { categoryId }
    }));
}

module.exports = {
    listCategories,
    getCategory,
    createCategory,
    updateCategory,
    deleteCategory
};
