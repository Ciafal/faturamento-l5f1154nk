migrate(
  (app) => {
    // ------------------------------------------------------------------
    // 0011 — Recebimento KS: 3 envios de DEMONSTRAÇÃO (is_simulated = true)
    // na coleção recebimentos_ks_demo (criada em 0010). Blocos/materiais/
    // letras/lotes/pesos são inventados para demo — nenhum dado real,
    // nenhuma regra SAP.
    // ------------------------------------------------------------------
    const col = app.findCollectionByNameOrId('recebimentos_ks_demo')

    const envios = [
      {
        numero_envio: '1800010001',
        placa_veiculo: 'RTX-8H21',
        data_processamento: '12/04/2025',
        hora_processamento: '08:12:44',
        status_picking: 'Parcialmente Conferido',
        peso_bruto: 38.42,
        tara: 14.5,
        lotes_json: [
          {
            bloco: 'BLK-0001',
            item: '00010',
            versao: 'A',
            material: 'BLK-ACO-120x120',
            denominacao: 'BLOCO DE AÇO LAMINADO 120X120',
            letra: 'A',
            lote_coletado: 'LT-KS-2025-041',
            peso_coletado: 7.512,
            lote_rfid: 'LT-KS-2025-041',
            quantidade_rfid: 18,
            peso_rfid: 7.512,
            status_lote: 'Lote OK',
            rfid: 'E200000001',
          },
          {
            bloco: 'BLK-0002',
            item: '00020',
            versao: 'A',
            material: 'BLK-ACO-150x150',
            denominacao: 'BLOCO DE AÇO LAMINADO 150X150',
            letra: 'B',
            lote_coletado: 'LT-KS-2025-042',
            peso_coletado: 8.93,
            lote_rfid: 'LT-KS-2025-042',
            quantidade_rfid: 22,
            peso_rfid: 8.93,
            status_lote: 'Lote OK',
            rfid: 'E200000002',
          },
          {
            bloco: 'BLK-0003',
            item: '00030',
            versao: 'B',
            material: 'BLK-ACO-180x180',
            denominacao: 'BLOCO DE AÇO LAMINADO 180X180',
            letra: 'C',
            lote_coletado: 'LT-KS-2025-043',
            peso_coletado: 6.204,
            lote_rfid: 'LT-KS-2025-044',
            quantidade_rfid: 12,
            peso_rfid: 6.48,
            status_lote: 'Divergência',
            rfid: 'E200000003',
          },
        ],
        is_simulated: true,
      },
      {
        numero_envio: '1800010002',
        placa_veiculo: 'MKV-3D07',
        data_processamento: '12/04/2025',
        hora_processamento: '10:47:19',
        status_picking: 'Concluído',
        peso_bruto: 25.98,
        tara: 11.2,
        lotes_json: [
          {
            bloco: 'BLK-0004',
            item: '00010',
            versao: 'C',
            material: 'BLK-ACO-200x200',
            denominacao: 'BLOCO DE AÇO LAMINADO 200X200',
            letra: 'D',
            lote_coletado: 'LT-KS-2025-050',
            peso_coletado: 5.87,
            lote_rfid: '',
            quantidade_rfid: 0,
            peso_rfid: 0,
            status_lote: 'Não consultado',
            rfid: '',
          },
          {
            bloco: 'BLK-0005',
            item: '00020',
            versao: 'A',
            material: 'BLK-ACO-100x100',
            denominacao: 'BLOCO DE AÇO LAMINADO 100X100',
            letra: 'A',
            lote_coletado: 'LT-KS-2025-051',
            peso_coletado: 4.402,
            lote_rfid: 'LT-KS-2025-051',
            quantidade_rfid: 10,
            peso_rfid: 4.402,
            status_lote: 'Lote OK',
            rfid: 'E200000005',
          },
        ],
        is_simulated: true,
      },
      {
        numero_envio: '1800010003',
        placa_veiculo: 'QNF-1A55',
        data_processamento: '13/04/2025',
        hora_processamento: '14:03:52',
        status_picking: 'Com Divergência',
        peso_bruto: 41.77,
        tara: 15.3,
        lotes_json: [
          {
            bloco: 'BLK-0006',
            item: '00010',
            versao: 'B',
            material: 'BLK-ACO-250x250',
            denominacao: 'BLOCO DE AÇO LAMINADO 250X250',
            letra: 'E',
            lote_coletado: 'LT-KS-2025-060',
            peso_coletado: 9.85,
            lote_rfid: 'LT-KS-2025-060',
            quantidade_rfid: 25,
            peso_rfid: 11.1,
            status_lote: 'Excesso peso',
            rfid: 'E200000006',
          },
          {
            bloco: 'BLK-0007',
            item: '00020',
            versao: 'A',
            material: 'BLK-ACO-120x120',
            denominacao: 'BLOCO DE AÇO LAMINADO 120X120',
            letra: 'A',
            lote_coletado: 'LT-KS-2025-061',
            peso_coletado: 6.3,
            lote_rfid: 'LT-KS-2025-061',
            quantidade_rfid: 16,
            peso_rfid: 6.3,
            status_lote: 'Lote OK',
            rfid: 'E200000007',
          },
          {
            bloco: 'BLK-0008',
            item: '00030',
            versao: 'C',
            material: 'BLK-ACO-180x180',
            denominacao: 'BLOCO DE AÇO LAMINADO 180X180',
            letra: 'C',
            lote_coletado: 'LT-KS-2025-062',
            peso_coletado: 4.117,
            lote_rfid: 'LT-KS-2025-063',
            quantidade_rfid: 8,
            peso_rfid: 4.3,
            status_lote: 'Divergência',
            rfid: 'E200000008',
          },
        ],
        is_simulated: true,
      },
    ]

    for (const e of envios) {
      try {
        app.findFirstRecordByFilter(
          'recebimentos_ks_demo',
          `process_type = 'recebimento_ks' && numero_envio = '${e.numero_envio}'`,
        )
      } catch (_) {
        const rec = new Record(col)
        rec.set('process_type', 'recebimento_ks')
        rec.set('numero_envio', e.numero_envio)
        rec.set('placa_veiculo', e.placa_veiculo)
        rec.set('data_processamento', e.data_processamento)
        rec.set('hora_processamento', e.hora_processamento)
        rec.set('status_picking', e.status_picking)
        rec.set('peso_bruto', e.peso_bruto)
        rec.set('tara', e.tara)
        rec.set('lotes_json', e.lotes_json)
        rec.set('is_simulated', e.is_simulated)
        app.save(rec)
      }
    }
  },
  (app) => {
    // Rollback: remove apenas os envios simulados criados por esta migration
    try {
      const demos = app.findRecordsByFilter(
        'recebimentos_ks_demo',
        "process_type = 'recebimento_ks'",
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
