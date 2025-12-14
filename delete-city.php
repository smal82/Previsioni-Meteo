<?php
/**
 * delete-city.php - Elimina una città dal file sites.json
 */

header('Content-Type: application/json');

// Leggi i dati POST
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (!$data || !isset($data['key'])) {
    echo json_encode(['success' => false, 'message' => 'Chiave non specificata']);
    exit;
}

$cityKey = $data['key'];
$sitesJsonPath = __DIR__ . '/sites.json';

// Carica il JSON esistente
if (!file_exists($sitesJsonPath)) {
    echo json_encode(['success' => false, 'message' => 'File sites.json non trovato']);
    exit;
}

$sitesJson = file_get_contents($sitesJsonPath);
$sites = json_decode($sitesJson, true);

if ($sites === null) {
    echo json_encode(['success' => false, 'message' => 'Errore nel leggere il file sites.json']);
    exit;
}

// Controlla se la città esiste
if (!isset($sites[$cityKey])) {
    echo json_encode(['success' => false, 'message' => 'Città non trovata']);
    exit;
}

// Rimuovi la città
unset($sites[$cityKey]);

// Salva il file
$jsonString = json_encode($sites, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
if (file_put_contents($sitesJsonPath, $jsonString) === false) {
    echo json_encode(['success' => false, 'message' => 'Impossibile scrivere il file sites.json']);
    exit;
}

echo json_encode(['success' => true, 'message' => 'Città eliminata con successo']);
?>