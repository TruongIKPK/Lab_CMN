const {
    CreateTableCommand,
    DescribeTableCommand,
    DeleteTableCommand,
    waitUntilTableExists,
} = require("@aws-sdk/client-dynamodb");
const {
    PutCommand,
    GetCommand,
    ScanCommand,
    UpdateCommand,
    DeleteCommand,
} = require("@aws-sdk/lib-dynamodb");
const { client, docClient } = require("../config/aws");

const TABLE_NAME = "product";
const REQUIRED_FIELDS = ["id", "name", "price", "unit_in_stock", "url_image"];
let tableReadyPromise;

const createAppError = (status, message) => {
    const error = new Error(message);
    error.status = status;
    return error;
};

const createTable = async() => {
    const params = {
        TableName: TABLE_NAME,
        KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
        ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5,
        },
    };

    const result = await client.send(new CreateTableCommand(params));
    console.log("Table created:", result.TableDescription.TableName);
};

const ensureTableExists = async() => {
    if (!tableReadyPromise) {
        tableReadyPromise = (async() => {
            try {
                await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
                return;
            } catch (err) {
                if (err.name !== "ResourceNotFoundException") {
                    throw err;
                }
            }

            try {
                await createTable();
            } catch (err) {
                if (err.name !== "ResourceInUseException") {
                    throw err;
                }
            }

            await waitUntilTableExists({
                client,
                maxWaitTime: 20,
                minDelay: 1,
                maxDelay: 2,
            }, { TableName: TABLE_NAME });
        })();
    }

    await tableReadyPromise;
};

const deleteTable = async() => {
    try {
        await client.send(new DeleteTableCommand({ TableName: TABLE_NAME }));
        console.log("Table deleted:", TABLE_NAME);
    } catch (err) {
        console.error("Error deleting table:", err);
    }
};

const validateCreatePayload = (body) => {
    const missing = REQUIRED_FIELDS.filter((field) => body[field] === undefined || body[field] === null || body[field] === "");
    if (missing.length > 0) {
        throw createAppError(400, `Missing required field(s): ${missing.join(", ")}`);
    }

    if (typeof body.id !== "string") throw createAppError(400, "id must be a string");
    if (typeof body.name !== "string") throw createAppError(400, "name must be a string");
    if (typeof body.url_image !== "string") throw createAppError(400, "url_image must be a string");
    if (typeof body.price !== "number") throw createAppError(400, "price must be a number");
    if (typeof body.unit_in_stock !== "number") throw createAppError(400, "unit_in_stock must be a number");
};

const createProduct = async(payload) => {
    await ensureTableExists();
    validateCreatePayload(payload);

    const existing = await docClient.send(
        new GetCommand({
            TableName: TABLE_NAME,
            Key: { id: payload.id },
        })
    );

    if (existing.Item) {
        throw createAppError(409, "Product id already exists");
    }

    const item = {
        id: payload.id,
        name: payload.name,
        price: payload.price,
        unit_in_stock: payload.unit_in_stock,
        url_image: payload.url_image,
    };

    await docClient.send(
        new PutCommand({
            TableName: TABLE_NAME,
            Item: item,
        })
    );

    return item;
};

const getAllProducts = async() => {
    await ensureTableExists();
    const data = await docClient.send(
        new ScanCommand({
            TableName: TABLE_NAME,
        })
    );

    return data.Items || [];
};

const getProductById = async(id) => {
    await ensureTableExists();
    const data = await docClient.send(
        new GetCommand({
            TableName: TABLE_NAME,
            Key: { id },
        })
    );

    if (!data.Item) {
        throw createAppError(404, "Product not found");
    }

    return data.Item;
};

const updateProductById = async(id, payload) => {
    await ensureTableExists();
    const { name, price, unit_in_stock, url_image } = payload;

    const updates = [];
    const values = {};
    const names = {};

    if (name !== undefined) {
        updates.push("#name = :name");
        values[":name"] = name;
        names["#name"] = "name";
    }
    if (price !== undefined) {
        updates.push("price = :price");
        values[":price"] = price;
    }
    if (unit_in_stock !== undefined) {
        updates.push("unit_in_stock = :unit_in_stock");
        values[":unit_in_stock"] = unit_in_stock;
    }
    if (url_image !== undefined) {
        updates.push("url_image = :url_image");
        values[":url_image"] = url_image;
    }

    if (updates.length === 0) {
        throw createAppError(400, "No fields to update");
    }

    try {
        const data = await docClient.send(
            new UpdateCommand({
                TableName: TABLE_NAME,
                Key: { id },
                UpdateExpression: `SET ${updates.join(", ")}`,
                ExpressionAttributeValues: values,
                ExpressionAttributeNames: Object.keys(names).length ? names : undefined,
                ConditionExpression: "attribute_exists(id)",
                ReturnValues: "ALL_NEW",
            })
        );

        return data.Attributes;
    } catch (error) {
        if (error.name === "ConditionalCheckFailedException") {
            throw createAppError(404, "Product not found");
        }
        throw error;
    }
};

const deleteProductById = async(id) => {
    await ensureTableExists();
    try {
        await docClient.send(
            new DeleteCommand({
                TableName: TABLE_NAME,
                Key: { id },
                ConditionExpression: "attribute_exists(id)",
            })
        );
    } catch (error) {
        if (error.name === "ConditionalCheckFailedException") {
            throw createAppError(404, "Product not found");
        }
        throw error;
    }
};

module.exports = {
    TABLE_NAME,
    ensureTableExists,
    createTable,
    deleteTable,
    createProduct,
    getAllProducts,
    getProductById,
    updateProductById,
    deleteProductById,
};