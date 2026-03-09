const { PutObjectCommand } = require("@aws-sdk/client-s3");
const { s3, BUCKET, REGION } = require("../config/aws");
const productModel = require("../models/productModel");

async function uploadToS3(file) {
    const key = `images/${Date.now()}-${file.originalname}`;
    await s3.send(new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype
    }));
    return `https://${BUCKET}.s3.${REGION}.amazonaws.com/${key}`;
}

exports.getAllProducts = async (req, res) => {
    try{
        const products = await productModel.getAllProducts();
        res.render("products", { products});
    }catch (error) {
        console.log(error);
        res.send("Error fetching products");
    }
}

exports.showAddForm = (req, res) => {
    res.render("addProduct");
};

exports.createProduct = async (req, res) => {
    try{

        const {name, price, quantity} = req.body;

        if(name === "" || name === null){
            return res.send("Vui long dien ten");
        }

        if(price === "" || price === null || price <= 0){
            return res.send("Vui long dien lai gia");
        }

        if(quantity === "" || quantity === null || quantity < 0){
            return res.send("Vui long dien lai so luong");
        }

        const parsedPrice = Number(price);
        const parsedQty = Number(quantity);

        if (Number.isNaN(parsedPrice) || Number.isNaN(parsedQty)) {
            return res.send("Gia hoac so luong khong hop le");
        }

        let imageUrl = null;
        if (req.file) {
            imageUrl = await uploadToS3(req.file);
        }

        const product = {
            ID: Date.now().toString(),
            name,
            price: parsedPrice,
            quantity: parsedQty,
            image: imageUrl
        };

        await productModel.createProduct(product);

        res.redirect("/products");
    
    }catch(error){
        console.log(error);
        res.send("Error creating product");
    }
}

exports.showEditForm = async (req, res) => {
    try{
        const id = req.params.id
        const product = await productModel.getProductById(id);
        res.render("editProduct", {product});
    }catch(err){
        console.log(error);
        res.send("Error loading product");
    }
}

exports.updateProduct = async (req, res) => {
    try{
        const parsedPrice = Number(req.body.price);
        const parsedQty = Number(req.body.quantity);

        if (Number.isNaN(parsedPrice) || Number.isNaN(parsedQty)) {
            return res.send("Gia hoac so luong khong hop le");
        }

        let imageUrl = req.body.oldImage;
        if (req.file) {
            imageUrl = await uploadToS3(req.file);
        }

        const product = {
            ID: req.params.id,
            name: req.body.name,
            price: parsedPrice,
            quantity: parsedQty,
            image: imageUrl
        }
        await productModel.updateProduct(product);
        res.redirect("/products");

    } catch (error) {
        console.log(error);
        res.send("Error updating product");
    }
}

exports.deleteProduct = async (req, res) => {
    try {
        const id = req.params.id;
        await productModel.deleteProduct(id);
        res.redirect("/products");
    } catch (error) {
        console.log(error);
        res.send("Error deleting product");
    }
};

exports.searchProduct = async (req, res) => {

  try {
    const keyword = req.query.keyword;
    const products = await productModel.searchProduct(keyword);
    res.render("products", { products });
  } catch (error) {
    console.log(error);
    res.send("Error searching product");
  }
};
