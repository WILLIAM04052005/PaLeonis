require("dotenv").config();
const mongoose = require("mongoose");
const pool = require("../src/config/db");
const Fiche = require("../src/models/Fiche");
const Evenement = require("../src/models/Evenement");
const Message = require("../src/models/Message");

const fiches = [
  { offreId: 1, categorie: "vps", vcpu: 1, ram_go: 2, stockage_go: 40, type_stockage: "SSD", os: ["Ubuntu 24.04", "Debian 12"] },
  { offreId: 2, categorie: "vps", vcpu: 2, ram_go: 4, stockage_go: 80, type_stockage: "NVMe", os: ["Ubuntu 24.04", "Debian 12", "Rocky Linux 9"], autres: { ipv6: true, snapshots: 3 } },
  { offreId: 3, categorie: "vps", vcpu: 4, ram_go: 8, stockage_go: 160, type_stockage: "NVMe", os: ["Ubuntu 24.04", "Debian 12", "Windows Server 2022"], autres: { snapshots: 7, sauvegarde_quotidienne: true } },
  { offreId: 4, categorie: "mutualise", espace_disque_go: 10, nb_sites: 1, nb_bases_donnees: 2 },
  { offreId: 5, categorie: "mutualise", espace_disque_go: 50, nb_sites: 10, nb_bases_donnees: 20, autres: { versions_php: ["8.2", "8.3"] } },
  { offreId: 6, categorie: "dedie", processeur: "Intel Xeon E-2386G", coeurs: 6, ram_go: 32, disques: [{ type: "SSD", capacite_go: 480 }, { type: "SSD", capacite_go: 480 }], bande_passante_gbps: 1 },
  { offreId: 7, categorie: "dedie", processeur: "AMD EPYC 7313P", coeurs: 16, ram_go: 128, disques: [{ type: "NVMe", capacite_go: 1920 }, { type: "NVMe", capacite_go: 1920 }], bande_passante_gbps: 10, autres: { raid: "RAID 1" } },
  { offreId: 8, categorie: "domaine", extension: ".fr", registrar: "AFNIC", duree_engagement_mois: 12 },
  { offreId: 9, categorie: "domaine", extension: ".com", registrar: "Verisign", duree_engagement_mois: 12 },
  { offreId: 10, categorie: "vps", vcpu: 1, ram_go: 2, stockage_go: 50, type_stockage: "SSD", os: ["CentOS 7"], autres: { fin_de_vie: true } },
];

const jour = (j, h, m = 0) => new Date(Date.UTC(2026, 9, j, h, m));

const evenements = [];

const serveursSuivis = [1, 2, 3, 5, 9, 11, 16];
for (const serveurId of serveursSuivis) {
  for (let j = 19; j <= 28; j++) {
    const base = (serveurId * 7 + j * 3) % 30;
    evenements.push({
      serveurId,
      type: "metrique",
      date: jour(j, 12),
      cpu: serveurId === 1 && j === 20 ? 98 : 20 + base,
      ram: 35 + ((base * 2) % 40),
      disque: serveurId === 5 ? Math.min(60 + (j - 19) * 12, 97) : 30 + (base % 25),
    });
  }
}

evenements.push(
  { serveurId: 1, type: "alerte", date: jour(20, 9, 0), niveau: "critique", message: "SSH ne répond plus" },
  { serveurId: 1, type: "redemarrage", date: jour(20, 9, 40), motif: "Redémarrage manuel après blocage SSH (ticket 1)", planifie: false },
  { serveurId: 3, type: "alerte", date: jour(19, 14, 0), niveau: "avertissement", message: "Temps de réponse HTTP supérieur à 8 s" },
  { serveurId: 5, type: "alerte", date: jour(22, 8, 30), niveau: "critique", message: "Partition principale à 95 %" },
  { serveurId: 5, type: "maintenance", date: jour(22, 10, 0), description: "Nettoyage des journaux et extension du volume", duree_minutes: 45, technicienId: 1 },
  { serveurId: 11, type: "alerte", date: jour(26, 7, 5), niveau: "critique", message: "Aucune connexion sortante" },
  { serveurId: 11, type: "redemarrage", date: jour(26, 8, 10), motif: "Redémarrage de l'interface réseau", planifie: false },
  { serveurId: 16, type: "alerte", date: jour(24, 10, 45), niveau: "avertissement", message: "Certificat SSL expiré" },
  { serveurId: 9, type: "redemarrage", date: jour(25, 3, 0), motif: "Mise à jour du noyau", planifie: true },
  { serveurId: 9, type: "alerte", date: jour(27, 16, 20), niveau: "info", message: "Sauvegarde hebdomadaire terminée" },
 
  { serveurId: 8, type: "maintenance", date: jour(21, 9, 0), description: "Remplacement d'une barrette mémoire", duree_minutes: 90, technicienId: 2 },
  { serveurId: 15, type: "maintenance", date: jour(23, 14, 0), description: "Mise à jour du firmware RAID", duree_minutes: 60, technicienId: 5 },
  { serveurId: 18, type: "maintenance", date: jour(27, 8, 30), description: "Diagnostic disque défaillant", duree_minutes: 120, technicienId: 4 }
);

const client = (id) => ({ type: "client", id });
const tech = (id) => ({ type: "technicien", id });

const messages = [
  { ticketId: 1, auteur: client(1), date: jour(20, 9, 15), contenu: "Bonjour, mon VPS ne répond plus en SSH depuis ce matin." },
  { ticketId: 1, auteur: tech(1), date: jour(20, 9, 45), contenu: "Redémarrage effectué, pouvez-vous vérifier l'accès SSH ?", pieces_jointes: [{ nom: "journal-ssh.txt", url: "https://files.paleonis.fr/tickets/1/journal-ssh.txt" }] },
  { ticketId: 1, auteur: client(1), date: jour(20, 10, 5), contenu: "La connexion passe, mais elle coupe au bout de quelques minutes." },
  { ticketId: 1, auteur: tech(1), date: jour(20, 11, 20), contenu: "Le CPU était saturé par un processus. Je surveille le serveur aujourd'hui." },
 
  { ticketId: 2, auteur: client(3), date: jour(18, 14, 35), contenu: "Notre site met plus de 10 secondes à s'afficher.", pieces_jointes: [{ nom: "capture-lenteur.png", url: "https://files.paleonis.fr/tickets/2/capture-lenteur.png" }] },
  { ticketId: 2, auteur: tech(2), date: jour(19, 9, 10), contenu: "Nous analysons les temps de réponse de votre hébergement." },

  { ticketId: 4, auteur: tech(1), date: jour(22, 8, 50), contenu: "Alerte reçue : la partition principale est à 95 %. Intervention en cours." },
  { ticketId: 4, auteur: client(6), date: jour(22, 9, 30), contenu: "Merci, ce sont sûrement nos sauvegardes locales." },
 
  { ticketId: 5, auteur: client(2), date: new Date(Date.UTC(2026, 7, 12, 17, 25)), contenu: "Comment restaurer la sauvegarde de la veille ?" },
  { ticketId: 5, auteur: tech(2), date: new Date(Date.UTC(2026, 7, 13, 9, 0)), contenu: "Depuis votre espace client, onglet Sauvegardes, bouton Restaurer.", pieces_jointes: [{ nom: "procedure-restauration.pdf", url: "https://files.paleonis.fr/docs/procedure-restauration.pdf" }] },
  { ticketId: 5, auteur: client(2), date: new Date(Date.UTC(2026, 7, 13, 9, 30)), contenu: "Parfait, c'est restauré. Merci !" },

  { ticketId: 6, auteur: client(10), date: jour(26, 7, 20), contenu: "Plus aucune connexion sortante depuis 7 h, c'est bloquant." },
  { ticketId: 6, auteur: tech(3), date: jour(26, 8, 15), contenu: "Interface réseau redémarrée. Pouvez-vous confirmer ?" },
  
  { ticketId: 7, auteur: client(7), date: jour(24, 11, 5), contenu: "Le navigateur affiche une alerte de sécurité sur mon site." },
  { ticketId: 7, auteur: tech(4), date: jour(24, 14, 0), contenu: "Le certificat a expiré. Le renouvellement automatique est relancé." },
];

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connecté à MongoDB");

  await Promise.all([Fiche.deleteMany({}), Evenement.deleteMany({}), Message.deleteMany({})]);
  await Promise.all([Fiche.syncIndexes(), Evenement.syncIndexes(), Message.syncIndexes()]);

  await Fiche.insertMany(fiches);
  await Evenement.insertMany(evenements);
  await Message.insertMany(messages);

  console.log(`Fiches techniques : ${await Fiche.countDocuments()}`);
  console.log(`Événements serveur : ${await Evenement.countDocuments()} (sur ${serveursSuivis.length + 3} serveurs)`);
  console.log(`Messages de tickets : ${await Message.countDocuments()} (sur ${new Set(messages.map((m) => m.ticketId)).size} tickets)`);
}

main()
  .catch((err) => {
    console.error("Seed MongoDB impossible :", err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect();
    await pool.end();
  });
