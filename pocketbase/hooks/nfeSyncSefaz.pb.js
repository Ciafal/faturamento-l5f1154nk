//
// pb_hooks — Monitor NF-e de Entrada (ENT-09)
// Endpoint XHR "POST /backend/v1/ciafal/nfe/sync-sefaz": serviço de sincronização
// SEFAZ estruturado no backend, BLOQUEADO por falta de certificado digital A1
// e credenciais SEFAZ da Ciafal (Fase 1 — sem integração com SEFAZ/SAP).
//
// O que ele faz de verdade (sem simular captura):
//   1. Lê a configuração em nfe_config (certificado_presente = false).
//   2. Registra a tentativa em nfe_sync_state (contador de tentativas,
//      última sincronização em UTC) — append-only nos logs nfe_logs.
//   3. Retorna status "bloqueado_certificado" com a pendência, que a tela
//      exibe ao usuário. NENHUMA captura de documentos é simulada.
//
routerAdd(
  'POST',
  '/backend/v1/ciafal/nfe/sync-sefaz',
  (e) => {
    const agora = new Date().toISOString()

    // 1. Configuração do serviço (criada pela migration 0014).
    let cfg
    try {
      cfg = app.findFirstRecordByFilter('nfe_config', 'chave = "sefaz"')
    } catch (_) {
      cfg = null
    }
    const certPresente = cfg ? !!cfg.get('certificado_presente') : false
    const ambiente = cfg ? String(cfg.get('ambiente') || 'homologacao') : 'homologacao'

    let usuario = ''
    try {
      if (e.auth) usuario = e.auth.get('email') || e.auth.id
    } catch (_) {}

    let mensagem = ''
    let status = ''

    if (certPresente) {
      // Caminho preparado para a Fase 2 (RFC/BAPI + certificado A1): não
      // implementado nesta fase — a captura real nunca é simulada.
      status = 'nao_implementado'
      mensagem =
        'Certificado configurado, porém a captura real via SEFAZ (RFC/BAPI no SAP ECC) não está implementada na Fase 1 do Monitor NF-e.'
    } else {
      status = 'bloqueado_certificado'
      mensagem =
        'Captura SEFAZ NÃO realizada: pendência de certificado digital A1 da Ciafal e credenciais SEFAZ. Cadastre o certificado (nfe_config) e as credenciais para habilitar a sincronização. Nenhum documento foi capturado ou alterado.'
    }

    // 2. Estado da sincronização (upsert do estado, idempotente).
    let st
    try {
      st = app.findFirstRecordByFilter('nfe_sync_state', 'servico = "sefaz"')
    } catch (_) {
      st = null
    }
    if (!st) {
      const col = app.findCollectionByNameOrId('nfe_sync_state')
      st = new Record(col)
      st.set('servico', 'sefaz')
      st.set('total_tentativas', 0)
      st.set('total_erros', 0)
    }
    st.set('ultima_sincronizacao', agora)
    st.set('ultimo_status', status)
    st.set('ultima_mensagem', mensagem)
    st.set('total_tentativas', Number(st.get('total_tentativas') || 0) + 1)
    if (status !== 'ok') {
      st.set('total_erros', Number(st.get('total_erros') || 0) + 1)
    }
    app.save(st)

    // 3. Log de auditoria append-only (nfe_logs não tem update/delete).
    const colLogs = app.findCollectionByNameOrId('nfe_logs')
    const log = new Record(colLogs)
    log.set('usuario', usuario)
    log.set('empresa', 'Ciafal')
    log.set('acao', 'sync_sefaz')
    log.set('nfe_numero', '')
    log.set('nfe_chave_acesso', '')
    log.set('status_anterior', '')
    log.set('status_novo', '')
    log.set('mensagem', mensagem)
    log.set('detalhes_json', {
      servico: 'sefaz',
      status: status,
      ambiente: ambiente,
      certificado_presente: certPresente,
      data_utc: agora,
      origem: 'monitor_nfe',
    })
    app.save(log)

    // 4. Resposta estruturada ao front (nunca "captura concluída").
    return e.json(200, {
      status: status,
      sucesso: false,
      capturou_documentos: false,
      mensagem: mensagem,
      data_utc: agora,
      ambiente: ambiente,
      certificado_presente: certPresente,
    })
  },
  $apis.requireAuth(),
)
