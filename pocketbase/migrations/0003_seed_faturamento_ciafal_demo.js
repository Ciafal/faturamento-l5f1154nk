migrate(
  (app) => {
    // ------------------------------------------------------------------
    // 0003 — Faturamento Ciafal: notas de demonstração em perfil de SAÍDA
    //
    // Sem inventar regras fiscais: as notas abaixo são SIMULADAS
    // (is_simulated = true) e usam apenas os campos já existentes na
    // coleção notas_fiscais. O select process_type recebe o novo valor
    // 'faturamento_ciafal' e status_recebimento o valor neutro
    // 'aguardando_especificacao' (nenhuma regra fiscal inventada).
    // ------------------------------------------------------------------
    const notasCol = app.findCollectionByNameOrId('notas_fiscais')

    if (!notasCol.fields.getByName('process_type')) {
      throw new Error('campo process_type não encontrado em notas_fiscais')
    }
    const procField = notasCol.fields.getByName('process_type')
    if (!procField.values.includes('faturamento_ciafal')) {
      procField.values.push('faturamento_ciafal')
    }
    if (
      !procField.values.includes('produto_acabado') ||
      !procField.values.includes('sucata_carepa_argola')
    ) {
      procField.values = ['produto_acabado', 'sucata_carepa_argola', 'faturamento_ciafal']
    }
    app.save(notasCol)

    const statusField = notasCol.fields.getByName('status_recebimento')
    if (statusField && !statusField.values.includes('aguardando_especificacao')) {
      statusField.values.push('aguardando_especificacao')
      app.save(notasCol)
    }

    const mockNotas = [
      {
        process_type: 'faturamento_ciafal',
        numero_nf: '000201100',
        serie_nf: '3',
        fornecedor_codigo: 'FORN-001042',
        fornecedor_nome: 'AÇOS DO BRASIL SUBCONTRATAÇÃO LTDA',
        fornecedor_cnpj: '45.123.890/0001-12',
        cliente_codigo: 'CLI-000777',
        cliente_nome: 'CONSTRUTORA ANDRADE ENGENHARIA S.A.',
        cliente_cnpj: '23.456.789/0001-55',
        categoria_nf: 'SIMULADO - Aguardando especificação funcional',
        data_emissao: '14/03/2025',
        valor_total: 145600.0,
        placa_veiculo: 'GHT-7A55',
        chave_acesso: '35250345123890000112550030002011001044556677',
        status_recebimento: 'aguardando_especificacao',
        status_sap_codigo: 'FAT_AGUARD_ESPEC',
        status_sap_descricao:
          'Simulado — Nota de faturamento de saída aguardando especificação funcional e homologação da integração SAP (RFC/BAPI)',
        doc_sap_migo: '',
        doc_sap_miro: '',
        itens_json: [
          {
            item: '00010',
            material_codigo: 'PA-TUBO-ESTR-80',
            material_descricao: 'TUBO ESTRUTURAL RETANGULAR 80X40',
            ncm: '7306.61.00',
            cfop: 'N/D (simulado)',
            unidade: 'BR',
            quantidade_nf: 600,
            valor_unitario: 180.0,
            valor_total: 108000.0,
            lote_fornecedor: 'LT-TUB-501C',
            deposito_destino: 'DP20 - Produto Acabado SDC',
            status_item: 'Aguardando especificação',
          },
          {
            item: '00020',
            material_codigo: 'PA-PERFIL-U-100',
            material_descricao: 'PERFIL METÁLICO U ENRIJECIDO 100MM',
            ncm: '7306.90.20',
            cfop: 'N/D (simulado)',
            unidade: 'BR',
            quantidade_nf: 400,
            valor_unitario: 94.0,
            valor_total: 37600.0,
            lote_fornecedor: 'LT-PERF-229',
            deposito_destino: 'DP20 - Produto Acabado SDC',
            status_item: 'Aguardando especificação',
          },
        ],
        pedidos_json: [
          {
            pedido_sap: '5500004412',
            item_pedido: '00010',
            tipo_pedido: 'Simulado — tipo de pedido N/D',
            material: 'PA-TUBO-ESTR-80',
            quantidade_prevista: 600,
            quantidade_recebida: 600,
            saldo: 0,
            unidade: 'BR',
            centro: '0100',
            status_pedido: 'Aguardando especificação',
          },
        ],
        integracao_json: {
          interface_edi: 'N/D (simulado)',
          canal_comunicacao: 'RFC/BAPI — a homologar',
          data_leitura_edi: '14/03/2025 08:30:00',
          protocolo_integracao: 'DEMO-FAT-20250314-001',
          validacao_regras: [
            {
              regra: 'Existência da nota fiscal',
              status: 'OK',
              mensagem: 'Nota encontrada na base de demonstração do HUB Ciafal',
            },
            {
              regra: 'Consistência de itens (material, quantidade, unidade, valor)',
              status: 'OK',
              mensagem: '2 itens consistentes nos campos informados',
            },
            {
              regra: 'Regras fiscais específicas do faturamento',
              status: 'PENDENTE',
              mensagem: 'Aguardando especificação funcional (PDF ABAP) — nenhuma regra inventada',
            },
            {
              regra: 'Integração SAP (RFC/BAPI)',
              status: 'PENDENTE',
              mensagem: 'Aguardando homologação da integração — processamento real desabilitado',
            },
          ],
        },
        is_simulated: true,
      },
      {
        process_type: 'faturamento_ciafal',
        numero_nf: '000201101',
        serie_nf: '3',
        fornecedor_codigo: 'FORN-002210',
        fornecedor_nome: 'TREFILAÇÃO PAULISTA DE METAIS S.A.',
        fornecedor_cnpj: '61.987.654/0001-33',
        cliente_codigo: 'CLI-000812',
        cliente_nome: 'DISTRIBUIDORA SUL DE AÇOS LTDA',
        cliente_cnpj: '98.765.432/0001-10',
        categoria_nf: 'SIMULADO - Aguardando especificação funcional',
        data_emissao: '14/03/2025',
        valor_total: 62750.0,
        placa_veiculo: 'PLK-2B18',
        chave_acesso: '35250361987654000133550030002011011055667788',
        status_recebimento: 'aguardando_especificacao',
        status_sap_codigo: 'FAT_AGUARD_ESPEC',
        status_sap_descricao:
          'Simulado — Nota de faturamento de saída aguardando especificação funcional e homologação da integração SAP (RFC/BAPI)',
        doc_sap_migo: '',
        doc_sap_miro: '',
        itens_json: [
          {
            item: '00010',
            material_codigo: 'MP-ARAME-GALV-03',
            material_descricao: 'ARAME RECOZIDO GALVANIZADO 3.00MM',
            ncm: '7217.20.10',
            cfop: 'N/D (simulado)',
            unidade: 'KG',
            quantidade_nf: 5000,
            valor_unitario: 12.55,
            valor_total: 62750.0,
            lote_fornecedor: 'LT-GALV-2025-07',
            deposito_destino: 'DP10 - Almoxarifado WM',
            status_item: 'Aguardando especificação',
          },
        ],
        pedidos_json: [
          {
            pedido_sap: '5500004413',
            item_pedido: '00010',
            tipo_pedido: 'Simulado — tipo de pedido N/D',
            material: 'MP-ARAME-GALV-03',
            quantidade_prevista: 5000,
            quantidade_recebida: 5000,
            saldo: 0,
            unidade: 'KG',
            centro: '0100',
            status_pedido: 'Aguardando especificação',
          },
        ],
        integracao_json: {
          interface_edi: 'N/D (simulado)',
          canal_comunicacao: 'RFC/BAPI — a homologar',
          data_leitura_edi: '14/03/2025 10:05:00',
          protocolo_integracao: 'DEMO-FAT-20250314-002',
          validacao_regras: [
            {
              regra: 'Existência da nota fiscal',
              status: 'OK',
              mensagem: 'Nota encontrada na base de demonstração do HUB Ciafal',
            },
            {
              regra: 'Consistência de itens (material, quantidade, unidade, valor)',
              status: 'OK',
              mensagem: '1 item consistente nos campos informados',
            },
            {
              regra: 'Regras fiscais específicas do faturamento',
              status: 'PENDENTE',
              mensagem: 'Aguardando especificação funcional (PDF ABAP) — nenhuma regra inventada',
            },
            {
              regra: 'Integração SAP (RFC/BAPI)',
              status: 'PENDENTE',
              mensagem: 'Aguardando homologação da integração — processamento real desabilitado',
            },
          ],
        },
        is_simulated: true,
      },
      {
        process_type: 'faturamento_ciafal',
        numero_nf: '000201102',
        serie_nf: '3',
        fornecedor_codigo: 'FORN-001042',
        fornecedor_nome: 'AÇOS DO BRASIL SUBCONTRATAÇÃO LTDA',
        fornecedor_cnpj: '45.123.890/0001-12',
        cliente_codigo: 'CLI-000777',
        cliente_nome: 'CONSTRUTORA ANDRADE ENGENHARIA S.A.',
        cliente_cnpj: '23.456.789/0001-55',
        categoria_nf: 'SIMULADO - Aguardando especificação funcional',
        data_emissao: '13/03/2025',
        valor_total: 41200.0,
        placa_veiculo: 'WLM-4C44',
        chave_acesso: '35250345123890000112550030002011021066778899',
        status_recebimento: 'aguardando_especificacao',
        status_sap_codigo: 'FAT_AGUARD_ESPEC',
        status_sap_descricao:
          'Simulado — Nota de faturamento de saída aguardando especificação funcional e homologação da integração SAP (RFC/BAPI)',
        doc_sap_migo: '',
        doc_sap_miro: '',
        itens_json: [
          {
            item: '00010',
            material_codigo: 'PA-PERFIL-U-100',
            material_descricao: 'PERFIL METÁLICO U ENRIJECIDO 100MM',
            ncm: '7306.90.20',
            cfop: 'N/D (simulado)',
            unidade: 'BR',
            quantidade_nf: 400,
            valor_unitario: 103.0,
            valor_total: 41200.0,
            lote_fornecedor: 'LT-PERF-230',
            deposito_destino: 'DP20 - Produto Acabado SDC',
            status_item: 'Aguardando especificação',
          },
        ],
        pedidos_json: [
          {
            pedido_sap: '5500004414',
            item_pedido: '00010',
            tipo_pedido: 'Simulado — tipo de pedido N/D',
            material: 'PA-PERFIL-U-100',
            quantidade_prevista: 400,
            quantidade_recebida: 400,
            saldo: 0,
            unidade: 'BR',
            centro: '0100',
            status_pedido: 'Aguardando especificação',
          },
        ],
        integracao_json: {
          interface_edi: 'N/D (simulado)',
          canal_comunicacao: 'RFC/BAPI — a homologar',
          data_leitura_edi: '13/03/2025 15:40:00',
          protocolo_integracao: 'DEMO-FAT-20250313-003',
          validacao_regras: [
            {
              regra: 'Existência da nota fiscal',
              status: 'OK',
              mensagem: 'Nota encontrada na base de demonstração do HUB Ciafal',
            },
            {
              regra: 'Consistência de itens (material, quantidade, unidade, valor)',
              status: 'OK',
              mensagem: '1 item consistente nos campos informados',
            },
            {
              regra: 'Regras fiscais específicas do faturamento',
              status: 'PENDENTE',
              mensagem: 'Aguardando especificação funcional (PDF ABAP) — nenhuma regra inventada',
            },
            {
              regra: 'Integração SAP (RFC/BAPI)',
              status: 'PENDENTE',
              mensagem: 'Aguardando homologação da integração — processamento real desabilitado',
            },
          ],
        },
        is_simulated: true,
      },
    ]

    for (const n of mockNotas) {
      try {
        app.findFirstRecordByFilter(
          'notas_fiscais',
          `numero_nf = '${n.numero_nf}' && serie_nf = '${n.serie_nf}'`,
        )
      } catch (_) {
        const rec = new Record(notasCol)
        rec.set('process_type', n.process_type)
        rec.set('numero_nf', n.numero_nf)
        rec.set('serie_nf', n.serie_nf)
        rec.set('fornecedor_codigo', n.fornecedor_codigo)
        rec.set('fornecedor_nome', n.fornecedor_nome)
        rec.set('fornecedor_cnpj', n.fornecedor_cnpj)
        rec.set('cliente_codigo', n.cliente_codigo)
        rec.set('cliente_nome', n.cliente_nome)
        rec.set('cliente_cnpj', n.cliente_cnpj)
        rec.set('categoria_nf', n.categoria_nf)
        rec.set('data_emissao', n.data_emissao)
        rec.set('valor_total', n.valor_total)
        rec.set('placa_veiculo', n.placa_veiculo)
        rec.set('chave_acesso', n.chave_acesso)
        rec.set('status_recebimento', n.status_recebimento)
        rec.set('status_sap_codigo', n.status_sap_codigo)
        rec.set('status_sap_descricao', n.status_sap_descricao)
        rec.set('doc_sap_migo', n.doc_sap_migo)
        rec.set('doc_sap_miro', n.doc_sap_miro)
        rec.set('itens_json', n.itens_json)
        rec.set('pedidos_json', n.pedidos_json)
        rec.set('integracao_json', n.integracao_json)
        rec.set('is_simulated', n.is_simulated)
        app.save(rec)
      }
    }
  },
  (app) => {
    // Rollback: remove apenas as notas simuladas criadas por esta migration
    try {
      const demos = app.findRecordsByFilter(
        'notas_fiscais',
        "process_type = 'faturamento_ciafal'",
        '',
        0,
        0,
      )
      for (const d of demos) {
        app.delete(d)
      }
    } catch (_) {}
  },
)
