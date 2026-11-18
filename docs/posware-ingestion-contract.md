# Contratto di acquisizione POSWARE

## Endpoint
`POST /functions/v1/posware-ingest` sul progetto Supabase Caruso Supermercati.

L'endpoint usa una chiave Bearer dedicata per PC. Il controllo JWT del gateway è disattivato esclusivamente perché l'handler verifica autonomamente il token; il token viene confrontato tramite SHA-256 con un hash conservato in `app_private.ingestion_agents`. Non usare mai la chiave Supabase secret/service-role nell'agente.

## Header
`Authorization: Bearer <token-del-PC>`
`Content-Type: application/json`

## Payload
```json
{
  "source_pc": "PC1",
  "register_no": "1",
  "agent_version": "0.1.0",
  "records": [
    {
      "source_id": "818149",
      "document_number": "101",
      "document_type": "NC",
      "occurred_at": "2026-11-16T17:16:36+01:00",
      "gross_amount": 19.05,
      "discount_amount": 0,
      "cancelled": false,
      "credit_note": false,
      "source_status": "APERTO"
    }
  ]
}
```

- `source_pc`: `PC1` oppure `PC2`.
- `register_no`: identificativo cassa censito in `app_private.registers`.
- `source_id`: ID stabile della riga POSWARE; usato per l'upsert idempotente.
- `occurred_at`: data/ora locale con offset esplicito.
- Batch: da 1 a 200 documenti per richiesta.

## Sicurezza e limiti
- L'agente usa esclusivamente un utente MySQL POSWARE dedicato con permessi SELECT.
- La porta MySQL resta locale e non viene pubblicata su Internet.
- Il token del PC non deve essere inserito nel repository, in screenshot o nei log.
- La chiave Supabase secret/service-role resta esclusivamente lato server.
- L'agente deve mantenere una coda SQLite locale e ritentare gli invii non confermati.
- Il totale vendite ordinarie visualizzato va calcolato sui documenti CO non annullati con numero scontrino diverso da zero. I documenti NC restano memorizzati ma separati.
- La regola CO/annullato/numero scontrino è stata riconciliata con i report ufficiali del 16 e 17 novembre 2026 su PC1 e PC2; non è ancora una certificazione di ogni casistica POSWARE.

## Stato
Endpoint pubblicato. Test con token valido, test batch e test di riconciliazione end-to-end ancora da eseguire. Nessun agente installato.
