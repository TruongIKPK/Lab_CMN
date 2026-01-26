const Product = require('../models/product.model');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');
const path = require('path');
const s3 = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
    }
});
const upload = multer({ storage: multer.memoryStorage() });
exports.uploadMiddleware = upload.single('image');

exports.list = async (req, res) => {
    try {
        const products = await Product.getAllProducts();
        console.log('Fetched products:', products.length);
        res.render('products', { products });
    } catch (err) {
        console.error('Fetch products error:', err);
        res.render('products', { products: [] });
    }
};

exports.add = async (req, res) => {
    const { name, price, quantity } = req.body;
    let s3_truong = '';
    try {
        if (req.file) {
            const fileExt = path.extname(req.file.originalname);
            const s3Key = `products/${Date.now()}_${Math.random().toString(36).substring(2)}${fileExt}`;
            try {
                await s3.send(new PutObjectCommand({
                    Bucket: 's3-truong',
                    Key: s3Key,
                    Body: req.file.buffer,
                    ContentType: req.file.mimetype
                }));
                s3_truong = `https://s3.${process.env.AWS_REGION}.amazonaws.com/s3-truong/${s3Key}`;
                console.log('Upload image to S3 success:', s3_truong);
            } catch (uploadErr) {
                console.error('Upload image to S3 failed:', uploadErr);
                console.error('File info:', {
                  originalname: req.file.originalname,
                  mimetype: req.file.mimetype,
                  size: req.file.size,
                  s3Key,
                  region: process.env.AWS_REGION,
                  bucket: 's3-truong',
                  accessKeyId: process.env.AWS_ACCESS_KEY_ID
                });
                if (uploadErr.stack) {
                  console.error('Stack trace:', uploadErr.stack);
                }
            }
        }
        await Product.createProduct({
            id: Date.now().toString(),
            name,
            price: Number(price),
            quantity: Number(quantity),
            s3_truong
        });
        console.log('Product added:', name);
        res.redirect('/products');
    } catch (err) {
        console.error('Add product error:', err);
        res.redirect('/products');
    }
};

exports.editPage = async (req, res) => {
    try {
        const product = await Product.getProduct(req.params.id);
        if (product) {
            console.log('Edit product page for:', req.params.id);
            res.render('edit', { product });
        } else {
            console.log('Product not found for edit:', req.params.id);
            res.redirect('/products');
        }
    } catch (err) {
        console.error('Edit page error:', err);
        res.redirect('/products');
    }
};

exports.update = async (req, res) => {
    const { name, price, quantity, s3_truong } = req.body;
    let new_s3_truong = s3_truong || '';
    try {
        if (req.file) {
            const fileExt = path.extname(req.file.originalname);
            const s3Key = `products/${Date.now()}_${Math.random().toString(36).substring(2)}${fileExt}`;
            try {
                await s3.send(new PutObjectCommand({
                    Bucket: 's3-truong',
                    Key: s3Key,
                    Body: req.file.buffer,
                    ContentType: req.file.mimetype
                }));
                new_s3_truong = `https://s3.${process.env.AWS_REGION}.amazonaws.com/s3-truong/${s3Key}`;
                console.log('Upload image to S3 (update) success:', new_s3_truong);
            } catch (uploadErr) {
                console.error('Upload image to S3 (update) failed:', uploadErr);
                console.error('File info:', {
                  originalname: req.file.originalname,
                  mimetype: req.file.mimetype,
                  size: req.file.size,
                  s3Key,
                  region: process.env.AWS_REGION,
                  bucket: 's3-truong',
                  accessKeyId: process.env.AWS_ACCESS_KEY_ID
                });
                if (uploadErr.stack) {
                  console.error('Stack trace:', uploadErr.stack);
                }
            }
        }
        await Product.updateProduct(req.params.id, { name, price, quantity, s3_truong: new_s3_truong });
        console.log('Product updated:', req.params.id);
        res.redirect('/products');
    } catch (err) {
        console.error('Update product error:', err);
        res.redirect('/products');
    }
};

exports.delete = async (req, res) => {
    try {
        await Product.deleteProduct(req.params.id);
        console.log('Product deleted:', req.params.id);
        res.redirect('/products');
    } catch (err) {
        console.error('Delete product error:', err);
        res.redirect('/products');
    }
};
