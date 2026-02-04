const db = require('../db/dynamodb');
const { GetCommand, PutCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const USERS_TABLE = process.env.USERS_TABLE || 'Users';
const USERNAME_INDEX = process.env.USERS_USERNAME_INDEX || process.env.USERS_USERNAME_GSI || null;

async function getById(userId) {
    if (!userId) return null;
    const result = await db.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { userId }
    }));
    return result.Item || null;
}

async function getByUsername(username) {
    if (!username) return null;

    if (USERNAME_INDEX) {
        const result = await db.send(new QueryCommand({
            TableName: USERS_TABLE,
            IndexName: USERNAME_INDEX,
            KeyConditionExpression: 'username = :username',
            ExpressionAttributeValues: {
                ':username': username
            },
            Limit: 1
        }));
        if (result.Items && result.Items.length > 0) {
            return result.Items[0];
        }
    }

    const fallbackResult = await db.send(new ScanCommand({
        TableName: USERS_TABLE,
        FilterExpression: 'username = :username',
        ExpressionAttributeValues: {
            ':username': username
        },
        Limit: 1
    }));
    return fallbackResult.Items && fallbackResult.Items.length > 0 ? fallbackResult.Items[0] : null;
}

async function createUser(user) {
    const item = {
        ...user,
        createdAt: user.createdAt || new Date().toISOString()
    };
    await db.send(new PutCommand({
        TableName: USERS_TABLE,
        Item: item
    }));
    return item;
}

module.exports = {
    getById,
    getByUsername,
    createUser
};
