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

/* Weather code to emoji */
// ===============================
//   MAPPA COMPLETA CODICI WMO
// ===============================

const WEATHER_CODES = {

  // SERENO / NUVOLOSO
  0: { text: "Sereno", day: "☀️", night: "🌕" },

  1: { text: "Quasi sereno", day: "🌤️", night: "🌙☁️" },
  2: { text: "Parzialmente nuvoloso", day: "⛅", night: "🌙☁️" },
  3: { text: "Coperto", day: "☁️", night: "☁️" },

  // NEBBIA
  45: { text: "Nuvoloso", day: "☁️️", night: "☁️️" },
  48: { text: "Nuvoloso con brina", day: "☁️️❄️", night: "☁️️❄️" },

  // PIOVIGGINE (intensità)
  51: { text: "Pioviggine debole", day: "🌦️", night: "🌧️" },
  53: { text: "Pioviggine moderata", day: "🌦️💧", night: "🌧️💧" },
  55: { text: "Pioviggine intensa", day: "🌧️💧💧", night: "🌧️💧💧" },

  // PIOVIGGINE GELATA
  56: { text: "Pioviggine gelata debole", day: "🌧️❄️", night: "🌧️❄️" },
  57: { text: "Pioviggine gelata intensa", day: "🌧️❄️❄️", night: "🌧️❄️❄️" },

  // PIOGGIA (intensità)
  61: { text: "Pioggia debole", day: "🌦️", night: "🌧️" },
  62: { text: "Pioggia moderata", day: "🌧️💧", night: "🌧️💧" },
  63: { text: "Pioggia forte", day: "🌧️💧💧", night: "🌧️💧💧" },

  // PIOGGIA MOLTO FORTE
  65: { text: "Pioggia molto intensa", day: "🌧️💦", night: "🌧️💦" },

  // PIOGGIA GELATA
  66: { text: "Pioggia gelata debole", day: "🌧️❄️", night: "🌧️❄️" },
  67: { text: "Pioggia gelata intensa", day: "🌧️❄️❄️", night: "🌧️❄️❄️" },

  // NEVE (intensità)
  71: { text: "Neve debole", day: "🌨️", night: "🌨️" },
  72: { text: "Neve moderata", day: "🌨️❄️", night: "🌨️❄️" },
  73: { text: "Neve forte", day: "❄️❄️", night: "❄️❄️" },

  // NEVE MOLTO INTENSA
  75: { text: "Nevicata molto intensa", day: "❄️❄️❄️", night: "❄️❄️❄️" },

  // GRANULI DI GHIACCIO
  77: { text: "Granuli di ghiaccio", day: "🧊", night: "🧊" },

  // ROVESCI DI PIOGGIA (intensità)
  80: { text: "Rovescio debole", day: "🌦️", night: "🌧️" },
  81: { text: "Rovescio moderato", day: "🌧️💧", night: "🌧️💧" },
  82: { text: "Rovescio violento", day: "🌧️💦", night: "🌧️💦" },

  // ROVESCI DI NEVE
  85: { text: "Rovescio di neve debole", day: "🌨️", night: "🌨️" },
  86: { text: "Rovescio di neve forte", day: "❄️❄️", night: "❄️❄️" },

  // TEMPORALI
  95: { text: "Temporale", day: "⛈️", night: "⛈️" },

  // TEMPORALI CON GRANDINE (intensità)
  96: { text: "Temporale con grandine debole", day: "⛈️🧊", night: "⛈️🧊" },
  97: { text: "Temporale con grandine moderato", day: "⛈️🧊❄️", night: "⛈️🧊❄️" },
  98: { text: "Temporale con grandine forte", day: "⛈️❄️❄️", night: "⛈️❄️❄️" },
  99: { text: "Temporale con grandine molto forte", day: "⛈️❄️❄️❄️", night: "⛈️❄️❄️❄️" },
};


// ========================================
//  FUNZIONE PRINCIPALE RICHIESTA DA TE
// ========================================

function weatherCodeToEmoji(code) {
  code = Number(code);

  // Orario attuale (per determinare sole/luna)
  const hour = new Date().getHours();

  // Fascia notte: 00–06, 18–23
  const isNight = (hour >= 0 && hour <= 6) || (hour >= 18 && hour <= 23);

  const info = WEATHER_CODES[code];

  // Se manca il codice
  if (!info) {
    return {
      icon: isNight ? "🌙" : "☁️",
      text: "Condizione sconosciuta"
    };
  }

  return {
    icon: isNight ? info.night : info.day,
    text: info.text
  };
}

/* Degrees to compass name (full name) */
function degToCompassName(deg) {
  if (deg === null || deg === undefined || isNaN(deg)) return '--';
  const d = (Number(deg) + 360) % 360;
  const points = [
    'Nord', 'Nord-NordEst', 'NordEst', 'Est-NordEst',
    'Est', 'Est-SudEst', 'SudEst', 'Sud-SudEst',
    'Sud', 'Sud-SudOvest', 'SudOvest', 'Ovest-SudOvest',
    'Ovest', 'Ovest-NordOvest', 'NordOvest', 'Nord-NordOvest'
  ];
  const idx = Math.floor((d + 11.25) / 22.5) % 16;
  return points[idx];
}

/* Degrees to compass SHORT (only letters) */
function degToCompassShort(deg) {
  if (deg === null || deg === undefined || isNaN(deg)) return '--';
  const d = (Number(deg) + 360) % 360;
  const points = [
    'N', 'NNE', 'NE', 'ENE',
    'E', 'ESE', 'SE', 'SSE',
    'S', 'SSO', 'SO', 'OSO',
    'O', 'ONO', 'NO', 'NNO'
  ];
  const idx = Math.floor((d + 11.25) / 22.5) % 16;
  return points[idx];
}

/* Meters to cm */
function metersToCm(m) {
  if (m === null || m === undefined || isNaN(m)) return '--';
  return Math.round(Number(m) * 100);
}

/* Km/h to knots */
function kmhToKnots(kmh) {
  if (kmh === null || kmh === undefined || isNaN(kmh) || kmh === '--') return '--';
  return Math.round(Number(kmh) * 0.539957);
}

/* Fetch normal weather */
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
  const url = `${FORECAST_BASE}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('API error');
  return res.json();
}

/* Fetch marine weather */
async function fetchMarine(lat, lon) {
  const params = new URLSearchParams({
    latitude: lat,
    longitude: lon,
    hourly: 'wave_height,wave_direction,wind_wave_height,wind_wave_direction',
    daily: 'wave_height_max,wave_direction_dominant',
    forecast_days: 14,
    timezone: 'auto'
  });
  const url = `${MARINE_BASE}?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Marine API error');
  return res.json();
}

/* Show error */
function showError(msg) {
  $('#error-msg').text(msg).removeClass('hidden');
}

/* Hide error */
function hideError() {
  $('#error-msg').addClass('hidden');
}

/* Show loading */
function showLoading() {
  $('#loading').removeClass('hidden');
  $('#main-content').addClass('hidden');
}

/* Hide loading */
function hideLoading() {
  $('#loading').addClass('hidden');
  $('#main-content').removeClass('hidden');
}

/* Get current hour */
function getCurrentHour() {
  return new Date().getHours();
}

/* Get today's date string YYYY-MM-DD */
function getTodayDateString() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

/* Render current summary */
function renderCurrentSummary(site) {
  if (site.type === 'marine') {
    // Per località marine, mostra meteo + condizioni marine
    let mainText = '';
    let subText = '';
    
    // Meteo normale
    if (weatherData.current_weather) {
      const temp = Math.round(weatherData.current_weather.temperature);
      const wc = weatherCodeToEmoji(weatherData.current_weather.weathercode);
      const windSpeed = kmhToKnots(weatherData.current_weather.windspeed);
      const windDir = degToCompassName(weatherData.current_weather.winddirection);
      
      $('#current-icon').text(wc.icon);
      $('#current-temp').text(temp + '°');
      mainText = `${wc.text} • Vento: ${windSpeed} nodi da ${windDir}`;
    }
    
    // Dati marini
    if (marineData && marineData.hourly && marineData.hourly.time && marineData.hourly.wave_height) {
      const now = new Date();
      const currentHourStr = now.toISOString().slice(0, 13) + ':00:00';
      
      let currentIdx = marineData.hourly.time.findIndex(t => t === currentHourStr);
      if (currentIdx === -1) {
        const todayStr = getTodayDateString();
        for (let i = marineData.hourly.time.length - 1; i >= 0; i--) {
          if (marineData.hourly.time[i].startsWith(todayStr)) {
            currentIdx = i;
            break;
          }
        }
      }
      
      if (currentIdx !== -1 && marineData.hourly.wave_height[currentIdx] !== undefined) {
        const waveH = metersToCm(marineData.hourly.wave_height[currentIdx]);
        const waveDir = marineData.hourly.wave_direction && marineData.hourly.wave_direction[currentIdx] !== undefined
          ? degToCompassShort(marineData.hourly.wave_direction[currentIdx]) : '--';
        
        subText = `🌊 Onda: ${waveH} cm da ${waveDir}`;
      }
    }
    
    $('#current-desc').html(mainText + (subText ? '<br>' + subText : ''));
    
  } else {
    // Per località normali
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

/* Render today's hourly from current hour to 24:00 (every 1 hour) */
function renderTodayHourly(site) {
  const container = $('#hourly-container');
  container.empty();
  $('#hourly-title').text('Oggi');
  
  if (!weatherData.hourly || !weatherData.hourly.time) return;
  
  const todayStr = getTodayDateString();
  const currentHour = getCurrentHour();
  const hours = weatherData.hourly.time;
  
  // Filter today's hours from current hour onwards, take every 1 hour
  const todayHours = [];
  for (let i = 0; i < hours.length; i++) {
    if (hours[i].startsWith(todayStr)) {
      const hour = new Date(hours[i]).getHours();
      // Solo orari >= ora attuale
      if (hour >= currentHour) {
        todayHours.push(i);
      }
    }
  }
  
  // Se non ci sono ore future oggi, aggiungi almeno l'ultima ora disponibile
  if (todayHours.length === 0) {
    for (let i = hours.length - 1; i >= 0; i--) {
      if (hours[i].startsWith(todayStr)) {
        todayHours.push(i);
        break;
      }
    }
  }
  
  if (todayHours.length === 0) {
    container.html('<p style="color:var(--muted);padding:20px 0;">Nessun dato orario disponibile</p>');
    return;
  }
  
  todayHours.forEach(idx => {
    const time = new Date(hours[idx]);
    const timeStr = time.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    
    const card = $('<div class="hourly-card"></div>');
    card.append(`<div class="hourly-time">${timeStr}</div>`);
    
    if (site.type === 'marine') {
      // Meteo normale
      const temp = weatherData.hourly.temperature_2m && weatherData.hourly.temperature_2m[idx] !== undefined
        ? Math.round(weatherData.hourly.temperature_2m[idx]) : '--';
      const wc = weatherData.hourly.weathercode && weatherData.hourly.weathercode[idx] !== undefined
        ? weatherCodeToEmoji(weatherData.hourly.weathercode[idx]) : { icon: '☁️', text: '--' };
      const windSpeed = weatherData.hourly.windspeed_10m && weatherData.hourly.windspeed_10m[idx] !== undefined
        ? kmhToKnots(weatherData.hourly.windspeed_10m[idx]) : '--';
      const windDir = weatherData.hourly.winddirection_10m && weatherData.hourly.winddirection_10m[idx] !== undefined
        ? degToCompassName(weatherData.hourly.winddirection_10m[idx]) : '--';
      
      // Dati marini
      let waveH = '--';
      let waveDir = '--';
      if (marineData && marineData.hourly && marineData.hourly.time) {
        const marineIdx = marineData.hourly.time.findIndex(t => t === hours[idx]);
        if (marineIdx !== -1) {
          waveH = marineData.hourly.wave_height && marineData.hourly.wave_height[marineIdx] !== undefined 
            ? metersToCm(marineData.hourly.wave_height[marineIdx]) : '--';
          waveDir = marineData.hourly.wave_direction && marineData.hourly.wave_direction[marineIdx] !== undefined
            ? degToCompassShort(marineData.hourly.wave_direction[marineIdx]) : '--';
        }
      }
      
      card.append(`<div class="hourly-icon">${wc.icon}</div>`);
      card.append(`<div class="hourly-temp">${temp}°</div>`);
      card.append(`<div class="hourly-desc">${wc.text}</div>`);
      card.append(`<div class="hourly-wind">Vento: ${windSpeed} nodi da ${windDir}</div>`);
      card.append(`<div class="hourly-wave">🌊 Onda: ${waveH} cm ${waveDir}</div>`);
    } else {
      const temp = weatherData.hourly.temperature_2m && weatherData.hourly.temperature_2m[idx] !== undefined
        ? Math.round(weatherData.hourly.temperature_2m[idx]) : '--';
      const wc = weatherData.hourly.weathercode && weatherData.hourly.weathercode[idx] !== undefined
        ? weatherCodeToEmoji(weatherData.hourly.weathercode[idx]) : { icon: '☁️', text: '--' };
      const windSpeed = weatherData.hourly.windspeed_10m && weatherData.hourly.windspeed_10m[idx] !== undefined
        ? Math.round(weatherData.hourly.windspeed_10m[idx]) : '--';
      const windDir = weatherData.hourly.winddirection_10m && weatherData.hourly.winddirection_10m[idx] !== undefined
        ? degToCompassName(weatherData.hourly.winddirection_10m[idx]) : '--';
      
      card.append(`<div class="hourly-icon">${wc.icon}</div>`);
      card.append(`<div class="hourly-temp">${temp}°</div>`);
      card.append(`<div class="hourly-desc">${wc.text}</div>`);
      card.append(`<div class="hourly-wind">Vento: ${windSpeed} km/h da ${windDir}</div>`);
    }
    
    container.append(card);
  });
}

/* Render days calendar - only days with data */
function renderDaysCalendar(site) {
  const container = $('#days-container');
  container.empty();
  
  if (!weatherData.daily || !weatherData.daily.time) return;
  
  const times = weatherData.daily.time;
  const todayStr = getTodayDateString();
  
  times.forEach((dateStr, idx) => {
    // Verifica temperatura per tutti
    const hasData = weatherData.daily.temperature_2m_max && 
                    weatherData.daily.temperature_2m_max[idx] !== undefined &&
                    weatherData.daily.temperature_2m_max[idx] !== null;
    if (!hasData) return;
    
    // Per località marine, verifica anche che ci siano dati onde
    if (site.type === 'marine') {
      const hasWaveData = marineData && marineData.daily && 
                          marineData.daily.wave_height_max && 
                          marineData.daily.wave_height_max[idx] !== undefined &&
                          marineData.daily.wave_height_max[idx] !== null;
      if (!hasWaveData) return; // Skip questo giorno se non ha dati onde
    }
    
    const date = new Date(dateStr);
    const dayLabel = date.toLocaleDateString('it-IT', { weekday: 'short', day: 'numeric', month: 'short' });
    const isToday = dateStr === todayStr;
    
    const card = $('<div class="day-card"></div>');
    card.attr('data-idx', idx);
    card.attr('data-date', dateStr);
    card.attr('data-is-today', isToday);
    if (isToday) {
    card.append(`<div class="day-date">Oggi</div>`);
    } else {
    card.append(`<div class="day-date">${dayLabel}</div>`);
    }
    
    const tmax = weatherData.daily.temperature_2m_max && weatherData.daily.temperature_2m_max[idx] !== undefined
      ? Math.round(weatherData.daily.temperature_2m_max[idx]) : '--';
    const tmin = weatherData.daily.temperature_2m_min && weatherData.daily.temperature_2m_min[idx] !== undefined
      ? Math.round(weatherData.daily.temperature_2m_min[idx]) : '--';
    const wc = weatherData.daily.weathercode && weatherData.daily.weathercode[idx] !== undefined
      ? weatherCodeToEmoji(weatherData.daily.weathercode[idx]) : { icon: '☁️', text: '--' };
    
    card.append(`<div class="day-icon">${wc.icon}</div>`);
    card.append(`<div class="day-temp">${tmax}° / ${tmin}°</div>`);
    card.append(`<div class="day-desc">${wc.text}</div>`);
    
    // Per località marine, aggiungi info onda se disponibile
    if (site.type === 'marine' && marineData && marineData.daily) {
      const waveMax = marineData.daily.wave_height_max && marineData.daily.wave_height_max[idx] !== undefined
        ? metersToCm(marineData.daily.wave_height_max[idx]) : null;
      if (waveMax) {
        card.append(`<div class="day-wave">🌊 ${waveMax} cm</div>`);
      }
    }
    
    card.on('click', function() {
      const clickedIsToday = $(this).attr('data-is-today') === 'true';
      selectDay(idx, site, dateStr, clickedIsToday);
    });
    
    container.append(card);
  });
}

/* Select a day and show its hourly in the same container */
function selectDay(idx, site, dateStr, isToday) {
  selectedDayIndex = idx;
  
  // Visual feedback
  $('.day-card').removeClass('selected');
  $(`.day-card[data-idx="${idx}"]`).addClass('selected');
  
  // Update title
  let dayLabel;
  if (isToday) {
    dayLabel = 'Oggi';
  } else {
    const date = new Date(dateStr);
    dayLabel = date.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' });
  }
  $('#hourly-title').text(dayLabel);
  
  // Render hourly for this day in the same container
  renderDayHourly(site, dateStr, isToday);
  
  // Scroll to hourly section
  setTimeout(() => {
    $('#hourly-container')[0].scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, 100);
}

/* Render hourly for selected day (every hour if today, every 3 hours for other days) */
function renderDayHourly(site, dateStr, isToday = false) {
  const container = $('#hourly-container');
  container.empty();
  
  if (!weatherData.hourly || !weatherData.hourly.time) return;
  
  const hours = weatherData.hourly.time;
  const currentHour = isToday ? getCurrentHour() : 0;
  
  // Filter this day's hours
  const dayHours = [];
  for (let i = 0; i < hours.length; i++) {
    if (hours[i].startsWith(dateStr)) {
      const hour = new Date(hours[i]).getHours();
      
      if (isToday) {
        // Se è oggi, mostra OGNI ORA dall'ora attuale in poi
        if (hour >= currentHour) {
          dayHours.push(i);
        }
      } else {
        // Se NON è oggi, mostra ogni 3 ore
        if (hour % 3 === 0) {
          dayHours.push(i);
        }
      }
    }
  }
  
  if (dayHours.length === 0) {
    container.html('<p style="color:var(--muted);padding:20px 0;">Nessun dato orario disponibile</p>');
    return;
  }
  
  dayHours.forEach(idx => {
    const time = new Date(hours[idx]);
    const timeStr = time.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
    
    const card = $('<div class="hourly-card"></div>');
    card.append(`<div class="hourly-time">${timeStr}</div>`);
    
    if (site.type === 'marine') {
      // Meteo normale
      const temp = weatherData.hourly.temperature_2m && weatherData.hourly.temperature_2m[idx] !== undefined
        ? Math.round(weatherData.hourly.temperature_2m[idx]) : '--';
      const wc = weatherData.hourly.weathercode && weatherData.hourly.weathercode[idx] !== undefined
        ? weatherCodeToEmoji(weatherData.hourly.weathercode[idx]) : { icon: '☁️', text: '--' };
      const windSpeed = weatherData.hourly.windspeed_10m && weatherData.hourly.windspeed_10m[idx] !== undefined
        ? kmhToKnots(weatherData.hourly.windspeed_10m[idx]) : '--';
      const windDir = weatherData.hourly.winddirection_10m && weatherData.hourly.winddirection_10m[idx] !== undefined
        ? degToCompassName(weatherData.hourly.winddirection_10m[idx]) : '--';
      
      // Dati marini
      let waveH = '--';
      let waveDir = '--';
      if (marineData && marineData.hourly && marineData.hourly.time) {
        const marineIdx = marineData.hourly.time.findIndex(t => t === hours[idx]);
        if (marineIdx !== -1) {
          waveH = marineData.hourly.wave_height && marineData.hourly.wave_height[marineIdx] !== undefined 
            ? metersToCm(marineData.hourly.wave_height[marineIdx]) : '--';
          waveDir = marineData.hourly.wave_direction && marineData.hourly.wave_direction[marineIdx] !== undefined
            ? degToCompassShort(marineData.hourly.wave_direction[marineIdx]) : '--';
        }
      }
      
      card.append(`<div class="hourly-icon">${wc.icon}</div>`);
      card.append(`<div class="hourly-temp">${temp}°</div>`);
      card.append(`<div class="hourly-desc">${wc.text}</div>`);
      card.append(`<div class="hourly-wind">Vento: ${windSpeed} nodi da ${windDir}</div>`);
      card.append(`<div class="hourly-wave">🌊 Onda: ${waveH} cm ${waveDir}</div>`);
    } else {
      const temp = weatherData.hourly.temperature_2m && weatherData.hourly.temperature_2m[idx] !== undefined
        ? Math.round(weatherData.hourly.temperature_2m[idx]) : '--';
      const wc = weatherData.hourly.weathercode && weatherData.hourly.weathercode[idx] !== undefined
        ? weatherCodeToEmoji(weatherData.hourly.weathercode[idx]) : { icon: '☁️', text: '--' };
      const windSpeed = weatherData.hourly.windspeed_10m && weatherData.hourly.windspeed_10m[idx] !== undefined
        ? Math.round(weatherData.hourly.windspeed_10m[idx]) : '--';
      const windDir = weatherData.hourly.winddirection_10m && weatherData.hourly.winddirection_10m[idx] !== undefined
        ? degToCompassName(weatherData.hourly.winddirection_10m[idx]) : '--';
      
      card.append(`<div class="hourly-icon">${wc.icon}</div>`);
      card.append(`<div class="hourly-temp">${temp}°</div>`);
      card.append(`<div class="hourly-desc">${wc.text}</div>`);
      card.append(`<div class="hourly-wind">Vento: ${windSpeed} km/h da ${windDir}</div>`);
    }
    
    container.append(card);
  });
}

/* Load weather data */
async function loadWeather() {
  const site = SITES[CITY_KEY];
  if (!site) {
    showError('Città non trovata');
    return;
  }
  
  $('#city-name').text(site.name);
  hideError();
  showLoading();
  
  try {
    if (site.type === 'marine') {
      // Fetch both weather and marine data
      [weatherData, marineData] = await Promise.all([
        fetchNormal(site.lat, site.lon),
        fetchMarine(site.lat, site.lon)
      ]);
      
      if (!weatherData || !weatherData.hourly || !weatherData.daily) {
        throw new Error('Dati meteo incompleti');
      }
    } else {
      weatherData = await fetchNormal(site.lat, site.lon);
      marineData = null;
      
      if (!weatherData || !weatherData.hourly || !weatherData.daily) {
        throw new Error('Dati incompleti');
      }
    }
    
    hideLoading();
    renderCurrentSummary(site);
    renderTodayHourly(site);
    renderDaysCalendar(site);
    
  } catch (err) {
    console.error('Error loading weather:', err);
    hideLoading();
    showError('Impossibile caricare le previsioni. Riprova più tardi.');
  }
}

/* Init */
$(async function() {
  // Carica prima i dati delle località
  const sitesLoaded = await loadSitesData();
  if (!sitesLoaded) {
    return; // Ferma l'esecuzione se non riesce a caricare i dati
  }
  
  loadWeather();
  
  $('#refresh-btn').on('click', function() {
    selectedDayIndex = null;
    $('.day-card').removeClass('selected');
    loadWeather();
  });
});