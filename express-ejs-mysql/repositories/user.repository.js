const db = require('../db/dynamodb');
const { GetCommand, PutCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');

const USERS_TABLE = process.env.USERS_TABLE || 'Users';

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

    console.log('🔍 [DB] Scanning DynamoDB for username:', username);
    console.log('🔍 [DB] Table name:', USERS_TABLE);

    try {
        const result = await db.send(new ScanCommand({
            TableName: USERS_TABLE,
            FilterExpression: 'username = :username',
            ExpressionAttributeValues: {
                ':username': username
            },
            Limit: 1
        }));

        console.log('🔍 [DB] Scan result - Items found:', result.Items?.length || 0);
        if (result.Items && result.Items.length > 0) {
            console.log('✅ [DB] User found:', result.Items[0].username);
        } else {
            console.log('❌ [DB] No user found with username:', username);
        }

        return result.Items && result.Items.length > 0 ? result.Items[0] : null;
    } catch (error) {
        console.error('❌ [DB] Error scanning DynamoDB:', error.message);
        console.error('❌ [DB] Error details:', error);
        throw error;
    }
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
