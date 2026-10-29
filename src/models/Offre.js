const pool = require("../config/db");
const Fiche = require("./Fiche");

class Offre {
    static async findAll(filtres) {
        let sql = "SELECT * FROM offre WHERE 1 = 1";
        const valeurs = [];

        if (filtres.categorie) {
            valeurs.push(filtres.categorie);
            sql += " AND categorie = $" + valeurs.length;
        }

        if (filtres.en_vente === "true") {
            sql += " AND en_vente = true";
        }
        if (filtres.en_vente === "false") {
            sql += " AND en_vente = false";
        }

        sql += " ORDER BY id_offre";

        const { rows } = await pool.query(sql, valeurs);
        return rows;
    }

    static async findById(id) {
        const { rows } = await pool.query("SELECT * FROM offre WHERE id_offre = $1", [id]);
        return rows[0] ?? null;
    }

    static async create(data) {
        const { nom, categorie, prix_mensuel_ht } = data;
        const { rows } = await pool.query(
            "INSERT INTO offre (nom, categorie, prix_mensuel_ht) VALUES ($1, $2, $3) RETURNING *",
            [nom, categorie, prix_mensuel_ht]
        );
        return rows[0];
    }

    static async update(id, data) {
        const { nom, categorie, prix_mensuel_ht } = data;
        const { rows } = await pool.query(
            "UPDATE offre SET nom = $1, categorie = $2, prix_mensuel_ht = $3 WHERE id_offre = $4 RETURNING *",
            [nom, categorie, prix_mensuel_ht, id]
        );
        
        if (rows[0]) await Fiche.deleteOne({ offreId: rows[0].id_offre, categorie: { $ne: rows[0].categorie } });
        return rows[0] ?? null;
    }

    static async retirer(id) {
        const { rows } = await pool.query(
            "UPDATE offre SET en_vente = false WHERE id_offre = $1 RETURNING *",
            [id]
        );
        return rows[0] ?? null;
    }

    static async delete(id) {
        const conn = await pool.connect();
        try {
            await conn.query("BEGIN");
            const { rows } = await conn.query("DELETE FROM offre WHERE id_offre = $1 RETURNING *", [id]);
            if (rows.length === 0) {
                await conn.query("ROLLBACK");
                return null;
            }
            await Fiche.deleteOne({ offreId: rows[0].id_offre });
            await conn.query("COMMIT");
            return rows[0];
        } catch (err) {
            await conn.query("ROLLBACK");
            throw err;
        } finally {
            conn.release();
        }
    }
}

module.exports = Offre;
