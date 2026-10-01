# Projektregeln für KI-Assistenten

Dieses Projekt entsteht im Modul 291 (SBW Neue Medien). Halte dich an diese Regeln, bevor du Code vorschlägst oder änderst.

## Technik (nicht ändern ohne Rückfrage)
- Vue 3 mit Composition API und `<script setup>`, JavaScript (kein TypeScript)
- Tailwind CSS 4 (Konfiguration in `src/style.css` via `@theme`, keine `tailwind.config.js`)
- Vue Router im History-Modus, Routen in `src/router/index.js`
- Pinia mit Setup-Stores in `src/stores/`
- API-Zugriffe nur über `src/lib/api.js`
- Backend: PHP 8 Single Entry Point `public/api/index.php`, PDO mit Prepared Statements, MariaDB
- Keine zusätzlichen npm-Pakete ohne Begründung

## Konventionen
- Sprache der Oberfläche: Deutsch (Schweizer Rechtschreibung, «ss» statt «ß»)
- Komponenten: `PascalCase.vue`; Seiten in `src/views/`, Bausteine in `src/components/`
- Formulare: Validierung mit `src/lib/validate.js`, Fehlermeldungen beim Feld, `aria-live`/`role="alert"` für Status
- Barrierefreiheit: jedes Eingabefeld mit `<label>`, Buttons mit verständlichem Text
- Animationen respektieren `prefers-reduced-motion`
- Neue Logik möglichst als reine Funktion in `src/lib/` mit Test in `tests/`

## Sicherheit
- Keine Geheimnisse in `VITE_`-Variablen oder im Code
- `.env.deploy`, `.env.api*` nie committen
- SQL nur mit Prepared Statements

## Befehle
- `npm run dev` / `npm run api` / `npm test` / `npm run build` / `npm run deploy`
