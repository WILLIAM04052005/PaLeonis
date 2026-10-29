const pool = require("../config/db");
const { HttpError } = require("../middlewares/errorHandler");
const Message = require("./Message");

class Ticket {
    static async findAll() {
        const { rows } = await pool.query("SELECT * FROM ticket ORDER BY id_ticket");
        return rows;
    }

    static async findById(id) {
        const { rows } = await pool.query("SELECT * FROM ticket WHERE id_ticket = $1", [id]);
        return rows[0] ?? null;
    }

    
    static async create(data) {
        const { id_client, id_serveur, sujet, description, priorite } = data;

        if (id_serveur) {
            const verif = await pool.query(
                `SELECT s.id_serveur FROM serveur s
                 JOIN abonnement a ON a.id_abonnement = s.id_abonnement
                 WHERE s.id_serveur = $1 AND a.id_client = $2`,
                [id_serveur, id_client]
            );
            if (verif.rows.length === 0) throw new HttpError(422, "Ce serveur n'appartient pas à ce client");
        }

        const { rows } = await pool.query(
            `INSERT INTO ticket (id_client, id_serveur, sujet, description, priorite)
             VALUES ($1, $2, $3, $4, COALESCE($5, 'normale'))
             RETURNING *`,
            [id_client, id_serveur || null, sujet, description, priorite || null]
        );
        return rows[0];
    }

    static async assigner(id, idTechnicien) {
        const { rows } = await pool.query(
            "UPDATE ticket SET id_technicien = $1 WHERE id_ticket = $2 RETURNING *",
            [idTechnicien, id]
        );
        return rows[0] ?? null;
    }

    static async changerStatut(id, statut) {
        const { rows } = await pool.query(
            "UPDATE ticket SET statut = $1 WHERE id_ticket = $2 RETURNING *",
            [statut, id]
        );
        return rows[0] ?? null;
    }

    static async findByTechnicien(idTechnicien) {
        const { rows } = await pool.query(
            `SELECT * FROM ticket
             WHERE id_technicien = $1 AND statut <> 'ferme'
             ORDER BY CASE priorite
                        WHEN 'critique' THEN 1
                        WHEN 'haute' THEN 2
                        WHEN 'normale' THEN 3
                        ELSE 4
                      END,
                      date_ouverture`,
            [idTechnicien]
        );
        return rows;
    }

    static async delete(id) {
        const conn = await pool.connect();
        try {
            await conn.query("BEGIN");
            const { rows } = await conn.query("DELETE FROM ticket WHERE id_ticket = $1 RETURNING *", [id]);
            if (rows.length === 0) {
                await conn.query("ROLLBACK");
                return null;
            }
            await Message.deleteMany({ ticketId: rows[0].id_ticket });
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
module.exports = Ticket;
