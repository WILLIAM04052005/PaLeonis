
const PG_ERRORS = {
  "23505": [409, "DOUBLON", "Cette valeur existe déjà (email, IP ou nom d'hôte)"],
  "23503": [404, "REFERENCE_INEXISTANTE", "Une ressource référencée n'existe pas"],
  "23001": [409, "SUPPRESSION_BLOQUEE", "Suppression impossible : la ressource est encore utilisée"],
  "23514": [422, "CONTRAINTE_VIOLEE", "Valeur refusée (prix négatif, statut ou catégorie inconnus…)"],
  "23502": [400, "CHAMP_OBLIGATOIRE", "Un champ obligatoire est manquant"],
  "22P02": [400, "FORMAT_INVALIDE", "Format invalide (texte à la place d'un nombre…)"],
  "22007": [400, "DATE_INVALIDE", "Date invalide"],
  "22001": [400, "TROP_LONG", "Une valeur dépasse la longueur autorisée"],
};

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function notFound(req, res) {
  res.status(404).json({ erreur: `Route ${req.method} ${req.originalUrl} inexistante` });
}

function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ erreur: err.message });
  }

  if (err.name === "ValidationError") {
    const details = Object.values(err.errors).map((e) => e.message);
    return res.status(422).json({ erreur: "Document invalide", details });
  }
  if (err.name === "StrictModeError") {
    return res.status(422).json({ erreur: "Document invalide", details: [err.message] });
  }

  if (err.name === "CastError") {
    return res.status(400).json({ erreur: `Valeur invalide pour ${err.path}` });
  }

  if (/^Mongo(ose)?(ServerSelection|Network|NotConnected)Error$/.test(err.name)) {
    return res.status(503).json({ erreur: "MongoDB est indisponible, l'opération a été annulée" });
  }

  if (err.code === 11000) {
    return res.status(409).json({ erreur: "Ce document existe déjà" });
  }

  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ erreur: "Le body n'est pas un JSON valide" });
  }

  if (err.code === "23503" && req.method === "DELETE") {
    return res.status(409).json({ erreur: "Suppression impossible : la ressource est encore utilisée" });
  }
  const pg = PG_ERRORS[err.code];
  if (pg) {
    const [status, code, message] = pg;
    return res.status(status).json({ erreur: message });
  }
  console.error(err);
  res.status(500).json({ erreur: "Erreur interne du serveur" });
}

module.exports = { errorHandler, notFound, HttpError };
