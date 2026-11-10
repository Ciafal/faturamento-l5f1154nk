migrate(
  (app) => {
    // ------------------------------------------------------------------
    // 0004 — Envio Tarugos e Sucata para SDC: notas de demonstração
    //
    // Sem inventar regras fiscais: as notas abaixo são SIMULADAS
    // (is_simulated = true) e usam apenas os campos já existentes na
    // coleção notas_fiscais. O select process_type recebe o novo valor
    // 'envio_tarugos_sucata' e status_recebimento o valor neutro
    // 'aguardando_especificacao' (nenhuma regra fiscal inventada).
    // Estrutura/categorias espelham a migration 0003 (faturamento_ciafal).
    // ------------------------------------------------------------------
    const notasCol = app.findCollectionByNameOrId('notas_fiscais')

    if (!notasCol.fields.getByName('process_type')) {
      throw new Error('campo process_type não encontrado em notas_fiscais')
    }
    const procField = notasCol.fields.getByName('process_type')
    if (!procField.values.includes('envio_tarugos_sucata')) {
      procField.values.push('envio_tarugos_sucata')
    }
    if (
      !procField.values.includes('produto_acabado') ||
      !procField.values.includes('sucata_carepa_argola') ||
      !procField.values.includes('faturamento_ciafal')
    ) {
      procField.values = [
        'produto_acabado',
        'sucata_carepa_argola',
        'faturamento_ciafal',
        'envio_tarugos_sucata',
      ]
    }
    app.save(notasCol)

    const mockNotas = [
      {
        process_type: 'envio_tarugos_sucata',
        numero_nf: '000202200',
        serie_nf: '8',
        fornecedor_codigo: 'FORN-000211',
        fornecedor_nome: 'CIAFAL AÇOS E METAIS S.A. (MATRIZ 0100)',
        fornecedor_cnpj: '12.345.678/0001-90',
        cliente_codigo: 'CLI-SDC-001',
        cliente_nome: 'SDC – SIDERÚRGICA DO CAMPO LTDA',
        cliente_cnpj: '55.444.333/0001-22',
        categoria_nf: 'SIMULADO - Aguardando especificação funcional',
        data_emissao: '10/04/2025',
        valor_total: 98400.0,
        placa_veiculo: 'RTX-8H21',
        chave_acesso: '35250412345678000190550080002022001011223344',
        status_recebimento: 'aguardando_especificacao',
        status_sap_codigo: 'ENV_AGUARD_ESPEC',
        status_sap_descricao:
          'Simulado — Nota de envio de tarugos e sucata para SDC aguardando especificação funcional e homologação da integração SAP (RFC/BAPI)',
        doc_sap_migo: '',
        doc_sap_miro: '',
        itens_json: [
          {
            item: '00010',
            material_codigo: 'MP-TARUGO-ACO-1080',
            material_descricao: 'TARUGO DE AÇO SAE 1080 (BILLET 130MM)',
            ncm: '7224.90.00',
            cfop: 'N/D (simulado)',
            unidade: 'KG',
            quantidade_nf: 24000,
            valor_unitario: 3.65,
            valor_total: 87600.0,
            lote_fornecedor: 'LT-TAR-2025-041',
            deposito_destino: 'DP30 - Tarugos SDC',
            status_item: 'Aguardando especificação',
          },
          {
            item: '00020',
            material_codigo: 'MP-SUCATA-CAREPA-01',
            material_descricao: 'SUCATA DE CAREPA / RECICLADO INDUSTRIAL',
            ncm: '7204.49.00',
            cfop: 'N/D (simulado)',
            unidade: 'KG',
            quantidade_nf: 6000,
            valor_unitario: 1.8,
            valor_total: 10800.0,
            lote_fornecedor: 'LT-SUC-2025-017',
            deposito_destino: 'DP31 - Sucata SDC',
            status_item: 'Aguardando especificação',
          },
        ],
        pedidos_json: [
          {
            pedido_sap: '4600007711',
            item_pedido: '00010',
            tipo_pedido: 'Simulado — tipo de pedido N/D',
            material: 'MP-TARUGO-ACO-1080',
            quantidade_prevista: 24000,
            quantidade_recebida: 24000,
            saldo: 0,
            unidade: 'KG',
            centro: '0100',
            status_pedido: 'Aguardando especificação',
          },
          {
            pedido_sap: '4600007712',
            item_pedido: '00010',
            tipo_pedido: 'Simulado — tipo de pedido N/D',
            material: 'MP-SUCATA-CAREPA-01',
            quantidade_prevista: 6000,
            quantidade_recebida: 6000,
            saldo: 0,
            unidade: 'KG',
            centro: '0100',
            status_pedido: 'Aguardando especificação',
          },
        ],
        integracao_json: {
          interface_edi: 'N/D (simulado)',
          canal_comunicacao: 'RFC/BAPI — a homologar',
          data_leitura_edi: '10/04/2025 09:15:00',
          protocolo_integracao: 'DEMO-ENV-TAR-20250410-001',
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
              regra: 'Regras fiscais específicas do envio de tarugos e sucata',
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
        process_type: 'envio_tarugos_sucata',
        numero_nf: '000202201',
        serie_nf: '8',
        fornecedor_codigo: 'FORN-000211',
        fornecedor_nome: 'CIAFAL AÇOS E METAIS S.A. (MATRIZ 0100)',
        fornecedor_cnpj: '12.345.678/0001-90',
        cliente_codigo: 'CLI-SDC-001',
        cliente_nome: 'SDC – SIDERÚRGICA DO CAMPO LTDA',
        cliente_cnpj: '55.444.333/0001-22',
        categoria_nf: 'SIMULADO - Aguardando especificação funcional',
        data_emissao: '11/04/2025',
        valor_total: 43750.0,
        placa_veiculo: 'MKV-3D07',
        chave_acesso: '35250412345678000190550080002022011022334455',
        status_recebimento: 'aguardando_especificacao',
        status_sap_codigo: 'ENV_AGUARD_ESPEC',
        status_sap_descricao:
          'Simulado — Nota de envio de tarugos e sucata para SDC aguardando especificação funcional e homologação da integração SAP (RFC/BAPI)',
        doc_sap_migo: '',
        doc_sap_miro: '',
        itens_json: [
          {
            item: '00010',
            material_codigo: 'MP-TARUGO-ACO-1045',
            material_descricao: 'TARUGO DE AÇO SAE 1045 (BILLET 150MM)',
            ncm: '7224.90.00',
            cfop: 'N/D (simulado)',
            unidade: 'KG',
            quantidade_nf: 12500,
            valor_unitario: 3.5,
            valor_total: 43750.0,
            lote_fornecedor: 'LT-TAR-2025-042',
            deposito_destino: 'DP30 - Tarugos SDC',
            status_item: 'Aguardando especificação',
          },
        ],
        pedidos_json: [
          {
            pedido_sap: '4600007713',
            item_pedido: '00010',
            tipo_pedido: 'Simulado — tipo de pedido N/D',
            material: 'MP-TARUGO-ACO-1045',
            quantidade_prevista: 12500,
            quantidade_recebida: 12500,
            saldo: 0,
            unidade: 'KG',
            centro: '0100',
            status_pedido: 'Aguardando especificação',
          },
        ],
        integracao_json: {
          interface_edi: 'N/D (simulado)',
          canal_comunicacao: 'RFC/BAPI — a homologar',
          data_leitura_edi: '11/04/2025 14:40:00',
          protocolo_integracao: 'DEMO-ENV-TAR-20250411-002',
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
              regra: 'Regras fiscais específicas do envio de tarugos e sucata',
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
        process_type: 'envio_tarugos_sucata',
        numero_nf: '000202202',
        serie_nf: '8',
        fornecedor_codigo: 'FORN-000211',
        fornecedor_nome: 'CIAFAL AÇOS E METAIS S.A. (MATRIZ 0100)',
        fornecedor_cnpj: '12.345.678/0001-90',
        cliente_codigo: 'CLI-SDC-001',
        cliente_nome: 'SDC – SIDERÚRGICA DO CAMPO LTDA',
        cliente_cnpj: '55.444.333/0001-22',
        categoria_nf: 'SIMULADO - Aguardando especificação funcional',
        data_emissao: '11/04/2025',
        valor_total: 7560.0,
        placa_veiculo: '',
        chave_acesso: '35250412345678000190550080002022021033445566',
        status_recebimento: 'aguardando_especificacao',
        status_sap_codigo: 'ENV_AGUARD_ESPEC',
        status_sap_descricao:
          'Simulado — Nota de envio de tarugos e sucata para SDC aguardando especificação funcional e homologação da integração SAP (RFC/BAPI)',
        doc_sap_migo: '',
        doc_sap_miro: '',
        itens_json: [
          {
            item: '00010',
            material_codigo: 'MP-SUCATA-ARGOLA-05',
            material_descricao: 'ARGOLA / SUCATA DE CORTE E RECORTE',
            ncm: '7204.21.00',
            cfop: 'N/D (simulado)',
            unidade: 'KG',
            quantidade_nf: 4200,
            valor_unitario: 1.8,
            valor_total: 7560.0,
            lote_fornecedor: 'LT-ARG-2025-008',
            deposito_destino: 'DP31 - Sucata SDC',
            status_item: 'Aguardando especificação',
          },
        ],
        pedidos_json: [
          {
            pedido_sap: '4600007714',
            item_pedido: '00010',
            tipo_pedido: 'Simulado — tipo de pedido N/D',
            material: 'MP-SUCATA-ARGOLA-05',
            quantidade_prevista: 4200,
            quantidade_recebida: 4200,
            saldo: 0,
            unidade: 'KG',
            centro: '0100',
            status_pedido: 'Aguardando especificação',
          },
        ],
        integracao_json: {
          interface_edi: 'N/D (simulado)',
          canal_comunicacao: 'RFC/BAPI — a homologar',
          data_leitura_edi: '11/04/2025 16:05:00',
          protocolo_integracao: 'DEMO-ENV-TAR-20250411-003',
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
              regra: 'Regras fiscais específicas do envio de tarugos e sucata',
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
        "process_type = 'envio_tarugos_sucata'",
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
