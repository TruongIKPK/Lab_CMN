const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDir = path.join(__dirname, "..", "public", "images");

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, uploadDir);
    },
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname || "").toLowerCase();
        const baseName = path
            .basename(file.originalname || "image", ext)
            .replace(/[^a-zA-Z0-9-_]/g, "-")
            .toLowerCase();
        cb(null, `${Date.now()}-${baseName}${ext}`);
    },
});

const fileFilter = (_req, file, cb) => {
    if (!file.mimetype || !file.mimetype.startsWith("image/")) {
        cb(new Error("Chi cho phep tai len file hinh anh"));
        return;
    }

    cb(null, true);
};

module.exports = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});