migrate(
  (app) => {
    // 1. Update users collection to add role, company, active
    const users = app.findCollectionByNameOrId('_pb_users_auth_')
    if (!users.fields.getByName('role')) {
      users.fields.add(
        new SelectField({
          name: 'role',
          values: [
            'consultor',
            'operador_recebimento',
            'operador_saida',
            'reprocessador',
            'auditor',
            'administrador',
          ],
          maxSelect: 1,
        }),
      )
    }
    if (!users.fields.getByName('company')) {
      users.fields.add(
        new TextField({
          name: 'company',
        }),
      )
    }
    app.save(users)

    // 2. Demonstration / Mock Invoices (notas_fiscais)
    const notasCollection = new Collection({
      name: 'notas_fiscais',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        {
          name: 'process_type',
          type: 'select',
          required: true,
          values: ['produto_acabado', 'sucata_carepa_argola'],
          maxSelect: 1,
        },
        { name: 'numero_nf', type: 'text', required: true },
        { name: 'serie_nf', type: 'text', required: true },
        { name: 'fornecedor_codigo', type: 'text', required: true },
        { name: 'fornecedor_nome', type: 'text', required: true },
        { name: 'fornecedor_cnpj', type: 'text' },
        { name: 'cliente_codigo', type: 'text' },
        { name: 'cliente_nome', type: 'text' },
        { name: 'cliente_cnpj', type: 'text' },
        { name: 'categoria_nf', type: 'text', required: true },
        { name: 'data_emissao', type: 'text' },
        { name: 'valor_total', type: 'number' },
        { name: 'placa_veiculo', type: 'text' },
        { name: 'chave_acesso', type: 'text' },
        {
          name: 'status_recebimento',
          type: 'select',
          values: [
            'nao_concluido',
            'fisico_concluido_pendente_fiscal',
            'concluido',
            'erro_integracao',
          ],
          maxSelect: 1,
        },
        { name: 'status_sap_codigo', type: 'text' },
        { name: 'status_sap_descricao', type: 'text' },
        { name: 'doc_sap_migo', type: 'text' },
        { name: 'doc_sap_miro', type: 'text' },
        { name: 'itens_json', type: 'json' },
        { name: 'pedidos_json', type: 'json' },
        { name: 'integracao_json', type: 'json' },
        { name: 'is_simulated', type: 'bool' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_nf_busca ON notas_fiscais (process_type, numero_nf, serie_nf, fornecedor_codigo)',
      ],
    })
    app.save(notasCollection)

    // 3. Process History (historico_processamentos)
    const historicoCollection = new Collection({
      name: 'historico_processamentos',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'user_id', type: 'relation', collectionId: '_pb_users_auth_', maxSelect: 1 },
        { name: 'user_email', type: 'text' },
        { name: 'user_nome', type: 'text' },
        { name: 'empresa', type: 'text', required: true },
        { name: 'processo_id', type: 'text', required: true },
        { name: 'processo_nome', type: 'text', required: true },
        { name: 'tipo_operacao', type: 'select', values: ['entrada', 'saida'], maxSelect: 1 },
        { name: 'numero_nf', type: 'text', required: true },
        { name: 'serie_nf', type: 'text', required: true },
        { name: 'fornecedor', type: 'text' },
        { name: 'cliente', type: 'text' },
        { name: 'status_anterior', type: 'text' },
        { name: 'status_posterior', type: 'text' },
        {
          name: 'resultado',
          type: 'select',
          required: true,
          values: ['sucesso', 'pendente', 'erro', 'ja_processado'],
          maxSelect: 1,
        },
        { name: 'documento_sap', type: 'text' },
        { name: 'mensagens', type: 'text' },
        { name: 'detalhes_json', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: [
        'CREATE INDEX idx_hist_proc_created ON historico_processamentos (processo_id, created DESC)',
      ],
    })
    app.save(historicoCollection)

    // 4. Module Parameters (parametros_modulo)
    const parametrosCollection = new Collection({
      name: 'parametros_modulo',
      type: 'base',
      listRule: "@request.auth.id != ''",
      viewRule: "@request.auth.id != ''",
      createRule: "@request.auth.id != ''",
      updateRule: "@request.auth.id != ''",
      deleteRule: "@request.auth.id != ''",
      fields: [
        { name: 'chave', type: 'text', required: true },
        { name: 'categoria', type: 'text', required: true },
        { name: 'descricao', type: 'text' },
        { name: 'valor_json', type: 'json' },
        { name: 'created', type: 'autodate', onCreate: true, onUpdate: false },
        { name: 'updated', type: 'autodate', onCreate: true, onUpdate: true },
      ],
      indexes: ['CREATE UNIQUE INDEX idx_param_chave ON parametros_modulo (chave)'],
    })
    app.save(parametrosCollection)
  },
  (app) => {
    try {
      const p = app.findCollectionByNameOrId('parametros_modulo')
      app.delete(p)
    } catch (_) {}
    try {
      const h = app.findCollectionByNameOrId('historico_processamentos')
      app.delete(h)
    } catch (_) {}
    try {
      const n = app.findCollectionByNameOrId('notas_fiscais')
      app.delete(n)
    } catch (_) {}
  },
)
