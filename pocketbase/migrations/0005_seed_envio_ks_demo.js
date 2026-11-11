migrate(
  (app) => {
    // ------------------------------------------------------------------
    // 0005 — Envio para KS (SAI-03): notas de demonstração
    //
    // Sem inventar regras fiscais: as notas abaixo são SIMULADAS
    // (is_simulated = true) e usam apenas os campos já existentes na
    // coleção notas_fiscais. O select process_type recebe o novo valor
    // 'envio_ks' e status_recebimento o valor neutro
    // 'aguardando_especificacao' (nenhuma regra fiscal inventada).
    // Estrutura/categorias espelham as migrations 0003/0004.
    // ------------------------------------------------------------------
    const notasCol = app.findCollectionByNameOrId('notas_fiscais')

    const procField = notasCol.fields.getByName('process_type')
    if (!procField) {
      throw new Error('campo process_type não encontrado em notas_fiscais')
    }
    if (!procField.values.includes('envio_ks')) {
      procField.values.push('envio_ks')
    }
    app.save(notasCol)

    const mockNotas = [
      {
        process_type: 'envio_ks',
        numero_nf: '000202210',
        serie_nf: '9',
        fornecedor_codigo: 'FORN-000211',
        fornecedor_nome: 'CIAFAL AÇOS E METAIS S.A. (MATRIZ 0100)',
        fornecedor_cnpj: '12.345.678/0001-90',
        cliente_codigo: 'CLI-KS-001',
        cliente_nome: 'KS – DESTINATÁRIO DE DEMONSTRAÇÃO LTDA',
        cliente_cnpj: '11.222.333/0001-44',
        categoria_nf: 'SIMULADO - Aguardando especificação funcional',
        data_emissao: '12/04/2025',
        valor_total: 76500.0,
        placa_veiculo: 'KSR-7A15',
        chave_acesso: '35250412345678000190550090002022101011223344',
        status_recebimento: 'aguardando_especificacao',
        status_sap_codigo: 'ENV_AGUARD_ESPEC',
        status_sap_descricao:
          'Simulado — Nota de envio para KS aguardando especificação funcional e homologação da integração SAP (RFC/BAPI)',
        doc_sap_migo: '',
        doc_sap_miro: '',
        itens_json: [
          {
            item: '00010',
            material_codigo: 'MP-MATERIAL-DEMO-01',
            material_descricao: 'MATERIAL DE DEMONSTRAÇÃO — DESTINO KS',
            ncm: 'N/D (simulado)',
            cfop: 'N/D (simulado)',
            unidade: 'KG',
            quantidade_nf: 18000,
            valor_unitario: 4.25,
            valor_total: 76500.0,
            lote_fornecedor: 'LT-KS-2025-001',
            deposito_destino: 'N/D (simulado)',
            status_item: 'Aguardando especificação',
          },
        ],
        pedidos_json: [
          {
            pedido_sap: '4600007811',
            item_pedido: '00010',
            tipo_pedido: 'Simulado — tipo de pedido N/D',
            material: 'MP-MATERIAL-DEMO-01',
            quantidade_prevista: 18000,
            quantidade_recebida: 18000,
            saldo: 0,
            unidade: 'KG',
            centro: '0100',
            status_pedido: 'Aguardando especificação',
          },
        ],
        integracao_json: {
          interface_edi: 'N/D (simulado)',
          canal_comunicacao: 'RFC/BAPI — a homologar',
          data_leitura_edi: '12/04/2025 08:30:00',
          protocolo_integracao: 'DEMO-ENV-KS-20250412-001',
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
              regra: 'Regras fiscais específicas do envio para KS',
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
        process_type: 'envio_ks',
        numero_nf: '000202211',
        serie_nf: '9',
        fornecedor_codigo: 'FORN-000211',
        fornecedor_nome: 'CIAFAL AÇOS E METAIS S.A. (MATRIZ 0100)',
        fornecedor_cnpj: '12.345.678/0001-90',
        cliente_codigo: 'CLI-KS-001',
        cliente_nome: 'KS – DESTINATÁRIO DE DEMONSTRAÇÃO LTDA',
        cliente_cnpj: '11.222.333/0001-44',
        categoria_nf: 'SIMULADO - Aguardando especificação funcional',
        data_emissao: '12/04/2025',
        valor_total: 31500.0,
        placa_veiculo: 'KSB-2C88',
        chave_acesso: '35250412345678000190550090002022111022334455',
        status_recebimento: 'aguardando_especificacao',
        status_sap_codigo: 'ENV_AGUARD_ESPEC',
        status_sap_descricao:
          'Simulado — Nota de envio para KS aguardando especificação funcional e homologação da integração SAP (RFC/BAPI)',
        doc_sap_migo: '',
        doc_sap_miro: '',
        itens_json: [
          {
            item: '00010',
            material_codigo: 'MP-MATERIAL-DEMO-02',
            material_descricao: 'MATERIAL DE DEMONSTRAÇÃO 02 — DESTINO KS',
            ncm: 'N/D (simulado)',
            cfop: 'N/D (simulado)',
            unidade: 'KG',
            quantidade_nf: 9000,
            valor_unitario: 3.5,
            valor_total: 31500.0,
            lote_fornecedor: 'LT-KS-2025-002',
            deposito_destino: 'N/D (simulado)',
            status_item: 'Aguardando especificação',
          },
        ],
        pedidos_json: [
          {
            pedido_sap: '4600007812',
            item_pedido: '00010',
            tipo_pedido: 'Simulado — tipo de pedido N/D',
            material: 'MP-MATERIAL-DEMO-02',
            quantidade_prevista: 9000,
            quantidade_recebida: 9000,
            saldo: 0,
            unidade: 'KG',
            centro: '0100',
            status_pedido: 'Aguardando especificação',
          },
        ],
        integracao_json: {
          interface_edi: 'N/D (simulado)',
          canal_comunicacao: 'RFC/BAPI — a homologar',
          data_leitura_edi: '12/04/2025 11:10:00',
          protocolo_integracao: 'DEMO-ENV-KS-20250412-002',
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
              regra: 'Regras fiscais específicas do envio para KS',
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
        process_type: 'envio_ks',
        numero_nf: '000202212',
        serie_nf: '9',
        fornecedor_codigo: 'FORN-000211',
        fornecedor_nome: 'CIAFAL AÇOS E METAIS S.A. (MATRIZ 0100)',
        fornecedor_cnpj: '12.345.678/0001-90',
        cliente_codigo: 'CLI-KS-001',
        cliente_nome: 'KS – DESTINATÁRIO DE DEMONSTRAÇÃO LTDA',
        cliente_cnpj: '11.222.333/0001-44',
        categoria_nf: 'SIMULADO - Aguardando especificação funcional',
        data_emissao: '13/04/2025',
        valor_total: 12400.0,
        placa_veiculo: '',
        chave_acesso: '35250412345678000190550090002022121033445566',
        status_recebimento: 'aguardando_especificacao',
        status_sap_codigo: 'ENV_AGUARD_ESPEC',
        status_sap_descricao:
          'Simulado — Nota de envio para KS aguardando especificação funcional e homologação da integração SAP (RFC/BAPI)',
        doc_sap_migo: '',
        doc_sap_miro: '',
        itens_json: [
          {
            item: '00010',
            material_codigo: 'MP-MATERIAL-DEMO-03',
            material_descricao: 'MATERIAL DE DEMONSTRAÇÃO 03 — DESTINO KS',
            ncm: 'N/D (simulado)',
            cfop: 'N/D (simulado)',
            unidade: 'KG',
            quantidade_nf: 4000,
            valor_unitario: 3.1,
            valor_total: 12400.0,
            lote_fornecedor: 'LT-KS-2025-003',
            deposito_destino: 'N/D (simulado)',
            status_item: 'Aguardando especificação',
          },
        ],
        pedidos_json: [
          {
            pedido_sap: '4600007813',
            item_pedido: '00010',
            tipo_pedido: 'Simulado — tipo de pedido N/D',
            material: 'MP-MATERIAL-DEMO-03',
            quantidade_prevista: 4000,
            quantidade_recebida: 4000,
            saldo: 0,
            unidade: 'KG',
            centro: '0100',
            status_pedido: 'Aguardando especificação',
          },
        ],
        integracao_json: {
          interface_edi: 'N/D (simulado)',
          canal_comunicacao: 'RFC/BAPI — a homologar',
          data_leitura_edi: '13/04/2025 09:45:00',
          protocolo_integracao: 'DEMO-ENV-KS-20250413-003',
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
              regra: 'Regras fiscais específicas do envio para KS',
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
      const demos = app.findRecordsByFilter('notas_fiscais', "process_type = 'envio_ks'", '', 0, 0)
      for (const d of demos) {
        app.delete(d)
      }
    } catch (_) {}
  },
)
