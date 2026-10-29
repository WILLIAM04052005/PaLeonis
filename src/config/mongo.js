const mongoose = require("mongoose");

// Connexion à MongoDB (fiches techniques, journal des serveurs, messages des tickets)
async function connectMongo() {
  // 5 s max pour trouver le serveur Mongo (sinon 30 s par défaut avant l'erreur)
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  console.log("Connecté à MongoDB");
}

module.exports = connectMongo;
