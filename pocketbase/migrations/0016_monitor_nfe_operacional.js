//
// Migration 0016 — Monitor NF-e de Entrada, ETAPA 1 (grid operacional e detalhe).
// Campos novos para as 22 colunas do grid e para as abas novas do detalhe:
//   nfe_documentos: filial, fornecedor_codigo, uf_emitente, correlacao_status,
//                   alertas_count, recebimento_status, pontos_correcao (JSON)
//   nfe_itens:      filial, recebimento_status, pedido_sap, item_pedido_sap,
//                   quantidade_recebida
// Backfill idempotente das notas demo (is_simulated=true), sem duplicar:
// as 8 notas continuam existindo — apenas recebem os campos novos.
//
migrate(
  (app) => {
    const colDocs = app.findCollectionByNameOrId('nfe_documentos')
    const colItens = app.findCollectionByNameOrId('nfe_itens')

    if (!colDocs.fields.getByName('filial')) {
      colDocs.fields.add(new TextField({ name: 'filial', max: 60 }))
    }
    if (!colDocs.fields.getByName('fornecedor_codigo')) {
      colDocs.fields.add(new TextField({ name: 'fornecedor_codigo', max: 20 }))
    }
    if (!colDocs.fields.getByName('uf_emitente')) {
      colDocs.fields.add(new TextField({ name: 'uf_emitente', max: 2 }))
    }
    if (!colDocs.fields.getByName('correlacao_status')) {
      colDocs.fields.add(
        new SelectField({
          name: 'correlacao_status',
          maxSelect: 1,
          values: ['Pendente', 'Correlacionada', 'Sem Pedido', 'Divergente'],
        }),
      )
    }
    if (!colDocs.fields.getByName('alertas_count')) {
      colDocs.fields.add(new NumberField({ name: 'alertas_count', onlyInt: true, min: 0 }))
    }
    if (!colDocs.fields.getByName('recebimento_status')) {
      colDocs.fields.add(
        new SelectField({
          name: 'recebimento_status',
          maxSelect: 1,
          values: ['Pendente', 'Parcial', 'Total'],
        }),
      )
    }
    if (!colDocs.fields.getByName('pontos_correcao')) {
      colDocs.fields.add(new JSONField({ name: 'pontos_correcao', maxSize: 2000000 }))
    }
    app.save(colDocs)

    if (!colItens.fields.getByName('filial')) {
      colItens.fields.add(new TextField({ name: 'filial', max: 60 }))
    }
    if (!colItens.fields.getByName('recebimento_status')) {
      colItens.fields.add(
        new SelectField({
          name: 'recebimento_status',
          maxSelect: 1,
          values: ['Pendente', 'Parcial', 'Total'],
        }),
      )
    }
    if (!colItens.fields.getByName('pedido_sap')) {
      colItens.fields.add(new TextField({ name: 'pedido_sap', max: 20 }))
    }
    if (!colItens.fields.getByName('item_pedido_sap')) {
      colItens.fields.add(new TextField({ name: 'item_pedido_sap', max: 10 }))
    }
    if (!colItens.fields.getByName('quantidade_recebida')) {
      colItens.fields.add(new NumberField({ name: 'quantidade_recebida' }))
    }
    app.save(colItens)

    // ---- Backfill idempotente das notas demo (apenas is_simulated=true) ----
    const ufs = ['SP', 'MG', 'SP', 'GO', 'PR', 'SP', 'SC', 'SP']
    const codigosForn = [
      'F00012',
      'F00034',
      'F00047',
      'F00058',
      'F00061',
      'F00073',
      'F00085',
      'F00090',
    ]

    const demos = app.findRecordsByFilter('nfe_documentos', 'is_simulated = true', 'numero', 0, 0)
    for (let i = 0; i < demos.length; i++) {
      const rec = demos[i]
      if (rec.get('recebimento_status')) continue // já backfillado — não mexe

      // Dados do XML demo (mesma origem da seed 0015).
      const filial = '1001 — Planta Demo SP'
      const cnpjDest = String(rec.get('cnpj_destinatario') || '')
      const status = String(rec.get('status') || '')
      const temReceb = !!rec.get('data_recebimento')
      const temDiverg = !!rec.get('tem_divergencia')

      rec.set('filial', filial)
      rec.set('fornecedor_codigo', codigosForn[i % codigosForn.length])
      rec.set('uf_emitente', ufs[i % ufs.length])

      // Correlação: nota com pedido informado no XML = Correlacionada;
      // sem pedido = Sem Pedido; com divergência de pedido = Divergente.
      let pedidoSap = String(rec.get('pedido_sap') || '')
      if (!pedidoSap && cnpjDest.length >= 8) {
        try {
          const itens = app.findRecordsByFilter(
            'nfe_itens',
            `nfe = "${rec.id}" && pedido_informado_xml != ""`,
            'item',
            1,
            0,
          )
          if (itens.length > 0) pedidoSap = String(itens[0].get('pedido_informado_xml') || '')
        } catch (_) {}
      }
      if (status === 'Aguardando Vinculação SAP') {
        rec.set('correlacao_status', 'Divergente')
      } else if (pedidoSap) {
        rec.set('correlacao_status', 'Correlacionada')
      } else {
        rec.set('correlacao_status', 'Sem Pedido')
      }

      // Alertas: divergências registradas contam como alertas (dado real do HUB).
      let alertas = 0
      if (temDiverg) {
        try {
          alertas = app.countRecords('nfe_divergencias', `nfe = "${rec.id}"`)
        } catch (_) {
          alertas = 1
        }
      }
      rec.set('alertas_count', alertas)

      // Recebimento: coerente com o status do fluxo HUB.
      if (status === 'Cancelada') rec.set('recebimento_status', 'Pendente')
      else if (temDiverg) rec.set('recebimento_status', 'Parcial')
      else if (temReceb) rec.set('recebimento_status', 'Total')
      else rec.set('recebimento_status', 'Pendente')

      // Pontos de correção: itens estruturais pendentes (estado vazio honesto
      // quando não há nada a corrigir).
      const pontos = []
      if (temDiverg) {
        pontos.push({
          item: 0,
          campo: 'Recebimento físico',
          problema: 'Divergência registrada na conferência física — ver aba Divergências.',
          origem: 'HUB',
        })
      }
      if (status === 'Aguardando Vinculação SAP') {
        pontos.push({
          item: 0,
          campo: 'Correlação',
          problema: 'Pedido SAP não vinculado — aguardando correlação compra x NF-e.',
          origem: 'HUB',
        })
      }
      if (pontos.length > 0) rec.set('pontos_correcao', pontos)
      app.save(rec)

      // Itens: recebimento por item espelha o status da NF (demo simplificado).
      const qtdRecebida = rec.get('recebimento_status') === 'Total' ? null : 0 // null = usa a própria qtd. da NF
      const itens = app.findRecordsByFilter('nfe_itens', `nfe = "${rec.id}"`, 'item', 0, 0)
      for (const it of itens) {
        it.set('filial', filial)
        it.set('pedido_sap', String(it.get('pedido_informado_xml') || ''))
        it.set('item_pedido_sap', String(it.get('item_pedido') || ''))
        it.set('recebimento_status', rec.get('recebimento_status'))
        if (qtdRecebida === 0 && rec.get('recebimento_status') === 'Parcial') {
          it.set('quantidade_recebida', Math.floor(Number(it.get('quantidade') || 0) * 0.6))
        }
        app.save(it)
      }
    }
  },
  (app) => {
    // Rollback: apenas limpa os campos novos dos registros demo (não remove nada).
    try {
      const colDocs = app.findCollectionByNameOrId('nfe_documentos')
      for (const nome of [
        'filial',
        'fornecedor_codigo',
        'uf_emitente',
        'correlacao_status',
        'alertas_count',
        'recebimento_status',
        'pontos_correcao',
      ]) {
        const f = colDocs.fields.getByName(nome)
        if (f) colDocs.fields.removeByName(nome)
      }
      app.save(colDocs)
    } catch (_) {}
    try {
      const colItens = app.findCollectionByNameOrId('nfe_itens')
      for (const nome of [
        'filial',
        'recebimento_status',
        'pedido_sap',
        'item_pedido_sap',
        'quantidade_recebida',
      ]) {
        const f = colItens.fields.getByName(nome)
        if (f) colItens.fields.removeByName(nome)
      }
      app.save(colItens)
    } catch (_) {}
  },
)
