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
  
  // Disabilita il pulsante e mostra loading
  addBtn.prop('disabled', true).html('<span class="loading-spinner"></span>Ricerca in corso...');
  
  try {
    // Cerca coordinate tramite Geocoding API di Open-Meteo
    // Ho aggiunto "Munich" come fallback se l'utente scrive "Monaco di Baviera" per aiutare l'API
    let searchQuery = cityName;
    if (cityName.toLowerCase().includes('baviera')) {
      searchQuery = 'Munich';
    }

    const geocodeUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(searchQuery)}&count=1&language=it&format=json`;
    
    const geocodeRes = await fetch(geocodeUrl);
    const geocodeData = await geocodeRes.json();
    
    if (!geocodeData.results || geocodeData.results.length === 0) {
      showMessage(`Città "${cityName}" non trovata. Verifica il nome.`, 'error');
      addBtn.prop('disabled', false).text('Aggiungi Città');
      return;
    }
    
    const location = geocodeData.results[0];
    // Usiamo il nome inserito dall'utente per la chiave, ma i dati dall'API
    const cityKey = generateCityKey(cityName);
    
    // Prepara i dati da salvare
    const cityData = {
      key: cityKey,
      name: location.name,
      type: isMarine ? 'marine' : 'normal',
      lat: location.latitude,
      lon: location.longitude
    };
    
    // Invia al server per salvare
    const saveRes = await fetch('save-city.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(cityData)
    });
    
    const saveData = await saveRes.json();
    
    if (saveData.success) {
      showMessage(`✓ Città "${cityData.name}" aggiunta con successo!`, 'success');
      
      // Aggiungi alla lista visivamente
      addCityToList(cityKey, cityData);
      
      // Reset form
      $('#city-name').val('');
      $('#is-marine').prop('checked', false);
    } else {
      showMessage(`Errore: ${saveData.message}`, 'error');
    }
    
  } catch (error) {
    console.error('Errore:', error);
    showMessage('Errore durante l\'aggiunta della città. Riprova.', 'error');
  } finally {
    addBtn.prop('disabled', false).text('Aggiungi Città');
  }
});

// Aggiungi città alla lista visivamente
function addCityToList(key, cityData) {
  const container = $('#cities-container');
  
  // Rimuovi messaggio "nessuna città" se presente
  container.find('p').remove();
  
  const icon = cityData.type === 'marine' ? '🌊' : '🏛️';
  const typeText = cityData.type === 'marine' ? 'Località marina' : 'Località normale';
  const typeClass = cityData.type === 'marine' ? 'marine' : '';
  
  const cityItem = $(`
    <div class="city-item" data-key="${key}">
      <div class="city-item-info">
        <div class="city-item-name">
          ${icon} ${cityData.name}
        </div>
        <div class="city-item-type ${typeClass}">
          ${typeText} • Lat: ${cityData.lat}, Lon: ${cityData.lon}
        </div>
      </div>
      <button class="btn-delete" onclick="deleteCity('${key}')">
        Elimina
      </button>
    </div>
  `);
  
  container.append(cityItem);
}

// Elimina città
async function deleteCity(cityKey) {
  if (!confirm('Sei sicuro di voler eliminare questa città?')) {
    return;
  }
  
  try {
    const res = await fetch('delete-city.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ key: cityKey })
    });
    
    const data = await res.json();
    
    if (data.success) {
      showMessage('Città eliminata con successo', 'success');
      $(`.city-item[data-key="${cityKey}"]`).fadeOut(300, function() {
        $(this).remove();
        
        // Se non ci sono più città, mostra messaggio
        if ($('#cities-container .city-item').length === 0) {
          $('#cities-container').html('<p style="color: var(--muted); text-align: center; padding: 20px;">Nessuna città configurata. Aggiungi la prima città sopra.</p>');
        }
      });
    } else {
      showMessage(`Errore: ${data.message}`, 'error');
    }
    
  } catch (error) {
    console.error('Errore:', error);
    showMessage('Errore durante l\'eliminazione. Riprova.', 'error');
  }
}

// Pulsante "Ho finito"
$('#finish-btn').on('click', function() {
  const citiesCount = $('#cities-container .city-item').length;
  
  if (citiesCount === 0) {
    showMessage('Aggiungi almeno una città prima di continuare', 'error');
    return;
  }
  
  window.location.href = 'index.php';
});
