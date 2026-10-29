# Contrat d'API – PaLeonis

Toutes les routes sont préfixées par `/api`. Corps et réponses en JSON.

## Format d'erreur (unique dans toute l'API)

```json
{ "erreur": "Aucun serveur libre en service dans ce datacenter" }
```

| Situation | Code HTTP |
| --- | --- |
| Body invalide, champ manquant, texte à la place d'un nombre (22P02) | 400 |
| Ressource ou référence inexistante (23503) | 404 |
| Valeur déjà existante (23505), suppression bloquée (23001), conflit métier | 409 |
| Contrainte CHECK violée : prix négatif, statut ou catégorie inconnus (23514) | 422 |

## Clients – B1, B5, RG8

| Méthode | URL | Body | Réponses | Besoin |
| --- | --- | --- | --- | --- |
| GET | /clients | — | 200 | B1 |
| GET | /clients?search=dup · ?nom=lam · ?email=gmail | — | 200 | B1 |
| GET | /clients/:id | — | 200, 400, 404 | B1 |
| GET | /clients/:id/fiche | — | 200, 400, 404 | B5 |
| POST | /clients | type_client, nom, email, telephone?, siret? (obligatoire si entreprise) | 201, 400, 409, 422 | B1 |
| PUT | /clients/:id | type_client, nom, email, telephone?, siret? | 200, 400, 404, 409, 422 | B1 |
| DELETE | /clients/:id | — | 204, 400, 404, 409 (abonnement actif ou historique) | B1, RG8 |

## Offres – B2, RG2

| Méthode | URL | Body | Réponses | Besoin |
| --- | --- | --- | --- | --- |
| GET | /offres | — | 200 | B2 |
| GET | /offres?categorie=vps&en_vente=true | — | 200 | B2 |
| GET | /offres/:id | — | 200, 400, 404 | B2 · TP4 : renvoie aussi `fiche_technique` (MongoDB) |
| POST | /offres | nom, categorie (vps, mutualise, dedie, domaine), prix_mensuel_ht | 201, 400, 422 | B2 |
| PUT | /offres/:id | nom, categorie, prix_mensuel_ht | 200, 400, 404, 422 | B2 |
| PATCH | /offres/:id/retrait | — | 200, 404 | B2, RG2 (pas de DELETE) |

## Abonnements – B3, B4

| Méthode | URL | Body | Réponses | Besoin |
| --- | --- | --- | --- | --- |
| POST | /abonnements | id_client, id_offre, id_datacenter (obligatoire si hébergement) | 201, 400 (champ manquant, datacenter manquant), 404, 409 (aucun serveur libre), 422 (offre retirée) | B3 |
| GET | /abonnements/:id | — | 200, 400, 404 | B3 |
| PATCH | /abonnements/:id/resiliation | — | 200, 400, 404, 409 (déjà résilié) | B4 |

La souscription et la résiliation sont des transactions : en cas d'erreur, rien n'est enregistré.

## Serveurs – B6

| Méthode | URL | Body | Réponses | Besoin |
| --- | --- | --- | --- | --- |
| GET | /serveurs?datacenter=1&statut=en_service&libre=true | — | 200, 400 | B6 |
| GET | /serveurs/:id | — | 200, 400, 404 | B6 |

## Tickets – B7

| Méthode | URL | Body | Réponses | Besoin |
| --- | --- | --- | --- | --- |
| GET | /tickets?statut=ouvert&client=1&technicien=2 | — | 200 | B7 |
| GET | /tickets/:id | — | 200, 400, 404 | B7 |
| POST | /tickets | id_client, sujet, description, priorite?, id_serveur? (serveur du client) | 201, 400, 404, 422 | B7, RG6 |
| PATCH | /tickets/:id/assignation | id_technicien | 200, 400, 404 | B7, RG7 |
| PATCH | /tickets/:id/statut | statut (ouvert, en_cours, resolu, ferme) | 200, 400, 404, 422 | B7 |
| DELETE | /tickets/:id | — | 204, 400, 404 | — |

## Techniciens, datacenters – B8, B10

| Méthode | URL | Body | Réponses | Besoin |
| --- | --- | --- | --- | --- |
| GET | /techniciens | — | 200 | B10 |
| GET | /techniciens/:id | — | 200, 400, 404 | B10 |
| GET | /techniciens/:id/tickets | — | 200, 400, 404 | B8 (non fermés, du plus critique au moins critique) |
| GET | /datacenters | — | 200 | B10 |
| GET | /datacenters/:id | — | 200, 400, 404 | B10 |

## Tableau de bord – B9

| Méthode | URL | Body | Réponses | Besoin |
| --- | --- | --- | --- | --- |
| GET | /dashboard | — | 200 | B9 : CA mensuel des abonnements actifs (total et par catégorie), serveurs par datacenter et par statut |

# TP4 – Données MongoDB

Les ids PostgreSQL (offre, serveur, ticket, client, technicien) sont vérifiés par l'API avant toute écriture dans MongoDB. Erreurs propres à MongoDB : document invalide ou champ d'une autre catégorie → 422, id mal formé → 400, doublon → 409, MongoDB indisponible → 503 (l'opération est annulée).

## N1 – Fiches techniques des offres

| Méthode | URL | Body | Réponses |
| --- | --- | --- | --- |
| GET | /offres/:id | — | 200 (offre PostgreSQL + `fiche_technique` MongoDB, ou `null`), 400, 404 |
| GET | /offres/:id/fiche | — | 200, 400, 404 (offre inexistante ou sans fiche) |
| PUT | /offres/:id/fiche | Champs selon la catégorie de l'offre, + `autres` libre | 201 (créée), 200 (remplacée), 400, 404, 422 |
| DELETE | /offres/:id | — | 204 (offre + fiche supprimées), 404, 409 (l'offre a des abonnements) |

Champs obligatoires par catégorie :

| Catégorie | Champs |
| --- | --- |
| vps | vcpu, ram_go, stockage_go, os (liste) · facultatif : type_stockage (SSD, NVMe, HDD) |
| mutualise | espace_disque_go, nb_sites, nb_bases_donnees · facultatif : certificat_ssl |
| dedie | processeur, coeurs, ram_go, disques (liste de { type, capacite_go }), bande_passante_gbps |
| domaine | extension (.fr, .com…), registrar, duree_engagement_mois |

## N2 – Journal d'activité des serveurs

| Méthode | URL | Body | Réponses |
| --- | --- | --- | --- |
| POST | /serveurs/:id/evenements | type + champs du type, date facultative | 201, 400 (type absent), 404 (serveur ou technicien), 422 |
| GET | /serveurs/:id/evenements?type=alerte&debut=2026-10-19&fin=2026-10-28&limite=20 | — | 200 (du plus récent au plus ancien, 50 par défaut, 500 max), 400, 404 |
| GET | /serveurs/:id/evenements/stats | — | 200 (nombre et date du dernier événement par type, calculés par `aggregate`), 400, 404 |

| Type | Champs obligatoires |
| --- | --- |
| redemarrage | motif · facultatif : planifie |
| alerte | niveau (info, avertissement, critique), message |
| maintenance | description, duree_minutes · facultatif : technicienId |
| metrique | cpu, ram, disque (pourcentages de 0 à 100) |

`fin` donnée sous la forme AAAA-MM-JJ inclut toute la journée.

## N3 – Messages des tickets

| Méthode | URL | Body | Réponses |
| --- | --- | --- | --- |
| GET | /tickets/:id | — | 200 (ticket PostgreSQL + `messages` MongoDB, ordre chronologique), 400, 404 |
| POST | /tickets/:id/messages | auteur { type: client ou technicien, id }, contenu, pieces_jointes? [{ nom, url }] | 201, 400, 403 (client qui n'est pas celui du ticket), 404 (ticket ou technicien), 409 (ticket fermé), 422 |
| DELETE | /tickets/:id | — | 200 (ticket + messages supprimés), 404 |
| DELETE | /clients/:id | — | 204 (client, ses tickets et leurs messages), 404, 409 (abonnements) |
