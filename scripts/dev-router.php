<?php
// Router für den PHP-Entwicklungsserver (npm run api): ersetzt lokal die .htaccess-Regeln.
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

if (str_starts_with($path, '/api')) {
    require __DIR__ . '/../public/api/index.php';
    return true;
}
return false; // statische Dateien normal ausliefern
