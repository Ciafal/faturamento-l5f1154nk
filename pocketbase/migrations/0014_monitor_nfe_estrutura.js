//
// Migration 0014 — Monitor NF-e de Entrada (ENT-09): estrutura.
// Cria as coleções do fluxo HUB (8 status) e a configuração do serviço SEFAZ.
// Seed de dados demo é feita DEPOIS, na migration 0015 (padrão do projeto:
// seed sempre após a criação da coleção — erro histórico da 0010/0011).
//
// Regras de acesso: leitura e criação para usuários autenticados (acusar
// recebimento grava pelo front); update/delete NULOS — sem edição nem
// exclusão via API (auditoria append-only em nfe_logs; coleções de estado/
// config só por superuser/hooks/migrations).
//
migrate(
  (app) => {
    const AUT = "@request.auth.id != ''"

    const auditDates = () => [
      { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
      { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
    ]

    // ---------- nfe_documentos ----------
    const docs = new Collection({
      type: 'base',
      name: 'nfe_documentos',
      listRule: AUT,
      viewRule: AUT,
      createRule: AUT,
      updateRule: null,
      deleteRule: null,
      fields: [
        { name: 'empresa', type: 'text', required: true },
        { name: 'cnpj_destinatario', type: 'text' },
        { name: 'numero', type: 'text', required: true },
        { name: 'serie', type: 'text', required: true },
        { name: 'chave_acesso', type: 'text', required: true },
        { name: 'data_emissao', type: 'date' },
        { name: 'fornecedor_razao_social', type: 'text' },
        { name: 'fornecedor_cnpj', type: 'text' },
        { name: 'fornecedor_ie', type: 'text' },
        { name: 'cfop', type: 'text' },
        { name: 'natureza_operacao', type: 'text' },
        { name: 'valor_total', type: 'number' },
        { name: 'valor_produtos', type: 'number' },
        { name: 'valor_icms', type: 'number' },
        { name: 'valor_ipi', type: 'number' },
        { name: 'valor_st', type: 'number' },
        { name: 'valor_frete', type: 'number' },
        {
          name: 'status',
          type: 'select',
          required: true,
          values: [
            'NF-e Nova',
            'Aguardando Recebimento',
            'Recebida',
            'Aguardando Vinculação SAP',
            'Com Divergência',
            'Apta para Entrada',
            'Entrada SAP Realizada',
            'Cancelada',
          ],
        },
        { name: 'data_recebimento', type: 'date' },
        { name: 'usuario_recebedor', type: 'text' },
        { name: 'centro', type: 'text' },
        { name: 'local_recebimento', type: 'text' },
        { name: 'observacoes_recebimento', type: 'text' },
        { name: 'pedido_sap', type: 'text' },
        { name: 'entrada_sap_doc', type: 'text' },
        { name: 'tem_divergencia', type: 'bool' },
        { name: 'is_simulated', type: 'bool' },
        { name: 'xml_demo', type: 'text' },
        { name: 'protocolo_autorizacao', type: 'text' },
        { name: 'data_autorizacao', type: 'date' },
        ...auditDates(),
      ],
      indexes: [
        'CREATE UNIQUE INDEX idx_nfe_docs_chave ON nfe_documentos (chave_acesso)',
        'CREATE INDEX idx_nfe_docs_status ON nfe_documentos (status)',
        'CREATE INDEX idx_nfe_docs_numero ON nfe_documentos (numero)',
      ],
    })
    app.save(docs)
    const docsId = docs.id

    // ---------- nfe_itens ----------
    app.save(
      new Collection({
        type: 'base',
        name: 'nfe_itens',
        listRule: AUT,
        viewRule: AUT,
        createRule: AUT,
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            name: 'nfe',
            type: 'relation',
            required: true,
            collectionId: docsId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'item', type: 'number' },
          { name: 'codigo_produto_fornecedor', type: 'text' },
          { name: 'descricao', type: 'text' },
          { name: 'ncm', type: 'text' },
          { name: 'cfop', type: 'text' },
          { name: 'quantidade', type: 'number' },
          { name: 'unidade', type: 'text' },
          { name: 'valor_unitario', type: 'number' },
          { name: 'valor_total', type: 'number' },
          { name: 'pedido_informado_xml', type: 'text' },
          { name: 'item_pedido', type: 'text' },
          ...auditDates(),
        ],
        indexes: ['CREATE INDEX idx_nfe_itens_nfe ON nfe_itens (nfe)'],
      }),
    )

    // ---------- nfe_recebimentos ----------
    app.save(
      new Collection({
        type: 'base',
        name: 'nfe_recebimentos',
        listRule: AUT,
        viewRule: AUT,
        createRule: AUT,
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            name: 'nfe',
            type: 'relation',
            required: true,
            collectionId: docsId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'empresa', type: 'text' },
          { name: 'numero', type: 'text' },
          { name: 'serie', type: 'text' },
          { name: 'fornecedor', type: 'text' },
          { name: 'data_recebimento', type: 'date' },
          { name: 'hora_recebimento', type: 'text' },
          { name: 'usuario_recebedor', type: 'text' },
          { name: 'centro', type: 'text' },
          { name: 'local_recebimento', type: 'text' },
          { name: 'observacoes', type: 'text' },
          { name: 'recebimento_fisico_confirmado', type: 'bool' },
          { name: 'is_simulated', type: 'bool' },
          ...auditDates(),
        ],
        indexes: ['CREATE INDEX idx_nfe_receb_nfe ON nfe_recebimentos (nfe)'],
      }),
    )

    // ---------- nfe_divergencias ----------
    app.save(
      new Collection({
        type: 'base',
        name: 'nfe_divergencias',
        listRule: AUT,
        viewRule: AUT,
        createRule: AUT,
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            name: 'nfe',
            type: 'relation',
            required: true,
            collectionId: docsId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'tipo', type: 'select', values: ['Informativa', 'Atenção', 'Bloqueante'] },
          { name: 'descricao', type: 'text' },
          { name: 'origem', type: 'text' },
          { name: 'data_deteccao', type: 'date' },
          ...auditDates(),
        ],
        indexes: ['CREATE INDEX idx_nfe_div_nfe ON nfe_divergencias (nfe)'],
      }),
    )

    // ---------- nfe_entrada_sap ----------
    app.save(
      new Collection({
        type: 'base',
        name: 'nfe_entrada_sap',
        listRule: AUT,
        viewRule: AUT,
        createRule: AUT,
        updateRule: null,
        deleteRule: null,
        fields: [
          {
            name: 'nfe',
            type: 'relation',
            required: true,
            collectionId: docsId,
            maxSelect: 1,
            cascadeDelete: true,
          },
          { name: 'numero_documento', type: 'text' },
          { name: 'data_entrada', type: 'date' },
          { name: 'usuario', type: 'text' },
          { name: 'centro', type: 'text' },
          { name: 'observacoes', type: 'text' },
          { name: 'is_simulated', type: 'bool' },
          ...auditDates(),
        ],
        indexes: ['CREATE INDEX idx_nfe_entsap_nfe ON nfe_entrada_sap (nfe)'],
      }),
    )

    // ---------- nfe_logs (auditoria append-only) ----------
    app.save(
      new Collection({
        type: 'base',
        name: 'nfe_logs',
        listRule: AUT,
        viewRule: AUT,
        createRule: AUT,
        updateRule: null, // sem update
        deleteRule: null, // sem delete
        fields: [
          { name: 'usuario', type: 'text' },
          { name: 'empresa', type: 'text' },
          { name: 'acao', type: 'text', required: true },
          { name: 'nfe_numero', type: 'text' },
          { name: 'nfe_chave_acesso', type: 'text' },
          { name: 'status_anterior', type: 'text' },
          { name: 'status_novo', type: 'text' },
          { name: 'mensagem', type: 'text' },
          { name: 'detalhes_json', type: 'json' },
          { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        ],
        indexes: ['CREATE INDEX idx_nfe_logs_nfe ON nfe_logs (nfe_numero)'],
      }),
    )

    // ---------- nfe_sync_state ----------
    app.save(
      new Collection({
        type: 'base',
        name: 'nfe_sync_state',
        listRule: AUT,
        viewRule: AUT,
        createRule: null,
        updateRule: null, // só superuser/hook — estado mantido pelo serviço
        deleteRule: null,
        fields: [
          { name: 'servico', type: 'text', required: true },
          { name: 'ultima_sincronizacao', type: 'date' },
          { name: 'ultimo_status', type: 'text' },
          { name: 'ultima_mensagem', type: 'text' },
          { name: 'total_tentativas', type: 'number' },
          { name: 'total_erros', type: 'number' },
          ...auditDates(),
        ],
        indexes: ['CREATE UNIQUE INDEX idx_nfe_sync_servico ON nfe_sync_state (servico)'],
      }),
    )

    // ---------- nfe_config ----------
    app.save(
      new Collection({
        type: 'base',
        name: 'nfe_config',
        listRule: AUT,
        viewRule: AUT,
        createRule: null,
        updateRule: null, // só superuser/hook
        deleteRule: null,
        fields: [
          { name: 'chave', type: 'text', required: true },
          { name: 'ambiente', type: 'text' },
          { name: 'certificado_presente', type: 'bool' },
          { name: 'descricao', type: 'text' },
          ...auditDates(),
        ],
        indexes: ['CREATE UNIQUE INDEX idx_nfe_config_chave ON nfe_config (chave)'],
      }),
    )

    // Config inicial: SEM certificado digital A1 — serviço SEFAZ bloqueado.
    const colCfg = app.findCollectionByNameOrId('nfe_config')
    const cfg = new Record(colCfg)
    cfg.set('chave', 'sefaz')
    cfg.set('ambiente', 'homologacao')
    cfg.set('certificado_presente', false)
    cfg.set(
      'descricao',
      'Sincronização SEFAZ (Fase 1) — bloqueada: pendência de certificado digital A1 e credenciais SEFAZ da Ciafal. Integração real futura via RFC/BAPI no SAP ECC.',
    )
    app.save(cfg)
  },
  (app) => {
    for (const nome of [
      'nfe_config',
      'nfe_sync_state',
      'nfe_logs',
      'nfe_entrada_sap',
      'nfe_divergencias',
      'nfe_recebimentos',
      'nfe_itens',
      'nfe_documentos',
    ]) {
      try {
        const col = app.findCollectionByNameOrId(nome)
        app.delete(col)
      } catch (_) {
        // coleção não existe — ok no rollback
      }
    }
  },
)
