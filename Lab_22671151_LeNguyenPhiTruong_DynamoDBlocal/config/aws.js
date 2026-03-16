const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");

const endpoint = process.env.DYNAMODB_ENDPOINT || "http://localhost:8000";

const client = new DynamoDBClient({
    region: "local",
    endpoint,
    credentials: {
        accessKeyId: "dummy",
        secretAccessKey: "dummy",
    },
});

const docClient = DynamoDBDocumentClient.from(client);

module.exports = { client, docClient };