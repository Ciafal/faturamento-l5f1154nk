migrate(
  (app) => {
    // ------------------------------------------------------------------
    // 0008 — EDI Lançamento NF Subcontratação (Produto Acabado, ENT-01):
    // coleção parametrizacao_cfop_retorno, que persiste o CFOP de entrada
    // (combo por linha) e o vínculo com o pedido de compra Ciafal para cada
    // item/lote de NF de retorno de subcontratação exibido na grid
    // "Relação de NF de Retorno de Subcontratação".
    // ------------------------------------------------------------------
    const parametrizacaoCollection = new Collection({
      name: 'parametrizacao_cfop_retorno',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'numero_nf', type: 'text', required: true },
        { name: 'serie_nf', type: 'text', required: true },
        { name: 'item_nf', type: 'text', required: true },
        { name: 'material_codigo', type: 'text', required: true },
        { name: 'lote', type: 'text', required: true },
        {
          name: 'cfop',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['5101', '5102', '5949'],
        },
        { name: 'pedido_ciafal', type: 'text' },
        { name: 'item_pedido_ciafal', type: 'text' },
        { name: 'is_simulated', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_param_cfop_retorno_chave ON parametrizacao_cfop_retorno (numero_nf, serie_nf, item_nf, material_codigo, lote)',
      ],
    })
    app.save(parametrizacaoCollection)
  },
  (app) => {
    try {
      const t = app.findCollectionByNameOrId('parametrizacao_cfop_retorno')
      app.delete(t)
    } catch (_) {}
  },
)
