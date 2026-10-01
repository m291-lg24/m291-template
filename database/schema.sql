-- Schema für die Beispiel-API. In Plesk: Datenbanken → phpMyAdmin → Import.
-- Lokal: mariadb -u <user> -p <datenbank> < database/schema.sql

SET NAMES utf8mb4;

CREATE TABLE IF NOT EXISTS notes (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  text       VARCHAR(500) NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO notes (text) VALUES
  ('Willkommen! Diese Notiz kommt aus der Datenbank.'),
  ('Lösche mich oder füge eine neue Notiz hinzu.');
