const pool = require("../config/db");
const Message = require("./Message");

class Client {
  static async findAll() {
    const { rows } = await pool.query("SELECT * FROM client ORDER BY nom");
    return rows;
  }


  static async search(terme) {
    const { rows } = await pool.query(
      "SELECT * FROM client WHERE nom ILIKE $1 OR email ILIKE $1 ORDER BY nom",
      ["%" + terme + "%"]
    );
    return rows;
  }

  static async findById(id) {
    const { rows } = await pool.query("SELECT * FROM client WHERE id_client = $1", [id]);
    return rows[0];
  }


  static async findFiche(id) {
    const client = await Client.findById(id);
    if (!client) return null;

    const { rows } = await pool.query(
      `SELECT a.id_abonnement, a.date_debut, a.date_fin, a.statut, a.prix_applique,
              o.nom AS offre, s.nom_hote AS serveur
       FROM abonnement a
       JOIN offre o ON o.id_offre = a.id_offre
       LEFT JOIN serveur s ON s.id_abonnement = a.id_abonnement
       WHERE a.id_client = $1`,
      [id]
    );

    client.abonnements = rows;
    return client;
  }

  static async create(data) {
    const { rows } = await pool.query(
      "INSERT INTO client (type_client, nom, email, telephone, siret) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [data.type_client, data.nom, data.email, data.telephone || null, data.siret || null]
    );
    return rows[0];
  }

  static async update(id, data) {
    const { rows } = await pool.query(
      "UPDATE client SET type_client = $1, nom = $2, email = $3, telephone = $4, siret = $5 WHERE id_client = $6 RETURNING *",
      [data.type_client, data.nom, data.email, data.telephone || null, data.siret || null, id]
    );
    return rows[0];
  }

  static async delete(id) {
    const conn = await pool.connect();
    try {
      await conn.query("BEGIN");
      const tickets = await conn.query("SELECT id_ticket FROM ticket WHERE id_client = $1", [id]);
      const result = await conn.query("DELETE FROM client WHERE id_client = $1", [id]);
      if (result.rowCount > 0 && tickets.rows.length > 0) {
        await Message.deleteMany({ ticketId: { $in: tickets.rows.map((t) => t.id_ticket) } });
      }
      await conn.query("COMMIT");
      return result.rowCount;
    } catch (err) {
      await conn.query("ROLLBACK");
      throw err;
    } finally {
      conn.release();
    }
  }
}

module.exports = Client;
