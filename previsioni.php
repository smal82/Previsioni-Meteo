<?php
// previsioni.php - Dettaglio previsioni città
require_once 'config.php';

$city = isset($_GET['city']) ? $_GET['city'] : 'alcamo';
?><!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Previsioni Meteo</title>
  <link rel="stylesheet" href="assets/previsioni.css?v=<?php echo APP_VERSION; ?>">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
</head>
<body>
  <div class="app-container">
    <!-- Header -->
    <header class="app-header">
      <a href="index.php" class="back-btn">‹ Indietro</a>
      <h1 id="city-name" class="city-title">Caricamento...</h1>
      <button id="refresh-btn" class="refresh-btn">⟳</button>
    </header>

    <!-- Error message -->
    <div id="error-msg" class="error-msg hidden"></div>

    <!-- Loading -->
    <div id="loading" class="loading">
      <div class="spinner"></div>
      <p>Caricamento previsioni...</p>
    </div>

    <!-- Main content -->
    <main id="main-content" class="main-content hidden">
      
      <!-- Current weather summary -->
      <section class="current-summary">
        <div class="current-icon" id="current-icon">☀️</div>
        <div class="current-info">
          <div class="current-temp" id="current-temp">--°</div>
          <div class="current-desc" id="current-desc">--</div>
        </div>
      </section>

      <!-- Hourly section (today from current hour OR selected day) -->
      <section class="section">
        <h2 class="section-title" id="hourly-title">Oggi - Orario</h2>
        <div id="hourly-container" class="hourly-scroll">
          <!-- JS generated -->
        </div>
      </section>

      <!-- Days calendar -->
      <section class="section">
        <h2 class="section-title">Prossimi giorni</h2>
        <div id="days-container" class="days-grid">
          <!-- JS generated -->
        </div>
      </section>

    </main>
  </div>

  <script>
    const CITY_KEY = '<?php echo htmlspecialchars($city); ?>';
  </script>
  <script src="assets/previsioni.js?v=<?php echo APP_VERSION; ?>"></script>
</body>
</html>