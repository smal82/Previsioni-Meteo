# ☀️ Meteo Sicilia

Un'applicazione web moderna e intuitiva per visualizzare le previsioni meteo e marine per le città della Sicilia.

![Version](https://img.shields.io/badge/version-7.0.0-blue.svg)
![PHP](https://img.shields.io/badge/PHP-7.4%2B-777BB4.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 📋 Caratteristiche

- ✅ **Previsioni meteo complete** per 14 giorni
- 🌊 **Previsioni marine** (altezza onde, direzione) per località costiere
- 📱 **Design responsive** ottimizzato per mobile e desktop
- 🎨 **Interfaccia moderna** con animazioni fluide
- ⚡ **Dati in tempo reale** da Open-Meteo API
- 🔧 **Sistema di configurazione** semplice e intuitivo
- 🌍 **Geocoding automatico** per trovare coordinate delle città
- 📊 **Visualizzazione oraria** dettagliata con temperatura, vento e onde

## 🚀 Installazione

### Requisiti

- **PHP 7.4 o superiore**
- **Web server** (Apache, Nginx, o server PHP integrato)
- **Connessione internet** per API Open-Meteo

### Setup Rapido

1. **Clona il repository**
   ```bash
   git clone https://github.com/smal82//Previsioni-Meteo.git
   cd /Previsioni-Meteo
   ```

2. **Avvia il server PHP**
   ```bash
   php -S localhost:8000
   ```

3. **Apri il browser**
   ```
   http://localhost:8000
   ```

4. **Configura le città**
   - Al primo avvio verrai automaticamente reindirizzato all'installer
   - Aggiungi le tue città preferite
   - Seleziona se sono località marine per avere previsioni onde
   - Click su "Ho finito, vai all'applicazione"

## 📁 Struttura del Progetto

```
meteo-sicilia/
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

1. Vai su `installer.php` o clicca su "⚙️ Gestisci città" dalla homepage
2. Inserisci il nome della città (es: "Palermo")
3. Seleziona "🌊 Località marina" se vuoi previsioni onde
4. Click su "Aggiungi Città"
5. L'app cerca automaticamente le coordinate via Geocoding API

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

- **`normal`**: Solo previsioni meteo (temperatura, vento, precipitazioni)
- **`marine`**: Previsioni meteo + marine (altezza onde, direzione onde)

## 🌐 API Utilizzate

L'applicazione utilizza le seguenti API gratuite di Open-Meteo:

1. **Geocoding API**: `https://geocoding-api.open-meteo.com/v1/search`
   - Trova coordinate geografiche dal nome città
   
2. **Weather Forecast API**: `https://api.open-meteo.com/v1/forecast`
   - Previsioni meteo a 14 giorni
   - Dati orari: temperatura, codice meteo, vento
   
3. **Marine Weather API**: `https://marine-api.open-meteo.com/v1/marine`
   - Previsioni marine a 14 giorni
   - Dati orari: altezza onde, direzione onde

**Nota**: Tutte le API sono gratuite e non richiedono chiavi API.

### Cambiare Giorni di Previsione

In `previsioni.js`, modifica la variabile `forecast_days`:

```javascript
const params = new URLSearchParams({
  // ... altri parametri
  forecast_days: 14,  // Cambia da 14 a 7 o 10
});
```

## 🤝 Contribuire

I contributi sono benvenuti! Per contribuire:

1. Fai un fork del progetto
2. Crea un branch per la tua feature (`git checkout -b feature/AmazingFeature`)
3. Commit delle modifiche (`git commit -m 'Add some AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

### Idee per Contributi

- 🌍 Supporto multilingua
- 📊 Grafici delle temperature
- 🔔 Sistema di notifiche
- 🌙 Tema scuro
- 📍 Geolocalizzazione automatica
- 💾 Esportazione dati CSV/PDF

## 📄 Licenza

Questo progetto è distribuito sotto licenza **MIT**. Vedi il file `LICENSE` per maggiori dettagli.

## 👨‍💻 Autore

**Il Tuo Nome**
- GitHub: [@smal82](https://github.com/smal82)

## 🙏 Ringraziamenti

- [Open-Meteo](https://open-meteo.com/) per le API meteo gratuite
- [jQuery](https://jquery.com/) per la libreria JavaScript
- [Cloudflare CDN](https://cdnjs.com/) per l'hosting delle librerie

## 📞 Supporto

Per problemi o domande:
- 🐛 Apri una [Issue](https://github.com/smal82//Previsioni-Meteo/issues)
- 💬 Contattami su GitHub

---

**Nota**: Quest'applicazione è fornita "così com'è" senza garanzie. I dati meteo provengono da Open-Meteo e la loro accuratezza dipende da tale servizio.
