const pool = require("../config/db");
const { HttpError } = require("../middlewares/errorHandler");

class Abonnement {
  static async findById(id) {
    const { rows } = await pool.query(
      `SELECT a.*, o.nom AS offre, o.categorie, s.nom_hote AS serveur
       FROM abonnement a
       JOIN offre o ON o.id_offre = a.id_offre
       LEFT JOIN serveur s ON s.id_abonnement = a.id_abonnement
       WHERE a.id_abonnement = $1`,
      [id]
    );
    return rows[0];
  }

  // B3 : souscription. Tout se fait dans une transaction : soit tout réussit, soit rien n'est enregistré
  static async souscrire(idClient, idOffre, idDatacenter) {
    const conn = await pool.connect();
    try {
      await conn.query("BEGIN");

      // 1. On vérifie que l'offre existe et qu'elle est en vente
      const resultatOffre = await conn.query("SELECT * FROM offre WHERE id_offre = $1", [idOffre]);
      const offre = resultatOffre.rows[0];
      if (!offre) throw new HttpError(404, "Offre introuvable");
      if (!offre.en_vente) throw new HttpError(422, "Cette offre n'est plus en vente");

      // 2. On crée l'abonnement avec le prix du catalogue (si le client n'existe pas, la clé étrangère refuse)
      const resultatAbonnement = await conn.query(
        "INSERT INTO abonnement (id_client, id_offre, prix_applique) VALUES ($1, $2, $3) RETURNING *",
        [idClient, idOffre, offre.prix_mensuel_ht]
      );
      const abonnement = resultatAbonnement.rows[0];

      // 3. Si c'est un hébergement (pas un nom de domaine), on attribue un serveur libre du datacenter demandé
      if (offre.categorie !== "domaine") {
        if (!idDatacenter) throw new HttpError(400, "id_datacenter est obligatoire pour un hébergement");
        const dc = await conn.query("SELECT 1 FROM datacenter WHERE id_datacenter = $1", [idDatacenter]);
        if (dc.rowCount === 0) throw new HttpError(404, "Datacenter introuvable");

        const resultatServeur = await conn.query(
          `SELECT id_serveur, nom_hote FROM serveur
           WHERE id_datacenter = $1 AND statut = 'en_service' AND id_abonnement IS NULL
           LIMIT 1`,
          [idDatacenter]
        );
        const serveur = resultatServeur.rows[0];
        if (!serveur) throw new HttpError(409, "Aucun serveur libre dans ce datacenter");

        await conn.query("UPDATE serveur SET id_abonnement = $1 WHERE id_serveur = $2", [
          abonnement.id_abonnement,
          serveur.id_serveur,
        ]);
        abonnement.serveur = serveur.nom_hote;
      }

      await conn.query("COMMIT");
      return abonnement;
    } catch (err) {
      // Une erreur à n'importe quelle étape : on annule tout
      await conn.query("ROLLBACK");
      throw err;
    } finally {
      conn.release();
    }
  }

  // B4 : résiliation. Le statut et la date de fin changent, et le serveur redevient libre
  static async resilier(id) {
    const conn = await pool.connect();
    try {
      await conn.query("BEGIN");

      const resultat = await conn.query("SELECT statut FROM abonnement WHERE id_abonnement = $1", [id]);
      const abonnement = resultat.rows[0];
      if (!abonnement) throw new HttpError(404, "Abonnement introuvable");
      if (abonnement.statut === "resilie") throw new HttpError(409, "Cet abonnement est déjà résilié");

      await conn.query(
        "UPDATE abonnement SET statut = 'resilie', date_fin = CURRENT_DATE WHERE id_abonnement = $1",
        [id]
      );
      await conn.query("UPDATE serveur SET id_abonnement = NULL WHERE id_abonnement = $1", [id]);

      await conn.query("COMMIT");
    } catch (err) {
      await conn.query("ROLLBACK");
      throw err;
    } finally {
      conn.release();
    }

    return Abonnement.findById(id);
  }

  // Chiffre d'affaires mensuel des abonnements actifs : total et par catégorie d'offre (B9)
  static async getChiffreAffaires() {
    const total = await pool.query(
      "SELECT COALESCE(SUM(prix_applique), 0) AS total FROM abonnement WHERE statut = 'actif'"
    );

    const parCategorie = await pool.query(
      `SELECT o.categorie, SUM(a.prix_applique) AS chiffre_affaires
       FROM abonnement a
       JOIN offre o ON o.id_offre = a.id_offre
       WHERE a.statut = 'actif'
       GROUP BY o.categorie
       ORDER BY o.categorie`
    );

    return {
      total: total.rows[0].total,
      par_categorie: parCategorie.rows,
    };
  }
}

module.exports = Abonnement;
