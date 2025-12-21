/* installer.js - Gestione installazione città */

// Mostra messaggio
function showMessage(text, type = 'info') {
  const container = $('#message-container');
  const message = $(`<div class="message ${type}">${text}</div>`);
  container.empty().append(message);
  
  // Auto-rimuovi dopo 5 secondi
  setTimeout(() => {
    message.fadeOut(300, function() {
      $(this).remove();
    });
  }, 5000);
}

// Genera chiave univoca dalla città
function generateCityKey(cityName) {
  return cityName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Rimuovi accenti
    .replace(/[^a-z0-9]/g, '') // Solo lettere e numeri
    .substring(0, 20); // Limita lunghezza
}

// Aggiungi città
$('#city-form').on('submit', async function(e) {
  e.preventDefault();
  
  const cityName = $('#city-name').val().trim();
  const isMarine = $('#is-marine').is(':checked');
  const addBtn = $('#add-btn');
  
  if (!cityName) {
    showMessage('Inserisci il nome della città', 'error');
    return;
  }
  
  addBtn.prop('disabled', true).html('<span class="loading-spinner"></span>Ricerca in corso...');
  
  try {
    // Gestione nomi italiani problematici per l'API
    let searchName = cityName;
    if (cityName.toLowerCase().includes('baviera')) {
      searchName = 'Munich'; // Forza la ricerca su Monaco di Baviera
    }

    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchName)}&count=1&language=it&format=json`;
    
    const geocodeRes = await fetch(geocodeUrl);
    const geocodeData = await geocodeRes.json();
    
    if (!geocodeData.results || geocodeData.results.length === 0) {
      showMessage(`Città "${cityName}" non trovata.`, 'error');
      addBtn.prop('disabled', false).text('Aggiungi Città');
      return;
    }
    
    const location = geocodeData.results[0];
    // La chiave deve essere generata dal nome inserito dall'utente per coerenza con l'URL
    const cityKey = generateCityKey(cityName);
    
    const cityData = {
      key: cityKey,
      name: cityName, // Teniamo il nome inserito dall'utente (es. "Monaco di Baviera")
      type: isMarine ? 'marine' : 'normal',
      lat: location.latitude,
      lon: location.longitude
    };
    
    const saveRes = await fetch('save-city.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cityData)
    });
    
    const saveData = await saveRes.json();
    
    if (saveData.success) {
      showMessage(`✓ Città "${cityData.name}" aggiunta!`, 'success');
      addCityToList(cityKey, cityData);
      $('#city-name').val('');
      $('#is-marine').prop('checked', false);
    } else {
      showMessage(`Errore: ${saveData.message}`, 'error');
    }
    
  } catch (error) {
    console.error('Errore:', error);
    showMessage('Errore durante l\'aggiunta.', 'error');
  } finally {
    addBtn.prop('disabled', false).text('Aggiungi Città');
  }
});

function addCityToList(key, cityData) {
  const container = $('#cities-container');
  container.find('p').remove();
  
  const icon = cityData.type === 'marine' ? '🌊' : '🏛️';
  const typeText = cityData.type === 'marine' ? 'Località marina' : 'Località normale';
  const typeClass = cityData.type === 'marine' ? 'marine' : '';
  
  const cityItem = $(`
    <div class="city-item" data-key="${key}">
      <div class="city-item-info">
        <div class="city-item-name">${icon} ${cityData.name}</div>
        <div class="city-item-type ${typeClass}">${typeText} • Lat: ${cityData.lat}, Lon: ${cityData.lon}</div>
      </div>
      <button class="btn-delete" onclick="deleteCity('${key}')">Elimina</button>
    </div>
  `);
  container.append(cityItem);
}

async function deleteCity(cityKey) {
  if (!confirm('Sei sicuro?')) return;
  try {
    const res = await fetch('delete-city.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: cityKey })
    });
    const data = await res.json();
    if (data.success) {
      showMessage('Città eliminata', 'success');
      $(`.city-item[data-key="${cityKey}"]`).fadeOut(300, function() {
        $(this).remove();
        if ($('#cities-container .city-item').length === 0) {
          $('#cities-container').html('<p style="color: var(--muted); text-align: center; padding: 20px;">Nessuna città.</p>');
        }
      });
    }
  } catch (error) {
    showMessage('Errore eliminazione', 'error');
  }
}

$('#finish-btn').on('click', function() {
  if ($('#cities-container .city-item').length === 0) {
    showMessage('Aggiungi almeno una città', 'error');
    return;
  }
  window.location.href = 'index.php';
});
