const db = require('../db/dynamodb');
const { GetCommand, PutCommand } = require('@aws-sdk/lib-dynamodb');

const TABLE = 'users';

async function getUser(username) {
    const result = await db.send(new GetCommand({
        TableName: TABLE,
        Key: { username }
    }));
    return result.Item;
}

async function createUser(user) {
    await db.send(new PutCommand({
        TableName: TABLE,
        Item: user
    }));
}

module.exports = { getUser, createUser };
