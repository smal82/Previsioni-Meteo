<?php
// previsioni.php - Dettaglio previsioni città
require_once 'config.php';

// Prendiamo il parametro city e puliamolo: minuscolo, senza spazi e senza caratteri speciali
$city_raw = isset($_GET['city']) ? $_GET['city'] : 'alcamo';

// Funzione di normalizzazione per farla coincidere con il JS dell'installer
$city_key = strtolower(preg_replace('/[^a-z0-9]/', '', $city_raw));
?><!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Previsioni Meteo</title>
  <link rel="stylesheet" href="assets/previsioni.css?v=<?php echo APP_VERSION; ?>">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
</head>
<body>
  <div class="app-container">
    <header class="app-header">
      <a href="./" class="back-btn">‹ Indietro</a>
      <h1 id="city-name" class="city-title">Caricamento...</h1>
      <button id="download-png" class="refresh-btn" title="Scarica PNG">📷</button>
      <button id="refresh-btn" class="refresh-btn">⟳</button>
    </header>

    <div id="error-msg" class="error-msg hidden"></div>

    <div id="loading" class="loading">
      <div class="spinner"></div>
      <p>Caricamento previsioni...</p>
    </div>

    <main id="main-content" class="main-content hidden">
      
      <section class="current-summary">
        <div class="current-icon" id="current-icon">☀️</div>
        <div class="current-info">
          <div class="current-temp" id="current-temp">--°</div>
          <div class="current-desc" id="current-desc">--</div>
        </div>
      </section>

      <section id="meteo" class="section">
        <h2 class="section-title" id="hourly-title">Oggi - Orario</h2>
        <div id="hourly-container" class="hourly-scroll">
          </div>
      </section>

      <section class="section">
        <h2 class="section-title">Prossimi giorni</h2>
        <div id="days-container" class="days-grid">
          </div>
      </section>

    </main>
  </div>

  <script>
    // Passiamo la chiave normalizzata al JS
    const CITY_KEY = '<?php echo htmlspecialchars($city_key); ?>';
  </script>
  <script src="assets/previsioni.js?v=<?php echo APP_VERSION; ?>"></script>
  <script>
    // Gestione download immagine
    $('#download-png').click(function() {
      const btn = $(this);
      const originalText = btn.text();
      btn.text('⏳').prop('disabled', true);
      const hourlyTitleEl = $('#hourly-title');
      const originalTitle = hourlyTitleEl.text();
      const cityName = $('#city-name').text().trim();
      hourlyTitleEl.text(`${cityName} - ${originalTitle}`);
      
      html2canvas(document.querySelector('#meteo'), {
        backgroundColor: '#f0f4f8',
        scale: 2,
        logging: false,
        useCORS: true
      }).then(canvas => {
        hourlyTitleEl.text(originalTitle);
        canvas.toBlob(function(blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          const cityNameFile = cityName.toLowerCase().replace(/\s+/g, '-');
          const datePart = originalTitle.toLowerCase().replace(/[^a-z0-9]/g, '-');
          link.download = `meteo-${cityNameFile}-${datePart}.png`;
          link.href = url;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          btn.text(originalText).prop('disabled', false);
        }, 'image/png');
      }).catch(error => {
        console.error('Errore canvas:', error);
        hourlyTitleEl.text(originalTitle);
        btn.text(originalText).prop('disabled', false);
      });
    });
  </script>
</body>
</html>
