const fs = require("fs/promises");
const path = require("path");
const productModel = require("../models/product");

const isManagedImageUrl = (value) => typeof value === "string" && value.startsWith("/images/");

const resolveImagePath = (imageUrl) => path.join(__dirname, "..", "public", imageUrl.replace(/^\//, ""));

const deleteStoredImage = async(imageUrl) => {
    if (!isManagedImageUrl(imageUrl)) {
        return;
    }

    try {
        await fs.unlink(resolveImagePath(imageUrl));
    } catch (error) {
        if (error.code !== "ENOENT") {
            throw error;
        }
    }
};

const pad2 = (value) => String(value).padStart(2, "0");

const generateCurrentMinuteId = () => {
    const now = new Date();
    const year = String(now.getFullYear());
    const month = pad2(now.getMonth() + 1);
    const day = pad2(now.getDate());
    const hour = pad2(now.getHours());
    const minute = pad2(now.getMinutes());

    return `${year}${month}${day}${hour}${minute}`;
};

const mapFormToProductPayload = (body, file) => ({
    id: body.id || generateCurrentMinuteId(),
    name: body.name,
    price: Number(body.price),
    unit_in_stock: Number(body.unit_in_stock),
    url_image: file ? `/images/${file.filename}` : body.url_image,
});

exports.renderProductList = async(_req, res) => {
    try {
        const items = await productModel.getAllProducts();
        return res.render("index", {
            title: "Product Dashboard",
            products: items,
        });
    } catch (error) {
        return res.status(error.status || 500).render("error", {
            message: error.message || "Failed to load product list",
            error,
        });
    }
};

exports.createProduct = async(req, res) => {
    try {
        const item = await productModel.createProduct(req.body);

        return res.status(201).json(item);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.message || "Failed to create product" });
    }
};

exports.getAllProducts = async(_req, res) => {
    try {
        const items = await productModel.getAllProducts();

        return res.status(200).json(items);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.message || "Failed to get products" });
    }
};

exports.getProductById = async(req, res) => {
    try {
        const item = await productModel.getProductById(req.params.id);

        return res.status(200).json(item);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.message || "Failed to get product" });
    }
};

exports.updateProduct = async(req, res) => {
    try {
        const item = await productModel.updateProductById(req.params.id, req.body);

        return res.status(200).json(item);
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.message || "Failed to update product" });
    }
};

exports.deleteProduct = async(req, res) => {
    try {
        await productModel.deleteProductById(req.params.id);

        return res.status(200).json({ message: "Product deleted" });
    } catch (error) {
        return res.status(error.status || 500).json({ message: error.message || "Failed to delete product" });
    }
};

exports.renderCreateForm = (_req, res) => {
    return res.render("product-create", {
        title: "Them san pham",
        product: null,
        errorMessage: null,
    });
};

exports.createProductFromForm = async(req, res) => {
    try {
        const payload = mapFormToProductPayload(req.body, req.file);
        await productModel.createProduct(payload);
        return res.redirect("/");
    } catch (error) {
        if (req.file) {
            await deleteStoredImage(`/images/${req.file.filename}`);
        }

        return res.status(error.status || 500).render("product-create", {
            title: "Them san pham",
            product: req.body,
            errorMessage: error.message || "Khong the them san pham",
        });
    }
};

exports.renderEditForm = async(req, res) => {
    try {
        const item = await productModel.getProductById(req.params.id);
        return res.render("product-edit", {
            title: "Chinh sua san pham",
            product: item,
            errorMessage: null,
        });
    } catch (error) {
        return res.status(error.status || 500).render("error", {
            message: error.message || "Khong the tai du lieu san pham",
            error,
        });
    }
};

exports.updateProductFromForm = async(req, res) => {
    try {
        const existingProduct = await productModel.getProductById(req.params.id);
        const nextImageUrl = req.file ? `/images/${req.file.filename}` : req.body.url_image;
        const payload = {
            name: req.body.name,
            price: Number(req.body.price),
            unit_in_stock: Number(req.body.unit_in_stock),
            url_image: nextImageUrl,
        };

        await productModel.updateProductById(req.params.id, payload);

        if (req.file && existingProduct.url_image !== nextImageUrl) {
            await deleteStoredImage(existingProduct.url_image);
        }

        return res.redirect("/");
    } catch (error) {
        if (req.file) {
            await deleteStoredImage(`/images/${req.file.filename}`);
        }

        return res.status(error.status || 500).render("product-edit", {
            title: "Chinh sua san pham",
            product: {
                id: req.params.id,
                ...req.body,
            },
            errorMessage: error.message || "Khong the cap nhat san pham",
        });
    }
};

exports.deleteProductFromForm = async(req, res) => {
    try {
        await productModel.deleteProductById(req.params.id);
        return res.redirect("/");
    } catch (error) {
        return res.status(error.status || 500).render("error", {
            message: error.message || "Khong the xoa san pham",
            error,
        });
    }
};