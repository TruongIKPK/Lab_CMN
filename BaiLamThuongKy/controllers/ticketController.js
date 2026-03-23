const { docClient, s3 } = require("../config/aws")
const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { PutCommand } = require("@aws-sdk/lib-dynamodb");
const { UpdateCommand } = require("@aws-sdk/lib-dynamodb");
const { ScanCommand } = require("@aws-sdk/lib-dynamodb");
const { DeleteCommand } = require("@aws-sdk/lib-dynamodb");

async function uploadToS3(file) {
    const fileName = Date.now() + "-" + file.originalname;
    const encodedFileName = encodeURIComponent(fileName);
    const bucketName = process.env.S3_BUCKET_NAME;

    const command = new PutObjectCommand({
        Bucket: bucketName,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype
    });

    await s3.send(command);

    return `https://${bucketName}.s3.amazonaws.com/${encodedFileName}`;
}

function validateTicket(data) {
    const errors = [];

    if (!data.ticketId || data.ticketId.trim() === "") {
        errors.push("Mã vé không được rỗng");
    }

    if (!data.eventName || data.eventName.trim().length < 3) {
        errors.push("Tên sự kiện phải có ít nhất 3 ký tự");
    }

    if (isNaN(data.price) || Number(data.price) <= 0) {
        errors.push("Giá vé phải > 0");
    }

    if (isNaN(data.quantity) || Number(data.quantity) < 0) {
        errors.push("Số lượng phải >= 0");
    }

    return errors;
}

async function createTicket(ticket) {
    const params = {
        TableName: "EventTickets",
        Item: ticket
    };
    await docClient.send(new PutCommand(params));
}

async function getAllTickets() {
    const params = { TableName: "EventTickets" };
    const result = await docClient.send(new ScanCommand(params));
    return result.Items || [];
}

async function deleteTicket(ticketId) {
    const params = {
        TableName: "EventTickets",
        Key: { ticketId }
    };
    await docClient.send(new DeleteCommand(params));
}

async function updateTicket(ticketId, data) {
    const params = {
        TableName: "EventTickets",
        Key: { ticketId },
        UpdateExpression: `
      SET eventName = :eventName,
          price = :price,
          quantity = :quantity
    `,
        ExpressionAttributeValues: {
            ":eventName": data.eventName,
            ":price": Number(data.price),
            ":quantity": Number(data.quantity)
        }
    };
    await docClient.send(new UpdateCommand(params));
}

async function searchTickets(keyword) {
    const params = {
        TableName: "EventTickets",
        FilterExpression: "contains(eventName, :kw)",
        ExpressionAttributeValues: {
            ":kw": keyword
        }
    };

    const result = await docClient.send(new ScanCommand(params));
    return result.Items || [];
}

function calculateTotalRevenue(price, quantitySold) {
    return Number(price) * Number(quantitySold);
}

function calculateRemaining(quantity, quantitySold) {
    return Number(quantity) - Number(quantitySold);
}

function getTicketStatus(quantity) {
    if (quantity <= 0) return "Hết vé";
    if (quantity <= 10) return "Sắp hết";
    return "Còn vé";
}

module.exports = {
    uploadToS3,
    createTicket,
    getAllTickets,
    deleteTicket,
    updateTicket,
    getTicketStatus
}