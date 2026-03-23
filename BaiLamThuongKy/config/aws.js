require('dotenv').config();
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient } = require("@aws-sdk/lib-dynamodb");
const { S3Client } = require("@aws-sdk/client-s3");

const awsRegion = process.env.AWS_REGION;
const s3Region = process.env.S3_BUCKET_REGION || awsRegion;

const client = new DynamoDBClient({
    region: awsRegion,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const s3 = new S3Client({
    region: s3Region,
    followRegionRedirects: true,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});

const docClient = DynamoDBDocumentClient.from(client);

module.exports = {
    docClient,
    s3
};