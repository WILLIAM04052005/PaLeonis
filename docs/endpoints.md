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
| GET | /offres/:id | — | 200, 400, 404 | B2 |
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
