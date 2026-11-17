// Data integration will be added only after POSWARE totals are reconciled.
// Never insert sample figures here: the dashboard must not present test values as real cash receipts.
const today = new Intl.DateTimeFormat('it-IT', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
document.getElementById('today-label').textContent = today.format(new Date());
