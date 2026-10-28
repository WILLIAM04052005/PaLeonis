TRUNCATE ticket, technicien, serveur, abonnement, offre, client, datacenter RESTART IDENTITY CASCADE;

-- Datacenters (id 1 à 3)
INSERT INTO datacenter (nom, ville) VALUES
  ('PAR-1', 'Paris'),
  ('LYO-1', 'Lyon'),
  ('MRS-1', 'Marseille');

-- Clients (id 1 à 12)
INSERT INTO client (type_client, nom, email, telephone, date_inscription, siret) VALUES
  ('particulier', 'Sophie Lambert',          'sophie.lambert@gmail.com', '0612345678', '2024-01-15', NULL),
  ('particulier', 'Karim Benali',            'karim.benali@outlook.fr',  NULL,         '2024-03-02', NULL),
  ('entreprise',  'Boulangerie Dupain',      'contact@dupain.fr',        '0145678901', '2023-11-20', '41234567800012'),
  ('entreprise',  'WebAgency Lyon',          'hello@webagency-lyon.fr',  '0478123456', '2024-05-10', '52345678900023'),
  ('particulier', 'Julie Moreau',            'julie.moreau@yahoo.fr',    '0698765432', '2024-06-01', NULL),
  ('entreprise',  'TechNova SAS',            'admin@technova.io',        '0156789012', '2023-09-05', '63456789000034'),
  ('particulier', 'Thomas Girard',           'thomas.girard@gmail.com',  NULL,         '2025-01-12', NULL),
  ('entreprise',  'Cabinet Roux et Associes','compta@cabinet-roux.fr',   '0491234567', '2024-02-28', '74567890100045'),
  ('particulier', 'Ines Haddad',             'ines.haddad@proton.me',    '0611223344', '2025-03-18', NULL),
  ('entreprise',  'GreenLog SARL',           'it@greenlog.fr',           '0472345678', '2024-09-09', '85678901200056'),
  ('particulier', 'Paul Fontaine',           'paul.fontaine@free.fr',    NULL,         '2025-06-21', NULL),
  ('particulier', 'Lea Chevalier',           'lea.chevalier@gmail.com',  '0677889900', '2025-09-30', NULL);

-- Offres (id 1 à 10) ; la 10 est retirée de la vente
INSERT INTO offre (nom, categorie, prix_mensuel_ht, en_vente) VALUES
  ('VPS Starter',          'vps',       5.99,   TRUE),
  ('VPS Pro',              'vps',       14.99,  TRUE),
  ('VPS Business',         'vps',       29.99,  TRUE),
  ('Mutualise Perso',      'mutualise', 3.49,   TRUE),
  ('Mutualise Pro',        'mutualise', 7.99,   TRUE),
  ('Dedie Essentiel',      'dedie',     59.00,  TRUE),
  ('Dedie Performance',    'dedie',     119.00, TRUE),
  ('Domaine .fr',          'domaine',   0.99,   TRUE),
  ('Domaine .com',         'domaine',   1.25,   TRUE),
  ('VPS Legacy',           'vps',       9.99,   FALSE);

-- Abonnements (id 1 à 17)
INSERT INTO abonnement (id_client, id_offre, date_debut, date_fin, statut, prix_applique) VALUES
  (1,  2,  '2024-01-20', NULL,         'actif',    12.99),  -- 1  prix ancien < catalogue
  (1,  8,  '2024-01-20', NULL,         'actif',    0.99),   -- 2  domaine, pas de serveur
  (2,  1,  '2024-03-05', NULL,         'actif',    5.99),   -- 3
  (3,  4,  '2023-12-01', NULL,         'actif',    3.49),   -- 4
  (3,  9,  '2023-12-01', NULL,         'actif',    1.25),   -- 5  domaine
  (4,  6,  '2024-05-15', NULL,         'actif',    59.00),  -- 6
  (4,  3,  '2024-06-01', NULL,         'suspendu', 29.99),  -- 7
  (5,  10, '2024-06-05', NULL,         'actif',    9.99),   -- 8  offre retirée mais conservée
  (6,  7,  '2023-09-10', NULL,         'actif',    109.00), -- 9
  (6,  2,  '2023-09-10', '2025-03-31', 'resilie',  12.99),  -- 10
  (7,  5,  '2025-01-15', NULL,         'actif',    7.99),   -- 11
  (8,  5,  '2024-03-01', '2025-02-28', 'resilie',  6.99),   -- 12
  (8,  8,  '2024-03-01', NULL,         'actif',    0.99),   -- 13 domaine
  (9,  1,  '2025-03-20', NULL,         'suspendu', 5.99),   -- 14
  (10, 6,  '2024-09-15', NULL,         'actif',    59.00),  -- 15
  (10, 3,  '2024-09-15', NULL,         'actif',    27.99),  -- 16
  (11, 9,  '2025-06-25', '2026-01-10', 'resilie',  1.25);   -- 17

-- Serveurs (id 1 à 20) : 11 attribués, 9 libres
-- MRS-1 n'a aucun serveur libre en service (pour tester l'échec de B3)
INSERT INTO serveur (nom_hote, adresse_ip, statut, date_mise_en_service, id_datacenter, id_abonnement) VALUES
  ('srv-par-01', '10.1.0.11', 'en_service',   '2023-06-01', 1, 1),
  ('srv-par-02', '10.1.0.12', 'en_service',   '2023-06-01', 1, 3),
  ('srv-par-03', '10.1.0.13', 'en_service',   '2023-06-01', 1, 4),
  ('srv-par-04', '10.1.0.14', 'en_service',   '2023-09-15', 1, 8),
  ('srv-par-05', '10.1.0.15', 'en_service',   '2023-09-15', 1, 9),
  ('srv-par-06', '10.1.0.16', 'en_service',   '2024-02-01', 1, NULL),
  ('srv-par-07', '10.1.0.17', 'en_service',   '2024-02-01', 1, NULL),
  ('srv-par-08', '10.1.0.18', 'maintenance',  '2022-11-10', 1, NULL),
  ('srv-lyo-01', '10.2.0.11', 'en_service',   '2023-04-20', 2, 6),
  ('srv-lyo-02', '10.2.0.12', 'en_service',   '2023-04-20', 2, 7),
  ('srv-lyo-03', '10.2.0.13', 'en_service',   '2024-01-10', 2, 15),
  ('srv-lyo-04', '10.2.0.14', 'en_service',   '2024-01-10', 2, 16),
  ('srv-lyo-05', '10.2.0.15', 'en_service',   '2024-08-01', 2, NULL),
  ('srv-lyo-06', '10.2.0.16', 'hors_service', '2021-05-03', 2, NULL),
  ('srv-lyo-07', '10.2.0.17', 'maintenance',  '2022-03-14', 2, NULL),
  ('srv-mrs-01', '10.3.0.11', 'en_service',   '2024-10-01', 3, 11),
  ('srv-mrs-02', '10.3.0.12', 'en_service',   '2024-10-01', 3, 14),
  ('srv-mrs-03', '10.3.0.13', 'maintenance',  '2024-10-01', 3, NULL),
  ('srv-mrs-04', '10.3.0.14', 'hors_service', '2022-07-19', 3, NULL),
  ('srv-mrs-05', '10.3.0.15', 'hors_service', '2022-07-19', 3, NULL);

-- Techniciens (id 1 à 5)
INSERT INTO technicien (nom, prenom, email, id_datacenter) VALUES
  ('Martin',  'Lucas',  'lucas.martin@paleonis.fr',  1),
  ('Bernard', 'Emma',   'emma.bernard@paleonis.fr',  1),
  ('Petit',   'Hugo',   'hugo.petit@paleonis.fr',    2),
  ('Durand',  'Chloe',  'chloe.durand@paleonis.fr',  3),
  ('Moreau',  'Nathan', 'nathan.moreau@paleonis.fr', 2);

-- Tickets (id 1 à 12) : toutes les priorités et tous les statuts
INSERT INTO ticket (id_client, id_serveur, id_technicien, sujet, description, date_ouverture, priorite, statut) VALUES
  (1,  1,    1,    'VPS inaccessible',        'Le VPS ne repond plus en SSH depuis ce matin.',      '2026-10-20 09:12', 'critique', 'en_cours'),
  (3,  3,    2,    'Site tres lent',          'Les pages mettent plus de 10 secondes a charger.',   '2026-10-18 14:30', 'haute',    'ouvert'),
  (4,  NULL, 3,    'Facture incorrecte',      'Le montant de septembre ne correspond pas.',          '2026-09-30 10:05', 'normale',  'resolu'),
  (6,  5,    1,    'Disque presque plein',    'Alerte a 95 pour cent sur la partition principale.', '2026-10-22 08:40', 'haute',    'en_cours'),
  (2,  2,    2,    'Question sauvegarde',     'Comment restaurer une sauvegarde de la veille ?',    '2026-08-12 17:20', 'basse',    'ferme'),
  (10, 11,   3,    'Panne reseau',            'Plus aucune connexion sortante depuis 7h.',          '2026-10-26 07:15', 'critique', 'ouvert'),
  (7,  16,   4,    'Certificat SSL expire',   'Le navigateur affiche une alerte de securite.',      '2026-10-24 11:00', 'haute',    'en_cours'),
  (8,  NULL, NULL, 'Ajout d''un sous-domaine','Nous voulons creer blog.cabinet-roux.fr.',            '2026-10-25 16:45', 'basse',    'ouvert'),
  (9,  17,   4,    'Reactivation du VPS',     'Le paiement est regularise, merci de reactiver.',    '2026-10-23 09:30', 'normale',  'ouvert'),
  (5,  4,    1,    'Migration vers VPS Pro',  'Demande de migration avec conservation de l''IP.',   '2026-07-02 13:10', 'normale',  'resolu'),
  (10, 12,   5,    'Acces console KVM',       'Besoin d''un acces console pour une reinstallation.','2026-06-15 15:00', 'basse',    'ferme'),
  (1,  NULL, NULL, 'Renouvellement domaine',  'Le domaine expire le mois prochain.',                '2026-10-26 18:05', 'normale',  'ouvert');