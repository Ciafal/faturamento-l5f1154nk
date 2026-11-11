migrate(
  (app) => {
    // ------------------------------------------------------------------
    // 0012 — Amostra Grátis para Clientes (SAI-09): notas de demonstração
    // na coleção notas_fiscais, com process_type = 'amostra_gratis'.
    // Sem inventar regras fiscais: notas SIMULADAS (is_simulated = true),
    // apenas campos já existentes na coleção; o select process_type
    // recebe o novo valor 'amostra_gratis' e status_recebimento o valor
    // neutro 'aguardando_especificacao'. Estrutura espelha 0003/0004/0005.
    // ------------------------------------------------------------------
    const notasCol = app.findCollectionByNameOrId('notas_fiscais')

    const procField = notasCol.fields.getByName('process_type')
    if (!procField) {
      throw new Error('campo process_type não encontrado em notas_fiscais')
    }
    if (!procField.values.includes('amostra_gratis')) {
      procField.values.push('amostra_gratis')
    }
    app.save(notasCol)

    const mockNotas = [
      {
        process_type: 'amostra_gratis',
        numero_nf: '000202220',
        serie_nf: '9',
        fornecedor_codigo: 'FORN-000211',
        fornecedor_nome: 'CIAFAL AÇOS E METAIS S.A. (MATRIZ 0100)',
        fornecedor_cnpj: '12.345.678/0001-90',
        cliente_codigo: 'CLI-AG-001',
        cliente_nome: 'CLIENTE DE DEMONSTRAÇÃO ALFA LTDA',
        cliente_cnpj: '22.333.444/0001-55',
        categoria_nf: 'SIMULADO - Aguardando especificação funcional',
        data_emissao: '14/04/2025',
        valor_total: 4200.0,
        placa_veiculo: 'AGX-1B23',
        chave_acesso: '35250412345678000190550090002022201044556677',
        status_recebimento: 'aguardando_especificacao',
        status_sap_codigo: 'ENV_AGUARD_ESPEC',
        status_sap_descricao:
          'Simulado — Nota de amostra grátis aguardando especificação funcional e homologação da integração SAP (RFC/BAPI)',
        doc_sap_migo: '',
        doc_sap_miro: '',
        itens_json: [
          {
            item: '00010',
            material_codigo: 'MP-AMOSTRA-DEMO-01',
            material_descricao: 'AMOSTRA DE DEMONSTRAÇÃO 01 — CLIENTE ALFA',
            ncm: 'N/D (simulado)',
            cfop: 'N/D (simulado)',
            unidade: 'KG',
            quantidade_nf: 1200,
            valor_unitario: 3.5,
            valor_total: 4200.0,
            lote_fornecedor: 'LT-AG-2025-001',
            deposito_destino: 'N/D (simulado)',
            status_item: 'Aguardando especificação',
          },
        ],
        pedidos_json: [
          {
            pedido_sap: '4600007821',
            item_pedido: '00010',
            tipo_pedido: 'Simulado — tipo de pedido N/D',
            material: 'MP-AMOSTRA-DEMO-01',
            quantidade_prevista: 1200,
            quantidade_recebida: 1200,
            saldo: 0,
            unidade: 'KG',
            centro: '0100',
            status_pedido: 'Aguardando especificação',
          },
        ],
        integracao_json: {
          interface_edi: 'N/D (simulado)',
          canal_comunicacao: 'RFC/BAPI — a homologar',
          data_leitura_edi: '14/04/2025 09:20:00',
          protocolo_integracao: 'DEMO-AMOSTRA-20250414-001',
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
              regra: 'Regras fiscais específicas de amostra grátis (saída sem fato gerador)',
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
        process_type: 'amostra_gratis',
        numero_nf: '000202221',
        serie_nf: '9',
        fornecedor_codigo: 'FORN-000211',
        fornecedor_nome: 'CIAFAL AÇOS E METAIS S.A. (MATRIZ 0100)',
        fornecedor_cnpj: '12.345.678/0001-90',
        cliente_codigo: 'CLI-AG-002',
        cliente_nome: 'CLIENTE DE DEMONSTRAÇÃO BETA S.A.',
        cliente_cnpj: '33.444.555/0001-66',
        categoria_nf: 'SIMULADO - Aguardando especificação funcional',
        data_emissao: '14/04/2025',
        valor_total: 2750.0,
        placa_veiculo: 'BGT-4C90',
        chave_acesso: '35250412345678000190550090002022211055667788',
        status_recebimento: 'aguardando_especificacao',
        status_sap_codigo: 'ENV_AGUARD_ESPEC',
        status_sap_descricao:
          'Simulado — Nota de amostra grátis aguardando especificação funcional e homologação da integração SAP (RFC/BAPI)',
        doc_sap_migo: '',
        doc_sap_miro: '',
        itens_json: [
          {
            item: '00010',
            material_codigo: 'MP-AMOSTRA-DEMO-02',
            material_descricao: 'AMOSTRA DE DEMONSTRAÇÃO 02 — CLIENTE BETA',
            ncm: 'N/D (simulado)',
            cfop: 'N/D (simulado)',
            unidade: 'KG',
            quantidade_nf: 550,
            valor_unitario: 5.0,
            valor_total: 2750.0,
            lote_fornecedor: 'LT-AG-2025-002',
            deposito_destino: 'N/D (simulado)',
            status_item: 'Aguardando especificação',
          },
        ],
        pedidos_json: [
          {
            pedido_sap: '4600007822',
            item_pedido: '00010',
            tipo_pedido: 'Simulado — tipo de pedido N/D',
            material: 'MP-AMOSTRA-DEMO-02',
            quantidade_prevista: 550,
            quantidade_recebida: 550,
            saldo: 0,
            unidade: 'KG',
            centro: '0100',
            status_pedido: 'Aguardando especificação',
          },
        ],
        integracao_json: {
          interface_edi: 'N/D (simulado)',
          canal_comunicacao: 'RFC/BAPI — a homologar',
          data_leitura_edi: '14/04/2025 11:05:00',
          protocolo_integracao: 'DEMO-AMOSTRA-20250414-002',
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
              regra: 'Regras fiscais específicas de amostra grátis (saída sem fato gerador)',
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
        process_type: 'amostra_gratis',
        numero_nf: '000202222',
        serie_nf: '9',
        fornecedor_codigo: 'FORN-000211',
        fornecedor_nome: 'CIAFAL AÇOS E METAIS S.A. (MATRIZ 0100)',
        fornecedor_cnpj: '12.345.678/0001-90',
        cliente_codigo: 'CLI-AG-003',
        cliente_nome: 'CLIENTE DE DEMONSTRAÇÃO GAMA ME',
        cliente_cnpj: '44.555.666/0001-77',
        categoria_nf: 'SIMULADO - Aguardando especificação funcional',
        data_emissao: '15/04/2025',
        valor_total: 1800.0,
        placa_veiculo: '',
        chave_acesso: '35250412345678000190550090002022212066778899',
        status_recebimento: 'aguardando_especificacao',
        status_sap_codigo: 'ENV_AGUARD_ESPEC',
        status_sap_descricao:
          'Simulado — Nota de amostra grátis aguardando especificação funcional e homologação da integração SAP (RFC/BAPI)',
        doc_sap_migo: '',
        doc_sap_miro: '',
        itens_json: [
          {
            item: '00010',
            material_codigo: 'MP-AMOSTRA-DEMO-03',
            material_descricao: 'AMOSTRA DE DEMONSTRAÇÃO 03 — CLIENTE GAMA',
            ncm: 'N/D (simulado)',
            cfop: 'N/D (simulado)',
            unidade: 'KG',
            quantidade_nf: 300,
            valor_unitario: 6.0,
            valor_total: 1800.0,
            lote_fornecedor: 'LT-AG-2025-003',
            deposito_destino: 'N/D (simulado)',
            status_item: 'Aguardando especificação',
          },
        ],
        pedidos_json: [
          {
            pedido_sap: '4600007823',
            item_pedido: '00010',
            tipo_pedido: 'Simulado — tipo de pedido N/D',
            material: 'MP-AMOSTRA-DEMO-03',
            quantidade_prevista: 300,
            quantidade_recebida: 300,
            saldo: 0,
            unidade: 'KG',
            centro: '0100',
            status_pedido: 'Aguardando especificação',
          },
        ],
        integracao_json: {
          interface_edi: 'N/D (simulado)',
          canal_comunicacao: 'RFC/BAPI — a homologar',
          data_leitura_edi: '15/04/2025 08:40:00',
          protocolo_integracao: 'DEMO-AMOSTRA-20250415-003',
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
              regra: 'Regras fiscais específicas de amostra grátis (saída sem fato gerador)',
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
          `numero_nf = '${n.numero_nf}' && serie_nf = '${n.serie_nf}' && process_type = '${n.process_type}'`,
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
        "process_type = 'amostra_gratis'",
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
