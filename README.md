# M291-Projekt – Vorlage

Leeres Startprojekt für Modul 291 «Oberflächen (UIs) mit Webtechnologien entwickeln».

Vue 3 · Tailwind CSS 4 · Vue Router · Pinia · Vite · Deployment auf Plesk

## Schnellstart

```bash
npm install
npm run dev        # http://localhost:5173
```

## Befehle

| Befehl | Wirkung |
|---|---|
| `npm run dev` | Entwicklungsserver mit Hot Reload |
| `npm run build` | Produktions-Build nach `dist/` |
| `npm run preview` | Build lokal ansehen |
| `npm run deploy:check` | Verbindung zum Server testen |
| `npm run deploy:dry` | Build + Liste der Dateien, die hochgeladen würden |
| `npm run deploy` | Build + Upload auf Plesk |

## Struktur

```
├── index.html            Einstiegsseite
├── src/
│   ├── main.js           App, Router und Pinia verbinden
│   ├── App.vue           Rahmen der App (<RouterView />)
│   ├── style.css         Tailwind + eigene Farben/Schriften (@theme)
│   ├── router/index.js   Routen
│   ├── views/            Seiten (HomeView.vue)
│   ├── components/       wiederverwendbare Komponenten
│   └── stores/           Pinia-Stores
├── public/               wird unverändert nach dist/ kopiert (inkl. .htaccess)
├── scripts/deploy.mjs    Upload auf Plesk
├── docs/plesk.md         Deployment und Fehlersuche
└── CLAUDE.md             Projektregeln für KI-Assistenten
```

## Konfiguration (.env-Dateien)

| Datei | Zweck | Ins Repo? |
|---|---|---|
| `.env` | Standardwerte (Titel, Basis-Pfad) | ja |
| `.env.example` | Vorlage für `.env.local` | ja |
| `.env.local` | eigene Werte | **nein** |
| `.env.deploy.example` | Vorlage Zugangsdaten Deployment | ja |
| `.env.deploy` | Zugangsdaten Deployment | **nein** |

> Alles mit `VITE_` landet im ausgelieferten JavaScript und ist öffentlich lesbar. Passwörter gehören nur in `.env.deploy`.

## Deployment auf Plesk

```bash
cp .env.deploy.example .env.deploy   # Zugangsdaten eintragen
npm run deploy:check                 # Verbindung testen
npm run deploy                       # bauen und hochladen
```

Details und Fehlersuche: [docs/plesk.md](docs/plesk.md).

## Diese Vorlage verwenden

Auf GitHub: **Use this template → Create a new repository**, oder:

```bash
gh repo create <org>/<repo> --template <org>/m291-vue-template --private --clone
```
# m291-template
