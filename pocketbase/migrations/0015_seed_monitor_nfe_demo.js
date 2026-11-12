//
// Migration 0015 — Monitor NF-e de Entrada (ENT-09): seed de DEMONSTRAÇÃO.
// Executa DEPOIS da 0014 (que cria as coleções). Notas cobrindo os 8 status
// do fluxo HUB, com itens, emitentes CNPJ fictícios marcados DEMO, XML de
// demonstração identificável e datas RELATIVAS (hoje/N-1/N-2...) para os
// filtros de período nunca envelhecerem. Nenhum dado real, nenhuma chamada
// SEFAZ/SAP.
//
migrate(
  (app) => {
    const colDocs = app.findCollectionByNameOrId('nfe_documentos')
    const colItens = app.findCollectionByNameOrId('nfe_itens')
    const colDiv = app.findCollectionByNameOrId('nfe_divergencias')
    const colEntSap = app.findCollectionByNameOrId('nfe_entrada_sap')
    const colLogs = app.findCollectionByNameOrId('nfe_logs')

    // ---- Datas relativas (persistidas em UTC; exibição em America/Sao_Paulo)
    const agora = new Date()
    const diasAtras = (d, h, min) => {
      const dt = new Date(agora.getTime() - d * 86400000)
      dt.setUTCHours(h, min, 0, 0)
      return dt.toISOString().replace('T', ' ')
    }

    // ---- XML demo identificável (gerado — nunca um XML real capturado)
    const xmlDemo = (n) =>
      [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<!-- ============================================================',
        '     ARQUIVO DE DEMONSTRAÇÃO — Monitor NF-e HUB Ciafal (Fase 1)',
        '     XML simulado, gerado pelo HUB para exibição — NÃO é um',
        '     documento autorizado pela SEFAZ. CNPJs fictícios (DEMO).',
        '     ============================================================ -->',
        '<nfeProc versao="4.00"><protNFe><infProt>',
        `  <chNFe>${n.chave}</chNFe>`,
        `  <nProt>${n.protocolo}</nProt>`,
        '  <xMotivo>Autorizado (DEMONSTRAÇÃO)</xMotivo>',
        '</infProt></protNFe>',
        '<NFe><infNFe versao="4.00">',
        `  <ide><nNF>${n.numero}</nNF><serie>${n.serie}</serie><dhEmi>${n.emissaoUTC}Z</dhEmi>`,
        `  <natOp>${n.natureza}</natOp><indPag>1</indPag></ide>`,
        `  <emit><CNPJ>${n.cnpj}</CNPJ><xNome>${n.fornecedor}</xNome><enderEmit><xLgr>Av. das Indústrias (DEMO)</xLgr><nro>1000</nro><xMun>São Paulo (DEMO)</xMun><UF>SP</UF></enderEmit><IE>${n.ie}</IE></emit>`,
        `  <dest><CNPJ>${n.cnpjDest}</CNPJ><xNome>DESTINATARIO DEMO LTDA</xNome><indIEDest>1</indIEDest><IE>123456789012</IE></dest>`,
        ...n.itens.map(
          (it) =>
            `  <det nItem="${it.item}"><prod><cProd>${it.codigo}</cProd><xProd>${it.descricao}</xProd><NCM>${it.ncm}</NCM><CFOP>${it.cfop}</CFOP><uCom>${it.unidade}</uCom><qCom>${it.quantidade}</qCom><vUnCom>${it.valorUnit}</vUnCom><vProd>${it.valorTotal}</vProd></prod><imposto><ICMS><ICMS00><orig>0</orig><CST>00</CST></ICMS00></ICMS></imposto></det>`,
        ),
        `  <total><ICMSTot><vProd>${n.valorProdutos}</vProd><vICMS>${n.valorIcms}</vICMS><vIPI>${n.valorIpi}</vIPI><vST>${n.valorSt}</vST><vFrete>${n.valorFrete}</vFrete><vNF>${n.valorTotal}</vNF></ICMSTot></total>`,
        '</infNFe></NFe></nfeProc>',
      ].join('\n')

    // ---- Notas demo (8 status do fluxo HUB)
    const notas = [
      {
        status: 'NF-e Nova',
        numero: '000202331',
        serie: '1',
        fornecedor: 'ACO FORJADOS DEMO LTDA [DEMO]',
        cnpj: '12.345.678/0001-90',
        ie: '1100424901133',
        cfop: '2102',
        natureza: 'COMPRA PARA INDUSTRIALIZACAO (DEMO)',
        valorTotal: 48560.0,
        valorProdutos: 48560.0,
        valorIcms: 8265.2,
        valorIpi: 0,
        valorSt: 0,
        valorFrete: 0,
        itens: [
          {
            item: 1,
            codigo: 'BLOCO-ACO-120',
            descricao: 'BLOCO DE AÇO LAMINADO 120X120 (DEMO)',
            ncm: '72142000',
            cfop: '2102',
            quantidade: 120,
            unidade: 'UN',
            valorUnit: 210.0,
            valorTotal: 25200.0,
            pedido: '',
            itemPedido: '',
          },
          {
            item: 2,
            codigo: 'BLOCO-ACO-150',
            descricao: 'BLOCO DE AÇO LAMINADO 150X150 (DEMO)',
            ncm: '72142000',
            cfop: '2102',
            quantidade: 80,
            unidade: 'UN',
            valorUnit: 292.0,
            valorTotal: 23360.0,
            pedido: '',
            itemPedido: '',
          },
        ],
        emitUTC: diasAtras(0, 12, 30),
        protocolo: '135202609000000001',
      },
      {
        status: 'Aguardando Recebimento',
        numero: '000202332',
        serie: '1',
        fornecedor: 'METAIS PRECISAO DEMO S/A [DEMO]',
        cnpj: '23.456.789/0001-01',
        ie: '2060900801557',
        cfop: '1102',
        natureza: 'COMPRA PARA COMERCIALIZACAO (DEMO)',
        valorTotal: 31250.0,
        valorProdutos: 31250.0,
        valorIcms: 5312.5,
        valorIpi: 1562.5,
        valorSt: 0,
        valorFrete: 0,
        itens: [
          {
            item: 1,
            codigo: 'CHAPA-FINA-2MM',
            descricao: 'CHAPA DE AÇO FINA 2MM (DEMO)',
            ncm: '72091600',
            cfop: '1102',
            quantidade: 500,
            unidade: 'KG',
            valorUnit: 62.5,
            valorTotal: 31250.0,
            pedido: '',
            itemPedido: '',
          },
        ],
        emitUTC: diasAtras(1, 9, 15),
        protocolo: '135202609000000002',
      },
      {
        status: 'Recebida',
        numero: '000202333',
        serie: '1',
        fornecedor: 'SUPRIMENTOS INDUSTRIAIS DEMO EIRELI [DEMO]',
        cnpj: '34.567.890/0001-12',
        ie: '3010573600112',
        cfop: '1102',
        natureza: 'COMPRA PARA COMERCIALIZACAO (DEMO)',
        valorTotal: 18720.0,
        valorProdutos: 18720.0,
        valorIcms: 3182.4,
        valorIpi: 0,
        valorSt: 0,
        valorFrete: 0,
        itens: [
          {
            item: 1,
            codigo: 'ELETRODO-E7018',
            descricao: 'ELETRODO REVESTIDO E7018 2,5MM (DEMO)',
            ncm: '83111010',
            cfop: '1102',
            quantidade: 300,
            unidade: 'KG',
            valorUnit: 62.4,
            valorTotal: 18720.0,
            pedido: '',
            itemPedido: '',
          },
        ],
        emitUTC: diasAtras(2, 8, 40),
        protocolo: '135202609000000003',
        recebimento: {
          dataUTC: diasAtras(1, 14, 5),
          usuario: 'carlos.mendes@ciafal.com.br',
          centro: '1001 — Planta Demo SP',
          local: 'Doca 3 — Almoxarifado Central',
          obs: 'Conferência física OK (demo). 300 kg conferidos na balança.',
        },
      },
      {
        status: 'Aguardando Vinculação SAP',
        numero: '000202334',
        serie: '1',
        fornecedor: 'FUNDICAO DEMO PARTICIPACOES LTDA [DEMO]',
        cnpj: '45.678.901/0001-23',
        ie: '4027360001124',
        cfop: '1102',
        natureza: 'COMPRA PARA COMERCIALIZACAO (DEMO)',
        valorTotal: 72400.0,
        valorProdutos: 72400.0,
        valorIcms: 12308.0,
        valorIpi: 2172.0,
        valorSt: 0,
        valorFrete: 0,
        itens: [
          {
            item: 1,
            codigo: 'CARCAÇA-FUND-40',
            descricao: 'CARCAÇA FUNDIDA 40KG (DEMO)',
            ncm: '73251000',
            cfop: '1102',
            quantidade: 40,
            unidade: 'UN',
            valorUnit: 1810.0,
            valorTotal: 72400.0,
            pedido: '',
            itemPedido: '',
          },
        ],
        emitUTC: diasAtras(3, 10, 20),
        protocolo: '135202609000000004',
        recebimento: {
          dataUTC: diasAtras(2, 13, 40),
          usuario: 'ana.souza@ciafal.com.br',
          centro: '1001 — Planta Demo SP',
          local: 'Doca 1 — Almoxarifado Central',
          obs: '',
        },
      },
      {
        status: 'Com Divergência',
        numero: '000202335',
        serie: '1',
        fornecedor: 'TRANSMISSOES DEMO COMERCIO LTDA [DEMO]',
        cnpj: '56.789.012/0001-34',
        ie: '5019046002235',
        cfop: '2102',
        natureza: 'COMPRA PARA INDUSTRIALIZACAO (DEMO)',
        valorTotal: 55980.0,
        valorProdutos: 55980.0,
        valorIcms: 9516.6,
        valorIpi: 0,
        valorSt: 0,
        valorFrete: 0,
        itens: [
          {
            item: 1,
            codigo: 'ENGRENAGEM-48D',
            descricao: 'ENGRENAGEM 48 DENTES (DEMO)',
            ncm: '84834010',
            cfop: '2102',
            quantidade: 30,
            unidade: 'UN',
            valorUnit: 1240.0,
            valorTotal: 37200.0,
            pedido: '',
            itemPedido: '',
          },
          {
            item: 2,
            codigo: 'COROA-48D',
            descricao: 'COROA 48 DENTES (DEMO)',
            ncm: '84834010',
            cfop: '2102',
            quantidade: 30,
            unidade: 'UN',
            valorUnit: 626.0,
            valorTotal: 18780.0,
            pedido: '',
            itemPedido: '',
          },
        ],
        emitUTC: diasAtras(4, 15, 10),
        protocolo: '135202609000000005',
        recebimento: {
          dataUTC: diasAtras(3, 11, 25),
          usuario: 'carlos.mendes@ciafal.com.br',
          centro: '1001 — Planta Demo SP',
          local: 'Doca 2 — Almoxarifado Central',
          obs: 'Divergência de quantidade no item 2 (demo).',
        },
        divergencias: [
          {
            tipo: 'Bloqueante',
            descricao:
              'Quantidade recebida (18 UN) menor que a quantidade da NF-e (30 UN) no item 2 — COROA 48 DENTES (demo).',
            origem: 'Conferência física — Doca 2',
          },
          {
            tipo: 'Atenção',
            descricao: 'Lote do fornecedor não informado no XML do item 1 (demo).',
            origem: 'Validação HUB',
          },
        ],
      },
      {
        status: 'Apta para Entrada',
        numero: '000202336',
        serie: '1',
        fornecedor: 'PERFIS E TUBOS DEMO INDUSTRIA LTDA [DEMO]',
        cnpj: '67.890.123/0001-45',
        ie: '6027315003346',
        cfop: '1102',
        natureza: 'COMPRA PARA COMERCIALIZACAO (DEMO)',
        valorTotal: 26430.0,
        valorProdutos: 26430.0,
        valorIcms: 4493.1,
        valorIpi: 0,
        valorSt: 0,
        valorFrete: 0,
        itens: [
          {
            item: 1,
            codigo: 'TUBO-ESTR-80X80',
            descricao: 'TUBO ESTRUTURAL 80X80X3MM (DEMO)',
            ncm: '73063000',
            cfop: '1102',
            quantidade: 210,
            unidade: 'M',
            valorUnit: 125.86,
            valorTotal: 26430.0,
            pedido: '4500012345',
            itemPedido: '00010',
          },
        ],
        emitUTC: diasAtras(5, 11, 45),
        protocolo: '135202609000000006',
        recebimento: {
          dataUTC: diasAtras(4, 9, 50),
          usuario: 'joao.almeida@ciafal.com.br',
          centro: '1001 — Planta Demo SP',
          local: 'Doca 4 — Materiais Estruturais',
          obs: '',
        },
      },
      {
        status: 'Entrada SAP Realizada',
        numero: '000202337',
        serie: '1',
        fornecedor: 'TINTAS E VERNIZES DEMO LTDA [DEMO]',
        cnpj: '78.901.234/0001-56',
        ie: '7045164004457',
        cfop: '1102',
        natureza: 'COMPRA PARA COMERCIALIZACAO (DEMO)',
        valorTotal: 9870.0,
        valorProdutos: 9870.0,
        valorIcms: 1677.9,
        valorIpi: 0,
        valorSt: 0,
        valorFrete: 0,
        itens: [
          {
            item: 1,
            codigo: 'TINTA-EPOXI-CZ',
            descricao: 'TINTA EPOXI CINZA INDUSTRIAL (DEMO)',
            ncm: '32081090',
            cfop: '1102',
            quantidade: 90,
            unidade: 'LT',
            valorUnit: 109.67,
            valorTotal: 9870.0,
            pedido: '4500012388',
            itemPedido: '00010',
          },
        ],
        emitUTC: diasAtras(6, 14, 55),
        protocolo: '135202609000000007',
        recebimento: {
          dataUTC: diasAtras(5, 10, 30),
          usuario: 'ana.souza@ciafal.com.br',
          centro: '1001 — Planta Demo SP',
          local: 'Doca 1 — Almoxarifado Central',
          obs: '',
        },
        entradaSap: {
          doc: '5000001234',
          dataUTC: diasAtras(5, 11, 15),
          usuario: 'SAP_BATCH_DEMO',
          centro: '1001',
          obs: 'Documento de entrada simulado para demonstração — nenhum lançamento real no SAP ECC (Fase 1).',
        },
      },
      {
        status: 'Cancelada',
        numero: '000202338',
        serie: '1',
        fornecedor: 'ABRASIVOS DEMO DISTRIBUIDORA LTDA [DEMO]',
        cnpj: '89.012.345/0001-67',
        ie: '8053911005568',
        cfop: '1102',
        natureza: 'COMPRA PARA COMERCIALIZACAO (DEMO)',
        valorTotal: 7350.0,
        valorProdutos: 7350.0,
        valorIcms: 1249.5,
        valorIpi: 0,
        valorSt: 0,
        valorFrete: 0,
        itens: [
          {
            item: 1,
            codigo: 'DISCO-CORTE-7',
            descricao: 'DISCO DE CORTE 7 POL (DEMO)',
            ncm: '68042211',
            cfop: '1102',
            quantidade: 700,
            unidade: 'UN',
            valorUnit: 10.5,
            valorTotal: 7350.0,
            pedido: '',
            itemPedido: '',
          },
        ],
        emitUTC: diasAtras(7, 16, 35),
        protocolo: '',
        eventoCancelamento: {
          dataUTC: diasAtras(6, 10, 20),
          protocolo: '135202609000000019',
          motivo: 'NF-e cancelada pelo emitente antes do recebimento (demonstração).',
        },
      },
    ]

    for (const n of notas) {
      // Chave de acesso de 44 dígitos a partir de CNPJ/serie/numero (fictícia).
      const chave = '352610' + n.cnpj.replaceAll(/\D/g, '') + '55001' + '0000' + n.serie + n.numero

      // Idempotência: chave única = anti-duplicidade.
      try {
        app.findFirstRecordByFilter('nfe_documentos', `chave_acesso = "${chave}"`)
        continue
      } catch (_) {}

      const nro = {
        numero: n.numero,
        serie: n.serie,
        chave: chave,
        cnpj: n.cnpj.replaceAll(/\D/g, ''),
        fornecedor: n.fornecedor,
        ie: n.ie,
        natureza: n.natureza,
        emissaoUTC: n.emitUTC,
        protocolo: n.protocolo || '135202609000000099',
        cnpjDest: '12345678000199',
        itens: n.itens,
        valorProdutos: n.valorProdutos,
        valorIcms: n.valorIcms,
        valorIpi: n.valorIpi,
        valorSt: n.valorSt,
        valorFrete: n.valorFrete,
        valorTotal: n.valorTotal,
      }

      const rec = new Record(colDocs)
      rec.set('empresa', 'Ciafal Demo Indústria de Aços LTDA')
      rec.set('cnpj_destinatario', '12.345.678/0001-99 [DEMO]')
      rec.set('numero', n.numero)
      rec.set('serie', n.serie)
      rec.set('chave_acesso', chave)
      rec.set('data_emissao', n.emitUTC)
      rec.set('fornecedor_razao_social', n.fornecedor)
      rec.set('fornecedor_cnpj', n.cnpj)
      rec.set('fornecedor_ie', n.ie)
      rec.set('cfop', n.cfop)
      rec.set('natureza_operacao', n.natureza)
      rec.set('valor_total', n.valorTotal)
      rec.set('valor_produtos', n.valorProdutos)
      rec.set('valor_icms', n.valorIcms)
      rec.set('valor_ipi', n.valorIpi)
      rec.set('valor_st', n.valorSt)
      rec.set('valor_frete', n.valorFrete)
      rec.set('status', n.status)
      rec.set('is_simulated', true)
      rec.set('xml_demo', xmlDemo(nro))
      rec.set('protocolo_autorizacao', n.protocolo)
      rec.set('data_autorizacao', n.emitUTC)
      if (n.recebimento) {
        rec.set('data_recebimento', n.recebimento.dataUTC)
        rec.set('usuario_recebedor', n.recebimento.usuario)
        rec.set('centro', n.recebimento.centro)
        rec.set('local_recebimento', n.recebimento.local)
        rec.set('observacoes_recebimento', n.recebimento.obs)
      }
      const pedidoSap = n.itens.find((it) => it.pedido)?.pedido || ''
      if (pedidoSap) rec.set('pedido_sap', pedidoSap)
      if (n.entradaSap) rec.set('entrada_sap_doc', n.entradaSap.doc)
      rec.set('tem_divergencia', (n.divergencias || []).length > 0)
      app.save(rec)

      for (const it of n.itens) {
        const ir = new Record(colItens)
        ir.set('nfe', rec.id)
        ir.set('item', it.item)
        ir.set('codigo_produto_fornecedor', it.codigo)
        ir.set('descricao', it.descricao)
        ir.set('ncm', it.ncm)
        ir.set('cfop', it.cfop)
        ir.set('quantidade', it.quantidade)
        ir.set('unidade', it.unidade)
        ir.set('valor_unitario', it.valorUnit)
        ir.set('valor_total', it.valorTotal)
        ir.set('pedido_informado_xml', it.pedido)
        ir.set('item_pedido', it.itemPedido)
        app.save(ir)
      }

      if (n.divergencias) {
        for (const d of n.divergencias) {
          const dr = new Record(colDiv)
          dr.set('nfe', rec.id)
          dr.set('tipo', d.tipo)
          dr.set('descricao', d.descricao)
          dr.set('origem', d.origem)
          dr.set('data_deteccao', n.recebimento ? n.recebimento.dataUTC : n.emitUTC)
          app.save(dr)
        }
      }

      if (n.entradaSap) {
        const er = new Record(colEntSap)
        er.set('nfe', rec.id)
        er.set('numero_documento', n.entradaSap.doc)
        er.set('data_entrada', n.entradaSap.dataUTC)
        er.set('usuario', n.entradaSap.usuario)
        er.set('centro', n.entradaSap.centro)
        er.set('observacoes', n.entradaSap.obs)
        er.set('is_simulated', true)
        app.save(er)
      }

      // ---- Histórico demo (append-only): eventos coerentes com o status
      const eventos = []
      eventos.push({
        acao: 'CAPTURA_SEFAZ_DEMO',
        msg: 'Nota capturada (demonstração) — dados simulados, não provenientes da SEFAZ.',
        quando: n.emitUTC,
        stAnt: '',
        stNovo: n.status === 'Cancelada' ? 'NF-e Nova' : n.status,
      })
      if (n.recebimento) {
        eventos.push({
          acao: 'ACUSAR_RECEBIMENTO',
          msg: `Recebimento físico acusado por ${n.recebimento.usuario} — ${n.recebimento.centro} / ${n.recebimento.local}.`,
          quando: n.recebimento.dataUTC,
          stAnt: 'Aguardando Recebimento',
          stNovo: 'Recebida',
        })
      }
      if (n.divergencias) {
        eventos.push({
          acao: 'DIVERGENCIA_REGISTRADA',
          msg: `${n.divergencias.length} divergência(s) registrada(s) na conferência (demo).`,
          quando: n.recebimento ? n.recebimento.dataUTC : n.emitUTC,
          stAnt: 'Recebida',
          stNovo: 'Com Divergência',
        })
      }
      if (n.entradaSap) {
        eventos.push({
          acao: 'ENTRADA_SAP_SIMULADA',
          msg: 'Documento de entrada SAP simulado (demo) — nenhum lançamento real no SAP ECC.',
          quando: n.entradaSap.dataUTC,
          stAnt: 'Apta para Entrada',
          stNovo: 'Entrada SAP Realizada',
        })
      }
      if (n.eventoCancelamento) {
        eventos.push({
          acao: 'CANCELAMENTO',
          msg: n.eventoCancelamento.motivo,
          quando: n.eventoCancelamento.dataUTC,
          stAnt: 'NF-e Nova',
          stNovo: 'Cancelada',
        })
      }
      for (const ev of eventos) {
        const lr = new Record(colLogs)
        lr.set(
          'usuario',
          ev.acao === 'CAPTURA_SEFAZ_DEMO'
            ? 'HUB (integração demo)'
            : 'carlos.mendes@ciafal.com.br',
        )
        lr.set('empresa', 'Ciafal Demo Indústria de Aços LTDA')
        lr.set('acao', ev.acao)
        lr.set('nfe_numero', n.numero)
        lr.set('nfe_chave_acesso', chave)
        lr.set('status_anterior', ev.stAnt)
        lr.set('status_novo', ev.stNovo)
        lr.set('mensagem', ev.msg)
        lr.set('detalhes_json', JSON.stringify({ demo: true }))
        lr.set('created', ev.quando)
        app.save(lr)
      }
    }
  },
  (app) => {
    // Rollback: remove apenas os registros de DEMONSTRAÇÃO desta migration.
    for (const nome of ['nfe_itens', 'nfe_divergencias', 'nfe_entrada_sap', 'nfe_documentos']) {
      try {
        const demos = app.findRecordsByFilter(nome, 'is_simulated = true', '', 0, 0)
        for (const d of demos) app.delete(d)
      } catch (_) {}
    }
    try {
      const logsDemo = app.findRecordsByFilter('nfe_logs', 'detalhes_json ~ "demo"', '', 0, 0)
      for (const l of logsDemo) app.delete(l)
    } catch (_) {}
  },
)
