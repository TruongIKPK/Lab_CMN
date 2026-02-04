const db = require('../db/dynamodb');
const { PutCommand } = require('@aws-sdk/lib-dynamodb');

const PRODUCT_LOGS_TABLE = process.env.PRODUCT_LOGS_TABLE || 'ProductLogs';

async function createLog(log) {
    await db.send(new PutCommand({
        TableName: PRODUCT_LOGS_TABLE,
        Item: log
    }));
    return log;
}

module.exports = {
    createLog
};
