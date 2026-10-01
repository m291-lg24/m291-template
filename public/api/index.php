<?php
declare(strict_types=1);

/**
 * Single Entry Point der API.
 * Alle Anfragen auf /api/... werden per .htaccess (bzw. scripts/dev-router.php lokal) hierher geleitet.
 *
 *   GET    /api/health        Status von API und Datenbank
 *   GET    /api/notes         alle Notizen
 *   POST   /api/notes         {"text": "..."} neue Notiz
 *   DELETE /api/notes/{id}    Notiz löschen
 */

$config = require __DIR__ . '/config.php';
require __DIR__ . '/lib.php';

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

if ($config['cors'] !== '') {
    header('Access-Control-Allow-Origin: ' . $config['cors']);
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

set_exception_handler(function (Throwable $e) use ($config) {
    error_log('[api] ' . $e->getMessage());
    json_response(['error' => $config['debug'] ? $e->getMessage() : 'Interner Fehler'], 500);
});

// Pfad nach /api/ ermitteln, z. B. "notes/3"
$uri  = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/';
$path = trim((string) preg_replace('#^.*?/api/?#', '', $uri), '/');
$path = preg_replace('#^index\.php/?#', '', $path);
$segments = $path === '' ? [] : explode('/', $path);
$method = $_SERVER['REQUEST_METHOD'];

$resource = $segments[0] ?? '';
$id = isset($segments[1]) ? (int) $segments[1] : null;

match (true) {
    $resource === 'health' && $method === 'GET' => health($config),

    $resource === 'notes' && $method === 'GET' && $id === null
        => json_response(['items' => db($config)->query('SELECT id, text, created_at FROM notes ORDER BY created_at DESC')->fetchAll()]),

    $resource === 'notes' && $method === 'POST' && $id === null => (function () use ($config) {
        $body = json_body();
        $text = trim((string) ($body['text'] ?? ''));
        if ($text === '' || mb_strlen($text) > 500) {
            json_response(['error' => 'Text fehlt oder ist länger als 500 Zeichen'], 422);
        }
        $pdo = db($config);
        $stmt = $pdo->prepare('INSERT INTO notes (text) VALUES (:text)');
        $stmt->execute(['text' => $text]);
        $item = $pdo->query('SELECT id, text, created_at FROM notes WHERE id = ' . (int) $pdo->lastInsertId())->fetch();
        json_response(['item' => $item], 201);
    })(),

    $resource === 'notes' && $method === 'DELETE' && $id !== null => (function () use ($config, $id) {
        $stmt = db($config)->prepare('DELETE FROM notes WHERE id = :id');
        $stmt->execute(['id' => $id]);
        if ($stmt->rowCount() === 0) {
            json_response(['error' => 'Notiz nicht gefunden'], 404);
        }
        json_response(null, 204);
    })(),

    default => json_response(['error' => 'Route nicht gefunden'], 404),
};
