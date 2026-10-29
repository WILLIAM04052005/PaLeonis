DROP TABLE IF EXISTS ticket, technicien, serveur, abonnement, offre, client, datacenter CASCADE;

CREATE TABLE datacenter (
  id_datacenter INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nom           VARCHAR(50) NOT NULL UNIQUE,
  ville         VARCHAR(50) NOT NULL
);

-- RG1 : particulier ou entreprise, SIRET obligatoire seulement pour une entreprise
CREATE TABLE client (
  id_client        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  type_client      VARCHAR(12)  NOT NULL CHECK (type_client IN ('particulier', 'entreprise')),
  nom              VARCHAR(100) NOT NULL,
  email            VARCHAR(150) NOT NULL UNIQUE,
  telephone        VARCHAR(20),
  date_inscription DATE NOT NULL DEFAULT CURRENT_DATE,
  siret            CHAR(14) UNIQUE CHECK (siret ~ '^[0-9]{14}$'),
  CONSTRAINT client_siret_selon_type CHECK (
       (type_client = 'entreprise'  AND siret IS NOT NULL)
    OR (type_client = 'particulier' AND siret IS NULL))
);

-- RG2 : prix jamais négatif, retrait de la vente sans suppression
CREATE TABLE offre (
  id_offre        INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nom             VARCHAR(100) NOT NULL,
  categorie       VARCHAR(20)  NOT NULL CHECK (categorie IN ('vps', 'mutualise', 'dedie', 'domaine')),
  prix_mensuel_ht NUMERIC(10,2) NOT NULL CHECK (prix_mensuel_ht >= 0),
  en_vente        BOOLEAN NOT NULL DEFAULT TRUE
);

-- RG3 + RG8 : historique conservé, client et offre non supprimables s'ils sont référencés
CREATE TABLE abonnement (
  id_abonnement INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date_debut    DATE NOT NULL DEFAULT CURRENT_DATE,
  date_fin      DATE,
  statut        VARCHAR(10) NOT NULL DEFAULT 'actif'
                CHECK (statut IN ('actif', 'suspendu', 'resilie')),
  prix_applique NUMERIC(10,2) NOT NULL CHECK (prix_applique >= 0),
  id_client     INT NOT NULL REFERENCES client(id_client) ON DELETE RESTRICT,
  id_offre      INT NOT NULL REFERENCES offre(id_offre)   ON DELETE RESTRICT,
  CONSTRAINT abonnement_dates   CHECK (date_fin IS NULL OR date_fin >= date_debut),
  CONSTRAINT abonnement_resilie CHECK (statut <> 'resilie' OR date_fin IS NOT NULL)
);

-- RG5 : nom d'hôte et IP uniques ; libre si id_abonnement IS NULL, sinon un seul abonnement
CREATE TABLE serveur (
  id_serveur           INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nom_hote             VARCHAR(100) NOT NULL UNIQUE,
  adresse_ip           INET NOT NULL UNIQUE,
  statut               VARCHAR(15) NOT NULL DEFAULT 'en_service'
                       CHECK (statut IN ('en_service', 'maintenance', 'hors_service')),
  date_mise_en_service DATE NOT NULL,
  id_datacenter        INT NOT NULL REFERENCES datacenter(id_datacenter) ON DELETE RESTRICT,
  id_abonnement        INT UNIQUE REFERENCES abonnement(id_abonnement) ON DELETE SET NULL
);

-- RG7
CREATE TABLE technicien (
  id_technicien INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nom           VARCHAR(50)  NOT NULL,
  prenom        VARCHAR(50)  NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  id_datacenter INT NOT NULL REFERENCES datacenter(id_datacenter) ON DELETE RESTRICT
);

-- RG6 + RG7 : serveur et technicien facultatifs
CREATE TABLE ticket (
  id_ticket      INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sujet          VARCHAR(150) NOT NULL,
  description    TEXT NOT NULL,
  date_ouverture TIMESTAMP NOT NULL DEFAULT NOW(),
  priorite       VARCHAR(10) NOT NULL DEFAULT 'normale'
                 CHECK (priorite IN ('basse', 'normale', 'haute', 'critique')),
  statut         VARCHAR(10) NOT NULL DEFAULT 'ouvert'
                 CHECK (statut IN ('ouvert', 'en_cours', 'resolu', 'ferme')),
  id_client      INT NOT NULL REFERENCES client(id_client)         ON DELETE CASCADE,
  id_serveur     INT REFERENCES serveur(id_serveur)                ON DELETE SET NULL,
  id_technicien  INT REFERENCES technicien(id_technicien)          ON DELETE SET NULL
);

-- Index sur les colonnes les plus filtrées
CREATE INDEX idx_serveur_datacenter   ON serveur(id_datacenter);
CREATE INDEX idx_abonnement_client    ON abonnement(id_client);
CREATE INDEX idx_ticket_technicien    ON ticket(id_technicien);
