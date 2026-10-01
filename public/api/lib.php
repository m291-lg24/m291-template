<?php
declare(strict_types=1);

function json_response(mixed $data, int $status = 200): never
{
    http_response_code($status);
    if ($status !== 204) {
        echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
    exit;
}

function json_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    if (!is_array($data)) {
        json_response(['error' => 'Ungültiges JSON'], 400);
    }
    return $data;
}

function db(array $config): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) {
        return $pdo;
    }
    $c = $config['db'];
    if ($c['name'] === '') {
        throw new RuntimeException('Keine Datenbank konfiguriert (.env.api fehlt?)');
    }
    $dsn = "mysql:host={$c['host']};port={$c['port']};dbname={$c['name']};charset={$c['charset']}";
    $pdo = new PDO($dsn, $c['user'], $c['pass'], [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
    return $pdo;
}

function health(array $config): never
{
    $db = 'nicht konfiguriert';
    if ($config['db']['name'] !== '') {
        try {
            db($config)->query('SELECT 1');
            $db = 'ok';
        } catch (Throwable $e) {
            error_log('[api] DB: ' . $e->getMessage());
            $db = $config['debug'] ? $e->getMessage() : 'nicht erreichbar';
        }
    }
    json_response(['api' => 'ok', 'db' => $db, 'php' => PHP_VERSION]);
}
