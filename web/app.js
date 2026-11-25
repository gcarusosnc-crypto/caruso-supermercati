// CarusoAgent dashboard shell.
// No sample revenue is shown. Live figures are loaded only through the authenticated dashboard API.
const dateFormatter = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
const todayLabel = document.getElementById('today-label');
if (todayLabel) todayLabel.textContent = dateFormatter.format(new Date());

const euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR' });
const number = new Intl.NumberFormat('it-IT');

function setConnectionState(label, detail, live = false) {
  const liveLabel = document.getElementById('live-label');
  const status = document.getElementById('connection-status');
  const detailNode = document.getElementById('connection-detail');
  const dot = document.querySelector('.live-dot');
  if (liveLabel) liveLabel.textContent = live ? 'LIVE' : 'IN ATTESA';
  if (status) status.textContent = label;
  if (detailNode) detailNode.textContent = detail;
  if (dot) {
    dot.style.background = live ? '#69d7b0' : '#d8a85b';
    dot.style.boxShadow = live ? '0 0 9px #69d7b0' : '0 0 9px #d8a85b';
  }
}

// Intentionally no direct query to app_private from the browser.
// Next step: add a JWT-protected Edge Function and a restricted Supabase Auth allowlist.
setConnectionState(
  'Accesso riservato da attivare',
  'I dati sono già archiviati in Supabase. Stiamo predisponendo il canale autenticato per mostrarli senza esporre le tabelle interne.'
);
