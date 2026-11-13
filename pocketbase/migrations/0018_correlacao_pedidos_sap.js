//
// Migration 0018 — Monitor NF-e de Entrada, ETAPA 2: Correlação NF-e × Pedido SAP
// (modo demonstração). Cria:
//   nfe_pedidos_sap  — pedidos de compra de demonstração (is_simulated=true),
//                      coerentes com os itens das 8 notas demo (0015/0016),
//                      incluindo casos para as sugestões automáticas
//                      (pedido no XML, material igual, fornecedor igual) e
//                      casos de incompatibilidade (saldo insuficiente,
//                      preço divergente, material inexistente).
//   nfe_vinculos_pedido — vínculo item NF-e ↔ item pedido SAP, gravado pelo
//                      usuário na tela de correlação, com histórico antes/depois
//                      em nfe_logs (append-only). Nunca representa lançamento
//                      real no SAP ECC — vínculo local do HUB (demo).
//   nfe_config (chave 'sap') — integração SAP FUTURA via RFC/BAPI: bloqueada
//                      (integracao_habilitada=false, sem endpoint, sem credencial).
// Seed idempotente: executa DEPOIS da criação das coleções (padrão do projeto).
//
migrate(
  (app) => {
    const AUT = "@request.auth.id != ''"
    const auditDates = () => [
      { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
    ]

    // ---------- nfe_pedidos_sap (dados de DEMONSTRAÇÃO) ----------
    app.save(
      new Collection({
        type: 'base',
        name: 'nfe_pedidos_sap',
        listRule: AUT,
        viewRule: AUT,
        createRule: null,
        updateRule: null,
        deleteRule: null,
        fields: [
          { name: 'numero', type: 'text', required: true, max: 20 },
          { name: 'item', type: 'text', required: true, max: 10 },
          { name: 'fornecedor_codigo', type: 'text', max: 20 },
          { name: 'fornecedor_nome', type: 'text', max: 120 },
          { name: 'material_sap', type: 'text', max: 40 },
          { name: 'material_descricao', type: 'text', max: 120 },
          { name: 'quantidade_pedida', type: 'number', required: true },
          { name: 'quantidade_recebida', type: 'number' },
          { name: 'unidade', type: 'text', max: 5 },
          { name: 'preco_unitario', type: 'number' },
          { name: 'centro', type: 'text', max: 40 },
          { name: 'deposito', type: 'text', max: 20 },
          { name: 'status_item', type: 'text', max: 20 },
          { name: 'data_pedido', type: 'date' },
          { name: 'is_simulated', type: 'bool' },
          ...auditDates(),
        ],
        indexes: [
          'CREATE UNIQUE INDEX idx_nfe_ped_sap_item ON nfe_pedidos_sap (numero, item)',
          'CREATE INDEX idx_nfe_ped_sap_forn ON nfe_pedidos_sap (fornecedor_codigo)',
          'CREATE INDEX idx_nfe_ped_sap_mat ON nfe_pedidos_sap (material_sap)',
        ],
      }),
    )

    // ---------- nfe_vinculos_pedido (vínculo item NF-e ↔ item pedido) ----------
    const colDocs = app.findCollectionByNameOrId('nfe_documentos')
    const colItens = app.findCollectionByNameOrId('nfe_itens')
    app.save(
      new Collection({
        type: 'base',
        name: 'nfe_vinculos_pedido',
        listRule: AUT,
        viewRule: AUT,
        createRule: AUT,
        updateRule: null, // alterar vínculo = novo registro + log antes/depois
        deleteRule: null,
        fields: [
          {
            name: 'nfe',
            type: 'relation',
            required: true,
            collectionId: colDocs.id,
            maxSelect: 1,
            cascadeDelete: true,
          },
          {
            name: 'nfe_item',
            type: 'relation',
            required: true,
            collectionId: colItens.id,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'nfe_numero', type: 'text', max: 20 },
          { name: 'item_numero', type: 'number' },
          { name: 'pedido_numero', type: 'text', required: true, max: 20 },
          { name: 'pedido_item', type: 'text', required: true, max: 10 },
          { name: 'material_sap', type: 'text', max: 40 },
          { name: 'quantidade_vinculada', type: 'number' },
          { name: 'origem', type: 'select', maxSelect: 1, values: ['automatica', 'manual'] },
          { name: 'criterio', type: 'text', max: 200 },
          { name: 'usuario', type: 'text', max: 120 },
          { name: 'is_simulated', type: 'bool' },
          ...auditDates(),
        ],
        indexes: [
          'CREATE INDEX idx_nfe_vinc_nfe ON nfe_vinculos_pedido (nfe)',
          'CREATE INDEX idx_nfe_vinc_nfe_item ON nfe_vinculos_pedido (nfe, item_numero)',
          'CREATE INDEX idx_nfe_vinc_pedido ON nfe_vinculos_pedido (pedido_numero, pedido_item)',
        ],
      }),
    )

    // ---------- nfe_config: serviço SAP (RFC/BAPI futura) — BLOQUEADO ----------
    const colCfg = app.findCollectionByNameOrId('nfe_config')
    if (!colCfg.fields.getByName('integracao_habilitada')) {
      colCfg.fields.add(new BoolField({ name: 'integracao_habilitada' }))
    }
    if (!colCfg.fields.getByName('modo')) {
      colCfg.fields.add(new TextField({ name: 'modo', max: 20 }))
    }
    app.save(colCfg)

    try {
      app.findFirstRecordByFilter('nfe_config', 'chave = "sap"')
    } catch (_) {
      const cfg = new Record(colCfg)
      cfg.set('chave', 'sap')
      cfg.set('ambiente', 'homologacao')
      cfg.set('certificado_presente', false)
      cfg.set('integracao_habilitada', false)
      cfg.set('modo', 'demonstracao')
      cfg.set(
        'descricao',
        'Pedidos SAP para correlação (Etapa 2) — MODO DEMONSTRAÇÃO: a integração FCA/RFC-BAPI no SAP ECC não existe ainda no HUB; chamadas reais permanecem BLOQUEADAS até a camada RFC ser criada no backend.',
      )
      app.save(cfg)
    }

    // ============================================================
    // SEED IDEMPOTENTE — pedidos de compra de DEMONSTRAÇÃO
    // (coerentes com os itens das 8 notas demo da migration 0015)
    // ============================================================
    const colPed = app.findCollectionByNameOrId('nfe_pedidos_sap')
    const colLogs = app.findCollectionByNameOrId('nfe_logs')

    const pedidos = [
      // ---- Pedidos referenciados no XML das notas demo (sugestão prioridade 1)
      {
        numero: '4500012345',
        item: '00010',
        forn: 'F00073',
        fornNome: 'PERFIS E TUBOS DEMO INDUSTRIA LTDA [DEMO]',
        mat: 'TUBO-ESTR-80X80',
        desc: 'TUBO ESTRUTURAL 80X80X3MM (DEMO)',
        qtdPed: 300,
        qtdRec: 210,
        un: 'M',
        preco: 125.86,
        centro: '1001',
        dep: 'ALMX-01',
        status: 'Em aberto',
        dias: 30,
      },
      {
        numero: '4500012388',
        item: '00010',
        forn: 'F00085',
        fornNome: 'TINTAS E VERNIZES DEMO LTDA [DEMO]',
        mat: 'TINTA-EPOXI-CZ',
        desc: 'TINTA EPOXI CINZA INDUSTRIAL (DEMO)',
        qtdPed: 150,
        qtdRec: 90,
        un: 'LT',
        preco: 109.67,
        centro: '1001',
        dep: 'ALMX-02',
        status: 'Em aberto',
        dias: 34,
      },

      // ---- Material igual ao da NF 000202331 (sugestão prioridade 4)
      {
        numero: '4500012401',
        item: '00010',
        forn: 'F00012',
        fornNome: 'ACO FORJADOS DEMO LTDA [DEMO]',
        mat: 'BLOCO-ACO-120',
        desc: 'BLOCO DE AÇO LAMINADO 120X120 (DEMO)',
        qtdPed: 120,
        qtdRec: 0,
        un: 'UN',
        preco: 210.0,
        centro: '1001',
        dep: 'MP-01',
        status: 'Em aberto',
        dias: 21,
      },
      {
        numero: '4500012401',
        item: '00020',
        forn: 'F00012',
        fornNome: 'ACO FORJADOS DEMO LTDA [DEMO]',
        mat: 'BLOCO-ACO-150',
        desc: 'BLOCO DE AÇO LAMINADO 150X150 (DEMO)',
        qtdPed: 80,
        qtdRec: 0,
        un: 'UN',
        preco: 292.0,
        centro: '1001',
        dep: 'MP-01',
        status: 'Em aberto',
        dias: 21,
      },

      // ---- Fornecedor igual à NF 000202332 (sugestão prioridade 3) — preço divergente
      {
        numero: '4500012415',
        item: '00010',
        forn: 'F00034',
        fornNome: 'METAIS PRECISAO DEMO S/A [DEMO]',
        mat: 'CHAPA-FINA-2MM',
        desc: 'CHAPA DE AÇO FINA 2MM (DEMO)',
        qtdPed: 500,
        qtdRec: 0,
        un: 'KG',
        preco: 58.9,
        centro: '1001',
        dep: 'MP-02',
        status: 'Em aberto',
        dias: 18,
      },

      // ---- Coerente com a NF 000202333 (fornecedor F00047)
      {
        numero: '4500012420',
        item: '00010',
        forn: 'F00047',
        fornNome: 'SUPRIMENTOS INDUSTRIAIS DEMO EIRELI [DEMO]',
        mat: 'ELETRODO-E7018',
        desc: 'ELETRODO REVESTIDO E7018 2,5MM (DEMO)',
        qtdPed: 300,
        qtdRec: 300,
        un: 'KG',
        preco: 62.4,
        centro: '1001',
        dep: 'MP-03',
        status: 'Encerrado',
        dias: 25,
      },

      // ---- Caso de INCOMPATIBILIDADE por saldo (NF 000202334 = 40 UN; saldo 10)
      {
        numero: '4500012430',
        item: '00010',
        forn: 'F00058',
        fornNome: 'FUNDICAO DEMO PARTICIPACOES LTDA [DEMO]',
        mat: 'CARCAÇA-FUND-40',
        desc: 'CARCAÇA FUNDIDA 40KG (DEMO)',
        qtdPed: 50,
        qtdRec: 40,
        un: 'UN',
        preco: 1795.0,
        centro: '1001',
        dep: 'MP-01',
        status: 'Em aberto',
        dias: 27,
      },

      // ---- Coerente com a NF 000202335 (fornecedor F00061)
      {
        numero: '4500012435',
        item: '00010',
        forn: 'F00061',
        fornNome: 'TRANSMISSOES DEMO COMERCIO LTDA [DEMO]',
        mat: 'ENGRENAGEM-48D',
        desc: 'ENGRENAGEM 48 DENTES (DEMO)',
        qtdPed: 30,
        qtdRec: 0,
        un: 'UN',
        preco: 1240.0,
        centro: '1001',
        dep: 'MP-04',
        status: 'Em aberto',
        dias: 15,
      },
      {
        numero: '4500012435',
        item: '00020',
        forn: 'F00061',
        fornNome: 'TRANSMISSOES DEMO COMERCIO LTDA [DEMO]',
        mat: 'COROA-48D',
        desc: 'COROA 48 DENTES (DEMO)',
        qtdPed: 30,
        qtdRec: 18,
        un: 'UN',
        preco: 626.0,
        centro: '1001',
        dep: 'MP-04',
        status: 'Em aberto',
        dias: 15,
      },

      // ---- Caso de INCOMPATIBILIDADE: material sem qualquer correspondência
      {
        numero: '4500012440',
        item: '00010',
        forn: 'F00090',
        fornNome: 'ABRASIVOS DEMO DISTRIBUIDORA LTDA [DEMO]',
        mat: 'DISCO-FLAP-4',
        desc: 'DISCO FLAP 4 POL (DEMO)',
        qtdPed: 100,
        qtdRec: 0,
        un: 'UN',
        preco: 8.35,
        centro: '1001',
        dep: 'CON-01',
        status: 'Em aberto',
        dias: 12,
      },

      // ---- Pedido de outro fornecedor com o MESMO material da NF 000202331 (caso de atenção)
      {
        numero: '4500012450',
        item: '00010',
        forn: 'F00099',
        fornNome: 'SIDERURGICA EXEMPLO LTDA [DEMO]',
        mat: 'BLOCO-ACO-120',
        desc: 'BLOCO DE AÇO LAMINADO 120X120 (DEMO)',
        qtdPed: 60,
        qtdRec: 0,
        un: 'UN',
        preco: 218.5,
        centro: '2001',
        dep: 'MP-99',
        status: 'Em aberto',
        dias: 8,
      },
    ]

    const dataPedido = (d) => {
      const dt = new Date(Date.now() - d * 86400000)
      dt.setUTCHours(12, 0, 0, 0)
      return dt.toISOString().replace('T', ' ')
    }

    for (const p of pedidos) {
      try {
        app.findFirstRecordByFilter(
          'nfe_pedidos_sap',
          `numero = "${p.numero}" && item = "${p.item}"`,
        )
        continue
      } catch (_) {}
      const rec = new Record(colPed)
      rec.set('numero', p.numero)
      rec.set('item', p.item)
      rec.set('fornecedor_codigo', p.forn)
      rec.set('fornecedor_nome', p.fornNome)
      rec.set('material_sap', p.mat)
      rec.set('material_descricao', p.desc)
      rec.set('quantidade_pedida', p.qtdPed)
      rec.set('quantidade_recebida', p.qtdRec)
      rec.set('unidade', p.un)
      rec.set('preco_unitario', p.preco)
      rec.set('centro', p.centro)
      rec.set('deposito', p.dep)
      rec.set('status_item', p.status)
      rec.set('data_pedido', dataPedido(p.dias))
      rec.set('is_simulated', true)
      app.save(rec)
    }

    // ---- Vínculos demo pré-existentes: apenas as 2 notas cujo XML já traz o
    // ---- pedido (4500012345 e 4500012388), gravados como correlação automática
    let doc
    try {
      doc = app.findFirstRecordByFilter('nfe_documentos', 'numero = "000202336" && serie = "1"')
    } catch (_) {
      doc = null
    }
    if (doc) {
      try {
        app.findFirstRecordByFilter(
          'nfe_vinculos_pedido',
          `nfe = "${doc.id}" && pedido_numero = "4500012345"`,
        )
      } catch (_) {
        const itens = app.findRecordsByFilter('nfe_itens', `nfe = "${doc.id}"`, 'item', 0, 0)
        if (itens.length > 0) {
          const it = itens[0]
          const recV = new Record(app.findCollectionByNameOrId('nfe_vinculos_pedido'))
          recV.set('nfe', doc.id)
          recV.set('nfe_item', it.id)
          recV.set('nfe_numero', String(doc.get('numero') || ''))
          recV.set('item_numero', Number(it.get('item') || 0))
          recV.set('pedido_numero', '4500012345')
          recV.set('pedido_item', '00010')
          recV.set('material_sap', 'TUBO-ESTR-80X80')
          recV.set('quantidade_vinculada', Number(it.get('quantidade') || 0))
          recV.set('origem', 'automatica')
          recV.set('criterio', 'Pedido informado no XML da NF-e')
          recV.set('usuario', 'HUB (correlação demo)')
          recV.set('is_simulated', true)
          app.save(recV)
          // Log append-only do vínculo demo (sem antes = primeiro vínculo)
          const lg = new Record(colLogs)
          lg.set('usuario', 'HUB (correlação demo)')
          lg.set('empresa', String(doc.get('empresa') || 'Ciafal'))
          lg.set('acao', 'CORRELACAO_PEDIDO')
          lg.set('nfe_numero', String(doc.get('numero') || ''))
          lg.set('nfe_chave_acesso', String(doc.get('chave_acesso') || ''))
          lg.set('status_anterior', '')
          lg.set('status_novo', 'Correlacionada')
          lg.set(
            'mensagem',
            'Vínculo demo pré-carregado: item 10 → pedido 4500012345/00010 (pedido informado no XML). Dados de demonstração.',
          )
          lg.set('detalhes_json', {
            demo: true,
            item_numero: Number(it.get('item') || 0),
            pedido_novo: '4500012345/00010',
            pedido_anterior: '',
            criterio: 'Pedido informado no XML da NF-e',
            origem: 'automatica',
          })
          lg.set('created', new Date().toISOString().replace('T', ' '))
          app.save(lg)
        }
      }
    }
  },
  (app) => {
    // Rollback: remove dados demo + coleções criadas.
    try {
      const vinc = app.findRecordsByFilter('nfe_vinculos_pedido', 'is_simulated = true', '', 0, 0)
      for (const v of vinc) app.delete(v)
    } catch (_) {}
    try {
      const ped = app.findRecordsByFilter('nfe_pedidos_sap', 'is_simulated = true', '', 0, 0)
      for (const p of ped) app.delete(p)
    } catch (_) {}
    try {
      const cfg = app.findFirstRecordByFilter('nfe_config', 'chave = "sap"')
      if (cfg) app.delete(cfg)
    } catch (_) {}
    for (const nome of ['nfe_vinculos_pedido', 'nfe_pedidos_sap']) {
      try {
        app.delete(app.findCollectionByNameOrId(nome))
      } catch (_) {}
    }
    try {
      const colCfg = app.findCollectionByNameOrId('nfe_config')
      for (const nome of ['integracao_habilitada', 'modo']) {
        const f = colCfg.fields.getByName(nome)
        if (f) colCfg.fields.removeByName(nome)
      }
      app.save(colCfg)
    } catch (_) {}
  },
)
