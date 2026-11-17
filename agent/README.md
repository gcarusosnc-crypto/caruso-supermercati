# Agente locale POSWARE

## Obiettivo
Servizio leggero installato su PC1 e PC2. Legge POSWARE esclusivamente in sola lettura e invia i dati a Caruso Supermercati tramite HTTPS.

## Vincoli obbligatori
- Compatibilità da verificare con Windows 7 e MySQL 5.0.
- Nessuna modifica alle tabelle o ai processi POSWARE.
- Nessuna porta MySQL aperta su Internet.
- Credenziale MySQL dedicata con soli permessi SELECT; non usare root.
- Segreti e token fuori dal repository e dai log.
- Coda locale persistente per recuperare i periodi senza connessione.
- Invio idempotente: la stessa vendita non deve essere conteggiata due volte.
- Log con esito, intervallo sincronizzato e numero record; mai password o dati di pagamento sensibili.

## Stato
Specifiche iniziali. Non installare ancora: prima va definita e testata la query POSWARE per il totale giornaliero e verificata contro il report ANALISI TERMINALI.
