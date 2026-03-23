const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload");
const controller = require("../controllers/ticketController");

router.get("/", async(req, res, next) => {
    try {
        const tickets = await controller.getAllTickets();
        res.render("index", { tickets });
    } catch (error) {
        next(error);
    }
});

router.get("/tickets", async(req, res, next) => {
    try {
        const tickets = await controller.getAllTickets();
        res.render("index", { tickets });
    } catch (error) {
        next(error);
    }
});

router.get("/tickets/add", (req, res) => {
    res.render("add");
});

router.post("/tickets/add", upload.single("image"), async(req, res, next) => {
    try {
        const imageUrl = req.file ? await controller.uploadToS3(req.file) : "";

        const ticket = {
            ticketId: req.body.ticketId,
            eventName: req.body.eventName,
            price: Number(req.body.price),
            quantity: Number(req.body.quantity),
            imageUrl
        };

        await controller.createTicket(ticket);
        res.redirect("/tickets");
    } catch (error) {
        next(error);
    }
});

router.get("/tickets/:ticketId/edit", async(req, res, next) => {
    try {
        const tickets = await controller.getAllTickets();
        const ticket = tickets.find((item) => item.ticketId === req.params.ticketId);

        if (!ticket) {
            return res.status(404).send("Khong tim thay ve");
        }

        res.render("edit", { ticket });
    } catch (error) {
        next(error);
    }
});

router.post("/tickets/:ticketId/edit", async(req, res, next) => {
    try {
        await controller.updateTicket(req.params.ticketId, {
            eventName: req.body.eventName,
            price: req.body.price,
            quantity: req.body.quantity
        });

        res.redirect("/tickets");
    } catch (error) {
        next(error);
    }
});

router.post("/tickets/:ticketId/delete", async(req, res, next) => {
    try {
        await controller.deleteTicket(req.params.ticketId);
        res.redirect("/tickets");
    } catch (error) {
        next(error);
    }
});

module.exports = router;