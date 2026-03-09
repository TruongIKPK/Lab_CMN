const { ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand } =
  require("@aws-sdk/lib-dynamodb");

  const { dynamoDB } = require("../config/aws");

  const TABLE_NAME = "Products";

  exports.getAllProducts = async()=>{
    const command = new ScanCommand({
        TableName: TABLE_NAME
    });
    return (await dynamoDB.send(command)).Items;
  }

  exports.getProductById = async (id) => {
    const command = new GetCommand({
        TableName: TABLE_NAME,
        Key: {ID : id}
    });

    return (await dynamoDB.send(command)).Item;
  }

  exports.createProduct = async (product) => {
    const command = new PutCommand({
        TableName: TABLE_NAME,
        Item: product
    });

    await dynamoDB.send(command);
  }

  exports.updateProduct = async (product) => {
    const command = new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {ID: product.ID},

        UpdateExpression: "SET #name = :name, price = :price, quantity = :quantity, image = :image",
        ExpressionAttributeNames: {
            "#name": "name"
        },
        ExpressionAttributeValues: {
            ":name": product.name,
            ":price": product.price,
            ":quantity": product.quantity,
            ":image": product.image
        }
    })
    await dynamoDB.send(command);
  }

  exports.deleteProduct = async (id) => {
    const command = new DeleteCommand({
        TableName: TABLE_NAME,
        Key: {ID: id}
    });

    await dynamoDB.send(command);
  }

  exports.searchProduct = async(name) => {
    const command = new ScanCommand({
        TableName: TABLE_NAME,
        FilterExpression: "contains(#name, :name)",
        ExpressionAttributeNames: {
            "#name": "name"
        },
        ExpressionAttributeValues: {
            ":name": name
        }
    });
    const result = await dynamoDB.send(command);
    return result.Items;
  }


