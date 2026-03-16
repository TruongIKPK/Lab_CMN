const express = require("express");
const router = express.Router();
const productController = require("../controller/productController");
const upload = require("../config/upload");

router.get("/new", productController.renderCreateForm);
router.post("/new", upload.single("image"), productController.createProductFromForm);
router.get("/:id/edit", productController.renderEditForm);
router.post("/:id/edit", upload.single("image"), productController.updateProductFromForm);
router.delete("/:id", productController.deleteProductFromForm);
router.get("/", productController.renderProductList);

module.exports = router;