migrate(
  (app) => {
    // 1. Seed default admin and operator users if not existing
    const users = app.findCollectionByNameOrId('_pb_users_auth_')

    const seedUsers = [
      {
        email: 'ciafal@ciafal.com.br',
        name: 'Administrador Ciafal',
        role: 'administrador',
        company: 'Ciafal Matriz (0100)',
      },
      {
        email: 'operador.recebimento@ciafal.com.br',
        name: 'Carlos Oliveira (Recebimento)',
        role: 'operador_recebimento',
        company: 'Ciafal Filial (0200)',
      },
      {
        email: 'consultor.fiscal@ciafal.com.br',
        name: 'Mariana Santos (Fiscal)',
        role: 'consultor',
        company: 'Ciafal Matriz (0100)',
      },
    ]

    for (const u of seedUsers) {
      try {
        app.findAuthRecordByEmail('_pb_users_auth_', u.email)
      } catch (_) {
        const rec = new Record(users)
        rec.setEmail(u.email)
        rec.setPassword('Skip@Pass')
        rec.setVerified(true)
        rec.set('name', u.name)
        rec.set('role', u.role)
        rec.set('company', u.company)
        app.save(rec)
      }
    }

    // 2. Seed Module Parameters
    const paramsCol = app.findCollectionByNameOrId('parametros_modulo')
    const defaultParams = [
      {
        chave: 'CATEGORIAS_NF',
        categoria: 'SAP_FATURAMENTO',
        descricao: 'Categorias de Nota Fiscal SAP para Subcontratação',
        valor_json: [
          { codigo: 'E1', descricao: 'Entrada Mercadoria Subcontratação (SDC)', tipo: 'entrada' },
          {
            codigo: 'E2',
            descricao: 'Retorno Simbólico / Insumos Subcontratação',
            tipo: 'entrada',
          },
          { codigo: 'E3', descricao: 'Entrada Argola / Sucata / Carepa', tipo: 'entrada' },
          {
            codigo: 'S1',
            descricao: 'Remessa para Industrialização / Subcontratação',
            tipo: 'saida',
          },
          { codigo: 'S2', descricao: 'Retorno de Industrialização Efetiva', tipo: 'saida' },
        ],
      },
      {
        chave: 'CENTROS_DEPOSITOS',
        categoria: 'SAP_ESTOQUE',
        descricao: 'Centros e Depósitos homologados para o HUB Ciafal',
        valor_json: [
          {
            centro: '0100',
            centro_nome: 'Ciafal Matriz S/A',
            deposito: 'DP10',
            deposito_nome: 'Almoxarifado Principal WM',
          },
          {
            centro: '0100',
            centro_nome: 'Ciafal Matriz S/A',
            deposito: 'DP34',
            deposito_nome: 'Depósito Sucatas e Subprodutos',
          },
          {
            centro: '0200',
            centro_nome: 'Ciafal Filial Industrial',
            deposito: 'DP10',
            deposito_nome: 'Recebimento Matéria-Prima',
          },
          {
            centro: '0200',
            centro_nome: 'Ciafal Filial Industrial',
            deposito: 'DP20',
            deposito_nome: 'Produto Acabado SDC',
          },
        ],
      },
      {
        chave: 'EMPRESAS_DISPONIVEIS',
        categoria: 'SISTEMA',
        descricao: 'Empresas ativas para seleção no cabeçalho',
        valor_json: [
          { codigo: '0100', razao_social: 'Ciafal Matriz S/A (0100)', cnpj: '12.345.678/0001-90' },
          {
            codigo: '0200',
            razao_social: 'Ciafal Filial Industrial (0200)',
            cnpj: '12.345.678/0002-71',
          },
          {
            codigo: '0300',
            razao_social: 'Ciafal Logística & Distribuição (0300)',
            cnpj: '12.345.678/0003-52',
          },
        ],
      },
    ]

    for (const p of defaultParams) {
      try {
        app.findFirstRecordByData('parametros_modulo', 'chave', p.chave)
      } catch (_) {
        const rec = new Record(paramsCol)
        rec.set('chave', p.chave)
        rec.set('categoria', p.categoria)
        rec.set('descricao', p.descricao)
        rec.set('valor_json', p.valor_json)
        app.save(rec)
      }
    }

    // 3. Seed Demonstration Invoices (Produto Acabado e Sucata/Carepa/Argola)
    const notasCol = app.findCollectionByNameOrId('notas_fiscais')

    const mockNotas = [
      {
        process_type: 'produto_acabado',
        numero_nf: '000128450',
        serie_nf: '1',
        fornecedor_codigo: 'FORN-001042',
        fornecedor_nome: 'AÇOS DO BRASIL SUBCONTRATAÇÃO LTDA',
        fornecedor_cnpj: '45.123.890/0001-12',
        cliente_codigo: 'CLI-000501',
        cliente_nome: 'CIAFAL MATRIZ S/A',
        cliente_cnpj: '12.345.678/0001-90',
        categoria_nf: 'E1 - Entrada Mercadoria Subcontratação (SDC)',
        data_emissao: '12/03/2025',
        valor_total: 184500.5,
        placa_veiculo: 'ABC-4E21',
        chave_acesso: '35250345123890000112550010001284501029384756',
        status_recebimento: 'fisico_concluido_pendente_fiscal',
        status_sap_codigo: 'REC_FIS_OK',
        status_sap_descricao:
          'Físico Concluído (MIGO registrado), pendente de lançamento fiscal (MIRO)',
        doc_sap_migo: '5002938410',
        doc_sap_miro: '',
        itens_json: [
          {
            item: '00010',
            material_codigo: 'MP-AÇO-1020-BOB',
            material_descricao: 'BOBINA DE AÇO SAE 1020 2.50MM',
            ncm: '7209.16.00',
            cfop: '1.124',
            unidade: 'KG',
            quantidade_nf: 12500,
            valor_unitario: 8.5,
            valor_total: 106250.0,
            lote_fornecedor: 'LT-2025-089A',
            deposito_destino: 'DP10 - Almoxarifado WM',
            status_item: 'Conferido',
          },
          {
            item: '00020',
            material_codigo: 'SRV-IND-001',
            material_descricao: 'SERVIÇO DE INDUSTRIALIZAÇÃO POR ENCOMENDA',
            ncm: '9901.00.00',
            cfop: '1.902',
            unidade: 'UN',
            quantidade_nf: 1,
            valor_unitario: 78250.5,
            valor_total: 78250.5,
            lote_fornecedor: 'SRV-MAR-25',
            deposito_destino: 'DP10 - Almoxarifado WM',
            status_item: 'Pendente Fiscal',
          },
        ],
        pedidos_json: [
          {
            pedido_sap: '4500891234',
            item_pedido: '00010',
            tipo_pedido: 'NB - Pedido de Subcontratação',
            material: 'MP-AÇO-1020-BOB',
            quantidade_prevista: 12500,
            quantidade_recebida: 12500,
            saldo: 0,
            unidade: 'KG',
            centro: '0100',
            status_pedido: 'Atendido',
          },
          {
            pedido_sap: '4500891234',
            item_pedido: '00020',
            tipo_pedido: 'NB - Pedido de Subcontratação',
            material: 'SRV-IND-001',
            quantidade_prevista: 1,
            quantidade_recebida: 0,
            saldo: 1,
            unidade: 'UN',
            centro: '0100',
            status_pedido: 'Pendente MIRO',
          },
        ],
        integracao_json: {
          interface_edi: 'ZMMI0009_SC',
          canal_comunicacao: 'RFC_ECC_PRD_S4H',
          data_leitura_edi: '12/03/2025 14:22:10',
          protocolo_integracao: 'EDI-20250312-998124',
          validacao_regras: [
            {
              regra: 'Existência do Pedido de Compras SAP',
              status: 'OK',
              mensagem: 'Pedido 4500891234 ativo e liberado',
            },
            {
              regra: 'Validação de CNPJ do Fornecedor',
              status: 'OK',
              mensagem: 'Fornecedor cadastrado no centro 0100',
            },
            {
              regra: 'Tolerância de Preço e Quantidade',
              status: 'OK',
              mensagem: 'Divergência de 0.00%',
            },
            {
              regra: 'Consistência do Depósito de Entrada',
              status: 'OK',
              mensagem: 'Depósito DP10 apto para movimento 311/101',
            },
            {
              regra: 'Verificação Fiscal MIRO',
              status: 'PENDENTE',
              mensagem: 'Aguardando validação de impostos (PIS/COFINS/ICMS)',
            },
          ],
        },
        is_simulated: true,
      },
      {
        process_type: 'produto_acabado',
        numero_nf: '000128451',
        serie_nf: '1',
        fornecedor_codigo: 'FORN-001042',
        fornecedor_nome: 'AÇOS DO BRASIL SUBCONTRATAÇÃO LTDA',
        fornecedor_cnpj: '45.123.890/0001-12',
        cliente_codigo: 'CLI-000501',
        cliente_nome: 'CIAFAL MATRIZ S/A',
        cliente_cnpj: '12.345.678/0001-90',
        categoria_nf: 'E1 - Entrada Mercadoria Subcontratação (SDC)',
        data_emissao: '13/03/2025',
        valor_total: 92400.0,
        placa_veiculo: 'KTY-9102',
        chave_acesso: '35250345123890000112550010001284511098765432',
        status_recebimento: 'nao_concluido',
        status_sap_codigo: 'REC_PEND',
        status_sap_descricao:
          'Não Concluído — NF em conferência prévia, aguardando validação de divergência física',
        doc_sap_migo: '',
        doc_sap_miro: '',
        itens_json: [
          {
            item: '00010',
            material_codigo: 'PA-TUBO-ESTR-80',
            material_descricao: 'TUBO ESTRUTURAL RETANGULAR 80X40',
            ncm: '7306.61.00',
            cfop: '1.124',
            unidade: 'BR',
            quantidade_nf: 800,
            valor_unitario: 115.5,
            valor_total: 92400.0,
            lote_fornecedor: 'LT-TUB-442B',
            deposito_destino: 'DP20 - Produto Acabado SDC',
            status_item: 'Pendente Entrada',
          },
        ],
        pedidos_json: [
          {
            pedido_sap: '4500891299',
            item_pedido: '00010',
            tipo_pedido: 'NB - Pedido de Subcontratação',
            material: 'PA-TUBO-ESTR-80',
            quantidade_prevista: 800,
            quantidade_recebida: 0,
            saldo: 800,
            unidade: 'BR',
            centro: '0200',
            status_pedido: 'Aguardando Lote',
          },
        ],
        integracao_json: {
          interface_edi: 'ZMMI0009_SC',
          canal_comunicacao: 'RFC_ECC_PRD_S4H',
          data_leitura_edi: '13/03/2025 09:15:30',
          protocolo_integracao: 'EDI-20250313-102941',
          validacao_regras: [
            {
              regra: 'Existência do Pedido de Compras SAP',
              status: 'OK',
              mensagem: 'Pedido 4500891299 ativo',
            },
            {
              regra: 'Validação de CNPJ do Fornecedor',
              status: 'OK',
              mensagem: 'Fornecedor validado',
            },
            {
              regra: 'Validação Física de Portaria',
              status: 'ALERTA',
              mensagem: 'Aguardando pesagem na balança 02',
            },
          ],
        },
        is_simulated: true,
      },
      {
        process_type: 'produto_acabado',
        numero_nf: '000128430',
        serie_nf: '2',
        fornecedor_codigo: 'FORN-002210',
        fornecedor_nome: 'TREFILAÇÃO PAULISTA DE METAIS S.A.',
        fornecedor_cnpj: '61.987.654/0001-33',
        cliente_codigo: 'CLI-000501',
        cliente_nome: 'CIAFAL MATRIZ S/A',
        cliente_cnpj: '12.345.678/0001-90',
        categoria_nf: 'E1 - Entrada Mercadoria Subcontratação (SDC)',
        data_emissao: '10/03/2025',
        valor_total: 310200.0,
        placa_veiculo: 'DXZ-1190',
        chave_acesso: '35250361987654000133550020001284301011223344',
        status_recebimento: 'concluido',
        status_sap_codigo: 'REC_CONC',
        status_sap_descricao: 'Concluído — MIGO e MIRO lançados com sucesso no SAP ERP',
        doc_sap_migo: '5002931102',
        doc_sap_miro: '5101928340',
        itens_json: [
          {
            item: '00010',
            material_codigo: 'MP-ARAME-GALV-03',
            material_descricao: 'ARAME RECOZIDO GALVANIZADO 3.00MM',
            ncm: '7217.20.10',
            cfop: '1.124',
            unidade: 'KG',
            quantidade_nf: 25000,
            valor_unitario: 12.408,
            valor_total: 310200.0,
            lote_fornecedor: 'LT-GALV-2025-01',
            deposito_destino: 'DP10 - Almoxarifado WM',
            status_item: 'Efetivado',
          },
        ],
        pedidos_json: [
          {
            pedido_sap: '4500889912',
            item_pedido: '00010',
            tipo_pedido: 'NB - Pedido de Subcontratação',
            material: 'MP-ARAME-GALV-03',
            quantidade_prevista: 25000,
            quantidade_recebida: 25000,
            saldo: 0,
            unidade: 'KG',
            centro: '0100',
            status_pedido: 'Concluído',
          },
        ],
        integracao_json: {
          interface_edi: 'ZMMI0009_SC',
          canal_comunicacao: 'RFC_ECC_PRD_S4H',
          data_leitura_edi: '10/03/2025 11:04:12',
          protocolo_integracao: 'EDI-20250310-881203',
          validacao_regras: [
            {
              regra: 'MIGO Movimento 101/543',
              status: 'OK',
              mensagem: 'Material recebido no depósito DP10',
            },
            {
              regra: 'MIRO Lançamento Fatura',
              status: 'OK',
              mensagem: 'Documento fiscal 5101928340 compensado',
            },
          ],
        },
        is_simulated: true,
      },
      {
        process_type: 'sucata_carepa_argola',
        numero_nf: '000078901',
        serie_nf: '1',
        fornecedor_codigo: 'FORN-001042',
        fornecedor_nome: 'AÇOS DO BRASIL SUBCONTRATAÇÃO LTDA',
        fornecedor_cnpj: '45.123.890/0001-12',
        cliente_codigo: 'CLI-000501',
        cliente_nome: 'CIAFAL MATRIZ S/A',
        cliente_cnpj: '12.345.678/0001-90',
        categoria_nf: 'E3 - Entrada Argola / Sucata / Carepa',
        data_emissao: '11/03/2025',
        valor_total: 28400.0,
        placa_veiculo: 'EGG-3812',
        chave_acesso: '35250345123890000112550010000789011033445566',
        status_recebimento: 'fisico_concluido_pendente_fiscal',
        status_sap_codigo: 'REC_SUC_FIS',
        status_sap_descricao:
          'Físico Concluído (Entrada no Depósito DP34 com movimento 311/545), pendente MIRO',
        doc_sap_migo: '5002939910',
        doc_sap_miro: '',
        itens_json: [
          {
            item: '00010',
            material_codigo: 'SUC-ARGOLA-FERROSO',
            material_descricao: 'RETALHO/ARGOLA METÁLICA DE PROCESSO SDC',
            ncm: '7204.49.00',
            cfop: '1.949',
            unidade: 'KG',
            quantidade_nf: 14200,
            valor_unitario: 1.4,
            valor_total: 19880.0,
            lote_fornecedor: 'SUC-MAR-01',
            deposito_destino: 'DP34 - Sucatas e Subprodutos',
            status_item: 'Pendente Lançamento Fiscal',
          },
          {
            item: '00020',
            material_codigo: 'SUC-CAREPA-LAM',
            material_descricao: 'CAREPA DE LAMINAÇÃO E DECAPAGEM',
            ncm: '7204.49.00',
            cfop: '1.949',
            unidade: 'KG',
            quantidade_nf: 7100,
            valor_unitario: 1.2,
            valor_total: 8520.0,
            lote_fornecedor: 'CAR-MAR-01',
            deposito_destino: 'DP34 - Sucatas e Subprodutos',
            status_item: 'Pendente Lançamento Fiscal',
          },
        ],
        pedidos_json: [
          {
            pedido_sap: '4500891234',
            item_pedido: '00030',
            tipo_pedido: 'NB - Retorno de Subproduto/Sucata SDC',
            material: 'SUC-ARGOLA-FERROSO',
            quantidade_prevista: 15000,
            quantidade_recebida: 14200,
            saldo: 800,
            unidade: 'KG',
            centro: '0100',
            status_pedido: 'Em Aberto',
          },
          {
            pedido_sap: '4500891234',
            item_pedido: '00040',
            tipo_pedido: 'NB - Retorno de Subproduto/Sucata SDC',
            material: 'SUC-CAREPA-LAM',
            quantidade_prevista: 7500,
            quantidade_recebida: 7100,
            saldo: 400,
            unidade: 'KG',
            centro: '0100',
            status_pedido: 'Em Aberto',
          },
        ],
        integracao_json: {
          interface_edi: 'ZMMI0009_WM',
          canal_comunicacao: 'RFC_ECC_PRD_S4H',
          data_leitura_edi: '11/03/2025 16:45:00',
          protocolo_integracao: 'EDI-20250311-772189',
          validacao_regras: [
            {
              regra: 'Regra de Movimento WM Depósito DP34',
              status: 'OK',
              mensagem: 'Regra de subproduto 545/311 validada',
            },
            {
              regra: 'Balança de Pesagem de Sucata',
              status: 'OK',
              mensagem: 'Ticket de pesagem TCK-4819 associado com tolerância de 1.2%',
            },
            {
              regra: 'Verificação Fiscal MIRO (Insumo e Retorno)',
              status: 'PENDENTE',
              mensagem: 'Classificação contábil de sucata pendente',
            },
          ],
        },
        is_simulated: true,
      },
      {
        process_type: 'sucata_carepa_argola',
        numero_nf: '000078902',
        serie_nf: '1',
        fornecedor_codigo: 'FORN-003300',
        fornecedor_nome: 'ESTAMPARIA E METALÚRGICA CENTRAL LTDA',
        fornecedor_cnpj: '33.222.111/0001-44',
        cliente_codigo: 'CLI-000501',
        cliente_nome: 'CIAFAL MATRIZ S/A',
        cliente_cnpj: '12.345.678/0001-90',
        categoria_nf: 'E3 - Entrada Argola / Sucata / Carepa',
        data_emissao: '12/03/2025',
        valor_total: 15300.0,
        placa_veiculo: 'FHI-8271',
        chave_acesso: '35250333222111000144550010000789021077889900',
        status_recebimento: 'nao_concluido',
        status_sap_codigo: 'REC_PEND',
        status_sap_descricao: 'Não Concluído — Pesagem divergente em análise de laudo de sucata',
        doc_sap_migo: '',
        doc_sap_miro: '',
        itens_json: [
          {
            item: '00010',
            material_codigo: 'SUC-ARGOLA-FERROSO',
            material_descricao: 'RETALHO/ARGOLA METÁLICA DE PROCESSO SDC',
            ncm: '7204.49.00',
            cfop: '1.949',
            unidade: 'KG',
            quantidade_nf: 11000,
            valor_unitario: 1.39,
            valor_total: 15300.0,
            lote_fornecedor: 'LT-EST-22',
            deposito_destino: 'DP34 - Sucatas e Subprodutos',
            status_item: 'Bloqueado Qualidade',
          },
        ],
        pedidos_json: [
          {
            pedido_sap: '4500892211',
            item_pedido: '00010',
            tipo_pedido: 'NB - Retorno de Subproduto/Sucata SDC',
            material: 'SUC-ARGOLA-FERROSO',
            quantidade_prevista: 11000,
            quantidade_recebida: 0,
            saldo: 11000,
            unidade: 'KG',
            centro: '0100',
            status_pedido: 'Divergência de Peso',
          },
        ],
        integracao_json: {
          interface_edi: 'ZMMI0009_WM',
          canal_comunicacao: 'RFC_ECC_PRD_S4H',
          data_leitura_edi: '12/03/2025 10:11:00',
          protocolo_integracao: 'EDI-20250312-334411',
          validacao_regras: [
            {
              regra: 'Pesagem Bruto/Tara Balança',
              status: 'ALERTA',
              mensagem: 'Variação de +3.4% acima da tolerância padrão (2%)',
            },
            {
              regra: 'Validação de Contrato de Sucata',
              status: 'OK',
              mensagem: 'Contrato 460000123 válido',
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

    // 4. Seed initial processing history
    const histCol = app.findCollectionByNameOrId('historico_processamentos')
    const mockHist = [
      {
        user_email: 'ciafal@ciafal.com.br',
        user_nome: 'Administrador Ciafal',
        empresa: 'Ciafal Matriz S/A (0100)',
        processo_id: 'edi-subcontratacao-pa',
        processo_nome: 'EDI – Lançamento NF Subcontratação (Produto Acabado)',
        tipo_operacao: 'entrada',
        numero_nf: '000128450',
        serie_nf: '1',
        fornecedor: 'AÇOS DO BRASIL SUBCONTRATAÇÃO LTDA',
        cliente: 'CIAFAL MATRIZ S/A',
        status_anterior: 'Não Concluído',
        status_posterior: 'Físico Concluído (Pendente Fiscal)',
        resultado: 'sucesso',
        documento_sap: 'MIGO: 5002938410',
        mensagens:
          'Simulação de validação e conferência EDI executada com êxito. MIGO gerada no ambiente de demonstração.',
        detalhes_json: {
          movimento_sap: '101/543',
          deposito: 'DP10',
          itens_validados: 2,
        },
      },
      {
        user_email: 'operador.recebimento@ciafal.com.br',
        user_nome: 'Carlos Oliveira (Recebimento)',
        empresa: 'Ciafal Matriz S/A (0100)',
        processo_id: 'edi-subcontratacao-sucata',
        processo_nome: 'EDI – Lançamento NF Subcontratação (Argola/Sucata/Carepa)',
        tipo_operacao: 'entrada',
        numero_nf: '000078901',
        serie_nf: '1',
        fornecedor: 'AÇOS DO BRASIL SUBCONTRATAÇÃO LTDA',
        cliente: 'CIAFAL MATRIZ S/A',
        status_anterior: 'Não Concluído',
        status_posterior: 'Físico Concluído (Pendente Fiscal)',
        resultado: 'sucesso',
        documento_sap: 'MIGO: 5002939910',
        mensagens:
          'Validação da pesagem e movimento de sucata para depósito DP34 registrado com sucesso em modo simulado.',
        detalhes_json: {
          movimento_sap: '545/311',
          deposito: 'DP34',
          ticket_pesagem: 'TCK-4819',
        },
      },
      {
        user_email: 'consultor.fiscal@ciafal.com.br',
        user_nome: 'Mariana Santos (Fiscal)',
        empresa: 'Ciafal Matriz S/A (0100)',
        processo_id: 'edi-subcontratacao-sucata',
        processo_nome: 'EDI – Lançamento NF Subcontratação (Argola/Sucata/Carepa)',
        tipo_operacao: 'entrada',
        numero_nf: '000078902',
        serie_nf: '1',
        fornecedor: 'ESTAMPARIA E METALÚRGICA CENTRAL LTDA',
        cliente: 'CIAFAL MATRIZ S/A',
        status_anterior: 'Não Concluído',
        status_posterior: 'Não Concluído',
        resultado: 'pendente',
        documento_sap: '-',
        mensagens:
          'Consulta realizada. Constatada divergência de peso na balança (+3.4%). Necessário ajuste ou laudo do fornecedor.',
        detalhes_json: {
          peso_nf: '11000 KG',
          peso_balanca: '11374 KG',
          divergencia: '+3.4%',
        },
      },
    ]

    for (const h of mockHist) {
      try {
        app.findFirstRecordByFilter(
          'historico_processamentos',
          `numero_nf = '${h.numero_nf}' && processo_id = '${h.processo_id}'`,
        )
      } catch (_) {
        const rec = new Record(histCol)
        rec.set('user_email', h.user_email)
        rec.set('user_nome', h.user_nome)
        rec.set('empresa', h.empresa)
        rec.set('processo_id', h.processo_id)
        rec.set('processo_nome', h.processo_nome)
        rec.set('tipo_operacao', h.tipo_operacao)
        rec.set('numero_nf', h.numero_nf)
        rec.set('serie_nf', h.serie_nf)
        rec.set('fornecedor', h.fornecedor)
        rec.set('cliente', h.cliente)
        rec.set('status_anterior', h.status_anterior)
        rec.set('status_posterior', h.status_posterior)
        rec.set('resultado', h.resultado)
        rec.set('documento_sap', h.documento_sap)
        rec.set('mensagens', h.mensagens)
        rec.set('detalhes_json', h.detalhes_json)
        app.save(rec)
      }
    }
  },
  (app) => {
    // rollback logic if needed
  },
)
