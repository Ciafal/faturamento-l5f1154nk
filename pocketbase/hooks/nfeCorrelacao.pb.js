//
// pb_hooks — Monitor NF-e de Entrada (ENT-09) — ETAPA 2: Correlação NF-e × Pedido SAP
// Endpoint XHR "POST /backend/v1/ciafal/nfe/correlacao" (FORA do namespace /api/).
//
// MODO DEMONSTRAÇÃO: a integração FCA (RFC/BAPI no SAP ECC) NÃO existe no HUB.
// Este endpoint NUNCA consulta o SAP real e NUNCA simula lançamento real.
// O que faz de verdade (sem fingir integração):
//   1. Valida a NF-e, os itens e o vínculo pedido/item informado contra a
//      coleção de pedidos de demonstração (nfe_pedidos_sap, is_simulated=true).
//   2. Grava o vínculo definitivo em nfe_vinculos_pedido (create-only).
//   3. Reabre o vínculo anterior (desvincula) criando NOVO registro
//      desvinculado — coleção sem update/delete (append-only).
//   4. Propaga pedido/item para nfe_itens (espelho por item) e recalcula
//      correlacao_status do documento.
//   5. Registra ANTES/DEPOIS em nfe_logs (append-only), com usuário e data/hora.
//   6. Nunca grava senha/token/certificado em log.
//
// IMPORTANTE (Goja/pb_hooks): nenhuma função de nível superior é chamada dentro
// dos callbacks do PocketBase — TODA a lógica (inclusive helpers) vive DENTRO do
// callback do routerAdd, como constantes locais.
//

routerAdd(
  'POST',
  '/backend/v1/ciafal/nfe/correlacao',
  (e) => {
    const dados = (() => {
      try {
        return e.requestInfo().body
      } catch (_) {
        return {}
      }
    })()

    const nfeId = String(dados.nfe_id || '').trim()
    const itensVinc = Array.isArray(dados.vinculos) ? dados.vinculos : []
    const desvincularIds = Array.isArray(dados.desvincular) ? dados.desvincular : []

    if (!nfeId || (itensVinc.length === 0 && desvincularIds.length === 0)) {
      return e.json(400, {
        sucesso: false,
        mensagem: 'Informe a NF-e e pelo menos um vínculo ou desvinculamento.',
      })
    }

    // ---- NF-e existe? ----
    let doc
    try {
      doc = app.findRecordById('nfe_documentos', nfeId)
    } catch (_) {
      return e.json(404, { sucesso: false, mensagem: 'NF-e não encontrada.' })
    }

    let usuario = ''
    try {
      if (e.auth) usuario = String(e.auth.get('email') || e.auth.id)
    } catch (_) {}

    const colVinc = app.findCollectionByNameOrId('nfe_vinculos_pedido')
    const colLogs = app.findCollectionByNameOrId('nfe_logs')
    const agora = new Date().toISOString().replace('T', ' ')
    const nfeNumero = String(doc.get('numero') || '')
    const nfeChave = String(doc.get('chave_acesso') || '')
    const empresa = String(doc.get('empresa') || 'Ciafal')

    // ---- Helper: log de auditoria append-only (constante local, sem hoisting) ----
    const gravarLog = (obj) => {
      const log = new Record(colLogs)
      log.set('usuario', obj.usuario)
      log.set('empresa', obj.empresa)
      log.set('acao', 'CORRELACAO_PEDIDO')
      log.set('nfe_numero', obj.nfeNumero)
      log.set('nfe_chave_acesso', obj.nfeChave)
      log.set('status_anterior', obj.statusAnterior || '')
      log.set('status_novo', obj.statusNovo || '')
      log.set('mensagem', obj.mensagem)
      log.set('detalhes_json', obj.detalhes)
      if (obj.quando) log.set('created', obj.quando)
      return app.save(log)
    }

    // ---- Helper: recalcula o status de correlação a partir dos vínculos ativos ----
    const calcularStatusCorrelacao = (idNfe) => {
      try {
        const itens = app.findRecordsByFilter('nfe_itens', `nfe = "${idNfe}"`, 'item', 0, 0)
        if (itens.length === 0) return 'Sem Pedido'
        let comPedido = 0
        for (const it of itens) {
          if (String(it.get('pedido_sap') || '') !== '') comPedido++
        }
        if (comPedido === 0) return 'Pendente'
        if (comPedido === itens.length) return 'Correlacionada'
        return 'Divergente' // parcial exibido como Divergente no grid
      } catch (_) {
        return 'Pendente'
      }
    }

    const criados = []
    const desvinculados = []

    // ---------------- DESVINCULAR ----------------
    for (const vincId of desvincularIds) {
      let anterior
      try {
        anterior = app.findRecordById('nfe_vinculos_pedido', String(vincId))
      } catch (_) {
        continue
      }
      if (String(anterior.get('nfe') || '') !== nfeId) continue // vínculo de outra NF
      if (String(anterior.get('vinculado') || '') === 'false') continue // já desvinculado

      const novo = new Record(colVinc)
      novo.set('nfe', nfeId)
      novo.set('nfe_item', anterior.get('nfe_item'))
      novo.set('nfe_numero', anterior.get('nfe_numero'))
      novo.set('item_numero', anterior.get('item_numero'))
      novo.set('pedido_numero', anterior.get('pedido_numero'))
      novo.set('pedido_item', anterior.get('pedido_item'))
      novo.set('material_sap', anterior.get('material_sap'))
      novo.set('quantidade_vinculada', anterior.get('quantidade_vinculada'))
      novo.set('origem', anterior.get('origem') || 'manual')
      novo.set('criterio', 'Desvinculado pelo usuário')
      novo.set('usuario', usuario)
      novo.set('vinculado', false)
      novo.set('is_simulated', anterior.get('is_simulated'))
      app.save(novo)

      // Propaga a desvinculação para o espelho de correlação por item (nfe_itens).
      try {
        const itemNfe = app.findRecordById('nfe_itens', String(anterior.get('nfe_item')))
        if (
          itemNfe &&
          String(itemNfe.get('pedido_sap') || '') === String(anterior.get('pedido_numero'))
        ) {
          itemNfe.set('pedido_sap', '')
          itemNfe.set('item_pedido_sap', '')
          app.save(itemNfe)
        }
      } catch (_) {}

      gravarLog({
        usuario,
        empresa,
        nfeNumero,
        nfeChave,
        mensagem: `Vínculo desfeito: item ${anterior.get('item_numero')} desvinculado do pedido ${anterior.get('pedido_numero')}/${anterior.get('pedido_item')}, sem novo vínculo. Dados de demonstração.`,
        detalhes: {
          demo: true,
          desvinculado: true,
          item_numero: anterior.get('item_numero'),
          pedido_anterior: `${anterior.get('pedido_numero')}/${anterior.get('pedido_item')}`,
          pedido_novo: '',
        },
        quando: agora,
      })
      desvinculados.push(String(vincId))
    }

    // ---------------- VINCULAR (manual ou confirmação de sugestão) ----------------
    for (const v of itensVinc) {
      const itemNfeId = String(v.nfe_item_id || '')
      const pedidoNumero = String(v.pedido_numero || '').trim()
      const pedidoItem = String(v.pedido_item || '').trim()
      const origem = v.origem === 'automatica' ? 'automatica' : 'manual'
      const criterio = String(v.criterio || 'Vínculo manual informado pelo usuário').slice(0, 200)
      if (!itemNfeId || !pedidoNumero || !pedidoItem) continue

      // Item da NF-e pertence a esta NF?
      let itemNfe
      try {
        itemNfe = app.findRecordById('nfe_itens', itemNfeId)
      } catch (_) {
        continue
      }
      if (String(itemNfe.get('nfe') || '') !== nfeId) continue

      // Item do pedido de DEMONSTRAÇÃO existe?
      let ped
      try {
        ped = app.findFirstRecordByFilter(
          'nfe_pedidos_sap',
          `numero = "${pedidoNumero}" && item = "${pedidoItem}"`,
        )
      } catch (_) {
        ped = null
      }
      if (!ped) {
        return e.json(422, {
          sucesso: false,
          mensagem: `Item ${pedidoItem} do pedido ${pedidoNumero} não encontrado nos pedidos de demonstração (SAP indisponível).`,
        })
      }

      // Vínculo ATIVO atual deste item da NF (antes/depois para o log).
      let anterior = null
      try {
        anterior = app.findFirstRecordByFilter(
          'nfe_vinculos_pedido',
          `nfe = "${nfeId}" && nfe_item = "${itemNfeId}" && vinculado = true`,
        )
      } catch (_) {
        anterior = null
      }

      // Idempotência: mesmo pedido/item → nada a fazer.
      if (
        anterior &&
        String(anterior.get('pedido_numero')) === pedidoNumero &&
        String(anterior.get('pedido_item')) === pedidoItem
      ) {
        continue
      }

      // Fecha o vínculo anterior (novo registro vinculado=false — append-only).
      if (anterior) {
        const fechado = new Record(colVinc)
        fechado.set('nfe', nfeId)
        fechado.set('nfe_item', anterior.get('nfe_item'))
        fechado.set('nfe_numero', anterior.get('nfe_numero'))
        fechado.set('item_numero', anterior.get('item_numero'))
        fechado.set('pedido_numero', anterior.get('pedido_numero'))
        fechado.set('pedido_item', anterior.get('pedido_item'))
        fechado.set('material_sap', anterior.get('material_sap'))
        fechado.set('quantidade_vinculada', anterior.get('quantidade_vinculada'))
        fechado.set('origem', anterior.get('origem') || 'manual')
        fechado.set('criterio', 'Substituído por novo vínculo')
        fechado.set('usuario', usuario)
        fechado.set('vinculado', false)
        fechado.set('is_simulated', anterior.get('is_simulated'))
        app.save(fechado)
      }

      // Novo vínculo ATIVO.
      const novo = new Record(colVinc)
      novo.set('nfe', nfeId)
      novo.set('nfe_item', itemNfeId)
      novo.set('nfe_numero', nfeNumero)
      novo.set('item_numero', Number(itemNfe.get('item') || 0))
      novo.set('pedido_numero', pedidoNumero)
      novo.set('pedido_item', pedidoItem)
      novo.set('material_sap', String(ped.get('material_sap') || ''))
      novo.set('quantidade_vinculada', Number(itemNfe.get('quantidade') || 0))
      novo.set('origem', origem)
      novo.set('criterio', criterio)
      novo.set('usuario', usuario)
      novo.set('vinculado', true)
      novo.set('is_simulated', true)
      app.save(novo)
      criados.push({ item: novo.get('item_numero'), pedido: `${pedidoNumero}/${pedidoItem}` })

      // Propaga para o espelho por item (nfe_itens.pedido_sap / item_pedido_sap).
      itemNfe.set('pedido_sap', pedidoNumero)
      itemNfe.set('item_pedido_sap', pedidoItem)
      app.save(itemNfe)

      // Log antes/depois (dados anteriores e posteriores, sem credenciais).
      const pedidoAnterior = anterior
        ? `${anterior.get('pedido_numero')}/${anterior.get('pedido_item')}`
        : ''
      gravarLog({
        usuario,
        empresa,
        nfeNumero,
        nfeChave,
        mensagem:
          `Vínculo gravado: item ${novo.get('item_numero')} → pedido ${pedidoNumero}/${pedidoItem} ` +
          `(origem ${origem}${pedidoAnterior ? `; anterior ${pedidoAnterior}` : ''}). Dados de demonstração.`,
        detalhes: {
          demo: true,
          item_numero: Number(itemNfe.get('item') || 0),
          pedido_anterior: pedidoAnterior,
          pedido_novo: `${pedidoNumero}/${pedidoItem}`,
          criterio,
          origem,
        },
        quando: agora,
      })
    }

    if (criados.length === 0 && desvinculados.length === 0) {
      return e.json(200, {
        sucesso: true,
        mensagem: 'Nenhuma alteração necessária (vínculos já estavam nessa situação).',
        vinculos_criados: 0,
        desvinculados: 0,
        nfe_status: String(doc.get('status') || ''),
      })
    }

    // ---- Status de correlação da NF (dado real do HUB, sobre dados demo) ----
    const statusCorrelacao = calcularStatusCorrelacao(nfeId)
    doc.set('correlacao_status', statusCorrelacao)
    if (statusCorrelacao === 'Correlacionada') {
      const primeiro = criados[0]?.pedido?.split('/')[0] || ''
      if (primeiro && !String(doc.get('pedido_sap') || '')) doc.set('pedido_sap', primeiro)
    }
    app.save(doc)

    return e.json(200, {
      sucesso: true,
      mensagem: `Correlação gravada no HUB (demonstração): ${criados.length} vínculo(s), ${desvinculados.length} desvinculamento(s).`,
      vinculos_criados: criados.length,
      desvinculados: desvinculados.length,
      correlacao_status: statusCorrelacao,
      nfe_status: String(doc.get('status') || ''),
    })
  },
  $apis.requireAuth(),
)
