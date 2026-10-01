<?php
declare(strict_types=1);

/**
 * Konfiguration laden.
 *
 * Reihenfolge der Suche nach .env.api (erster Treffer gilt), ausgehend vom Ordner api/ aufwärts:
 *   <ordner>/private/.env.api   → Plesk: Ordner "private" liegt neben httpdocs, ausserhalb des Webroots
 *   <ordner>/.env.api           → lokal: Projektwurzel
 * Bereits gesetzte Umgebungsvariablen haben Vorrang.
 */
function load_env(): ?string
{
    $dir = __DIR__;
    for ($i = 0; $i < 6; $i++) {
        foreach (["$dir/private/.env.api", "$dir/.env.api"] as $file) {
            if (is_readable($file)) {
                foreach (file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
                    $line = trim($line);
                    if ($line === '' || $line[0] === '#' || !str_contains($line, '=')) {
                        continue;
                    }
                    [$key, $value] = array_map('trim', explode('=', $line, 2));
                    $value = trim($value, "\"'");
                    if (getenv($key) === false) {
                        putenv("$key=$value");
                        $_ENV[$key] = $value;
                    }
                }
                return $file;
            }
        }
        $parent = dirname($dir);
        if ($parent === $dir) {
            break;
        }
        $dir = $parent;
    }
    return null;
}

function env(string $key, ?string $default = null): ?string
{
    $value = getenv($key);
    return $value === false ? $default : $value;
}

load_env();

return [
    'debug'   => env('APP_DEBUG', 'false') === 'true',
    'cors'    => env('CORS_ORIGIN', ''),
    'db' => [
        'host'    => env('DB_HOST', 'localhost'),
        'port'    => (int) env('DB_PORT', '3306'),
        'name'    => env('DB_NAME', ''),
        'user'    => env('DB_USER', ''),
        'pass'    => env('DB_PASS', ''),
        'charset' => 'utf8mb4',
    ],
];
