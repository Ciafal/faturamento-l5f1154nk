migrate(
  (app) => {
    // ------------------------------------------------------------------
    // 0013 — Recebimento KS (ENT-08): Painel de Consulta e Acompanhamento.
    // 1) Novos campos na coleção recebimentos_ks_demo (criada em 0010):
    //    status logístico, origem/destino, datas operacionais
    //    (programada/saída/recebimento), pesos previsto/enviado/recebido
    //    e situação adicional (parcial/divergência — apenas exibida).
    // 2) Atualiza os 3 envios de 0011 e semeia 6 novos (1800010004-0009),
    //    todos com DATAS RELATIVAS à data de execução (ontem/hoje/semana/
    //    mês corrente) para que os filtros Ontem|Hoje|Semana|Mês tenham
    //    conteúdo em qualquer dia. Dados de DEMONSTRAÇÃO (is_simulated).
    // ------------------------------------------------------------------

    // --- 1. Novos campos -------------------------------------------------
    var col = app.findCollectionByNameOrId('recebimentos_ks_demo')
    var novosCamposTexto = [
      'status',
      'origem',
      'destino',
      'situacao_adicional',
      'data_programada',
      'data_saida',
      'data_recebimento',
    ]
    var novosCamposNumero = ['peso_previsto', 'peso_enviado', 'peso_recebido']
    for (var i = 0; i < novosCamposTexto.length; i++) {
      if (!col.fields.getByName(novosCamposTexto[i])) {
        col.fields.add(new TextField({ name: novosCamposTexto[i] }))
      }
    }
    for (var j = 0; j < novosCamposNumero.length; j++) {
      if (!col.fields.getByName(novosCamposNumero[j])) {
        col.fields.add(new NumberField({ name: novosCamposNumero[j] }))
      }
    }
    app.save(col)

    // --- 2. Datas relativas ---------------------------------------------
    function isoDiasAtras(dias) {
      var d = new Date()
      d.setDate(d.getDate() - dias)
      return isoDeData(d)
    }
    function isoDeData(d) {
      var m = d.getMonth() + 1
      var dia = d.getDate()
      return (
        d.getFullYear() +
        '-' +
        (m < 10 ? '0' + m : '' + m) +
        '-' +
        (dia < 10 ? '0' + dia : '' + dia)
      )
    }
    function brDeISO(iso) {
      var p = iso.split('-')
      return p[2] + '/' + p[1] + '/' + p[0]
    }
    var HOJE = isoDiasAtras(0)
    var ONTEM = isoDiasAtras(1)
    var M3 = isoDiasAtras(3)
    var M2 = isoDiasAtras(2)
    var M4 = isoDiasAtras(4)
    var M10 = isoDiasAtras(10)
    var M14 = isoDiasAtras(14)
    var M15 = isoDiasAtras(15)
    var M20 = isoDiasAtras(20)

    // --- 3. Fábrica de lotes de demonstração -----------------------------
    function loteBloco(
      bloco,
      item,
      letra,
      tamanho,
      loteC,
      pesoC,
      loteR,
      qtdR,
      pesoR,
      statusL,
      rfid,
    ) {
      return {
        bloco: bloco,
        item: item,
        versao: 'A',
        material: 'BLK-ACO-' + tamanho,
        denominacao: 'BLOCO DE AÇO LAMINADO ' + tamanho.replace('x', 'X'),
        letra: letra,
        lote_coletado: loteC,
        peso_coletado: pesoC,
        lote_rfid: loteR,
        quantidade_rfid: qtdR,
        peso_rfid: pesoR,
        status_lote: statusL,
        rfid: rfid,
      }
    }
    function soma(lotes, campo) {
      var s = 0
      for (var i = 0; i < lotes.length; i++) s += lotes[i][campo] || 0
      return Math.round(s * 1000) / 1000
    }

    // --- 4. Definição dos envios -----------------------------------------
    var KILN = 'KS'
    var envios = [
      {
        // Existente (0011): Programado com programação HOJE
        numero_envio: '1800010001',
        placa_veiculo: 'RTX-8H21',
        hora_processamento: '08:12:44',
        status: 'Programado',
        status_picking: 'Parcialmente Conferido',
        origem: 'Matriz 0100',
        destino: KILN,
        data_programada: HOJE,
        data_saida: '',
        data_recebimento: '',
        data_processamento: brDeISO(HOJE),
        situacao_adicional: '',
        lotes_json: [
          loteBloco(
            'BLK-0001',
            '00010',
            'A',
            '120x120',
            'LT-KS-2025-041',
            7.512,
            'LT-KS-2025-041',
            18,
            7.512,
            'Lote OK',
            'E200000001',
          ),
          loteBloco(
            'BLK-0002',
            '00020',
            'B',
            '150x150',
            'LT-KS-2025-042',
            8.93,
            'LT-KS-2025-042',
            22,
            8.93,
            'Lote OK',
            'E200000002',
          ),
          loteBloco(
            'BLK-0003',
            '00030',
            'C',
            '180x180',
            'LT-KS-2025-043',
            6.204,
            'LT-KS-2025-044',
            12,
            6.48,
            'Divergência',
            'E200000003',
          ),
        ],
      },
      {
        // Existente (0011): Em Trânsito — saída ONTEM
        numero_envio: '1800010002',
        placa_veiculo: 'MKV-3D07',
        hora_processamento: '10:47:19',
        status: 'Em Trânsito',
        status_picking: 'Concluído',
        origem: 'Matriz 0100',
        destino: KILN,
        data_programada: ONTEM,
        data_saida: ONTEM,
        data_recebimento: '',
        data_processamento: brDeISO(ONTEM),
        situacao_adicional: '',
        lotes_json: [
          loteBloco(
            'BLK-0004',
            '00010',
            'D',
            '200x200',
            'LT-KS-2025-050',
            5.87,
            '',
            0,
            0,
            'Não consultado',
            '',
          ),
          loteBloco(
            'BLK-0005',
            '00020',
            'A',
            '100x100',
            'LT-KS-2025-051',
            4.402,
            'LT-KS-2025-051',
            10,
            4.402,
            'Lote OK',
            'E200000005',
          ),
        ],
      },
      {
        // Existente (0011): Recebido — recebimento ONTEM
        numero_envio: '1800010003',
        placa_veiculo: 'QNF-1A55',
        hora_processamento: '14:03:52',
        status: 'Recebido',
        status_picking: 'Com Divergência',
        origem: 'Filial 0200',
        destino: KILN,
        data_programada: M3,
        data_saida: M2,
        data_recebimento: ONTEM,
        data_processamento: brDeISO(ONTEM),
        situacao_adicional: 'Divergência de peso',
        lotes_json: [
          loteBloco(
            'BLK-0006',
            '00010',
            'E',
            '250x250',
            'LT-KS-2025-060',
            9.85,
            'LT-KS-2025-060',
            25,
            11.1,
            'Excesso peso',
            'E200000006',
          ),
          loteBloco(
            'BLK-0007',
            '00020',
            'A',
            '120x120',
            'LT-KS-2025-061',
            6.3,
            'LT-KS-2025-061',
            16,
            6.3,
            'Lote OK',
            'E200000007',
          ),
          loteBloco(
            'BLK-0008',
            '00030',
            'C',
            '180x180',
            'LT-KS-2025-062',
            4.117,
            'LT-KS-2025-063',
            8,
            4.3,
            'Divergência',
            'E200000008',
          ),
        ],
      },
      {
        // Novo: Programado — programação ONTEM
        numero_envio: '1800010004',
        placa_veiculo: 'KLM-7C44',
        tara: 12.3,
        hora_processamento: '09:05:31',
        status: 'Programado',
        status_picking: 'Aguardando Coleta',
        origem: 'Filial 0200',
        destino: KILN,
        data_programada: ONTEM,
        data_saida: '',
        data_recebimento: '',
        data_processamento: brDeISO(ONTEM),
        situacao_adicional: '',
        lotes_json: [
          loteBloco(
            'BLK-0009',
            '00010',
            'D',
            '100x100',
            'LT-KS-2025-070',
            5.87,
            '',
            0,
            0,
            'Não consultado',
            '',
          ),
          loteBloco(
            'BLK-0010',
            '00020',
            'E',
            '150x150',
            'LT-KS-2025-071',
            6.63,
            'LT-KS-2025-071',
            14,
            6.63,
            'Lote OK',
            'E200000010',
          ),
        ],
      },
      {
        // Novo: Em Trânsito — saída HOJE
        numero_envio: '1800010005',
        placa_veiculo: 'SDF-2B88',
        tara: 13.1,
        hora_processamento: '07:48:10',
        status: 'Em Trânsito',
        status_picking: 'Concluído',
        origem: 'Filial 0300',
        destino: KILN,
        data_programada: M4,
        data_saida: HOJE,
        data_recebimento: '',
        data_processamento: brDeISO(HOJE),
        situacao_adicional: '',
        lotes_json: [
          loteBloco(
            'BLK-0011',
            '00010',
            'A',
            '120x120',
            'LT-KS-2025-080',
            5.512,
            'LT-KS-2025-080',
            18,
            5.512,
            'Lote OK',
            'E200000011',
          ),
          loteBloco(
            'BLK-0012',
            '00020',
            'B',
            '180x180',
            'LT-KS-2025-081',
            7.204,
            'LT-KS-2025-081',
            20,
            7.204,
            'Lote OK',
            'E200000012',
          ),
          loteBloco(
            'BLK-0013',
            '00030',
            'C',
            '200x200',
            'LT-KS-2025-082',
            3.684,
            '',
            0,
            0,
            'Não consultado',
            '',
          ),
        ],
      },
      {
        // Novo: Recebido — recebimento há 10 dias (mês corrente), parcial
        numero_envio: '1800010006',
        placa_veiculo: 'PLQ-4K12',
        tara: 11.7,
        hora_processamento: '13:22:47',
        status: 'Recebido',
        status_picking: 'Parcialmente Conferido',
        origem: 'Matriz 0100',
        destino: KILN,
        data_programada: M15,
        data_saida: M14,
        data_recebimento: M10,
        data_processamento: brDeISO(M10),
        situacao_adicional: 'Recebimento parcial',
        lotes_json: [
          loteBloco(
            'BLK-0014',
            '00010',
            'A',
            '120x120',
            'LT-KS-2025-090',
            6.1,
            'LT-KS-2025-090',
            16,
            6.1,
            'Lote OK',
            'E200000014',
          ),
          loteBloco(
            'BLK-0015',
            '00020',
            'B',
            '150x150',
            'LT-KS-2025-091',
            5.44,
            'LT-KS-2025-091',
            12,
            5.44,
            'Lote OK',
            'E200000015',
          ),
          loteBloco(
            'BLK-0016',
            '00030',
            'C',
            '250x250',
            'LT-KS-2025-092',
            7.97,
            '',
            0,
            0,
            'Não consultado',
            '',
          ),
        ],
      },
      {
        // Novo: Programado — programação há 2 dias (semana corrente)
        numero_envio: '1800010007',
        placa_veiculo: 'GHX-9P33',
        tara: 12.9,
        hora_processamento: '08:30:00',
        status: 'Programado',
        status_picking: 'Aguardando Coleta',
        origem: 'Filial 0300',
        destino: KILN,
        data_programada: M2,
        data_saida: '',
        data_recebimento: '',
        data_processamento: brDeISO(M2),
        situacao_adicional: '',
        lotes_json: [
          loteBloco(
            'BLK-0017',
            '00010',
            'A',
            '100x100',
            'LT-KS-2025-100',
            4.98,
            '',
            0,
            0,
            'Não consultado',
            '',
          ),
          loteBloco(
            'BLK-0018',
            '00020',
            'B',
            '120x120',
            'LT-KS-2025-101',
            6.12,
            '',
            0,
            0,
            'Não consultado',
            '',
          ),
          loteBloco(
            'BLK-0019',
            '00030',
            'C',
            '150x150',
            'LT-KS-2025-102',
            5.77,
            '',
            0,
            0,
            'Não consultado',
            '',
          ),
          loteBloco(
            'BLK-0020',
            '00040',
            'D',
            '200x200',
            'LT-KS-2025-103',
            4.35,
            '',
            0,
            0,
            'Não consultado',
            '',
          ),
        ],
      },
      {
        // Novo: Recebido — recebimento HOJE, divergência de peso
        numero_envio: '1800010008',
        placa_veiculo: 'TUV-6D19',
        tara: 14.2,
        hora_processamento: '10:15:33',
        status: 'Recebido',
        status_picking: 'Com Divergência',
        origem: 'Filial 0200',
        destino: KILN,
        data_programada: ONTEM,
        data_saida: ONTEM,
        data_recebimento: HOJE,
        data_processamento: brDeISO(HOJE),
        situacao_adicional: 'Divergência de peso',
        lotes_json: [
          loteBloco(
            'BLK-0021',
            '00010',
            'E',
            '180x180',
            'LT-KS-2025-110',
            7.85,
            'LT-KS-2025-110',
            21,
            8.24,
            'Excesso peso',
            'E200000021',
          ),
          loteBloco(
            'BLK-0022',
            '00020',
            'A',
            '120x120',
            'LT-KS-2025-111',
            5.63,
            'LT-KS-2025-111',
            15,
            5.63,
            'Lote OK',
            'E200000022',
          ),
        ],
      },
      {
        // Novo: Programado — programação há 20 dias (mês corrente)
        numero_envio: '1800010009',
        placa_veiculo: 'BNM-3F77',
        tara: 13.6,
        hora_processamento: '14:41:05',
        status: 'Programado',
        status_picking: 'Aguardando Coleta',
        origem: 'Matriz 0100',
        destino: KILN,
        data_programada: M20,
        data_saida: '',
        data_recebimento: '',
        data_processamento: brDeISO(M20),
        situacao_adicional: '',
        lotes_json: [
          loteBloco(
            'BLK-0023',
            '00010',
            'B',
            '150x150',
            'LT-KS-2025-120',
            6.44,
            '',
            0,
            0,
            'Não consultado',
            '',
          ),
          loteBloco(
            'BLK-0024',
            '00020',
            'C',
            '250x250',
            'LT-KS-2025-121',
            8.31,
            '',
            0,
            0,
            'Não consultado',
            '',
          ),
        ],
      },
    ]

    // --- 5. Cria (ou atualiza) cada envio de forma idempotente ------------
    for (var k = 0; k < envios.length; k++) {
      var e = envios[k]
      var existentes = app.findRecordsByFilter(
        'recebimentos_ks_demo',
        "numero_envio = '" + e.numero_envio + "'",
        '',
        0,
        0,
      )
      var rec = existentes.length > 0 ? existentes[0] : new Record(col)
      rec.set('process_type', 'recebimento_ks')
      rec.set('numero_envio', e.numero_envio)
      rec.set('placa_veiculo', e.placa_veiculo)
      rec.set('hora_processamento', e.hora_processamento)
      rec.set('status', e.status)
      rec.set('status_picking', e.status_picking)
      rec.set('origem', e.origem)
      rec.set('destino', e.destino)
      rec.set('data_programada', e.data_programada)
      rec.set('data_saida', e.data_saida)
      rec.set('data_recebimento', e.data_recebimento)
      rec.set('data_processamento', e.data_processamento)
      rec.set('situacao_adicional', e.situacao_adicional)
      rec.set('peso_previsto', soma(e.lotes_json, 'peso_coletado'))
      rec.set('peso_enviado', e.data_saida ? soma(e.lotes_json, 'peso_coletado') : 0)
      rec.set('peso_recebido', e.data_recebimento ? soma(e.lotes_json, 'peso_rfid') : 0)
      rec.set('lotes_json', e.lotes_json)
      rec.set('is_simulated', true)
      // Envios novos (sem tara definida em 0011) recebem bruto/tara coerentes
      // com a balança: bruto = coletado + tara.
      if (e.tara !== undefined) {
        rec.set('tara', e.tara)
        rec.set(
          'peso_bruto',
          Math.round((soma(e.lotes_json, 'peso_coletado') + e.tara) * 1000) / 1000,
        )
      }
      app.save(rec)
    }
  },
  (app) => {
    // Rollback: remove os envios criados aqui e os campos adicionados.
    var numeros = [
      '1800010004',
      '1800010005',
      '1800010006',
      '1800010007',
      '1800010008',
      '1800010009',
    ]
    for (var i = 0; i < numeros.length; i++) {
      try {
        var existentes = app.findRecordsByFilter(
          'recebimentos_ks_demo',
          "numero_envio = '" + numeros[i] + "'",
          '',
          0,
          0,
        )
        for (var k = 0; k < existentes.length; k++) app.delete(existentes[k])
      } catch (_) {}
    }
    try {
      var col = app.findCollectionByNameOrId('recebimentos_ks_demo')
      var campos = [
        'status',
        'origem',
        'destino',
        'situacao_adicional',
        'data_programada',
        'data_saida',
        'data_recebimento',
        'peso_previsto',
        'peso_enviado',
        'peso_recebido',
      ]
      for (var j = 0; j < campos.length; j++) {
        try {
          col.fields.removeByName(campos[j])
        } catch (_) {}
      }
      app.save(col)
    } catch (_) {}
  },
)
