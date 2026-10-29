# PaLeonis – API REST hybride (PostgreSQL + MongoDB)

API de l'espace client PaLeonis, en Node.js / Express, architecture MVC (routes → contrôleurs → modèles).

- **PostgreSQL** : clients, offres, abonnements, serveurs, tickets, techniciens, datacenters (données liées et transactionnelles).
- **MongoDB** : fiches techniques des offres, journal d'activité des serveurs, messages des tickets (voir `docs/arbitrage.md`).

## Prérequis

- Node.js 18 ou plus
- PostgreSQL 16
- MongoDB 7 (avec Docker, ou MongoDB Community Server + MongoDB Compass)

## Installation

```bash
git clone https://github.com/WILLIAM04052005/PaLeonis.git
cd PaLeonis
npm install
cp .env.example .env   
```

## 1. Lancer les deux bases

PostgreSQL (si pas déjà installé localement) :

```bash
docker run --name paleonis-db -e POSTGRES_USER=paleonis -e POSTGRES_PASSWORD=paleonis \
  -e POSTGRES_DB=paleonis -p 5432:5432 -d postgres:16
```

MongoDB :

```bash
docker run --name paleonis-mongo -p 27017:27017 -d mongo:7
```

Sans Docker : installer MongoDB Community Server (le service démarre tout seul sur le port 27017).

## 2. Charger les deux jeux d'essai

PostgreSQL (à faire en premier : les documents Mongo utilisent ses ids) :

```bash
psql -U paleonis -d paleonis -f database/schema.sql
psql -U paleonis -d paleonis -f database/seed.sql
```

Sous Windows sans `psql` dans le PATH : `"C:\Program Files\PostgreSQL\16\bin\psql.exe" ...`, ou le Query Tool de pgAdmin.

MongoDB :

```bash
node scripts/seed-mongo.js
```

Les scripts sont rejouables : ils vident les données avant de les réinsérer.

## 3. Lancer l'API

```bash
npm start      # ou npm run dev
```

Le terminal doit afficher :

```
Connecté à PostgreSQL
Connecté à MongoDB
API lancée sur http://localhost:3000
```

Si l'une des deux bases est injoignable, l'API affiche l'erreur et s'arrête.

## Tests

Importer `postman/PaLeonis.postman_collection.json` dans Postman, puis **Run collection**.

## Erreurs

Format unique : `{ "erreur": "message" }`.

| Cause | HTTP |
| --- | --- |
| Body invalide, champ manquant, format invalide (22P02, CastError Mongo) | 400 |
| Ressource ou référence inexistante (23503) | 404 |
| Doublon (23505, code Mongo 11000), suppression bloquée (23001), conflit métier | 409 |
| Contrainte non respectée (23514, ValidationError Mongoose) | 422 |

## Documentation

- `docs/arbitrage.md` : où va chaque donnée et pourquoi
- `docs/endpoints.md` : contrat d'API
- `docs/conception.pdf` : MCD, MLD, UML
