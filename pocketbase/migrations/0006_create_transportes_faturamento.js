migrate(
  (app) => {
    // ------------------------------------------------------------------
    // 0006 — Faturamento Ciafal (SAI-01, tela SAPMZSD076): schema da coleção
    // transportes_faturamento (cabeçalho do transporte VTTK-TKNUM, pesos da
    // balança e lotes coletados em lotes_json). A seed de demonstração fica
    // na migration 0007, que depende desta coleção.
    // ------------------------------------------------------------------
    const transportesCollection = new Collection({
      name: 'transportes_faturamento',
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
          values: ['faturamento_ciafal'],
          maxSelect: 1,
        },
        { name: 'tknum', type: 'text', required: true },
        { name: 'placa_veiculo', type: 'text' },
        { name: 'data_processamento', type: 'text' },
        { name: 'hora_processamento', type: 'text' },
        { name: 'status_picking', type: 'text' },
        { name: 'peso_bruto', type: 'number' },
        { name: 'tara', type: 'number' },
        { name: 'peso_coletado', type: 'number' },
        { name: 'peso_rfid', type: 'number' },
        { name: 'lotes_json', type: 'json' },
        { name: 'is_simulated', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_transp_fat_tknum ON transportes_faturamento (process_type, tknum)',
      ],
    })
    app.save(transportesCollection)
  },
  (app) => {
    try {
      const t = app.findCollectionByNameOrId('transportes_faturamento')
      app.delete(t)
    } catch (_) {}
  },
)
