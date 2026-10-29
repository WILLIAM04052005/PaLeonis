const Offre = require("../models/Offre");
const Fiche = require("../models/Fiche");

async function getAll(req, res, next) {
    try {
        res.status(200).json(await Offre.findAll(req.query));
    } catch(err){
        next(err)
    }
}

async function getById(req, res, next) {
    try {
        const offre = await Offre.findById(req.params.id);
        if (!offre) return res.status(404).json({ erreur: "Offre non trouvée"});
        // TP4 N1 : une seule réponse construite à partir des deux bases
        const fiche = await Fiche.findByOffre(offre.id_offre);
        res.status(200).json({ ...offre, fiche_technique: fiche });
    } catch(err) {
        next(err);
    }
}

async function create(req, res, next) {
    try {
        const { nom, categorie, prix_mensuel_ht } = req.body || {};
     
        if (!nom || !categorie || prix_mensuel_ht === undefined) {
            return res.status(400).json({ erreur: "nom, categorie et prix_mensuel_ht sont obligatoires" });
        }
        const offre = await Offre.create(req.body);
        res.status(201).json(offre);
    } catch(err) {
        next(err);
    }
}

async function update(req, res, next) {
    try {
        const { nom, categorie, prix_mensuel_ht } = req.body || {};
        if (!nom || !categorie || prix_mensuel_ht === undefined) {
            return res.status(400).json({ erreur: "nom, categorie et prix_mensuel_ht sont obligatoires" });
        }
        const offre = await Offre.update(req.params.id, req.body);
        if (!offre) return res.status(404).json({ erreur: "Offre non trouvée" });
        res.status(200).json(offre);
    } catch(err) {
        next(err);
    }
}

async function retirer(req, res, next) {
    try {
        const offre = await Offre.retirer(req.params.id);
        if (!offre) return res.status(404).json({ erreur: "Offre non trouvée" });
        res.status(200).json(offre);
    } catch(err) {
        next(err);
    }
}

async function supprimer(req, res, next) {
    try {
        const offre = await Offre.delete(req.params.id);
        if (!offre) return res.status(404).json({ erreur: "Offre non trouvée" });
        res.status(204).send();
    } catch (err) {
        next(err);
    }
}

async function getFiche(req, res, next) {
    try {
        const offre = await Offre.findById(req.params.id);
        if (!offre) return res.status(404).json({ erreur: "Offre non trouvée" });
        const fiche = await Fiche.findByOffre(offre.id_offre);
        if (!fiche) return res.status(404).json({ erreur: "Cette offre n'a pas encore de fiche technique" });
        res.status(200).json(fiche);
    } catch (err) {
        next(err);
    }
}

async function remplacerFiche(req, res, next) {
    try {
        if (!req.body || typeof req.body !== "object" || Array.isArray(req.body)) {
            return res.status(400).json({ erreur: "Le body doit être un objet JSON" });
        }
        const { fiche, creee } = await Fiche.remplacer(req.params.id, req.body);
        res.status(creee ? 201 : 200).json(fiche);
    } catch (err) {
        next(err);
    }
}

module.exports = { getAll, getById, create, update, retirer, supprimer, getFiche, remplacerFiche };
