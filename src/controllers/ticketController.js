const Ticket = require("../models/Ticket");
const Technicien = require("../models/Technicien");

async function getAll(req, res, next){
    try{
        res.status(200).json(await Ticket.findAll());
    } catch(err) {
        next(err);
    }
}

async function getById(req, res, next){
    try{
        const ticket = await Ticket.findById(req.params.id);
        if(!ticket) return res.status(404).json({ erreur: "Ticket non trouvé"});
        res.status(200).json(ticket);
    } catch(err) {
        next(err);
    }
}

// POST /api/tickets
async function create(req, res, next){
    try {
        const { id_client, sujet, description } = req.body || {};
        if (!id_client || !sujet || !description){
            return res.status(400).json({ erreur: "id_client, sujet et description sont obligatoires" });
        }
        const ticket = await Ticket.create(req.body);
        res.status(201).json(ticket);
    } catch(err) {
        next(err);
    }
}

// PATCH /api/tickets/:id/assignation
async function assigner(req, res, next){
    try {
        const { id_technicien } = req.body || {};
        if (!id_technicien) return res.status(400).json({ erreur: "id_technicien est obligatoire" });

        const ticket = await Ticket.assigner(req.params.id, id_technicien);
        if(!ticket) return res.status(404).json({ erreur: "Ticket non trouvé"});
        res.status(200).json(ticket);
    } catch(err) {
        next(err);
    }
}

// PATCH /api/tickets/:id/statut
async function changerStatut(req, res, next){
    try {
        const { statut } = req.body || {};
        if (!statut) return res.status(400).json({ erreur: "statut est obligatoire" });

        const ticket = await Ticket.changerStatut(req.params.id, statut);
        if(!ticket) return res.status(404).json({ erreur: "Ticket non trouvé"});
        res.status(200).json(ticket);
    } catch(err) {
        next(err);
    }
}

// GET /api/techniciens/:id/tickets
// GET /api/techniciens/:id/tickets — B8 : 404 si le technicien n'existe pas
async function getByTechnicien(req, res, next){
    try {
        const technicien = await Technicien.findById(req.params.id);
        if (!technicien) return res.status(404).json({ erreur: "Technicien introuvable" });
        res.status(200).json(await Ticket.findByTechnicien(req.params.id));
    } catch(err) {
        next(err);
    }
}

async function deleteTicket(req, res, next){
    try {
        const ticket = await Ticket.delete(req.params.id);
        if(!ticket) return res.status(404).json({ erreur: "Ticket non trouvé"});
        res.status(200).json({ message: "Ticket supprimé"});
    } catch(err) {
        next(err);
    }
}

module.exports = { getAll, getById, create, assigner, changerStatut, getByTechnicien, delete: deleteTicket };
