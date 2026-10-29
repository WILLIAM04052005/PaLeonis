const { Schema, model } = require("mongoose");
const pool = require("../config/db");
const { HttpError } = require("../middlewares/errorHandler");

const TYPES = ["redemarrage", "alerte", "maintenance", "metrique"];

const evenementSchema = new Schema(
  {
    serveurId: { type: Number, required: true },
    date: { type: Date, default: Date.now },
  },
  { discriminatorKey: "type", strict: "throw", versionKey: false }
);

evenementSchema.index({ serveurId: 1, date: -1 });

const Evenement = model("Evenement", evenementSchema, "evenements");

const options = { strict: "throw" };
const pourcentage = (champ) => ({
  type: Number,
  required: [true, `${champ} est obligatoire pour une métrique`],
  min: [0, `${champ} doit être entre 0 et 100`],
  max: [100, `${champ} doit être entre 0 et 100`],
});

Evenement.discriminator(
  "redemarrage",
  new Schema(
    {
      motif: { type: String, required: [true, "motif est obligatoire pour un redémarrage"], trim: true },
      planifie: { type: Boolean, default: false },
    },
    options
  )
);

Evenement.discriminator(
  "alerte",
  new Schema(
    {
      niveau: {
        type: String,
        required: [true, "niveau est obligatoire pour une alerte"],
        enum: { values: ["info", "avertissement", "critique"], message: "niveau doit valoir info, avertissement ou critique" },
      },
      message: { type: String, required: [true, "message est obligatoire pour une alerte"], trim: true },
    },
    options
  )
);

Evenement.discriminator(
  "maintenance",
  new Schema(
    {
      description: { type: String, required: [true, "description est obligatoire pour une maintenance"], trim: true },
      duree_minutes: { type: Number, required: [true, "duree_minutes est obligatoire pour une maintenance"], min: 1 },
      technicienId: { type: Number },
    },
    options
  )
);

Evenement.discriminator(
  "metrique",
  new Schema({ cpu: pourcentage("cpu"), ram: pourcentage("ram"), disque: pourcentage("disque") }, options)
);

Evenement.TYPES = TYPES;

async function verifierServeur(serveurId) {
  const { rows } = await pool.query("SELECT 1 FROM serveur WHERE id_serveur = $1", [serveurId]);
  if (rows.length === 0) throw new HttpError(404, "Serveur introuvable");
}

Evenement.enregistrer = async function (serveurId, donnees) {
  await verifierServeur(serveurId);

  const { type, serveurId: _s, _id, ...champs } = donnees;
  if (!TYPES.includes(type)) {
    throw new HttpError(422, `type doit valoir ${TYPES.join(", ")}`);
  }
  if (type === "maintenance" && champs.technicienId !== undefined) {
    const { rows } = await pool.query("SELECT 1 FROM technicien WHERE id_technicien = $1", [champs.technicienId]);
    if (rows.length === 0) throw new HttpError(404, "Technicien introuvable");
  }

  const Modele = Evenement.discriminators[type];
  const evenement = await Modele.create({ ...champs, serveurId: Number(serveurId) });
  return evenement.toObject();
};

Evenement.lister = async function (serveurId, { type, debut, fin, limite }) {
  await verifierServeur(serveurId);

  const filtre = { serveurId: Number(serveurId) };
  if (type) filtre.type = type;
  if (debut || fin) {
    filtre.date = {};
    if (debut) filtre.date.$gte = debut;
    if (fin) filtre.date.$lt = fin;
  }

  return Evenement.find(filtre).sort({ date: -1 }).limit(limite).lean();
};

Evenement.statistiques = async function (serveurId) {
  await verifierServeur(serveurId);

  const parType = await Evenement.aggregate([
    { $match: { serveurId: Number(serveurId) } },
    { $group: { _id: "$type", total: { $sum: 1 }, dernier: { $max: "$date" } } },
    { $project: { _id: 0, type: "$_id", total: 1, dernier: 1 } },
    { $sort: { total: -1, type: 1 } },
  ]);

  return { serveurId: Number(serveurId), par_type: parType };
};

module.exports = Evenement;
