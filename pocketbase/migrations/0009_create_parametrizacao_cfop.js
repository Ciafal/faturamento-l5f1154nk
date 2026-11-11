migrate(
  (app) => {
    // ------------------------------------------------------------------
    // 0009 — Parametrização dinâmica de CFOPs (integração "lista de CFOPs SAP"):
    // coleção parametrizacao_cfop com o cadastro de CFOPs usados nos combos
    // do módulo (grid "Relação de NF de Retorno de Subcontratação" da tela
    // EDI Lançamento NF Subcontratação — Produto Acabado e demais telas).
    // A sincronização com a tabela SAP ainda não existe: a origem dos
    // registros é 'manual' até que o sync seja ativado.
    // ------------------------------------------------------------------
    const collection = new Collection({
      name: 'parametrizacao_cfop',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'cfop', type: 'text', required: true, min: 4, max: 5 },
        { name: 'descricao', type: 'text', required: true, max: 200 },
        {
          name: 'direcao',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['entrada', 'saida'],
        },
        {
          name: 'origem',
          type: 'select',
          required: true,
          maxSelect: 1,
          values: ['sap_sync', 'manual'],
        },
        { name: 'ativo', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_param_cfop_valor ON parametrizacao_cfop (cfop)'],
    })
    app.save(collection)

    // ------------------------------------------------------------------
    // Seed idempotente (no-op quando o CFOP já existe):
    // - 5101/5102/5949: CFOPs já usados hoje no combo da grid
    //   "Relação de NF de Retorno de Subcontratação" (CFOPS_RETORNO_SUBCONTRATACAO).
    // - 2101/2102/5910/5911: CFOPs típicos de retorno de subcontratação,
    //   incluídos manualmente para enriquecer a lista.
    // ------------------------------------------------------------------
    const seed = [
      {
        cfop: '5101',
        descricao: 'Venda de produção do estabelecimento',
        direcao: 'saida',
      },
      {
        cfop: '5102',
        descricao: 'Venda de mercadoria adquirida ou recebida de terceiros',
        direcao: 'saida',
      },
      {
        cfop: '5949',
        descricao: 'Outra saída não especificada (retorno de subcontratação)',
        direcao: 'saida',
      },
      {
        cfop: '2101',
        descricao: 'Aquisição para industrialização (retorno de subcontratação)',
        direcao: 'entrada',
      },
      {
        cfop: '2102',
        descricao:
          'Aquisição para industrialização — mercadoria recebida de terceiros (retorno de subcontratação)',
        direcao: 'entrada',
      },
      {
        cfop: '5910',
        descricao: 'Remessa para industrialização (retorno de subcontratação)',
        direcao: 'saida',
      },
      {
        cfop: '5911',
        descricao:
          'Remessa para industrialização — mercadoria recebida de terceiros (retorno de subcontratação)',
        direcao: 'saida',
      },
    ]

    for (const s of seed) {
      let existente = []
      try {
        existente = app.findRecordsByFilter(
          'parametrizacao_cfop',
          "cfop = '" + s.cfop + "'",
          '',
          1,
          0,
        )
      } catch (_) {
        existente = []
      }
      if (existente.length > 0) {
        continue
      }
      const record = new Record(collection)
      record.set('cfop', s.cfop)
      record.set('descricao', s.descricao)
      record.set('direcao', s.direcao)
      record.set('origem', 'manual')
      record.set('ativo', true)
      app.save(record)
    }
  },
  (app) => {
    try {
      const t = app.findCollectionByNameOrId('parametrizacao_cfop')
      app.delete(t)
    } catch (_) {}
  },
)
