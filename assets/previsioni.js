/* previsioni.js - Gestione completa previsioni */

let SITES = {};
let weatherData = null;
let marineData = null;
let selectedDayIndex = 0;

const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast';
const MARINE_BASE = 'https://marine-api.open-meteo.com/v1/marine';

async function loadSitesData() {
  try {
    const response = await fetch('sites.json');
    if (!response.ok) throw new Error('Errore caricamento sites.json');
    SITES = await response.json();
    return true;
  } catch (error) {
    showError('Errore nella configurazione delle città');
    return false;
  }
}

/* ===============================
   CODICI METEO (45–48 = NUVOLOSO)
   =============================== */

const WEATHER_CODES = {
  0: { text: "Sereno", day: "☀️", night: "🌕" },
  1: { text: "Quasi sereno", day: "🌤️", night: "🌙" },
  2: { text: "Parzialmente nuvoloso", day: "⛅", night: "🌙" },
  3: { text: "Coperto", day: "☁️", night: "☁️" },
  // 45–48: resi come NUVOLOSO (non nebbia)
  45: {
    text: "Nuvoloso",
    day: '<div id="divnuvola"><img src="nuvola.png" /></div>',
    night: '<div id="divnuvola"><img src="nuvola.png" /></div>'
  },
  48: {
    text: "Nuvoloso con brina",
    day: '<div id="divnuvola"><img src="nuvola.png" /> <span id="brina">❄️</span></div>',
    night: '<div id="divnuvola"><img src="nuvola.png" /> <span id="brina">❄️</span></div>'
  },
  51: { text: "Pioviggine debole", day: "🌦️", night: "🌧️" },
  53: { text: "Pioviggine moderata", day: "🌦️💧", night: "🌧️💧" },
  55: { text: "Pioviggine intensa", day: "🌧️💧💧", night: "🌧️💧💧" },

  61: { text: "Pioggia debole", day: "🌦️", night: "🌧️" },
  63: { text: "Pioggia forte", day: "🌧️💧", night: "🌧️💧" },
  65: { text: "Pioggia violenta", day: "🌧️💦", night: "🌧️💦" },

  71: { text: "Neve debole", day: "🌨️", night: "🌨️" },
  73: { text: "Neve forte", day: "❄️❄️", night: "❄️❄️" },
  75: { text: "Neve intensa", day: "❄️❄️❄️", night: "❄️❄️❄️" },

  80: { text: "Rovescio debole", day: "🌦️", night: "🌧️" },
  81: { text: "Rovescio moderato", day: "🌧️💧", night: "🌧️💧" },

  95: { text: "Temporale", day: "⛈️", night: "⛈️" }
};

function weatherCodeToEmoji(code, isNight = false) {
  const info = WEATHER_CODES[Number(code)] || {
    text: "Variabile",
    day: "⛅",
    night: "🌙"
  };

  return {
    icon: isNight ? info.night : info.day,
    text: info.text
  };
}

/* ===============================
   UTILITY
   =============================== */

function degToCompass(deg) {
  const val = Math.floor((deg / 22.5) + 0.5);
  const arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSO", "SO", "OSO", "O", "ONO", "NO", "NNO"];
  return arr[(val % 16)];
}

function metersToCm(m) { return isNaN(m) ? '--' : Math.round(m * 100); }
function kmhToKnots(kmh) { return isNaN(kmh) ? '--' : Math.round(kmh * 0.539957); }

/* ===============================
   FETCH API
   =============================== */

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

/* ===============================
   UI
   =============================== */

function showError(msg) { $('#error-msg').text(msg).removeClass('hidden'); }
function showLoading() { $('#loading').removeClass('hidden'); $('#main-content').addClass('hidden'); }
function hideLoading() { $('#loading').addClass('hidden'); $('#main-content').removeClass('hidden'); }

function renderCurrentSummary(site) {
  const cur = weatherData.current_weather;
  const wc = weatherCodeToEmoji(cur.weathercode);

  // ⚠️ QUI HTML, non text
  $('#current-icon').html(wc.icon);
  $('#current-temp').text(Math.round(cur.temperature) + '°');

  let desc = `${wc.text}<br>Vento: ${Math.round(cur.windspeed)} km/h da ${degToCompass(cur.winddirection)}`;

  if (site.type === 'marine' && marineData) {
    desc += `<br>🌊 Onda oggi: ${metersToCm(marineData.daily.wave_height_max[0])} cm`;
  }

  $('#current-desc').html(desc);
}

function renderDaysCalendar(site) {
  const container = $('#days-container').empty();
  const today = new Date().toISOString().split('T')[0];

  weatherData.daily.time.forEach((dateStr, i) => {
    const dateObj = new Date(dateStr);
    const wc = weatherCodeToEmoji(weatherData.daily.weathercode[i]);

    const card = $('<div class="day-card"></div>').toggleClass('selected', i === selectedDayIndex);

    card.append(`<div class="day-date">${dateStr === today ? 'Oggi' : dateObj.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' })}</div>`);
    card.append(`<div class="day-icon">${wc.icon}</div>`);
    card.append(`<div class="hourly-desc">${wc.text}</div>`);
    card.append(`<div class="day-temp">${Math.round(weatherData.daily.temperature_2m_max[i])}° / ${Math.round(weatherData.daily.temperature_2m_min[i])}°</div>`);

    card.on('click', function () {
      selectedDayIndex = i;
      $('.day-card').removeClass('selected');
      $(this).addClass('selected');
      $('#hourly-title').text(dateStr === today ? 'Oggi - Orario' : dateObj.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }));
      renderDayHourly(site, dateStr, dateStr === today);
    });

    container.append(card);
  });
}

function renderDayHourly(site, dateStr, isToday) {
  const container = $('#hourly-container').empty();
  const curHour = new Date().getHours();

  weatherData.hourly.time.forEach((time, i) => {
    if (time.startsWith(dateStr)) {
      const h = new Date(time).getHours();
      if (isToday ? h >= curHour : h % 3 === 0) {
        const isNight = (h <= 6 || h >= 18);
        const wc = weatherCodeToEmoji(weatherData.hourly.weathercode[i], isNight);

        const card = $('<div class="hourly-card"></div>');
        card.append(`<div class="hourly-time">${h.toString().padStart(2, '0')}:00</div>`);
        card.append(`<div class="hourly-icon">${wc.icon}</div>`);
        card.append(`<div class="hourly-temp">${Math.round(weatherData.hourly.temperature_2m[i])}°</div>`);
        card.append(`<div class="hourly-desc">${wc.text}</div>`);

        if (site.type === 'marine' && marineData) {
          card.append(`<div class="hourly-wind">${kmhToKnots(weatherData.hourly.windspeed_10m[i])} nodi ${degToCompass(weatherData.hourly.winddirection_10m[i])}</div>`);
          card.append(`<div class="hourly-wave">🌊 ${metersToCm(marineData.hourly.wave_height[i])} cm</div>`);
        } else {
          card.append(`<div class="hourly-wind">${Math.round(weatherData.hourly.windspeed_10m[i])} km/h ${degToCompass(weatherData.hourly.winddirection_10m[i])}</div>`);
        }

        container.append(card);
      }
    }
  });
}

async function loadWeather() {
  showLoading();
  const site = SITES[CITY_KEY];
  if (!site) { showError('Città non trovata'); hideLoading(); return; }

  $('#city-name').text(site.name);

  try {
    weatherData = await fetchNormal(site.lat, site.lon);
    if (site.type === 'marine') marineData = await fetchMarine(site.lat, site.lon);
    renderCurrentSummary(site);
    renderDaysCalendar(site);
    renderDayHourly(site, weatherData.daily.time[selectedDayIndex], selectedDayIndex === 0);
    hideLoading();
  } catch {
    showError('Errore API');
    hideLoading();
  }
}

$(async function () {
  if (await loadSitesData()) loadWeather();
  $('#refresh-btn').on('click', loadWeather);
});
