migrate(
  (app) => {
    // ------------------------------------------------------------------
    // 0010 — Recebimento KS (ENT-08, Conferência de Lotes e Pesagem):
    // schema da coleção recebimentos_ks_demo (cabeçalho do envio KS +
    // lotes em lotes_json). Seed de demonstração fica em outra migration.
    // ------------------------------------------------------------------
    const recebimentoKsCollection = new Collection({
      name: 'recebimentos_ks_demo',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'process_type',
          type: 'select',
          required: true,
          values: ['recebimento_ks'],
          maxSelect: 1,
        },
        { name: 'numero_envio', type: 'text', required: true },
        { name: 'placa_veiculo', type: 'text' },
        { name: 'data_processamento', type: 'text' },
        { name: 'hora_processamento', type: 'text' },
        { name: 'status_picking', type: 'text' },
        { name: 'peso_bruto', type: 'number' },
        { name: 'tara', type: 'number' },
        { name: 'lotes_json', type: 'json' },
        { name: 'is_simulated', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_receb_ks_envio ON recebimentos_ks_demo (process_type, numero_envio)',
      ],
    })
    app.save(recebimentoKsCollection)
  },
  (app) => {
    try {
      const t = app.findCollectionByNameOrId('recebimentos_ks_demo')
      app.delete(t)
    } catch (_) {}
  },
)
