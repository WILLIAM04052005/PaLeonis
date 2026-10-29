const express = require("express");
const controller = require("../controllers/ticketController");
const router = express.Router();
router.get("/", controller.getAll);
router.get("/:id", controller.getById);
router.post("/", controller.create);
router.patch("/:id/assignation", controller.assigner);
router.patch("/:id/statut", controller.changerStatut);
router.delete("/:id", controller.delete);            

router.post("/:id/messages", controller.ajouterMessage);

module.exports = router;
