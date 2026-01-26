const db = require('../db/dynamodb');
const { ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE = 'products';

async function getAllProducts() {
    const result = await db.send(new ScanCommand({ TableName: TABLE }));
    console.log('[Model] getAllProducts:', result.Items ? result.Items.length : 0);
    return result.Items || [];
}

async function getProduct(id) {
    const result = await db.send(new GetCommand({ TableName: TABLE, Key: { id } }));
    if (result.Item) {
        console.log('[Model] getProduct found:', id);
    } else {
        console.log('[Model] getProduct not found:', id);
    }
    return result.Item;
}

async function createProduct(product) {
    await db.send(new PutCommand({ TableName: TABLE, Item: product }));
    console.log('[Model] createProduct:', product);
}

async function updateProduct(id, data) {
    await db.send(new UpdateCommand({
        TableName: TABLE,
        Key: { id },
        UpdateExpression: 'set #n = :name, price = :price, quantity = :quantity, s3_truong = :s3_truong',
        ExpressionAttributeNames: { '#n': 'name' },
        ExpressionAttributeValues: {
            ':name': data.name,
            ':price': Number(data.price),
            ':quantity': Number(data.quantity),
            ':s3_truong': data.s3_truong || ''
        }
    }));
    console.log('[Model] updateProduct:', id, data);
}

async function deleteProduct(id) {
    await db.send(new DeleteCommand({ TableName: TABLE, Key: { id } }));
    console.log('[Model] deleteProduct:', id);
}

module.exports = {
    getAllProducts,
    getProduct,
    createProduct,
    updateProduct,
    deleteProduct
};
