# Agente locale POSWARE

## Obiettivo
Servizio leggero installato su PC1 e PC2. Legge POSWARE esclusivamente in sola lettura e invia i dati a Caruso Supermercati tramite HTTPS.

## Regola di selezione verificata
Confrontando il database con i report ufficiali ANALISI TERMINALI del 16 e 17 novembre 2026 su entrambi i PC, la selezione che riproduce esattamente il conteggio e il totale delle vendite ordinarie è:

- `Documento = 'CO'`
- `annullato = 'NO'`
- `num_scontrino <> 0`

I documenti `NC` vanno conservati come tipologia distinta e non sommati alle vendite ordinarie CO. La regola è verificata sulle due giornate campione, non ancora su ogni casistica storica (resi, storni, note credito e documenti anomali).

## Vincoli obbligatori
- Compatibilità da verificare con Windows 7 e MySQL 5.0.
- Nessuna modifica alle tabelle o ai processi POSWARE.
- Nessuna porta MySQL aperta su Internet.
- Credenziale MySQL dedicata con soli permessi SELECT; non usare root.
- Segreti e token fuori dal repository e dai log.
- Coda locale persistente per recuperare i periodi senza connessione.
- Invio idempotente: la stessa vendita non deve essere conteggiata due volte.
- Log con esito, intervallo sincronizzato e numero record; mai password o token.

## Stato
- Endpoint HTTPS `posware-ingest` pubblicato su Supabase.
- Autenticazione agenti basata su token distinti per PC; nel database è conservato soltanto l'hash SHA-256.
- Il test end-to-end non è ancora stato eseguito.
- Non installare ancora l'agente sui PC: prima creare e verificare l'utente MySQL read-only, poi fare un test controllato su un solo giorno e confrontarlo con il report POSWARE.
