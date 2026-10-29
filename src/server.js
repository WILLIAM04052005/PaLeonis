//pour charger les varibales de .env 
require("dotenv").config();

//recup express, la config de la bd et le routes dans data...
const express = require("express");
const pool = require("./config/db");
const connectMongo = require("./config/mongo");
const { errorHandler, notFound } = require("./middlewares/errorHandler");

const datacenterRoutes = require("./routes/datacenterRoutes");
const clientRoutes = require("./routes/clientRoutes");
const offreRoutes = require("./routes/offreRoutes");
const abonnementRoutes = require("./routes/abonnementRoutes");
const serveurRoutes = require("./routes/serveurRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const technicienRoutes = require("./routes/technicienRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

//creer le serveur 
const app = express();

//ppermet à express de lire les données envoyer au format JSON
app.use(express.json());

//prefix de chaque requete pour chaque groupe de routes
app.use("/api/datacenters", datacenterRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/offres", offreRoutes);
app.use("/api/abonnements", abonnementRoutes);
app.use("/api/serveurs", serveurRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/techniciens", technicienRoutes);
app.use("/api/dashboard", dashboardRoutes);

//dans le cas ou aucune route ne corresp (à garder après toutes les routes)
app.use(notFound);

//middleware d'erreurs : traduit les erreurs (HttpError et PostgreSQL) en codes HTTP (toujours en dernier)
app.use(errorHandler);

//démarrage : on se connecte aux DEUX bases avant d'écouter.
//Si l'une échoue, on affiche l'erreur et on arrête : une API à moitié connectée est pire qu'une API éteinte.
async function demarrer() {
  try {
    await pool.query("SELECT NOW()");
    console.log("Connecté à PostgreSQL");

    await connectMongo();

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`API lancée sur http://localhost:${PORT}`));
  } catch (err) {
    console.error("Démarrage impossible :", err.message);
    process.exit(1);
  }
}

demarrer();
