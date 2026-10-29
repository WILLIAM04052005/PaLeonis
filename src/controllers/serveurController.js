const Serveur = require("../models/Serveur");
const Evenement = require("../models/Evenement");

async function getAll(req, res, next) {
  try {
  
    const { libre } = req.query;
    if (libre !== undefined && libre !== "true" && libre !== "false") {
      return res.status(400).json({ erreur: "libre doit valoir true ou false" });
    }
    const serveurs = await Serveur.findAll(req.query);
    res.status(200).json(serveurs);
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const serveur = await Serveur.findById(req.params.id);
    if (!serveur) {
      return res.status(404).json({ erreur: "Serveur introuvable" });
    }
    res.status(200).json(serveur);
  } catch (err) {
    next(err);
  }
}

function lireDate(valeur) {
  const d = new Date(valeur);
  return isNaN(d.getTime()) ? null : d;
}

async function ajouterEvenement(req, res, next) {
  try {
    if (!req.body || !req.body.type) {
      return res.status(400).json({ erreur: `type est obligatoire (${Evenement.TYPES.join(", ")})` });
    }
    const evenement = await Evenement.enregistrer(req.params.id, req.body);
    res.status(201).json(evenement);
  } catch (err) {
    next(err);
  }
}

async function listerEvenements(req, res, next) {
  try {
    const { type, debut, fin, limite } = req.query;

    if (type && !Evenement.TYPES.includes(type)) {
      return res.status(400).json({ erreur: `type doit valoir ${Evenement.TYPES.join(", ")}` });
    }

    const dateDebut = debut ? lireDate(debut) : null;
    if (debut && !dateDebut) return res.status(400).json({ erreur: "debut doit être une date (AAAA-MM-JJ)" });

    let dateFin = fin ? lireDate(fin) : null;
    if (fin && !dateFin) return res.status(400).json({ erreur: "fin doit être une date (AAAA-MM-JJ)" });

    if (dateFin && /^\d{4}-\d{2}-\d{2}$/.test(fin)) dateFin = new Date(dateFin.getTime() + 24 * 3600 * 1000);

    if (dateDebut && dateFin && dateDebut >= dateFin) {
      return res.status(400).json({ erreur: "debut doit être avant fin" });
    }

    const nb = limite === undefined ? 50 : Number(limite);
    if (!Number.isInteger(nb) || nb < 1 || nb > 500) {
      return res.status(400).json({ erreur: "limite doit être un entier entre 1 et 500" });
    }

    const evenements = await Evenement.lister(req.params.id, { type, debut: dateDebut, fin: dateFin, limite: nb });
    res.status(200).json(evenements);
  } catch (err) {
    next(err);
  }
}

async function statistiquesEvenements(req, res, next) {
  try {
    res.status(200).json(await Evenement.statistiques(req.params.id));
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getById, ajouterEvenement, listerEvenements, statistiquesEvenements };
