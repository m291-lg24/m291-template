# Deployment auf Plesk

Abschnitt A richtet sich an Lernende, Abschnitt B an die Kursleitung.

## A. Lernende: App ausliefern

### 1. Zugangsdaten eintragen

```bash
cp .env.deploy.example .env.deploy
```

In `.env.deploy` die Werte vom Zugangsdatenblatt eintragen: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PASSWORD`, `DEPLOY_REMOTE_DIR`.

### 2. Verbindung testen

```bash
npm run deploy:check
```

Erwartete Ausgabe: `Inhalt von /httpdocs: ...` und `Verbindung in Ordnung.`

### 3. Ausliefern

```bash
npm run deploy
```

Das Skript baut die App (`dist/`), leert auf dem Server den Ordner `assets/` und lädt alle Dateien hoch. Dateien ausserhalb von `assets/` bleiben auf dem Server erhalten.

### PHP-Backend (`api/`)

Existiert im Projekt ein Ordner `api/`, lädt `npm run deploy` ihn nach `<DEPLOY_REMOTE_DIR>/api` (erreichbar unter `https://<domain>/api/…`).

- Nur das Backend hochladen (ohne Build): `npm run deploy:api`
- Backend auslassen: `DEPLOY_API=false` oder `node scripts/deploy.mjs --no-api`
- Anderer Zielordner: `DEPLOY_API_DIR=/pfad/zu/api`
- `api/` wird auf dem Server **nie geleert**. Gelöschte PHP-Dateien im Plesk-Dateimanager entfernen.
- **Nicht** hochgeladen werden: versteckte Dateien (`.env`, `.git` …, ausser `.htaccess`), `*.local.*` (z. B. `config.local.php`), Vorlagen (`*.example`, `*.sample`, `*.dist`), `*.sql`, `*.sqlite`, `*.db`, `*.log`, `*.md`, `node_modules/`, `test/`, `tests/`.
- Datenbank-Zugangsdaten gehören in `api/config.local.php` (nicht committen) und werden einmalig im Plesk-Dateimanager angelegt.
- `npm run deploy:dry` zeigt, welche API-Dateien hochgeladen bzw. ausgelassen werden.

### Fehlersuche

| Meldung / Symptom | Ursache und Lösung |
|---|---|
| `Zeitüberschreitung` | Firewall (oft Windows oder Schulnetz) blockiert FTP. `DEPLOY_PROTOCOL=sftp` versuchen (falls freigeschaltet) oder Notweg unten. |
| `Anmeldung fehlgeschlagen` | Benutzername/Passwort prüfen; Sonderzeichen im Passwort in Anführungszeichen: `DEPLOY_PASSWORD="a#b$c"`. |
| `TLS-Zertifikat wird nicht akzeptiert` | Als `DEPLOY_HOST` den Servernamen verwenden, nicht die eigene Domain. |
| Startseite geht, Neuladen auf einer Unterseite gibt 404 | `.htaccess` fehlt auf dem Server (versteckte Datei) oder Apache ist deaktiviert → Kursleitung, siehe B.3. |
| Weisse Seite, Konsole meldet 404 für `/assets/...` | App liegt in einem Unterordner: `VITE_BASE_PATH=/ordner/` setzen und `RewriteBase` in `public/.htaccess` anpassen. |

### Notweg ohne FTP

1. `npm run build`
2. Ordner `dist/` als ZIP packen.
3. Plesk → **Dateien** → `httpdocs` → **Hochladen** → ZIP → **Entpacken**.
4. Darauf achten, dass `.htaccess` mitkommt (versteckte Datei).

## B. Kursleitung: Umgebung pro Gruppe

### B.1 Domain

- Pro Gruppe eine Domain oder Subdomain mit eigenem FTP-Benutzer.
- SSL/TLS mit Let's Encrypt, Weiterleitung HTTP → HTTPS aktiv.
- Dokumentstamm notieren (`httpdocs` oder Subdomain-Ordner) → Wert für `DEPLOY_REMOTE_DIR`.
- PHP nur nötig, wenn das Projekt einen Ordner `api/` enthält (PHP 8.x, MariaDB-Datenbank pro Gruppe).

### B.2 Zugänge

- FTP-Zugang: Plesk → **Websites & Domains** → **FTP-Zugang**. FTPS (explizit) ist bei Plesk standardmässig verfügbar.
- SFTP nur, wenn **SSH-Zugang** für den Systembenutzer auf «/bin/bash (chrooted)» steht; sonst FTPS.
- Werte für das Zugangsdatenblatt: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PASSWORD`, `DEPLOY_REMOTE_DIR`.

### B.3 Apache und nginx

Mit nginx als Proxy vor Apache (Plesk-Standard) wirkt `public/.htaccess` ohne weitere Einstellungen. Bei **nur nginx** unter **Apache & nginx-Einstellungen → Zusätzliche nginx-Anweisungen** eintragen:

```nginx
location ~ /\.(?!well-known) {
    deny all;
}
location /api/ {
    try_files $uri $uri/ /api/index.php?$query_string;
}
location / {
    try_files $uri $uri/ /index.html;
}
```

### B.4 Deployment über GitHub Actions (optional)

Workflow `.github/workflows/deploy.yml`, manuell auslösbar. Unter **Settings → Secrets and variables → Actions** setzen:

| Typ | Name | Wert |
|---|---|---|
| Secret | `DEPLOY_USER` | FTP-Benutzer |
| Secret | `DEPLOY_PASSWORD` | FTP-Passwort |
| Variable | `DEPLOY_HOST` | Servername |
| Variable | `DEPLOY_REMOTE_DIR` | z. B. `/httpdocs` |
| Variable | `DEPLOY_PROTOCOL` | `ftps` (Standard) oder `sftp` |
| Variable | `VITE_APP_TITLE` | (optional) Titel der App |

GitHub-Runner verbinden sich aus dem Internet; die Plesk-Firewall muss FTP/FTPS (21 + passive Ports) bzw. SSH (22) von aussen zulassen.

### B.5 Vorlage als Template-Repo

```bash
gh repo edit <org>/m291-vue-template --template
```
