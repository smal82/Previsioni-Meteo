<?php
/**
 * save-city.php - Salva una città nel file sites.json
 */

header('Content-Type: application/json');

// Leggi i dati POST
$input = file_get_contents('php://input');
$cityData = json_decode($input, true);

if (!$cityData || !isset($cityData['key']) || !isset($cityData['name'])) {
    echo json_encode(['success' => false, 'message' => 'Dati non validi']);
    exit;
}

$sitesJsonPath = __DIR__ . '/sites.json';

// Carica il JSON esistente o crea un array vuoto
$sites = [];
if (file_exists($sitesJsonPath)) {
    $sitesJson = file_get_contents($sitesJsonPath);
    $decoded = json_decode($sitesJson, true);
    if ($decoded !== null) {
        $sites = $decoded;
    }
}

// Controlla se la chiave esiste già
if (isset($sites[$cityData['key']])) {
    echo json_encode(['success' => false, 'message' => 'Questa città esiste già']);
    exit;
}

// Aggiungi la nuova città
$sites[$cityData['key']] = [
    'key' => $cityData['key'],
    'name' => $cityData['name'],
    'type' => $cityData['type'],
    'lat' => $cityData['lat'],
    'lon' => $cityData['lon']
];

// Salva il file
$jsonString = json_encode($sites, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
if (file_put_contents($sitesJsonPath, $jsonString) === false) {
    echo json_encode(['success' => false, 'message' => 'Impossibile scrivere il file sites.json']);
    exit;
}

echo json_encode(['success' => true, 'message' => 'Città aggiunta con successo']);
?>