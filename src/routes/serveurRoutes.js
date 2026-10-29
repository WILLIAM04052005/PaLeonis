const express = require("express");
const controller = require("../controllers/serveurController");

const router = express.Router();

router.get("/", controller.getAll);
router.get("/:id", controller.getById);

router.post("/:id/evenements", controller.ajouterEvenement);
router.get("/:id/evenements", controller.listerEvenements);      
router.get("/:id/evenements/stats", controller.statistiquesEvenements);

module.exports = router;
