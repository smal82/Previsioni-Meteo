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
   <!-- Aggiungi html2canvas -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"></script>
</head>
<body>
  <div class="app-container">
    <!-- Header -->
    <header class="app-header">
      <a href="./" class="back-btn">‹ Indietro</a>
      <h1 id="city-name" class="city-title">Caricamento...</h1>
      <button id="download-png" class="refresh-btn" title="Scarica PNG">📷</button>
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
      <section id="meteo" class="section">
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
  <script>
    // Funzione per scaricare la sezione #meteo come PNG
$('#download-png').click(function() {
  const btn = $(this);
  const originalText = btn.text();
  
  btn.text('⏳').prop('disabled', true);
  
  // Salva il titolo originale
  const hourlyTitleEl = $('#hourly-title');
  const originalTitle = hourlyTitleEl.text();
  
  // Aggiungi il nome della città al titolo
  const cityName = $('#city-name').text().trim();
  hourlyTitleEl.text(`${cityName} - ${originalTitle}`);
  
  // Cattura la sezione #meteo
  html2canvas(document.querySelector('#meteo'), {
    backgroundColor: '#f0f4f8',
    scale: 2,
    logging: false,
    useCORS: true
  }).then(canvas => {
    // Ripristina il titolo originale
    hourlyTitleEl.text(originalTitle);
    
    canvas.toBlob(function(blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const cityNameFile = cityName.toLowerCase().replace(/\s+/g, '-');
      
      const datePart = originalTitle.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[àáâãäå]/g, 'a')
        .replace(/[èéêë]/g, 'e')
        .replace(/[ìíîï]/g, 'i')
        .replace(/[òóôõö]/g, 'o')
        .replace(/[ùúûü]/g, 'u')
        .replace(/[^a-z0-9-]/g, '');
      
      link.download = `meteo-${cityNameFile}-${datePart}.png`;
      link.href = url;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      btn.text(originalText).prop('disabled', false);
    }, 'image/png');
  }).catch(error => {
    console.error('Errore durante la creazione del PNG:', error);
    alert('Errore durante la creazione dell\'immagine');
    // Ripristina il titolo anche in caso di errore
    hourlyTitleEl.text(originalTitle);
    btn.text(originalText).prop('disabled', false);
  });
});
  </script>
</body>
</html>
