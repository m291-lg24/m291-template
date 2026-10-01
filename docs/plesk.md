# Deployment auf Plesk

Diese Anleitung richtet sich an Lernende (Abschnitt A) und an die Kursleitung (Abschnitt B).

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

Das Skript baut die App (`dist/`), leert auf dem Server den Ordner `assets/` und lädt alle Dateien hoch. Dateien ausserhalb von `assets/` (z. B. eigene Bilder, die du direkt hochgeladen hast) bleiben erhalten.

### 4. Mit Datenbank (optional)

1. Plesk → **Datenbanken** → **Datenbank hinzufügen** (Name und Benutzer notieren).
2. **phpMyAdmin** öffnen → **Importieren** → `database/schema.sql`.
3. `cp .env.api.example .env.api.production` und DB-Werte eintragen (`DB_HOST=localhost`).
4. In `.env.deploy`: `DEPLOY_API_ENV=.env.api.production`.
5. `npm run deploy` – die Konfiguration landet in `/private/.env.api`, also **ausserhalb** des Webroots.
6. Prüfen: `https://<deine-domain>/api/health` liefert `{"api":"ok","db":"ok",...}`.

### Fehlersuche

| Meldung / Symptom | Ursache und Lösung |
|---|---|
| `Zeitüberschreitung` | Firewall (oft Windows oder Schulnetz) blockiert FTP. `DEPLOY_PROTOCOL=sftp` versuchen (falls freigeschaltet) oder `dist/` per Plesk-Dateimanager hochladen (ZIP hochladen, auf dem Server entpacken). |
| `Anmeldung fehlgeschlagen` | Benutzername/Passwort prüfen; Sonderzeichen im Passwort in Anführungszeichen setzen: `DEPLOY_PASSWORD="a#b$c"`. |
| `TLS-Zertifikat wird nicht akzeptiert` | Als `DEPLOY_HOST` den Servernamen verwenden, nicht die eigene Domain. |
| Startseite geht, Neuladen auf `/kontakt` gibt 404 | `.htaccess` fehlt auf dem Server (versteckte Datei!) oder Apache ist deaktiviert → Kursleitung, siehe B.3. |
| Weisse Seite, Konsole meldet 404 für `/assets/...` | App liegt in einem Unterordner: `VITE_BASE_PATH=/ordner/` setzen und `RewriteBase` in `public/.htaccess` anpassen. |
| `/api/health` liefert HTML statt JSON | API-Rewrite greift nicht → wie oben `.htaccess` prüfen. |
| `"db":"nicht erreichbar"` | DB-Name/Benutzer/Passwort in `.env.api.production` prüfen; lokal `APP_DEBUG=true` zeigt die genaue Meldung. |

### Ohne Kommandozeile (Notweg)

1. `npm run build`
2. Ordner `dist/` als ZIP packen.
3. Plesk → **Dateien** → `httpdocs` → **Hochladen** → ZIP → **Entpacken**.
4. Darauf achten, dass `.htaccess` mitkommt (versteckte Datei).

## B. Kursleitung: Umgebung pro Gruppe

### B.1 Subscription / Domain

- Pro Gruppe eine Domain oder Subdomain (z. B. `gruppe01.m291.example.ch`) mit eigenem FTP-Benutzer.
- **Hosting-Einstellungen**: PHP 8.2 oder neuer (FPM, ausgeliefert von Apache), SSL/TLS mit Let's Encrypt, «Dauerhafte SEO-sichere 301-Weiterleitung von HTTP zu HTTPS» aktiv.
- Dokumentstamm notieren (`httpdocs` oder Subdomain-Ordner) → Wert für `DEPLOY_REMOTE_DIR`.

### B.2 Zugänge

- FTP-Zugang: Plesk → **Websites & Domains** → **FTP-Zugang**. FTPS (explizit) ist bei Plesk standardmässig verfügbar.
- SFTP nur, wenn **SSH-Zugang** für den Systembenutzer auf «/bin/bash (chrooted)» steht; sonst FTPS verwenden.
- Werte für das Zugangsdatenblatt: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_PASSWORD`, `DEPLOY_REMOTE_DIR`, ggf. DB-Name/-Benutzer.

### B.3 Apache und nginx

Plesk betreibt standardmässig nginx als Proxy vor Apache; dann wirkt `public/.htaccess` ohne weitere Einstellungen. Wenn eine Domain **nur nginx** verwendet (Apache-Proxy-Modus aus), folgende Zeilen unter **Apache & nginx-Einstellungen → Zusätzliche nginx-Anweisungen** eintragen:

```nginx
location ~ ^/api(/|$) {
    try_files $uri /api/index.php$is_args$args;
}
location ~ /\.(?!well-known) {
    deny all;
}
location / {
    try_files $uri $uri/ /index.html;
}
```

### B.4 Deployment über GitHub Actions (optional)

Workflow `.github/workflows/deploy.yml`, manuell auslösbar. Im Repository unter **Settings → Secrets and variables → Actions** setzen:

| Typ | Name | Wert |
|---|---|---|
| Secret | `DEPLOY_USER` | FTP-Benutzer |
| Secret | `DEPLOY_PASSWORD` | FTP-Passwort |
| Secret | `API_ENV` | (optional) kompletter Inhalt von `.env.api.production` |
| Variable | `DEPLOY_HOST` | Servername |
| Variable | `DEPLOY_REMOTE_DIR` | z. B. `/httpdocs` |
| Variable | `DEPLOY_PROTOCOL` | `ftps` (Standard) oder `sftp` |
| Variable | `VITE_APP_TITLE` | (optional) Titel der App |

GitHub-Runner verbinden sich aus dem Internet; die Plesk-Firewall muss FTP/FTPS (21 + passive Ports) bzw. SSH (22) von aussen zulassen.

### B.5 Vorlage als Template-Repo

```bash
gh repo edit <org>/m291-vue-template --template
```
