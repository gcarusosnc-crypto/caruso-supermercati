-- Caruso Supermercati — diagnostica POSWARE in sola lettura
-- Eseguire separatamente su PC1 e PC2, nel database posware.
-- NON modifica dati: contiene esclusivamente SELECT.
-- Sostituire la data solo se si sta verificando un'altra giornata.

USE posware;

-- 1) Riepilogo grezzo del giorno: non è ancora l'incasso ufficiale.
SELECT
  COUNT(*) AS righe_documento,
  SUM(COALESCE(TotLordo, 0)) AS somma_totlordo,
  SUM(CASE WHEN annullato = 1 THEN 1 ELSE 0 END) AS righe_annullate,
  SUM(CASE WHEN EmessaNotaCredito = 1 THEN 1 ELSE 0 END) AS righe_nota_credito
FROM carscar
WHERE datadoc >= '2026-11-16'
  AND datadoc <  '2026-11-17';

-- 2) Stesso riepilogo separato per terminale e flag.
SELECT
  numcassa,
  COALESCE(CAST(annullato AS CHAR), 'NULL') AS flag_annullato,
  COALESCE(CAST(EmessaNotaCredito AS CHAR), 'NULL') AS flag_nota_credito,
  COUNT(*) AS numero_righe,
  SUM(COALESCE(TotLordo, 0)) AS somma_totlordo
FROM carscar
WHERE datadoc >= '2026-11-16'
  AND datadoc <  '2026-11-17'
GROUP BY numcassa, annullato, EmessaNotaCredito
ORDER BY numcassa, annullato, EmessaNotaCredito;

-- 3) Distribuzione dei valori di stato: serve a capire i valori realmente usati.
SELECT
  COALESCE(CAST(concluso AS CHAR), 'NULL') AS valore_concluso,
  COALESCE(CAST(annullato AS CHAR), 'NULL') AS valore_annullato,
  COALESCE(CAST(EmessaNotaCredito AS CHAR), 'NULL') AS valore_nota_credito,
  COUNT(*) AS numero_righe
FROM carscar
WHERE datadoc >= '2026-11-16'
  AND datadoc <  '2026-11-17'
GROUP BY concluso, annullato, EmessaNotaCredito
ORDER BY numero_righe DESC;

-- 4) Campione limitato di documenti: verificare importi, date, numeri e flag.
SELECT
  numcassa, id, datadoc, ora, num_scontrino, TotLordo, sconto,
  annullato, concluso, EmessaNotaCredito, resto, pagamento
FROM carscar
WHERE datadoc >= '2026-11-16'
  AND datadoc <  '2026-11-17'
ORDER BY numcassa, id DESC
LIMIT 30;

-- 5) Conteggio pagamenti associati: non sommare ancora come totale netto.
-- La join usa entrambe le chiavi osservate nello schema; la verifica di
-- unicità/duplicazioni va fatta confrontando i risultati con POSWARE.
SELECT
  c.numcassa,
  COUNT(*) AS righe_pagamento,
  SUM(COALESCE(p.importo, 0)) AS somma_pagamenti
FROM carscar c
JOIN carscar_pagamento p
  ON p.numcassa = c.numcassa
 AND p.id_carscar = c.id
WHERE c.datadoc >= '2026-11-16'
  AND c.datadoc <  '2026-11-17'
GROUP BY c.numcassa
ORDER BY c.numcassa;

-- Nota: esportare i risultati delle query 1-5 da entrambi i PC.
-- Non condividere password, stringhe di connessione o file XML di configurazione.
