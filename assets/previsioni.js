/* previsioni.js - Gestione completa previsioni meteo e marine */

let SITES = {};
let weatherData = null;
let marineData = null;
let selectedDayIndex = 0;

const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast';
const MARINE_BASE = 'https://marine-api.open-meteo.com/v1/marine';

// Caricamento database città dal file JSON
async function loadSitesData() {
  try {
    const response = await fetch('sites.json');
    if (!response.ok) throw new Error('Errore caricamento sites.json');
    SITES = await response.json();
    return true;
  } catch (error) {
    console.error(error);
    showError('Errore nella configurazione delle città');
    return false;
  }
}

// Mappatura Codici WMO (Weather Interpretation Codes)
const WEATHER_CODES = {
  0: { text: "Sereno", day: "☀️", night: "🌕" },
  1: { text: "Quasi sereno", day: "🌤️", night: "🌙" },
  2: { text: "Parzialmente nuvoloso", day: "⛅", night: "🌙" },
  3: { text: "Coperto", day: "☁️", night: "☁️" },
  45: { text: "Nebbia", day: "🌫️", night: "🌫️" },
  48: { text: "Nebbia con brina", day: "🌫️❄️", night: "🌫️❄️" },
  51: { text: "Pioviggine debole", day: "🌦️", night: "🌧️" },
  53: { text: "Pioviggine moderata", day: "🌦️💧", night: "🌧️💧" },
  55: { text: "Pioviggine intensa", day: "🌧️💧💧", night: "🌧️💧💧" },
  61: { text: "Pioggia debole", day: "🌦️", night: "🌧️" },
  63: { text: "Pioggia forte", day: "🌧️💧", night: "🌧️💧" },
  65: { text: "Pioggia violenta", day: "🌧️💦", night: "🌧️💦" },
  71: { text: "Neve debole", day: "🌨️", night: "🌨️" },
  73: { text: "Neve forte", day: "❄️❄️", night: "❄️❄️" },
  75: { text: "Neve intensa", day: "❄️❄️❄️", night: "❄️❄️❄️" },
  77: { text: "Granelli di neve", day: "🌨️", night: "🌨️" },
  80: { text: "Rovescio debole", day: "🌦️", night: "🌧️" },
  81: { text: "Rovescio moderato", day: "🌧️💧", night: "🌧️💧" },
  82: { text: "Rovescio violento", day: "🌧️💦", night: "🌧️💦" },
  85: { text: "Rovescio neve debole", day: "🌨️", night: "🌨️" },
  86: { text: "Rovescio neve forte", day: "❄️❄️", night: "❄️❄️" },
  95: { text: "Temporale", day: "⛈️", night: "⛈️" },
  96: { text: "Temporale con grandine", day: "⛈️🌨️", night: "⛈️🌨️" },
  99: { text: "Temporale forte", day: "⛈️💦", night: "⛈️💦" }
};

function weatherCodeToEmoji(code, isNight = false) {
  code = Number(code);
  const info = WEATHER_CODES[code] || { text: "Variabile", day: "⛅", night: "🌙" };
  return { icon: isNight ? info.night : info.day, text: info.text };
}

function degToCompass(deg) {
  if (deg === null || isNaN(deg)) return '--';
  const val = Math.floor((deg / 22.5) + 0.5);
  const arr = ["Nord", "Nord-NordEst", "NordEst", "Est-NordEst", "Est", "Est-SudEst", "SudEst", "Sud-SudEst", "Sud", "Sud-SudOvest", "SudOvest", "Ovest-SudOvest", "Ovest", "Ovest-NordOvest", "NordOvest", "Nord-NordOvest"];
  return arr[(val % 16)];
}

function metersToCm(m) { return isNaN(m) ? '--' : Math.round(m * 100); }
function kmhToKnots(kmh) { return isNaN(kmh) ? '--' : Math.round(kmh * 0.539957); }

// Chiamate API con parametro 14 giorni
async function fetchNormal(lat, lon) {
  const url = `${FORECAST_BASE}?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode,windspeed_10m,winddirection_10m&daily=temperature_2m_max,temperature_2m_min,weathercode&current_weather=true&forecast_days=14&timezone=auto`;
  const res = await fetch(url);
  return res.json();
}

async function fetchMarine(lat, lon) {
  const url = `${MARINE_BASE}?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_direction&daily=wave_height_max&forecast_days=14&timezone=auto`;
  const res = await fetch(url);
  return res.json();
}

// UI Helpers
function showError(msg) { $('#error-msg').text(msg).removeClass('hidden'); }
function hideError() { $('#error-msg').addClass('hidden'); }
function showLoading() { $('#loading').removeClass('hidden'); $('#main-content').addClass('hidden'); }
function hideLoading() { $('#loading').addClass('hidden'); $('#main-content').removeClass('hidden'); }

// Rendering Riepilogo Superiore
function renderCurrentSummary(site) {
  const cur = weatherData.current_weather;
  const wc = weatherCodeToEmoji(cur.weathercode);
  $('#current-icon').text(wc.icon);
  $('#current-temp').text(Math.round(cur.temperature) + '°');
  
  let desc = `${wc.text}<br>Vento: ${Math.round(cur.windspeed)} km/h da ${degToCompass(cur.winddirection)}`;
  if (site.type === 'marine' && marineData) {
    desc += `<br>🌊 Onda max oggi: ${metersToCm(marineData.daily.wave_height_max[0])} cm`;
  }
  $('#current-desc').html(desc);
}

// Rendering Calendario Giorni (Day Cards)
function renderDaysCalendar(site) {
  const container = $('#days-container').empty();
  const today = new Date().toISOString().split('T')[0];

  weatherData.daily.time.forEach((dateStr, i) => {
    const dateObj = new Date(dateStr);
    const isToday = dateStr === today;
    const wc = weatherCodeToEmoji(weatherData.daily.weathercode[i]);
    
    const card = $('<div class="day-card"></div>')
      .toggleClass('selected', i === selectedDayIndex)
      .attr('data-index', i);

    card.append(`<div class="day-date">${isToday ? 'Oggi' : dateObj.toLocaleDateString('it-IT', {weekday:'short', day:'numeric'})}</div>`);
    card.append(`<div class="day-icon">${wc.icon}</div>`);
    card.append(`<div class="day-temp">${Math.round(weatherData.daily.temperature_2m_max[i])}° / ${Math.round(weatherData.daily.temperature_2m_min[i])}°</div>`);
    
    card.on('click', function() {
      selectedDayIndex = i;
      $('.day-card').removeClass('selected');
      $(this).addClass('selected');
      
      const label = isToday ? 'Oggi - Orario' : dateObj.toLocaleDateString('it-IT', {weekday:'long', day:'numeric', month:'long'});
      $('#hourly-title').text(label);
      
      renderDayHourly(site, dateStr, isToday);
    });

    container.append(card);
  });
}

// Rendering Fasce Orarie (Hourly Cards)
function renderDayHourly(site, dateStr, isToday) {
  const container = $('#hourly-container').empty();
  const hours = weatherData.hourly.time;
  const curHour = new Date().getHours();

  hours.forEach((time, i) => {
    if (time.startsWith(dateStr)) {
      const dateObj = new Date(time);
      const h = dateObj.getHours();

      // Logica: tutte le ore per oggi, ogni 3 ore per il futuro
      if (isToday ? (h >= curHour) : (h % 3 === 0)) {
        const isNight = (h >= 0 && h <= 6) || (h >= 18 && h <= 23);
        const wc = weatherCodeToEmoji(weatherData.hourly.weathercode[i], isNight);
        const temp = Math.round(weatherData.hourly.temperature_2m[i]);
        const windSpeed = Math.round(weatherData.hourly.windspeed_10m[i]);
        const windDir = degToCompass(weatherData.hourly.winddirection_10m[i]);
        const timeLabel = h.toString().padStart(2, '0') + ':00';

        const card = $('<div class="hourly-card"></div>');
        card.append(`<div class="hourly-time">${timeLabel}</div>`);
        card.append(`<div class="hourly-icon">${wc.icon}</div>`);
        card.append(`<div class="hourly-temp">${temp}°</div>`);
        card.append(`<div class="hourly-desc">${wc.text}</div>`); // Qui è presente il div richiesto
        
        if (site.type === 'marine') {
          const mIdx = marineData ? marineData.hourly.time.indexOf(time) : -1;
          const wave = mIdx !== -1 ? metersToCm(marineData.hourly.wave_height[mIdx]) : '--';
          card.append(`<div class="hourly-wind">Vento: ${kmhToKnots(windSpeed)} nodi da ${windDir}</div>`);
          card.append(`<div class="hourly-wave">🌊 Onda: ${wave} cm</div>`);
        } else {
          card.append(`<div class="hourly-wind">Vento: ${windSpeed} km/h da ${windDir}</div>`);
        }

        container.append(card);
      }
    }
  });
}

// Funzione principale di caricamento
async function loadWeather() {
  showLoading();
  hideError();

  const site = SITES[CITY_KEY];
  if (!site) {
    showError(`Città non trovata: ${CITY_KEY}`);
    hideLoading();
    return;
  }

  $('#city-name').text(site.name);

  try {
    if (site.type === 'marine') {
      [weatherData, marineData] = await Promise.all([
        fetchNormal(site.lat, site.lon),
        fetchMarine(site.lat, site.lon)
      ]);
    } else {
      weatherData = await fetchNormal(site.lat, site.lon);
      marineData = null;
    }

    renderCurrentSummary(site);
    renderDaysCalendar(site);
    
    const todayStr = new Date().toISOString().split('T')[0];
    renderDayHourly(site, todayStr, true);
    
    hideLoading();
  } catch (err) {
    console.error(err);
    showError('Errore nel recupero dei dati meteo');
    hideLoading();
  }
}

// Avvio al caricamento del documento
$(async function() {
  const ok = await loadSitesData();
  if (ok) loadWeather();
  
  $('#refresh-btn').on('click', loadWeather);
});
