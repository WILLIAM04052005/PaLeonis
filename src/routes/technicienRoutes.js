const express = require("express");
const controller = require("../controllers/technicienController");
const ticketController = require("../controllers/ticketController");

const router = express.Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);

router.get("/:id/tickets", ticketController.getByTechnicien);

module.exports = router;
