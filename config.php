<?php
/**
 * config.php - Configurazione globale applicazione Meteo Sicilia
 */

// Versione applicazione
define('APP_VERSION', '7.0.0');

// Funzione per controllare se sites.json esiste ed è valido
function checkSitesJson() {
    $sitesJsonPath = __DIR__ . '/sites.json';
    
    if (!file_exists($sitesJsonPath)) {
        return false;
    }
    
    $sitesJson = file_get_contents($sitesJsonPath);
    if ($sitesJson === false) {
        return false;
    }
    
    $sitesData = json_decode($sitesJson, true);
    if ($sitesData === null || empty($sitesData)) {
        return false;
    }
    
    return $sitesData;
}

// Carica configurazione località da file JSON esterno
// SOLO se non siamo in installer.php
$currentScript = basename($_SERVER['PHP_SELF']);
if ($currentScript !== 'installer.php' && $currentScript !== 'save-city.php' && $currentScript !== 'delete-city.php') {
    $sitesData = checkSitesJson();
    
    if ($sitesData === false) {
        // Reindirizza a installer.php
        header('Location: installer.php');
        exit;
    }
    
    // Definisci la costante SITES con i dati caricati
    define('SITES', json_encode($sitesData));
} else {
    // Per installer e script di gestione, definisci SITES vuoto
    define('SITES', json_encode([]));
}

// Funzione helper per ottenere i dati delle località come array PHP
function getSitesArray() {
    return json_decode(SITES, true);
}

// Disabilita cache per tutte le pagine PHP
function disableCache() {
    header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
    header("Cache-Control: post-check=0, pre-check=0", false);
    header("Pragma: no-cache");
    header("Expires: 0");
}

// Applica headers anti-cache
disableCache();
?>