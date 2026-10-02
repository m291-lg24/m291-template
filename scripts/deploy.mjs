#!/usr/bin/env node
/**
 * Deployment auf Plesk: lädt den Inhalt von dist/ per SFTP, FTPS oder FTP hoch.
 *
 *   npm run deploy         Build + Upload
 *   npm run deploy:dry     Build + Anzeige, was hochgeladen würde (keine Verbindung)
 *   npm run deploy:check   nur Verbindung testen und Zielordner auflisten
 *
 * Zugangsdaten stehen in .env.deploy (Vorlage: .env.deploy.example).
 * In GitHub Actions kommen sie aus den Repository-Secrets (Umgebungsvariablen).
 */
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join, posix, relative } from 'node:path'

const args = new Set(process.argv.slice(2))
const DRY_RUN = args.has('--dry-run')
const CHECK = args.has('--check')
const LOCAL_DIR = 'dist'

// ---------- Konfiguration ----------
const ENV_FILE = process.env.DEPLOY_ENV_FILE || '.env.deploy'
if (existsSync(ENV_FILE)) {
  process.loadEnvFile(ENV_FILE)
} else if (!process.env.DEPLOY_HOST) {
  fail(`${ENV_FILE} fehlt. Kopiere .env.deploy.example nach ${ENV_FILE} und trage deine Zugangsdaten ein.`)
}

const cfg = {
  protocol: (process.env.DEPLOY_PROTOCOL || 'ftps').toLowerCase(),
  host: process.env.DEPLOY_HOST,
  port: process.env.DEPLOY_PORT ? Number(process.env.DEPLOY_PORT) : undefined,
  user: process.env.DEPLOY_USER,
  password: process.env.DEPLOY_PASSWORD,
  privateKey: process.env.DEPLOY_PRIVATE_KEY, // nur SFTP: Pfad zur Schlüsseldatei
  remoteDir: normalizeRemote(process.env.DEPLOY_REMOTE_DIR || '/httpdocs'),
  clean: process.env.DEPLOY_CLEAN !== 'false',
  ftpsInsecure: process.env.DEPLOY_FTPS_INSECURE === 'true',
}

for (const key of ['host', 'user']) {
  if (!cfg[key]) fail(`DEPLOY_${key.toUpperCase()} ist nicht gesetzt (${ENV_FILE}).`)
}
if (!cfg.password && !cfg.privateKey) fail('DEPLOY_PASSWORD (oder DEPLOY_PRIVATE_KEY für SFTP) ist nicht gesetzt.')
if (!['sftp', 'ftps', 'ftp'].includes(cfg.protocol)) fail(`Unbekanntes DEPLOY_PROTOCOL "${cfg.protocol}" (sftp | ftps | ftp).`)
if (['/', ''].includes(cfg.remoteDir)) fail('DEPLOY_REMOTE_DIR darf nicht die Wurzel "/" sein.')

// ---------- Ablauf ----------
if (!CHECK && !existsSync(LOCAL_DIR)) fail(`${LOCAL_DIR}/ fehlt. Zuerst "npm run build" ausführen.`)

const files = CHECK ? [] : listFiles(LOCAL_DIR)
log(`Ziel: ${cfg.protocol}://${cfg.user}@${cfg.host}${cfg.port ? ':' + cfg.port : ''}${cfg.remoteDir}`)

if (DRY_RUN) {
  files.forEach((f) => log(`  ${posix.join(cfg.remoteDir, f)}`))
  log(`Testlauf: ${files.length} Dateien würden hochgeladen${cfg.clean ? ' (assets/ wird vorher geleert)' : ''}.`)
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
    if (cfg.clean) {
      log('Entferne alte Build-Dateien (assets/) …')
      await transport.removeDir(posix.join(cfg.remoteDir, 'assets'))
    }
    log(`Lade ${files.length} Dateien hoch …`)
    await transport.uploadDir(LOCAL_DIR, cfg.remoteDir)
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
  return msg
}

function log(msg) {
  console.log(`[deploy] ${msg}`)
}

function fail(msg) {
  console.error(`[deploy] FEHLER: ${msg}`)
  process.exit(1)
}
