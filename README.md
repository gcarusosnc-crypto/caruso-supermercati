# Caruso Supermercati

Gestionale privato per il monitoraggio degli incassi dei punti vendita e delle casse POSWARE.

## Priorità di sviluppo

### Fase 1 — Incassi totali in tempo reale
- Dashboard privata accessibile da computer e smartphone.
- Totale vendite del giorno aggiornato frequentemente.
- Totali consultabili per punto vendita e singola cassa.
- Storico giornaliero dal 2021, nei limiti dei dati presenti nei database POSWARE.
- Indicazione dell'ultimo aggiornamento e dello stato di collegamento di ciascun PC.
- Gestione di PC temporaneamente offline e recupero dei dati mancanti.

### Fase 2 — Dettaglio degli incassi
Da integrare successivamente:
- ripartizione per contanti, carte, bancomat, buoni pasto e altri metodi;
- vendite per reparto;
- ulteriori statistiche e confronti.

## Architettura prevista
1. Agente locale in sola lettura su ciascun PC POSWARE.
2. Invio HTTPS autenticato verso un endpoint server-side.
3. Supabase Postgres come archivio centrale.
4. Applicazione web privata per consultazione e reportistica.

## Punti vendita e casse censiti
- PC1, terminale 001: Via Lombardia 21.
- PC1, terminale 002: Via Lombardia 10-12.
- PC1, terminale 004: Via IV Novembre 64.
- PC2, terminale 001: Viale Unità d'Italia 77.
- PC2, terminale 002: Viale Unità d'Italia 77.

## Sicurezza e affidabilità
- Nessuna porta MySQL esposta pubblicamente.
- Credenziali POSWARE e segreti Supabase solo in variabili d'ambiente / secret manager.
- Mai inserire service-role o chiavi segrete nel frontend o nel repository.
- Le tabelle operative sono collocate nello schema interno `app_private`, non esposto alla Data API.
- Gli agenti locali dovranno usare credenziali dedicate con permessi di sola lettura sul database POSWARE.
- I totali mostrati dovranno rispettare le regole POSWARE su scontrini conclusi, annullamenti, resi, storni e note credito. Tali regole vanno verificate prima di dichiarare il totale come incasso netto ufficiale.

## Stato iniziale
Database predisposto per punti vendita, casse, sessioni di importazione, documenti e righe di pagamento. I report POSWARE del 16/11/2026 sono stati acquisiti come riferimento iniziale per la riconciliazione. La prima versione della dashboard si concentrerà sui totali; i dettagli per pagamento e reparto sono previsti nella fase successiva.
