# Note d'arbitrage – PaLeonis hybride

PostgreSQL garde tout ce qui est lié, contraint et transactionnel (clients, offres, abonnements, serveurs, tickets). MongoDB reçoit les trois nouvelles données, dont la forme varie ou le volume explose.

## 1. Tableau de décision

| Donnée | Base | Critère décisif | Forme retenue |
| --- | --- | --- | --- |
| Fiche technique d'une offre (N1) | MongoDB | **Structure variable** : les champs dépendent de la catégorie, et le commercial en ajoute sans migration | Collection `fiches`, 1 document par offre (`offreId` unique), discriminator par catégorie |
| Événement serveur (N2) | MongoDB | **Volume d'écriture** (milliers/jour), jamais modifié, champs variables selon le type, lu du plus récent au plus ancien | Collection `evenements`, 1 document par événement, discriminator par type, index `{ serveurId: 1, date: -1 }` |
| Message de ticket (N3) | MongoDB | **Lecture du fil entier** + pièces jointes en liste de taille variable ; pas de transaction avec le reste | Collection `messages` **référencée** par `ticketId`, index `{ ticketId: 1, date: 1 }` |

Pourquoi pas PostgreSQL pour N1 : une colonne par caractéristique laisserait la plupart à NULL et imposerait un `ALTER TABLE` à chaque nouveauté. Pour N2 : on n'y fait ni jointure ni mise à jour, seulement des écritures massives et des lectures par serveur et par date.

## 2. Modèles de documents

**N1 – fiche de l'offre 2 « VPS Pro »** (champs obligatoires selon la catégorie, `autres` libre pour les nouveautés)

```json
{ "offreId": 2, "categorie": "vps", "vcpu": 2, "ram_go": 4, "stockage_go": 80,
  "type_stockage": "NVMe", "os": ["Ubuntu 24.04", "Debian 12"],
  "autres": { "ipv6": true, "snapshots": 3 }, "updatedAt": "2026-10-28T09:00:00Z" }
```

**N2 – deux événements du serveur 1 « srv-par-01 »**

```json
{ "serveurId": 1, "type": "alerte", "date": "2026-10-27T14:05:00Z", "niveau": "critique", "message": "Disque à 95 %" }
{ "serveurId": 1, "type": "metrique", "date": "2026-10-27T14:00:00Z", "cpu": 82.5, "ram": 71.0, "disque": 95.2 }
```

**N3 – un message du ticket 1** (client 1, technicien 1)

```json
{ "ticketId": 1, "auteur": { "type": "technicien", "id": 1 }, "date": "2026-10-20T10:02:00Z",
  "contenu": "Redémarrage effectué, pouvez-vous vérifier l'accès SSH ?",
  "pieces_jointes": [{ "nom": "journal-ssh.txt", "url": "https://files.paleonis.fr/t1/journal-ssh.txt" }] }
```

**Référencé plutôt qu'imbriqué :** un fil de support grossit sans limite connue (un incident peut durer des semaines). Imbriqué, chaque ajout réécrit un document de plus en plus lourd, plafonné à 16 Mo. Référencé, un ajout est un simple `insertOne`, et le fil se lit quand même en **une seule requête** : `find({ ticketId }).sort({ date: 1 })`, servie par l'index. Cela permet aussi de paginer un très long fil.

## 3. Entre les deux bases

**Qui vérifie l'existence ?** L'API, dans le modèle, avant toute écriture Mongo : un `SELECT` dans PostgreSQL sur l'offre, le serveur, le ticket et l'auteur. Absent → **404**. Pour N1, ce `SELECT` donne aussi la catégorie qui choisit le schéma de validation. Pour N3, il vérifie que l'auteur est le client du ticket ou un technicien existant, et qu'un ticket `ferme` est refusé (**409**).

**Que deviennent les documents à la suppression ?**

| Suppression dans PostgreSQL | Documents MongoDB | Comment |
| --- | --- | --- |
| Offre (`DELETE /api/offres/:id`) | Fiche **supprimée** | Refus 409 si l'offre a des abonnements (RESTRICT). Sinon transaction PG ouverte → `DELETE` → `Fiche.deleteOne` → `COMMIT` ; si Mongo échoue, `ROLLBACK` : jamais d'offre fantôme ni de fiche orpheline |
| Ticket (`DELETE /api/tickets/:id`) | Messages **supprimés** | Même schéma : `DELETE` du ticket puis `Message.deleteMany({ ticketId })` avant le `COMMIT` |
| Serveur | Journal **conservé** | L'API n'expose aucune suppression de serveur : il passe `hors_service`. Son journal reste l'historique des incidents |

## 4. Au-delà du document

**Clé-valeur – Redis.** *« Un client qui lance un script mal écrit peut appeler l'API des milliers de fois par minute : limitez chaque client à 100 requêtes par minute. »* Il faut lire et incrémenter un compteur à chaque requête, en moins d'une milliseconde, et l'oublier après 60 s. PostgreSQL écrirait sur disque et verrouillerait une ligne à chaque appel ; MongoDB sait faire un TTL mais reste trop lent pour un compteur aussi chaud. Donnée : `ratelimit:client:12:2026-10-28T15:04` → `47`, avec expiration à 60 s (`INCR` puis `EXPIRE`).

**Graphe – Neo4j.** *« Quand un switch ou une alimentation tombe à Paris, donnez-nous en une seconde la liste des clients touchés, pour les prévenir avant qu'ils n'ouvrent un ticket. »* C'est un parcours de longueur variable : alimentation → baie → switch → serveur → abonnement → client. En SQL, il faut une requête récursive sur une table de liens ; MongoDB n'a pas de vraies relations. Donnée : des nœuds et des relations, `(:Switch {nom:"SW-PAR-3"})-[:ALIMENTE]->(:Serveur {nom:"srv-par-06"})-[:HEBERGE]->(:Abonnement {id:18})-[:SOUSCRIT_PAR]->(:Client {id:12})`.