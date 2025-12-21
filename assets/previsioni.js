/* previsioni.js - Gestione previsioni meteo */

let SITES = {};
let weatherData = null;
let marineData = null;

const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast';
const MARINE_BASE = 'https://marine-api.open-meteo.com/v1/marine';

// Carica dati dal JSON
async function loadSitesData() {
  try {
    const response = await fetch('sites.json');
    if (!response.ok) throw new Error('File sites.json non trovato');
    SITES = await response.json();
    return true;
  } catch (error) {
    console.error(error);
    showError('Errore configurazione città');
    hideLoading(); // Ferma il loader se il JSON fallisce
    return false;
  }
}

const WEATHER_CODES = {
  0: { text: "Sereno", day: "☀️", night: "🌕" },
  1: { text: "Quasi sereno", day: "🌤️", night: "🌙☁️" },
  2: { text: "Parzialmente nuvoloso", day: "⛅", night: "🌙☁️" },
  3: { text: "Coperto", day: "☁️", night: "☁️" },
  45: { text: "Nebbia", day: "🌫️", night: "🌫️" },
  51: { text: "Pioviggine debole", day: "🌦️", night: "🌧️" },
  61: { text: "Pioggia debole", day: "🌦️", night: "🌧️" },
  63: { text: "Pioggia forte", day: "🌧️💧", night: "🌧️💧" },
  71: { text: "Neve debole", day: "🌨️", night: "🌨️" },
  95: { text: "Temporale", day: "⛈️", night: "⛈️" }
};

function weatherCodeToEmoji(code) {
  const hour = new Date().getHours();
  const isNight = (hour >= 0 && hour <= 6) || (hour >= 18 && hour <= 23);
  const info = WEATHER_CODES[code] || { text: "Variabile", day: "⛅", night: "🌙" };
  return { icon: isNight ? info.night : info.day, text: info.text };
}

function degToCompassName(deg) {
  if (deg === null || isNaN(deg)) return '--';
  const points = ['Nord', 'Nord-Est', 'Est', 'Sud-Est', 'Sud', 'Sud-Ovest', 'Ovest', 'Nord-Ovest'];
  const idx = Math.floor((((Number(deg) + 360) % 360) + 22.5) / 45) % 8;
  return points[idx];
}

function metersToCm(m) { return isNaN(m) ? '--' : Math.round(m * 100); }
function kmhToKnots(kmh) { return isNaN(kmh) ? '--' : Math.round(kmh * 0.539957); }

async function fetchNormal(lat, lon) {
  const url = `${FORECAST_BASE}?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,weathercode,windspeed_10m,winddirection_10m&daily=temperature_2m_max,temperature_2m_min,weathercode&current_weather=true&timezone=auto`;
  const res = await fetch(url);
  return res.json();
}

async function fetchMarine(lat, lon) {
  const url = `${MARINE_BASE}?latitude=${lat}&longitude=${lon}&hourly=wave_height,wave_direction&daily=wave_height_max&timezone=auto`;
  const res = await fetch(url);
  return res.json();
}

function showError(msg) { $('#error-msg').text(msg).removeClass('hidden'); }
function hideError() { $('#error-msg').addClass('hidden'); }
function showLoading() { $('#loading').removeClass('hidden'); $('#main-content').addClass('hidden'); }
function hideLoading() { $('#loading').addClass('hidden'); $('#main-content').removeClass('hidden'); }

function renderCurrentSummary(site) {
  const cur = weatherData.current_weather;
  const wc = weatherCodeToEmoji(cur.weathercode);
  $('#current-icon').text(wc.icon);
  $('#current-temp').text(Math.round(cur.temperature) + '°');
  
  let desc = `${wc.text}<br>Vento: ${Math.round(cur.windspeed)} km/h da ${degToCompassName(cur.winddirection)}`;
  
  if (site.type === 'marine' && marineData) {
    const waveH = metersToCm(marineData.daily.wave_height_max[0]);
    desc += `<br>🌊 Onda max oggi: ${waveH} cm`;
  }
  $('#current-desc').html(desc);
}

function renderTodayHourly(site) {
  const container = $('#hourly-container').empty();
  const hours = weatherData.hourly.time;
  const now = new Date().toISOString().split('T')[0];
  const curHour = new Date().getHours();

  hours.forEach((time, i) => {
    const dateObj = new Date(time);
    if (time.startsWith(now) && dateObj.getHours() >= curHour) {
      const card = $('<div class="hourly-card"></div>');
      const wc = weatherCodeToEmoji(weatherData.hourly.weathercode[i]);
      card.append(`<div class="hourly-time">${dateObj.getHours()}:00</div>`);
      card.append(`<div class="hourly-icon">${wc.icon}</div>`);
      card.append(`<div class="hourly-temp">${Math.round(weatherData.hourly.temperature_2m[i])}°</div>`);
      container.append(card);
    }
  });
}

function renderDaysCalendar(site) {
  const container = $('#days-container').empty();
  weatherData.daily.time.forEach((date, i) => {
    const dateObj = new Date(date);
    const isToday = i === 0;
    const wc = weatherCodeToEmoji(weatherData.daily.weathercode[i]);
    const card = $('<div class="day-card"></div>');
    card.append(`<div class="day-date">${isToday ? 'Oggi' : dateObj.toLocaleDateString('it-IT', {weekday:'short', day:'numeric'})}</div>`);
    card.append(`<div class="day-icon">${wc.icon}</div>`);
    card.append(`<div class="day-temp">${Math.round(weatherData.daily.temperature_2m_max[i])}° / ${Math.round(weatherData.daily.temperature_2m_min[i])}°</div>`);
    container.append(card);
  });
}

async function loadWeather() {
  // Iniziamo mostrando il loading
  showLoading();
  hideError();

  const site = SITES[CITY_KEY];
  
  if (!site) {
    showError(`Città non trovata (Chiave cercata: ${CITY_KEY})`);
    hideLoading(); // Nasconde il loader così si vede l'errore
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
    renderTodayHourly(site);
    renderDaysCalendar(site);
    hideLoading();
  } catch (err) {
    console.error(err);
    showError('Errore nel recupero dei dati meteo');
    hideLoading();
  }
}

// Avvio
$(async function() {
  const ok = await loadSitesData();
  if (ok) loadWeather();
  
  $('#refresh-btn').on('click', loadWeather);
});
