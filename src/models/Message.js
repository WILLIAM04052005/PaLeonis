const { Schema, model } = require("mongoose");
const pool = require("../config/db");
const { HttpError } = require("../middlewares/errorHandler");

const messageSchema = new Schema(
  {
    ticketId: { type: Number, required: true }, 
    auteur: {
      type: {
        type: String,
        required: [true, "auteur.type est obligatoire"],
        enum: { values: ["client", "technicien"], message: "auteur.type doit valoir client ou technicien" },
      },
      id: { type: Number, required: [true, "auteur.id est obligatoire"] },
    },
    contenu: {
      type: String,
      required: [true, "contenu est obligatoire"],
      trim: true,
      maxlength: [5000, "contenu ne doit pas dépasser 5000 caractères"],
    },
    date: { type: Date, default: Date.now },
    pieces_jointes: [
      {
        _id: false,
        nom: { type: String, required: [true, "nom de la pièce jointe obligatoire"], trim: true },
        url: {
          type: String,
          required: [true, "url de la pièce jointe obligatoire"],
          match: [/^https?:\/\/\S+$/, "url doit commencer par http:// ou https://"],
        },
      },
    ],
  },
  { strict: "throw", versionKey: false }
);

messageSchema.index({ ticketId: 1, date: 1 });

const Message = model("Message", messageSchema, "messages");

Message.filDuTicket = function (ticketId) {
  return Message.find({ ticketId }).sort({ date: 1 }).lean();
};

Message.ajouter = async function (ticketId, donnees) {
  const { rows } = await pool.query("SELECT id_client, statut FROM ticket WHERE id_ticket = $1", [ticketId]);
  if (rows.length === 0) throw new HttpError(404, "Ticket introuvable");
  const ticket = rows[0];
  if (ticket.statut === "ferme") throw new HttpError(409, "Ce ticket est fermé : il n'accepte plus de messages");

  const auteur = donnees.auteur || {};
  const idAuteur = Number(auteur.id);
  if (auteur.type === "client") {
    if (idAuteur !== ticket.id_client) {
      throw new HttpError(403, "Seul le client qui a ouvert ce ticket peut y écrire");
    }
  } else if (auteur.type === "technicien") {
    if (!Number.isInteger(idAuteur) || idAuteur < 1) throw new HttpError(400, "auteur.id doit être un entier positif");
    const tech = await pool.query("SELECT 1 FROM technicien WHERE id_technicien = $1", [idAuteur]);
    if (tech.rows.length === 0) throw new HttpError(404, "Technicien introuvable");
  }

  const { ticketId: _t, _id, date, ...champs } = donnees;
  const message = await Message.create({ ...champs, ticketId: Number(ticketId) });
  return message.toObject();
};

module.exports = Message;
