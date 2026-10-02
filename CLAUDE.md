# Projektregeln für KI-Assistenten

Dieses Projekt entsteht im Modul 291 (SBW Neue Medien). Halte dich an diese Regeln, bevor du Code vorschlägst oder änderst.

## Technik (nicht ändern ohne Rückfrage)
- Vue 3 mit Composition API und `<script setup>`, JavaScript (kein TypeScript)
- Tailwind CSS 4 (Konfiguration in `src/style.css` via `@theme`, keine `tailwind.config.js`)
- Vue Router im History-Modus, Routen in `src/router/index.js`
- Pinia mit Setup-Stores in `src/stores/`
- Reines Frontend: kein eigenes Backend, keine Datenbank
- Keine zusätzlichen npm-Pakete ohne Begründung

## Struktur
- Seiten: `src/views/` (`PascalCaseView.vue`), Bausteine: `src/components/` (`PascalCase.vue`)
- Statische Dateien (Bilder, Fonts): `public/` oder `src/assets/`

## Konventionen
- Sprache der Oberfläche: Deutsch (Schweizer Rechtschreibung, «ss» statt «ß»)
- Barrierefreiheit: jedes Eingabefeld mit `<label>`, Buttons mit verständlichem Text
- Animationen respektieren `prefers-reduced-motion`

## Sicherheit
- Keine Geheimnisse in `VITE_`-Variablen oder im Code
- `.env.deploy` nie committen

## Befehle
- `npm run dev` / `npm run build` / `npm run deploy`
