/* previsioni.js - Logic per pagina previsioni con meteo + marine per città marine */

// Carica i dati delle località dal file JSON
let SITES = {};

// Funzione per caricare i dati delle città
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

const FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast';
const MARINE_BASE = 'https://marine-api.open-meteo.com/v1/marine';

let weatherData = null;
let marineData = null;
let selectedDayIndex = null;

const WEATHER_CODES = {
  0: { text: "Sereno", day: "☀️", night: "🌕" },
  1: { text: "Quasi sereno", day: "🌤️", night: "🌙☁️" },
  2: { text: "Parzialmente nuvoloso", day: "⛅", night: "🌙☁️" },
  3: { text: "Coperto", day: "☁️", night: "☁️" },
  45: { text: "Nuvoloso", day: "☁️️", night: "☁️️" },
  48: { text: "Nuvoloso con brina", day: "☁️️❄️", night: "☁️️❄️" },
  51: { text: "Pioviggine debole", day: "🌦️", night: "🌧️" },
  53: { text: "Pioviggine moderata", day: "🌦️💧", night: "🌧️💧" },
  55: { text: "Pioviggine intensa", day: "🌧️💧💧", night: "🌧️💧💧" },
  56: { text: "Pioviggine gelata debole", day: "🌧️❄️", night: "🌧️❄️" },
  57: { text: "Pioviggine gelata intensa", day: "🌧️❄️❄️", night: "🌧️❄️❄️" },
  61: { text: "Pioggia debole", day: "🌦️", night: "🌧️" },
  62: { text: "Pioggia moderata", day: "🌧️💧", night: "🌧️💧" },
  63: { text: "Pioggia forte", day: "🌧️💧💧", night: "🌧️💧💧" },
  65: { text: "Pioggia molto intensa", day: "🌧️💦", night: "🌧️💦" },
  66: { text: "Pioggia gelata debole", day: "🌧️❄️", night: "🌧️❄️" },
  67: { text: "Pioggia gelata intensa", day: "🌧️❄️❄️", night: "🌧️❄️❄️" },
  71: { text: "Neve debole", day: "🌨️", night: "🌨️" },
  72: { text: "Neve moderata", day: "🌨️❄️", night: "🌨️❄️" },
  73: { text: "Neve forte", day: "❄️❄️", night: "❄️❄️" },
  75: { text: "Nevicata molto intensa", day: "❄️❄️❄️", night: "❄️❄️❄️" },
  77: { text: "Granuli di ghiaccio", day: "🧊", night: "🧊" },
  80: { text: "Rovescio debole", day: "🌦️", night: "🌧️" },
  81: { text: "Rovescio moderato", day: "🌧️💧", night: "🌧️💧" },
  82: { text: "Rovescio violento", day: "🌧️💦", night: "🌧️💦" },
  85: { text: "Rovescio di neve debole", day: "🌨️", night: "🌨️" },
  86: { text: "Rovescio di neve forte", day: "❄️❄️", night: "❄️❄️" },
  95: { text: "Temporale", day: "⛈️", night: "⛈️" },
  96: { text: "Temporale con grandine debole", day: "⛈️🧊", night: "⛈️🧊" },
  97: { text: "Temporale con grandine moderato", day: "⛈️🧊❄️", night: "⛈️🧊❄️" },
  98: { text: "Temporale con grandine forte", day: "⛈️❄️❄️", night: "⛈️❄️❄️" },
  99: { text: "Temporale con grandine molto forte", day: "⛈️❄️❄️❄️", night: "⛈️❄️❄️❄️" },
};

function weatherCodeToEmoji(code) {
  code = Number(code);
  const hour = new Date().getHours();
  const isNight = (hour >= 0 && hour <= 6) || (hour >= 18 && hour <= 23);
  const info = WEATHER_CODES[code];
  if (!info) return { icon: isNight ? "🌙" : "☁️", text: "Condizione sconosciuta" };
  return { icon: isNight ? info.night : info.day, text: info.text };
}

function degToCompassName(deg) {
  if (deg === null || isNaN(deg)) return '--';
  const d = (Number(deg) + 360) % 360;
  const points = ['Nord', 'Nord-NordEst', 'NordEst', 'Est-NordEst', 'Est', 'Est-SudEst', 'SudEst', 'Sud-SudEst', 'Sud', 'Sud-SudOvest', 'SudOvest', 'Ovest-SudOvest', 'Ovest', 'Ovest-NordOvest', 'NordOvest', 'Nord-NordOvest'];
  const idx = Math.floor((d + 11.25) / 22.5) % 16;
  return points[idx];
}

function degToCompassShort(deg) {
  if (deg === null || isNaN(deg)) return '--';
  const d = (Number(deg) + 360) % 360;
  const points = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
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

async function fetchNormal(lat, lon) {
  const params = new URLSearchParams({ latitude: lat, longitude: lon, hourly: 'temperature_2m,weathercode,windspeed_10m,winddirection_10m', daily: 'temperature_2m_max,temperature_2m_min,weathercode', current_weather: 'true', forecast_days: 14, timezone: 'auto' });
  const res = await fetch(`${FORECAST_BASE}?${params.toString()}`);
  if (!res.ok) throw new Error('API error');
  return res.json();
}

async function fetchMarine(lat, lon) {
  const params = new URLSearchParams({ latitude: lat, longitude: lon, hourly: 'wave_height,wave_direction,wind_wave_height,wind_wave_direction', daily: 'wave_height_max,wave_direction_dominant', forecast_days: 14, timezone: 'auto' });
  const res = await fetch(`${MARINE_BASE}?${params.toString()}`);
  if (!res.ok) throw new Error('Marine API error');
  return res.json();
}

function showError(msg) { $('#error-msg').text(msg).removeClass('hidden'); }
function hideError() { $('#error-msg').addClass('hidden'); }
function showLoading() { $('#loading').removeClass('hidden'); $('#main-content').addClass('hidden'); }
function hideLoading() { $('#loading').addClass('hidden'); $('#main-content').removeClass('hidden'); }
function getCurrentHour() { return new Date().getHours(); }
function getTodayDateString() { return new Date().toISOString().split('T')[0]; }

function renderCurrentSummary(site) {
  if (site.type === 'marine') {
    let mainText = '', subText = '';
    if (weatherData.current_weather) {
      const temp = Math.round(weatherData.current_weather.temperature);
      const wc = weatherCodeToEmoji(weatherData.current_weather.weathercode);
      const windSpeed = kmhToKnots(weatherData.current_weather.windspeed);
      const windDir = degToCompassName(weatherData.current_weather.winddirection);
      $('#current-icon').text(wc.icon);
      $('#current-temp').text(temp + '°');
      mainText = `${wc.text} • Vento: ${windSpeed} nodi da ${windDir}`;
    }
    if (marineData && marineData.hourly) {
      const now = new Date();
      const currentHourStr = now.toISOString().slice(0, 13) + ':00:00';
      let currentIdx = marineData.hourly.time.findIndex(t => t === currentHourStr);
      if (currentIdx !== -1 && marineData.hourly.wave_height[currentIdx] !== undefined) {
        const waveH = metersToCm(marineData.hourly.wave_height[currentIdx]);
        const waveDir = degToCompassShort(marineData.hourly.wave_direction[currentIdx]);
        subText = `🌊 Onda: ${waveH} cm da ${waveDir}`;
      }
    }
    $('#current-desc').html(mainText + (subText ? '<br>' + subText : ''));
  } else {
    if (weatherData.current_weather) {
      const temp = Math.round(weatherData.current_weather.temperature);
      const wc = weatherCodeToEmoji(weatherData.current_weather.weathercode);
      const windSpeed = Math.round(weatherData.current_weather.windspeed);
      const windDir = degToCompassName(weatherData.current_weather.winddirection);
      $('#current-icon').text(wc.icon);
      $('#current-temp').text(temp + '°');
      $('#current-desc').html(`${wc.text}<br>Vento: ${windSpeed} km/h da ${windDir}`);
    }
  }
}

function renderTodayHourly(site) {
  const container = $('#hourly-container');
  container.empty();
  $('#hourly-title').text('Oggi');
  if (!weatherData.hourly) return;
  const todayStr = getTodayDateString();
  const currentHour = getCurrentHour();
  const hours = weatherData.hourly.time;
  const todayHours = hours.map((h, i) => h.startsWith(todayStr) && new Date(h).getHours() >= currentHour ? i : -1).filter(i => i !== -1);
  
  todayHours.forEach(idx => {
    const time = new Date(hours[idx]);
    const timeStr = time.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    const card = $('<div class="hourly-card"></div>');
    card.append(`<div class="hourly-time">${timeStr}</div>`);
    const temp = Math.round(weatherData.hourly.temperature_2m[idx]);
    const wc = weatherCodeToEmoji(weatherData.hourly.weathercode[idx]);
    card.append(`<div class="hourly-icon">${wc.icon}</div><div class="hourly-temp">${temp}°</div><div class="hourly-desc">${wc.text}</div>`);
    
    if (site.type === 'marine') {
      const windSpeed = kmhToKnots(weatherData.hourly.windspeed_10m[idx]);
      const marineIdx = marineData.hourly.time.findIndex(t => t === hours[idx]);
      const waveH = marineIdx !== -1 ? metersToCm(marineData.hourly.wave_height[marineIdx]) : '--';
      card.append(`<div class="hourly-wind">Vento: ${windSpeed} nodi</div><div class="hourly-wave">🌊 Onda: ${waveH} cm</div>`);
    } else {
      const windSpeed = Math.round(weatherData.hourly.windspeed_10m[idx]);
      card.append(`<div class="hourly-wind">Vento: ${windSpeed} km/h</div>`);
    }
    container.append(card);
  });
}

function renderDaysCalendar(site) {
  const container = $('#days-container');
  container.empty();
  if (!weatherData.daily) return;
  weatherData.daily.time.forEach((dateStr, idx) => {
    const date = new Date(dateStr);
    const isToday = dateStr === getTodayDateString();
    const card = $('<div class="day-card"></div>').attr('data-idx', idx).attr('data-date', dateStr).attr('data-is-today', isToday);
    card.append(`<div class="day-date">${isToday ? 'Oggi' : date.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric' })}</div>`);
    const wc = weatherCodeToEmoji(weatherData.daily.weathercode[idx]);
    const tmax = Math.round(weatherData.daily.temperature_2m_max[idx]);
    const tmin = Math.round(weatherData.daily.temperature_2m_min[idx]);
    card.append(`<div class="day-icon">${wc.icon}</div><div class="day-temp">${tmax}° / ${tmin}°</div>`);
    card.on('click', () => selectDay(idx, site, dateStr, isToday));
    container.append(card);
  });
}

function selectDay(idx, site, dateStr, isToday) {
  $('.day-card').removeClass('selected');
  $(`.day-card[data-idx="${idx}"]`).addClass('selected');
  $('#hourly-title').text(isToday ? 'Oggi' : new Date(dateStr).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }));
  renderDayHourly(site, dateStr, isToday);
  setTimeout(() => { $('#hourly-container')[0].scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 100);
}

function renderDayHourly(site, dateStr, isToday) {
  const container = $('#hourly-container');
  container.empty();
  const hours = weatherData.hourly.time;
  const currentHour = isToday ? getCurrentHour() : 0;
  hours.forEach((h, idx) => {
    const hour = new Date(h).getHours();
    if (h.startsWith(dateStr) && (isToday ? hour >= currentHour : hour % 3 === 0)) {
      const timeStr = new Date(h).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      const card = $('<div class="hourly-card"></div>').append(`<div class="hourly-time">${timeStr}</div>`);
      const wc = weatherCodeToEmoji(weatherData.hourly.weathercode[idx]);
      card.append(`<div class="hourly-icon">${wc.icon}</div><div class="hourly-temp">${Math.round(weatherData.hourly.temperature_2m[idx])}°</div>`);
      container.append(card);
    }
  });
}

async function loadWeather() {
  const site = SITES[CITY_KEY];
  if (!site) { showError('Città non trovata'); return; }
  $('#city-name').text(site.name);
  hideError(); showLoading();
  try {
    if (site.type === 'marine') {
      [weatherData, marineData] = await Promise.all([fetchNormal(site.lat, site.lon), fetchMarine(site.lat, site.lon)]);
    } else {
      weatherData = await fetchNormal(site.lat, site.lon);
      marineData = null;
    }
    hideLoading();
    renderCurrentSummary(site);
    renderTodayHourly(site);
    renderDaysCalendar(site);
  } catch (err) {
    hideLoading(); showError('Errore caricamento dati');
  }
}

$(async function() {
  if (await loadSitesData()) loadWeather();
  $('#refresh-btn').on('click', loadWeather);
});
