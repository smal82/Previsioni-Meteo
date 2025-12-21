/* previsioni.js - Logic per pagina previsioni con meteo + marine per città marine */

let SITES = {};
let weatherData = null;
let marineData = null;
let selectedDayIndex = null;

const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast';
const MARINE_BASE = 'https://marine-api.open-meteo.com/v1/marine';

// Funzione per caricare i dati delle città dal file JSON
async function loadSitesData() {
  try {
    const response = await fetch('sites.json');
    if (!response.ok) {
      throw new Error('Impossibile caricare sites.json');
    }
    SITES = await response.json();
    return true;
  } catch (error) {
    console.error('Errore nel caricamento di sites.json:', error);
    showError('Errore nel caricamento della configurazione');
    return false;
  }
}

// Mappa codici WMO
const WEATHER_CODES = {
  0: { text: "Sereno", day: "☀️", night: "🌕" },
  1: { text: "Quasi sereno", day: "🌤️", night: "🌙☁️" },
  2: { text: "Parzialmente nuvoloso", day: "⛅", night: "🌙☁️" },
  3: { text: "Coperto", day: "☁️", night: "☁️" },
  45: { text: "Nebbia", day: "🌫️", night: "🌫️" },
  48: { text: "Nebbia con brina", day: "🌫️❄️", night: "🌫️❄️" },
  51: { text: "Pioviggine debole", day: "🌦️", night: "🌧️" },
  53: { text: "Pioviggine moderata", day: "🌦️💧", night: "🌧️💧" },
  55: { text: "Pioviggine intensa", day: "🌧️💧💧", night: "🌧️💧💧" },
  61: { text: "Pioggia debole", day: "🌦️", night: "🌧️" },
  62: { text: "Pioggia moderata", day: "🌧️💧", night: "🌧️💧" },
  63: { text: "Pioggia forte", day: "🌧️💧💧", night: "🌧️💧💧" },
  71: { text: "Neve debole", day: "🌨️", night: "🌨️" },
  73: { text: "Neve forte", day: "❄️❄️", night: "❄️❄️" },
  80: { text: "Rovescio debole", day: "🌦️", night: "🌧️" },
  81: { text: "Rovescio moderato", day: "🌧️💧", night: "🌧️💧" },
  95: { text: "Temporale", day: "⛈️", night: "⛈️" }
};

function weatherCodeToEmoji(code) {
  code = Number(code);
  const hour = new Date().getHours();
  const isNight = (hour >= 0 && hour <= 6) || (hour >= 18 && hour <= 23);
  const info = WEATHER_CODES[code] || { text: "Variabile", day: "⛅", night: "🌙" };
  return { icon: isNight ? info.night : info.day, text: info.text };
}

function degToCompassName(deg) {
  if (deg === null || isNaN(deg)) return '--';
  const d = (Number(deg) + 360) % 360;
  const points = ['Nord', 'Nord-NordEst', 'NordEst', 'Est-NordEst', 'Est', 'Est-SudEst', 'SudEst', 'Sud-SudEst', 'Sud', 'Sud-SudOvest', 'SudOvest', 'Ovest-SudOvest', 'Ovest', 'Ovest-NordOvest', 'NordOvest', 'Nord-NordOvest'];
  const idx = Math.floor((d + 11.25) / 22.5) % 16;
  return points[idx];
}

function metersToCm(m) {
  if (m === null || isNaN(m)) return '--';
  return Math.round(Number(m) * 100);
}

function kmhToKnots(kmh) {
  if (kmh === null || isNaN(kmh) || kmh === '--') return '--';
  return Math.round(Number(kmh) * 0.539957);
}

// Fetch API
async function fetchNormal(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: 'temperature_2m,weathercode,windspeed_10m,winddirection_10m',
    daily: 'temperature_2m_max,temperature_2m_min,weathercode',
    current_weather: 'true',
    forecast_days: 14,
    timezone: 'auto'
  });
  const res = await fetch(`${FORECAST_BASE}?${params.toString()}`);
  if (!res.ok) throw new Error('API error');
  return res.json();
}

async function fetchMarine(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: 'wave_height,wave_direction',
    daily: 'wave_height_max',
    forecast_days: 14,
    timezone: 'auto'
  });
  const res = await fetch(`${MARINE_BASE}?${params.toString()}`);
  if (!res.ok) throw new Error('Marine API error');
  return res.json();
}

// Utility UI
function showError(msg) { $('#error-msg').text(msg).removeClass('hidden'); }
function hideError() { $('#error-msg').addClass('hidden'); }
function showLoading() { $('#loading').removeClass('hidden'); $('#main-content').addClass('hidden'); }
function hideLoading() { $('#loading').addClass('hidden'); $('#main-content').removeClass('hidden'); }
function getTodayDateString() { return new Date().toISOString().split('T')[0]; }

// RENDER: Riepilogo attuale
function renderCurrentSummary(site) {
  if (weatherData.current_weather) {
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
}

// RENDER: Calendario Prossimi Giorni
function renderDaysCalendar(site) {
  const container = $('#days-container').empty();
  if (!weatherData.daily) return;

  const todayStr = getTodayDateString();

  weatherData.daily.time.forEach((dateStr, idx) => {
    const date = new Date(dateStr);
    const isToday = dateStr === todayStr;
    const wc = weatherCodeToEmoji(weatherData.daily.weathercode[idx]);
    const tmax = Math.round(weatherData.daily.temperature_2m_max[idx]);
    const tmin = Math.round(weatherData.daily.temperature_2m_min[idx]);

    const card = $('<div class="day-card"></div>')
      .attr('data-idx', idx)
      .attr('data-date', dateStr)
      .attr('data-is-today', isToday);

    if (isToday) card.addClass('selected'); // Seleziona "Oggi" all'avvio

    card.append(`<div class="day-date">${isToday ? 'Oggi' : date.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' })}</div>`);
    card.append(`<div class="day-icon">${wc.icon}</div>`);
    card.append(`<div class="day-temp">${tmax}° / ${tmin}°</div>`);
    
    // Al click, seleziona il giorno
    card.on('click', function() {
      selectDay(idx, site, dateStr, isToday);
    });

    container.append(card);
  });
}

// FUNZIONE: Selezione del giorno
function selectDay(idx, site, dateStr, isToday) {
  selectedDayIndex = idx;

  // Feedback grafico
  $('.day-card').removeClass('selected');
  $(`.day-card[data-idx="${idx}"]`).addClass('selected');

  // Aggiorna titolo sezione oraria
  let dayLabel;
  if (isToday) {
    dayLabel = 'Oggi - Orario';
  } else {
    const date = new Date(dateStr);
    dayLabel = date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  $('#hourly-title').text(dayLabel);

  // Renderizza le ore per quel giorno specifico
  renderDayHourly(site, dateStr, isToday);

  // Scroll automatico alla sezione meteo oraria
  $('html, body').animate({
    scrollTop: $("#meteo").offset().top - 20
  }, 500);
}

// RENDER: Orario filtrato per giorno
function renderDayHourly(site, dateStr, isToday = false) {
  const container = $('#hourly-container').empty();
  if (!weatherData.hourly) return;

  const hours = weatherData.hourly.time;
  const currentHour = isToday ? new Date().getHours() : 0;

  hours.forEach((time, idx) => {
    if (time.startsWith(dateStr)) {
      const dateObj = new Date(time);
      const hour = dateObj.getHours();

      // Logica: Se è oggi mostra tutto, se è futuro mostra ogni 3 ore
      if (isToday ? (hour >= currentHour) : (hour % 3 === 0)) {
        const card = $('<div class="hourly-card"></div>');
        const wc = weatherCodeToEmoji(weatherData.hourly.weathercode[idx]);
        const temp = Math.round(weatherData.hourly.temperature_2m[idx]);
        const wind = Math.round(weatherData.hourly.windspeed_10m[idx]);

        card.append(`<div class="hourly-time">${hour}:00</div>`);
        card.append(`<div class="hourly-icon">${wc.icon}</div>`);
        card.append(`<div class="hourly-temp">${temp}°</div>`);
        
        if (site.type === 'marine') {
          // Trova l'indice corrispondente nei dati marini
          const mIdx = marineData ? marineData.hourly.time.findIndex(t => t === time) : -1;
          const wave = mIdx !== -1 ? metersToCm(marineData.hourly.wave_height[mIdx]) : '--';
          card.append(`<div class="hourly-wind">${kmhToKnots(wind)} kn</div>`);
          card.append(`<div class="hourly-wave">🌊 ${wave}</div>`);
        } else {
          card.append(`<div class="hourly-wind">${wind} km/h</div>`);
        }

        container.append(card);
      }
    }
  });

  if (container.children().length === 0) {
    container.append('<p class="no-data">Nessun dato disponibile per questo orario.</p>');
  }
}

// Caricamento principale
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
    renderDaysCalendar(site); // Questo ora include i click handler
    renderDayHourly(site, getTodayDateString(), true); // Mostra "Oggi" di default
    
    hideLoading();
  } catch (err) {
    console.error(err);
    showError('Errore durante il caricamento dei dati.');
    hideLoading();
  }
}

// Avvio al caricamento del DOM
$(async function() {
  const ready = await loadSitesData();
  if (ready) {
    loadWeather();
  }

  $('#refresh-btn').on('click', function() {
    loadWeather();
  });
});
