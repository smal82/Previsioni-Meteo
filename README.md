# ☀️ Previsioni Meteo

Un'applicazione web moderna e intuitiva per visualizzare le previsioni meteo e marine per le tue città preferite.

![Version](https://img.shields.io/badge/Version-7.0.0-blue.svg)
![PHP](https://img.shields.io/badge/PHP-7.4%2B-777BB4.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Database](https://img.shields.io/badge/Database-NoSQL-red.svg)

## 📋 Caratteristiche

🌤️ Previsioni meteo complete per 14 giorni  
🌊 Previsioni marine (altezza onde, direzione) per località costiere  
📱 Design responsive ottimizzato per mobile e desktop  
🎨 Interfaccia moderna con animazioni fluide  
⚡ Dati in tempo reale da Open-Meteo API  
🔧 Sistema di configurazione semplice e intuitivo  
🌍 Geocoding automatico per trovare coordinate delle città  
📊 Visualizzazione oraria dettagliata con temperatura, vento e onde

## 🚀 Installazione

### Requisiti

🖥️ PHP 7.4 o superiore  
🌐 Web server (Apache, Nginx, o server PHP integrato)  
📡 Connessione internet per API Open-Meteo

### Setup Rapido

**1️⃣ Clona il repository**
```bash
git clone https://github.com/smal82/Previsioni-Meteo.git
cd Previsioni-Meteo
```

**2️⃣ Avvia il server PHP**
```bash
php -S localhost:8000
```

**3️⃣ Apri il browser**
```
http://localhost:8000
```

**4️⃣ Configura le città**  
🔹 Al primo avvio verrai automaticamente reindirizzato all'installer  
🔹 Aggiungi le tue città preferite  
🔹 Seleziona se sono località marine per avere previsioni onde  
🔹 Click su "Ho finito, vai all'applicazione"

## 📁 Struttura del Progetto

```
Previsioni-Meteo/
├── index.php              # Homepage con lista città
├── previsioni.php         # Pagina dettaglio previsioni
├── installer.php          # Configurazione città
├── config.php             # Configurazione globale
├── save-city.php          # API endpoint - salva città
├── delete-city.php        # API endpoint - elimina città
├── sites.json             # Database città (generato automaticamente)
├── assets/
│   ├── main.css           # Stili homepage
│   ├── previsioni.css     # Stili pagina previsioni
│   ├── previsioni.js      # Logica previsioni
│   └── installer.js       # Logica installer
└── README.md
```

## ⚙️ Configurazione

### Aggiungere una Città

1️⃣ Vai su `installer.php` o clicca su "⚙️ Gestisci città" dalla homepage  
2️⃣ Inserisci il nome della città (es: "Palermo")  
3️⃣ Seleziona "🌊 Località marina" se vuoi previsioni onde  
4️⃣ Click su "Aggiungi Città"  
5️⃣ L'app cerca automaticamente le coordinate via Geocoding API

### File sites.json

Le città vengono salvate automaticamente in `sites.json`:

```json
{
  "palermo": {
    "key": "palermo",
    "name": "Palermo",
    "type": "normal",
    "lat": 38.1157,
    "lon": 13.3615
  },
  "trapani": {
    "key": "trapani",
    "name": "Trapani",
    "type": "marine",
    "lat": 38.0176,
    "lon": 12.5365
  }
}
```

### Tipi di Località

🏛️ **normal** Solo previsioni meteo (temperatura, vento, precipitazioni)  
🌊 **marine** Previsioni meteo + marine (altezza onde, direzione onde)

## 🌐 API Utilizzate

L'applicazione utilizza le seguenti API gratuite di Open-Meteo:

**1️⃣ Geocoding API** `https://geocoding-api.open-meteo.com/v1/search`  
🔹 Trova coordinate geografiche dal nome città

**2️⃣ Weather Forecast API** `https://api.open-meteo.com/v1/forecast`  
🔹 Previsioni meteo a 14 giorni  
🔹 Dati orari: temperatura, codice meteo, vento

**3️⃣ Marine Weather API** `https://marine-api.open-meteo.com/v1/marine`  
🔹 Previsioni marine a 14 giorni  
🔹 Dati orari: altezza onde, direzione onde

📝 Tutte le API sono gratuite e non richiedono chiavi API

## 🐛 Risoluzione Problemi

### L'installer non parte automaticamente
🔹 Verifica che `sites.json` non esista o sia vuoto  
🔹 Controlla i permessi di scrittura della cartella

### Città non trovata
🔹 Verifica l'ortografia del nome città  
🔹 Prova con nomi più generici (es: "Roma" invece di "Roma Capitale")  
🔹 Controlla la connessione internet

### Errore "Impossibile scrivere sites.json"
🔹 Verifica i permessi di scrittura:
```bash
chmod 755 .
chmod 644 sites.json  # se esiste
```

### jQuery non si carica
🔹 L'app usa Cloudflare CDN per jQuery  
🔹 Verifica la connessione internet  
🔹 Controlla che non ci siano blocchi firewall

## 📱 Compatibilità

✅ Chrome/Edge 90+  
✅ Firefox 88+  
✅ Safari 14+  
✅ Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contribuire

I contributi sono benvenuti! Per contribuire:

1️⃣ Fai un fork del progetto  
2️⃣ Crea un branch per la tua feature `git checkout -b feature/AmazingFeature`  
3️⃣ Commit delle modifiche `git commit -m 'Add some AmazingFeature'`  
4️⃣ Push al branch `git push origin feature/AmazingFeature`  
5️⃣ Apri una Pull Request

### Idee per Contributi

🌍 Supporto multilingua  
📊 Grafici delle temperature  
🔔 Sistema di notifiche  
🌙 Tema scuro  
📍 Geolocalizzazione automatica  
💾 Esportazione dati CSV/PDF

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi il file `LICENSE` per maggiori dettagli.

## 👨‍💻 Autore

**smal82**  
🔗 GitHub [@smal82](https://github.com/smal82)

## 🙏 Ringraziamenti

🌤️ [Open-Meteo](https://open-meteo.com/) per le API meteo gratuite  
💻 [jQuery](https://jquery.com/) per la libreria JavaScript  
☁️ [Cloudflare CDN](https://cdnjs.com/) per l'hosting delle librerie

## 📞 Supporto

🐛 Apri una [Issue](https://github.com/smal82/Previsioni-Meteo/issues)  
💬 Contattami su GitHub

---

⚠️ Quest'applicazione è fornita "così com'è" senza garanzie. I dati meteo provengono da Open-Meteo e la loro accuratezza dipende da tale servizio.
