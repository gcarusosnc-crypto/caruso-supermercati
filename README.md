# Caruso Supermercati

Gestionale privato per il monitoraggio degli incassi dei punti vendita e delle casse POSWARE.

## Obiettivi
- Dashboard privata accessibile da computer e smartphone.
- Consultazione per punto vendita, cassa, data e metodo di pagamento.
- Storico disponibile dal 2021, nei limiti dei dati presenti nei database POSWARE.
- Importazione periodica dai PC Windows legacy senza esporre MySQL su Internet.
- Conservazione dei dati originali e riconciliazione con i report ufficiali POSWARE prima di calcolare incassi consolidati.

## Architettura prevista
1. Agente locale in sola lettura su ciascun PC POSWARE.
2. Invio HTTPS autenticato verso un endpoint server-side.
3. Supabase Postgres come archivio centrale.
4. Applicazione web privata per consultazione e reportistica.

## Sicurezza
- Nessuna porta MySQL esposta pubblicamente.
- Credenziali POSWARE e segreti Supabase solo in variabili d'ambiente / secret manager.
- Mai inserire service-role o chiavi segrete nel frontend o nel repository.
- Le tabelle operative sono collocate nello schema interno `app_private`, non esposto alla Data API.
- Gli agenti locali dovranno usare credenziali dedicate con permessi di sola lettura sul database POSWARE.

## Stato iniziale
Schema database predisposto per punti vendita, casse, sessioni di importazione, documenti e righe di pagamento. Le regole contabili di inclusione/esclusione restano da validare confrontando i dati con i report nativi POSWARE.
