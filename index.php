<?php
// index.php - Homepage con selezione città
require_once 'config.php';

// Il controllo è già fatto in config.php, quindi se arriviamo qui
// significa che sites.json esiste ed è valido

// Ottieni i dati delle località
$sites = getSitesArray();
?><!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Previsioni Meteo</title>
  <link rel="stylesheet" href="assets/main.css?v=<?php echo APP_VERSION; ?>">
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
</head>
<body>
  <div class="page-wrapper">
    <header class="main-header">
      <h1>☀️ Meteo Sicilia</h1>
      <p class="subtitle">Scegli la tua città</p>
    </header>
    
    <main class="city-grid">
      <?php foreach ($sites as $cityKey => $cityData): ?>
        <a href="previsioni.php?city=<?php echo htmlspecialchars($cityKey); ?>" 
           class="city-card <?php echo $cityData['type'] === 'marine' ? 'marine' : ''; ?>">
          <div class="city-icon">
            <?php echo $cityData['type'] === 'marine' ? '🌊' : '🏛️'; ?>
          </div>
          <h2><?php echo htmlspecialchars($cityData['name']); ?></h2>
          <p><?php echo $cityData['type'] === 'marine' ? 'Previsioni marine' : 'Previsioni complete'; ?></p>
        </a>
      <?php endforeach; ?>
    </main>
    
    <footer class="main-footer">
      <small>Dati forniti da Open-Meteo</small>
      <a href="installer.php" class="footer-settings">⚙️ Gestisci città</a>
      <small>Created by smal</small>
    </footer>
  </div>
</body>
</html>
