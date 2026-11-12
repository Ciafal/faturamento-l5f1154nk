//
// Migration 0017 — correção do backfill demo do Monitor NF-e (ETAPA 1).
// A migration 0016 marcou notas sem recebimento físico (sem data_recebimento
// e sem divergência) como recebimento_status="Total" porque o campo de data
// vazio do PocketBase não é "" — é um objeto DateTime zerado (truthy).
// Esta migration corrige para "Pendente" o que está realmente sem recebimento
// (data_recebimento zerada e recebimento_status="Total").
//
migrate(
  (app) => {
    const demos = app.findRecordsByFilter(
      'nfe_documentos',
      'is_simulated = true && recebimento_status = "Total"',
      '',
      0,
      0,
    )
    for (const rec of demos) {
      const dt = rec.get('data_recebimento')
      const iso = dt ? String(dt) : ''
      if (!iso || iso.startsWith('0001-01-01') || iso.startsWith('0002-11-29')) {
        rec.set('recebimento_status', 'Pendente')
        app.save(rec)
      }
    }
  },
  (app) => {},
)
