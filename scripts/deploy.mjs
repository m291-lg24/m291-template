#!/usr/bin/env node
/**
 * Deployment auf Plesk: lädt dist/ (Frontend) und api/ (PHP-Backend, falls vorhanden)
 * per SFTP, FTPS oder FTP hoch.
 *
 *   npm run deploy         Build + Upload (Frontend und api/)
 *   npm run deploy:dry     Build + Anzeige, was hochgeladen würde (keine Verbindung)
 *   npm run deploy:check   nur Verbindung testen und Zielordner auflisten
 *   npm run deploy:api     nur api/ hochladen (ohne Build)
 *
 * Zusätzliche Schalter: --no-api (api/ auslassen), --api-only (nur api/)
 *
 * Zugangsdaten stehen in .env.deploy (Vorlage: .env.deploy.example).
 * In GitHub Actions kommen sie aus den Repository-Secrets (Umgebungsvariablen).
 */
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, posix, relative } from 'node:path'

const args = new Set(process.argv.slice(2))
const DRY_RUN = args.has('--dry-run')
const CHECK = args.has('--check')
const API_ONLY = args.has('--api-only')
const LOCAL_DIR = 'dist'
const API_DIR = 'api'

// Dateien in api/, die nie auf den Server gehören (Geheimnisse, Dumps, Werkzeuge).
// Geprüft wird der Pfad relativ zu api/, z. B. "config.local.php" oder "sql/schema.sql".
const API_EXCLUDE = [
  /(^|\/)\.(?!htaccess$)[^/]+/, // versteckte Dateien/Ordner (.env, .git …), ausser .htaccess
  /(^|\/)[^/]*\.local(\.[^/]+)?$/, // config.local.php, .env.local …
  /\.(example|sample|dist)$/, // Vorlagen wie config.php.example
  /\.(sql|log|md|sqlite|db)$/, // Datenbank-Dumps, Logs, Notizen
  /(^|\/)(node_modules|tests?)(\/|$)/,
]

// ---------- Konfiguration ----------
const ENV_FILE = process.env.DEPLOY_ENV_FILE || '.env.deploy'
if (existsSync(ENV_FILE)) {
  process.loadEnvFile(ENV_FILE)
} else if (!process.env.DEPLOY_HOST) {
  fail(`${ENV_FILE} fehlt. Kopiere .env.deploy.example nach ${ENV_FILE} und trage deine Zugangsdaten ein.`)
}

const remoteDir = normalizeRemote(process.env.DEPLOY_REMOTE_DIR || '/httpdocs')
const cfg = {
  protocol: (process.env.DEPLOY_PROTOCOL || 'ftps').toLowerCase(),
  host: process.env.DEPLOY_HOST,
  port: process.env.DEPLOY_PORT ? Number(process.env.DEPLOY_PORT) : undefined,
  user: process.env.DEPLOY_USER,
  password: process.env.DEPLOY_PASSWORD,
  privateKey: process.env.DEPLOY_PRIVATE_KEY, // nur SFTP: Pfad zur Schlüsseldatei
  remoteDir,
  // Zielordner für api/. Standard: <DEPLOY_REMOTE_DIR>/api (→ https://domain/api/…)
  apiRemoteDir: normalizeRemote(process.env.DEPLOY_API_DIR || posix.join(remoteDir, 'api')),
  api: process.env.DEPLOY_API !== 'false' && !args.has('--no-api'),
  clean: process.env.DEPLOY_CLEAN !== 'false',
  ftpsInsecure: process.env.DEPLOY_FTPS_INSECURE === 'true',
}

for (const key of ['host', 'user']) {
  if (!cfg[key]) fail(`DEPLOY_${key.toUpperCase()} ist nicht gesetzt (${ENV_FILE}).`)
}
if (!cfg.password && !cfg.privateKey) fail('DEPLOY_PASSWORD (oder DEPLOY_PRIVATE_KEY für SFTP) ist nicht gesetzt.')
if (!['sftp', 'ftps', 'ftp'].includes(cfg.protocol)) fail(`Unbekanntes DEPLOY_PROTOCOL "${cfg.protocol}" (sftp | ftps | ftp).`)
if (['/', ''].includes(cfg.remoteDir)) fail('DEPLOY_REMOTE_DIR darf nicht die Wurzel "/" sein.')
if (['/', ''].includes(cfg.apiRemoteDir)) fail('DEPLOY_API_DIR darf nicht die Wurzel "/" sein.')

// ---------- Ablauf ----------
const withFrontend = !CHECK && !API_ONLY
const withApi = !CHECK && (cfg.api || API_ONLY) && existsSync(API_DIR)

if (withFrontend && !existsSync(LOCAL_DIR)) fail(`${LOCAL_DIR}/ fehlt. Zuerst "npm run build" ausführen.`)
if (API_ONLY && !existsSync(API_DIR)) fail(`${API_DIR}/ fehlt – nichts hochzuladen.`)

const files = withFrontend ? listFiles(LOCAL_DIR) : []
const apiAll = withApi ? listFiles(API_DIR) : []
const apiFiles = apiAll.filter((f) => !API_EXCLUDE.some((re) => re.test(f)))
const apiSkipped = apiAll.filter((f) => !apiFiles.includes(f))

log(`Ziel: ${cfg.protocol}://${cfg.user}@${cfg.host}${cfg.port ? ':' + cfg.port : ''}${cfg.remoteDir}`)
if (withApi) log(`API:  ${cfg.apiRemoteDir}`)

if (DRY_RUN) {
  files.forEach((f) => log(`  ${posix.join(cfg.remoteDir, f)}`))
  apiFiles.forEach((f) => log(`  ${posix.join(cfg.apiRemoteDir, f)}`))
  apiSkipped.forEach((f) => log(`  (ausgelassen) ${API_DIR}/${f}`))
  log(
    `Testlauf: ${files.length} Frontend-Dateien${cfg.clean && withFrontend ? ' (assets/ wird vorher geleert)' : ''}` +
      (withApi ? `, ${apiFiles.length} API-Dateien (${apiSkipped.length} ausgelassen)` : '') +
      ' würden hochgeladen.',
  )
  process.exit(0)
}

const transport = cfg.protocol === 'sftp' ? await sftpTransport() : await ftpTransport()
const started = Date.now()
try {
  await transport.connect()
  log('Verbunden.')

  if (CHECK) {
    const entries = await transport.list(cfg.remoteDir)
    log(`Inhalt von ${cfg.remoteDir}: ${entries.join(', ') || '(leer)'}`)
    log('Verbindung in Ordnung.')
  } else {
    if (withFrontend) {
      if (cfg.clean) {
        log('Entferne alte Build-Dateien (assets/) …')
        await transport.removeDir(posix.join(cfg.remoteDir, 'assets'))
      }
      log(`Lade ${files.length} Frontend-Dateien hoch …`)
      await transport.uploadDir(LOCAL_DIR, cfg.remoteDir)
    }
    if (withApi) {
      // api/ wird nie geleert: Konfiguration auf dem Server (z. B. config.local.php) bleibt erhalten.
      log(`Lade ${apiFiles.length} API-Dateien hoch${apiSkipped.length ? ` (${apiSkipped.length} ausgelassen)` : ''} …`)
      await transport.uploadFiles(API_DIR, apiFiles, cfg.apiRemoteDir)
    }
    log(`Fertig in ${((Date.now() - started) / 1000).toFixed(1)} s.`)
  }
} catch (err) {
  fail(explain(err))
} finally {
  await transport.close()
}

// ---------- Transporte ----------
async function ftpTransport() {
  const { Client } = await import('basic-ftp')
  const client = new Client(30_000)
  return {
    connect: () =>
      client.access({
        host: cfg.host,
        port: cfg.port || 21,
        user: cfg.user,
        password: cfg.password,
        secure: cfg.protocol === 'ftps',
        secureOptions: cfg.ftpsInsecure ? { rejectUnauthorized: false } : undefined,
      }),
    list: async (dir) => (await client.list(dir)).map((e) => e.name),
    removeDir: async (dir) => {
      try {
        await client.removeDir(dir)
      } catch {
        /* Ordner existiert noch nicht – kein Problem */
      }
    },
    uploadDir: async (local, remote) => {
      await client.ensureDir(remote)
      await client.uploadFromDir(local)
    },
    uploadFiles: async (localBase, list, remoteBase) => {
      for (const [dir, names] of groupByDir(list)) {
        // ensureDir legt fehlende Ordner an und wechselt hinein
        await client.ensureDir(dir ? posix.join(remoteBase, dir) : remoteBase)
        for (const name of names) await client.uploadFrom(join(localBase, dir, name), name)
      }
    },
    close: async () => client.close(),
  }
}

async function sftpTransport() {
  const { default: SftpClient } = await import('ssh2-sftp-client')
  const { readFileSync } = await import('node:fs')
  const client = new SftpClient()
  return {
    connect: () =>
      client.connect({
        host: cfg.host,
        port: cfg.port || 22,
        username: cfg.user,
        password: cfg.password || undefined,
        privateKey: cfg.privateKey ? readFileSync(cfg.privateKey) : undefined,
        readyTimeout: 30_000,
      }),
    list: async (dir) => (await client.list(dir)).map((e) => e.name),
    removeDir: async (dir) => {
      if (await client.exists(dir)) await client.rmdir(dir, true)
    },
    uploadDir: (local, remote) => client.uploadDir(local, remote),
    uploadFiles: async (localBase, list, remoteBase) => {
      for (const [dir, names] of groupByDir(list)) {
        const target = dir ? posix.join(remoteBase, dir) : remoteBase
        if (!(await client.exists(target))) await client.mkdir(target, true)
        for (const name of names) await client.put(join(localBase, dir, name), posix.join(target, name))
      }
    },
    close: async () => {
      try {
        await client.end()
      } catch {
        /* bereits getrennt */
      }
    },
  }
}

// ---------- Hilfsfunktionen ----------
function listFiles(dir) {
  const out = []
  const walk = (d) => {
    for (const name of readdirSync(d)) {
      const full = join(d, name)
      statSync(full).isDirectory() ? walk(full) : out.push(relative(dir, full).split('\\').join('/'))
    }
  }
  walk(dir)
  return out
}

/** ["a.php", "lib/db.php"] → Map { "" => ["a.php"], "lib" => ["db.php"] } (Elternordner zuerst) */
function groupByDir(list) {
  const map = new Map()
  for (const f of [...list].sort()) {
    const dir = posix.dirname(f) === '.' ? '' : posix.dirname(f)
    if (!map.has(dir)) map.set(dir, [])
    map.get(dir).push(posix.basename(f))
  }
  return [...map].sort(([a], [b]) => a.split('/').length - b.split('/').length || a.localeCompare(b))
}

function normalizeRemote(p) {
  return ('/' + p.trim().replace(/\\/g, '/')).replace(/\/+/g, '/').replace(/(.)\/$/, '$1')
}

function explain(err) {
  const msg = String(err?.message || err)
  if (/ENOTFOUND|EAI_AGAIN/.test(msg)) return `Server "${cfg.host}" nicht gefunden. DEPLOY_HOST prüfen.`
  if (/ECONNREFUSED/.test(msg)) return `Verbindung abgelehnt (Port ${cfg.port || 'Standard'}). Protokoll/Port prüfen.`
  if (/ETIMEDOUT|Timeout/i.test(msg))
    return 'Zeitüberschreitung. Häufige Ursache: Firewall blockiert FTP. Alternative: DEPLOY_PROTOCOL=sftp oder Upload über den Plesk-Dateimanager.'
  if (/530|auth|All configured authentication methods failed/i.test(msg))
    return 'Anmeldung fehlgeschlagen. Benutzername und Passwort in .env.deploy prüfen.'
  if (/certificate|self.signed|altnames/i.test(msg))
    return `TLS-Zertifikat wird nicht akzeptiert: ${msg}. Hostnamen prüfen (Servername statt Domain verwenden).`
  if (/permission denied|550/i.test(msg)) return `Keine Schreibrechte im Zielordner: ${msg}. DEPLOY_REMOTE_DIR / DEPLOY_API_DIR prüfen.`
  return msg
}

function log(msg) {
  console.log(`[deploy] ${msg}`)
}

function fail(msg) {
  console.error(`[deploy] FEHLER: ${msg}`)
  process.exit(1)
}
