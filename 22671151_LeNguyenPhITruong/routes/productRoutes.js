const express = require("express");
const router = express.Router();

const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });

const productController = require("../controller/productController");

/* list */
router.get("/products", productController.getAllProducts);

/* add */
router.get("/products/add", productController.showAddForm);
router.post("/products/add", upload.single("image"), productController.createProduct);

/* edit */
router.get("/products/edit/:id", productController.showEditForm);
router.post("/products/edit/:id", upload.single("image"), productController.updateProduct);

/* delete */
router.get("/products/delete/:id", productController.deleteProduct);

/* search */
router.get("/search", productController.searchProduct);

module.exports = router;