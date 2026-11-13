//
// Migration 0019 — Monitor NF-e ETAPA 2 (correção da 0018 aplicada no banco
// vivo): a coleção nfe_vinculos_pedido ficou sem o campo bool "vinculado"
// (append-only: registro vinculado=true é o vínculo ativo; desvincular cria
// novo registro com vinculado=false — o hook nfeCorrelacao.pb.js usa o campo).
// Idempotente: só adiciona o campo se não existir e marca como ativos os
// vínculos já gravados (só pode existir o vínculo demo da 0018).
//
migrate(
  (app) => {
    let col
    try {
      col = app.findCollectionByNameOrId('nfe_vinculos_pedido')
    } catch (_) {
      return // coleção ainda não existe (banco limpo) — 0018 criará completa
    }
    if (!col.fields.getByName('vinculado')) {
      col.fields.add(new BoolField({ name: 'vinculado' }))
      app.save(col)
    }
    // Backfill: todo vínculo já gravado antes do campo era ativo.
    try {
      const ativar = app.findRecordsByFilter('nfe_vinculos_pedido', 'vinculado != true', '', 0, 0)
      for (const r of ativar) {
        r.set('vinculado', true)
        app.save(r)
      }
    } catch (_) {}
  },
  (app) => {
    try {
      const col = app.findCollectionByNameOrId('nfe_vinculos_pedido')
      if (col.fields.getByName('vinculado')) {
        col.fields.removeByName('vinculado')
        app.save(col)
      }
    } catch (_) {}
  },
)
