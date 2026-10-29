const { Schema, model } = require("mongoose");
const pool = require("../config/db");
const { HttpError } = require("../middlewares/errorHandler");

const ficheSchema = new Schema(
  {
    offreId: { type: Number, required: true, unique: true }, 
    autres: { type: Schema.Types.Mixed, default: {} },
  },
  { discriminatorKey: "categorie", strict: "throw", timestamps: true, versionKey: false }
);

const Fiche = model("Fiche", ficheSchema, "fiches");

const options = { strict: "throw" };

Fiche.discriminator(
  "vps",
  new Schema(
    {
      vcpu: { type: Number, required: [true, "vcpu est obligatoire pour un VPS"], min: 1 },
      ram_go: { type: Number, required: [true, "ram_go est obligatoire pour un VPS"], min: 0.5 },
      stockage_go: { type: Number, required: [true, "stockage_go est obligatoire pour un VPS"], min: 1 },
      type_stockage: { type: String, enum: ["SSD", "NVMe", "HDD"] },
      os: {
        type: [String],
        validate: { validator: (v) => v.length > 0, message: "os doit contenir au moins un système" },
      },
    },
    options
  )
);

Fiche.discriminator(
  "mutualise",
  new Schema(
    {
      espace_disque_go: { type: Number, required: [true, "espace_disque_go est obligatoire"], min: 1 },
      nb_sites: { type: Number, required: [true, "nb_sites est obligatoire"], min: 1 },
      nb_bases_donnees: { type: Number, required: [true, "nb_bases_donnees est obligatoire"], min: 0 },
      certificat_ssl: { type: Boolean, default: true },
    },
    options
  )
);

Fiche.discriminator(
  "dedie",
  new Schema(
    {
      processeur: { type: String, required: [true, "processeur est obligatoire pour un dédié"] },
      coeurs: { type: Number, required: [true, "coeurs est obligatoire pour un dédié"], min: 1 },
      ram_go: { type: Number, required: [true, "ram_go est obligatoire pour un dédié"], min: 1 },
      disques: {
        type: [
          {
            _id: false,
            type: { type: String, enum: ["SSD", "NVMe", "HDD"], required: true },
            capacite_go: { type: Number, required: true, min: 1 },
          },
        ],
        validate: { validator: (v) => v.length > 0, message: "disques doit contenir au moins un disque" },
      },
      bande_passante_gbps: { type: Number, required: [true, "bande_passante_gbps est obligatoire"], min: 0.1 },
    },
    options
  )
);

Fiche.discriminator(
  "domaine",
  new Schema(
    {
      extension: {
        type: String,
        required: [true, "extension est obligatoire pour un domaine"],
        match: [/^\.[a-z]{2,}$/, "extension doit ressembler à .fr ou .com"],
      },
      registrar: { type: String, required: [true, "registrar est obligatoire pour un domaine"] },
      duree_engagement_mois: { type: Number, required: [true, "duree_engagement_mois est obligatoire"], min: 1 },
    },
    options
  )
);

// Fiche d'une offre, ou null
Fiche.findByOffre = function (offreId) {
  return Fiche.findOne({ offreId }).lean();
};

Fiche.remplacer = async function (offreId, donnees) {
  const { rows } = await pool.query("SELECT categorie FROM offre WHERE id_offre = $1", [offreId]);
  if (rows.length === 0) throw new HttpError(404, "Offre introuvable");
  const { categorie } = rows[0];

  const { offreId: _o, categorie: _c, _id, createdAt, updatedAt, ...caracteristiques } = donnees;

  await Fiche.deleteOne({ offreId, categorie: { $ne: categorie } });

  const Modele = Fiche.discriminators[categorie];
  const resultat = await Modele.findOneAndReplace(
    { offreId },
    { ...caracteristiques, offreId },
    { upsert: true, returnDocument: "after", runValidators: true, includeResultMetadata: true, lean: true }
  );

  return { fiche: resultat.value, creee: !resultat.lastErrorObject?.updatedExisting };
};

module.exports = Fiche;
