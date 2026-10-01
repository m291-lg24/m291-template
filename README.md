# M291-Projekt – Vorlage

Startprojekt für Modul 291 «Oberflächen (UIs) mit Webtechnologien entwickeln».

| Bereich | Technik |
|---|---|
| Oberfläche | Vue 3 (Composition API, `<script setup>`), Tailwind CSS 4 |
| Navigation | Vue Router (History-Modus) |
| Zustand | Pinia (Setup-Stores) |
| Schnittstelle | PHP 8 (Single Entry Point) + MariaDB, optional |
| Tests | Vitest |
| Deployment | `npm run deploy` → Plesk per FTPS/SFTP, optional GitHub Actions |

## Schnellstart

```bash
npm install
cp .env.example .env.local     # Titel usw. anpassen (optional)
npm run dev                    # http://localhost:5173
```

Mit API (zweites Terminal, PHP 8.1+ nötig):

```bash
cp .env.api.example .env.api   # lokale DB-Zugangsdaten eintragen, APP_DEBUG=true
npm run api                    # PHP-Server auf http://localhost:8000
```

Vite leitet `/api/...` automatisch an den PHP-Server weiter. Ohne Datenbank läuft die App trotzdem, die Startseite zeigt dann «Datenbank: nicht konfiguriert».

## Befehle

| Befehl | Wirkung |
|---|---|
| `npm run dev` | Entwicklungsserver mit Hot Reload |
| `npm run api` | PHP-Entwicklungsserver für die API |
| `npm run build` | Produktions-Build nach `dist/` |
| `npm run preview` | Build lokal ansehen |
| `npm test` | automatisierte Tests (Vitest) |
| `npm run deploy:check` | Verbindung zum Server testen |
| `npm run deploy:dry` | Build + Liste der Dateien, die hochgeladen würden |
| `npm run deploy` | Build + Upload auf Plesk |

## Projektstruktur

```
├── index.html               Einstiegsseite (Vite)
├── src/
│   ├── main.js              App, Router und Pinia verbinden
│   ├── App.vue              Layout mit Navigation
│   ├── style.css            Tailwind + eigene Farben/Bausteine (@theme)
│   ├── router/index.js      Routen
│   ├── stores/              Pinia-Stores (notes, status)
│   ├── lib/api.js           zentraler API-Zugriff (fetch)
│   ├── lib/validate.js      clientseitige Validierung
│   ├── components/          wiederverwendbare Komponenten
│   └── views/               Seiten (Start, Notizen, Kontakt, Über, 404)
├── public/                  wird unverändert nach dist/ kopiert
│   ├── .htaccess            SPA-Fallback, API-Routing, Caching, Schutz
│   └── api/                 PHP-API (index.php, config.php, lib.php)
├── database/schema.sql      Tabellen + Beispieldaten
├── scripts/
│   ├── deploy.mjs           Upload auf Plesk
│   └── dev-router.php       lokales API-Routing
├── tests/                   Vitest-Tests
├── docs/plesk.md            Einrichtung auf Plesk, Fehlersuche
└── .github/workflows/       CI und Deployment
```

## Konfiguration (.env-Dateien)

| Datei | Zweck | Ins Repo? |
|---|---|---|
| `.env` | Standardwerte Frontend (ohne Geheimnisse) | ja |
| `.env.example` | Vorlage aller Frontend-Variablen | ja |
| `.env.local` | eigene Frontend-Werte | **nein** |
| `.env.deploy.example` | Vorlage Zugangsdaten Deployment | ja |
| `.env.deploy` | Zugangsdaten Deployment | **nein** |
| `.env.api.example` | Vorlage DB-Konfiguration API | ja |
| `.env.api` / `.env.api.production` | DB-Konfiguration lokal / Server | **nein** |

> Alles mit `VITE_` landet im ausgelieferten JavaScript und ist öffentlich lesbar. Passwörter gehören nur in `.env.deploy` und `.env.api*`.

## Deployment auf Plesk

1. `cp .env.deploy.example .env.deploy` und Zugangsdaten vom Zugangsdatenblatt eintragen.
2. `npm run deploy:check` – Verbindung testen.
3. `npm run deploy` – App ist danach unter deiner Domain erreichbar.

Mit API und Datenbank zusätzlich: Datenbank in Plesk anlegen, `database/schema.sql` in phpMyAdmin importieren, `.env.api.production` erstellen und in `.env.deploy` `DEPLOY_API_ENV=.env.api.production` setzen. Details und Fehlersuche: [docs/plesk.md](docs/plesk.md).

## Mit KI arbeiten

`CLAUDE.md` (bzw. `AGENTS.md`) beschreibt Technik und Regeln dieses Projekts für KI-Assistenten. Halte die Datei aktuell, wenn du Entscheide triffst – die KI liest sie bei jeder Sitzung.

## Diese Vorlage verwenden

Auf GitHub: **Use this template → Create a new repository**, oder per CLI:

```bash
gh repo create <org>/<repo> --template <org>/m291-vue-template --private --clone
```
