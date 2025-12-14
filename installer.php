<?php
// installer.php - Gestione città
require_once 'config.php';

// Carica città esistenti se presenti
$sitesJsonPath = __DIR__ . '/sites.json';
$existingSites = [];
if (file_exists($sitesJsonPath)) {
    $sitesJson = file_get_contents($sitesJsonPath);
    $decoded = json_decode($sitesJson, true);
    if ($decoded !== null) {
        $existingSites = $decoded;
    }
}
?><!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Configurazione Città - Meteo Sicilia</title>
  <link rel="stylesheet" href="assets/main.css?v=<?php echo APP_VERSION; ?>">
  <style>
    .installer-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    
    .installer-header {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .installer-header h1 {
      font-size: 2rem;
      margin-bottom: 8px;
    }
    
    .installer-header p {
      color: var(--muted);
    }
    
    .form-card {
      background: var(--card);
      border-radius: var(--radius);
      padding: 24px;
      box-shadow: var(--shadow);
      margin-bottom: 20px;
    }
    
    .form-group {
      margin-bottom: 20px;
    }
    
    .form-group label {
      display: block;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--text);
    }
    
    .form-group input[type="text"] {
      width: 100%;
      padding: 12px;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;
    }
    
    .form-group input[type="text"]:focus {
      outline: none;
      border-color: var(--accent);
    }
    
    .checkbox-group {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .checkbox-group input[type="checkbox"] {
      width: 20px;
      height: 20px;
      cursor: pointer;
    }
    
    .checkbox-group label {
      margin: 0;
      cursor: pointer;
    }
    
    .btn {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
    }
    
    .btn-primary {
      background: var(--accent);
      color: white;
    }
    
    .btn-primary:hover {
      background: var(--accent-hover);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(49, 130, 206, 0.3);
    }
    
    .btn-success {
      background: #48bb78;
      color: white;
      margin-top: 20px;
    }
    
    .btn-success:hover {
      background: #38a169;
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(72, 187, 120, 0.3);
    }
    
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }
    
    .message {
      padding: 14px;
      border-radius: 8px;
      margin-bottom: 20px;
      text-align: center;
      animation: slideIn 0.3s ease;
    }
    
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .message.success {
      background: #c6f6d5;
      color: #22543d;
      border: 2px solid #48bb78;
    }
    
    .message.error {
      background: #fed7d7;
      color: #742a2a;
      border: 2px solid #f56565;
    }
    
    .message.info {
      background: #bee3f8;
      color: #2c5282;
      border: 2px solid #4299e1;
    }
    
    .cities-list {
      margin-top: 30px;
    }
    
    .cities-list h2 {
      font-size: 1.3rem;
      margin-bottom: 15px;
    }
    
    .city-item {
      background: var(--card);
      border-radius: var(--radius);
      padding: 16px;
      margin-bottom: 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      box-shadow: var(--shadow);
    }
    
    .city-item-info {
      flex: 1;
    }
    
    .city-item-name {
      font-weight: 600;
      font-size: 1.1rem;
      margin-bottom: 4px;
    }
    
    .city-item-type {
      font-size: 0.9rem;
      color: var(--muted);
    }
    
    .city-item-type.marine {
      color: var(--marine);
    }
    
    .btn-delete {
      background: #fc8181;
      color: white;
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s;
    }
    
    .btn-delete:hover {
      background: #f56565;
    }
    
    .loading-spinner {
      display: inline-block;
      width: 16px;
      height: 16px;
      border: 3px solid rgba(255, 255, 255, 0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      margin-right: 8px;
    }
    
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
    
    .hidden {
      display: none;
    }
  </style>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"></script>
</head>
<body>
  <div class="installer-container">
    <div class="installer-header">
      <h1>⚙️ Configurazione Città</h1>
      <p>Aggiungi le città per le previsioni meteo</p>
    </div>
    
    <div id="message-container"></div>
    
    <div class="form-card">
      <form id="city-form">
        <div class="form-group">
          <label for="city-name">Nome della città</label>
          <input type="text" id="city-name" name="city-name" placeholder="Es: Palermo" required>
        </div>
        
        <div class="form-group">
          <div class="checkbox-group">
            <input type="checkbox" id="is-marine" name="is-marine">
            <label for="is-marine">🌊 Località marina (previsioni onde)</label>
          </div>
        </div>
        
        <button type="submit" class="btn btn-primary" id="add-btn">
          Aggiungi Città
        </button>
      </form>
    </div>
    
    <div class="cities-list">
      <h2>Città configurate</h2>
      <div id="cities-container">
        <?php if (empty($existingSites)): ?>
          <p style="color: var(--muted); text-align: center; padding: 20px;">
            Nessuna città configurata. Aggiungi la prima città sopra.
          </p>
        <?php else: ?>
          <?php foreach ($existingSites as $key => $city): ?>
            <div class="city-item" data-key="<?php echo htmlspecialchars($key); ?>">
              <div class="city-item-info">
                <div class="city-item-name">
                  <?php echo $city['type'] === 'marine' ? '🌊' : '🏛️'; ?>
                  <?php echo htmlspecialchars($city['name']); ?>
                </div>
                <div class="city-item-type <?php echo $city['type'] === 'marine' ? 'marine' : ''; ?>">
                  <?php echo $city['type'] === 'marine' ? 'Località marina' : 'Località normale'; ?>
                  • Lat: <?php echo $city['lat']; ?>, Lon: <?php echo $city['lon']; ?>
                </div>
              </div>
              <button class="btn-delete" onclick="deleteCity('<?php echo htmlspecialchars($key); ?>')">
                Elimina
              </button>
            </div>
          <?php endforeach; ?>
        <?php endif; ?>
      </div>
    </div>
    
    <button class="btn btn-success" id="finish-btn">
      ✓ Ho finito, vai all'applicazione
    </button>
  </div>
  
  <script src="assets/installer.js?v=<?php echo APP_VERSION; ?>"></script>
</body>
</html>