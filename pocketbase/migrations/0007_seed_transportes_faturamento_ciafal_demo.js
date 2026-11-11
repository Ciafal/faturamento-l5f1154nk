migrate(
  (app) => {
    // ------------------------------------------------------------------
    // 0007 — Faturamento Ciafal (SAI-01, tela SAPMZSD076): transportes de demonstração
    //
    // Depende da coleção transportes_faturamento criada em 0006.
    // TODOS os valores são SIMULADOS (is_simulated = true): não correspondem a
    // transportes, balanças ou lotes reais. A lógica de comparação de
    // lotes/saldos/pesos do ABAP não foi fornecida; os status abaixo são
    // apenas dados de exemplo.
    // ------------------------------------------------------------------
    const colName = 'transportes_faturamento'
    const transportesCol = app.findCollectionByNameOrId(colName)

    const mockTransportes = [
      {
        process_type: 'faturamento_ciafal',
        tknum: '0800012345',
        placa_veiculo: 'GHT-7A55',
        data_processamento: '14/03/2025',
        hora_processamento: '08:30:15',
        status_picking: 'Completo',
        peso_bruto: 42.85,
        tara: 14.2,
        peso_coletado: 28.52,
        peso_rfid: 28.48,
        lotes_json: [
          {
            remessa: '8000456701',
            item: '00010',
            versao: '1',
            material: 'PA-TUBO-ESTR-80',
            denominacao: 'TUBO ESTRUTURAL RETANGULAR 80X40',
            lote_coletado: 'LT-TUB-501C',
            peso_coletado: 10.26,
            lote_rfid: 'LT-TUB-501C',
            quantidade_rfid: 4,
            status_lote: 'Lote OK',
            rfid: 'SIM-RFID-0001',
          },
          {
            remessa: '8000456701',
            item: '00020',
            versao: '1',
            material: 'PA-PERFIL-U-100',
            denominacao: 'PERFIL METÁLICO U ENRIJECIDO 100MM',
            lote_coletado: 'LT-PERF-229',
            peso_coletado: 9.14,
            lote_rfid: 'LT-PERF-229',
            quantidade_rfid: 3,
            status_lote: 'Lote OK',
            rfid: 'SIM-RFID-0002',
          },
          {
            remessa: '8000456702',
            item: '00010',
            versao: '1',
            material: 'PA-TUBO-ESTR-80',
            denominacao: 'TUBO ESTRUTURAL RETANGULAR 80X40',
            lote_coletado: 'LT-TUB-502A',
            peso_coletado: 5.12,
            lote_rfid: 'LT-TUB-502A',
            quantidade_rfid: 2,
            status_lote: 'Saldo remessa',
            rfid: 'SIM-RFID-0003',
          },
          {
            remessa: '8000456702',
            item: '00020',
            versao: '1',
            material: 'PA-PERFIL-U-100',
            denominacao: 'PERFIL METÁLICO U ENRIJECIDO 100MM',
            lote_coletado: 'LT-PERF-230',
            peso_coletado: 4.0,
            lote_rfid: 'LT-PERF-231',
            quantidade_rfid: 1,
            status_lote: 'Divergência RFID',
            rfid: 'SIM-RFID-0004',
          },
        ],
        is_simulated: true,
      },
      {
        process_type: 'faturamento_ciafal',
        tknum: '0800012346',
        placa_veiculo: 'PLK-2B18',
        data_processamento: '14/03/2025',
        hora_processamento: '10:05:40',
        status_picking: 'Parcial',
        peso_bruto: 38.7,
        tara: 13.9,
        peso_coletado: 24.6,
        peso_rfid: 24.55,
        lotes_json: [
          {
            remessa: '8000456711',
            item: '00010',
            versao: '1',
            material: 'PA-PERFIL-U-100',
            denominacao: 'PERFIL METÁLICO U ENRIJECIDO 100MM',
            lote_coletado: 'LT-PERF-240',
            peso_coletado: 12.3,
            lote_rfid: 'LT-PERF-240',
            quantidade_rfid: 6,
            status_lote: 'Lote OK',
            rfid: 'SIM-RFID-0010',
          },
          {
            remessa: '8000456712',
            item: '00010',
            versao: '2',
            material: 'PA-TUBO-ESTR-80',
            denominacao: 'TUBO ESTRUTURAL RETANGULAR 80X40',
            lote_coletado: 'LT-TUB-510',
            peso_coletado: 9.8,
            lote_rfid: 'LT-TUB-510',
            quantidade_rfid: 5,
            status_lote: 'Excesso peso',
            rfid: 'SIM-RFID-0011',
          },
          {
            remessa: '8000456713',
            item: '00010',
            versao: '1',
            material: 'PA-TUBO-ESTR-80',
            denominacao: 'TUBO ESTRUTURAL RETANGULAR 80X40',
            lote_coletado: 'LT-TUB-511',
            peso_coletado: 2.5,
            lote_rfid: '',
            quantidade_rfid: 0,
            status_lote: 'Não consultado',
            rfid: '',
          },
        ],
        is_simulated: true,
      },
      {
        process_type: 'faturamento_ciafal',
        tknum: '0800012347',
        placa_veiculo: 'WLM-4C44',
        data_processamento: '13/03/2025',
        hora_processamento: '15:40:02',
        status_picking: 'Pendente',
        peso_bruto: 27.45,
        tara: 12.15,
        peso_coletado: 15.15,
        peso_rfid: 15.1,
        lotes_json: [
          {
            remessa: '8000456721',
            item: '00010',
            versao: '1',
            material: 'PA-PERFIL-U-100',
            denominacao: 'PERFIL METÁLICO U ENRIJECIDO 100MM',
            lote_coletado: 'LT-PERF-230',
            peso_coletado: 8.15,
            lote_rfid: 'LT-PERF-230',
            quantidade_rfid: 4,
            status_lote: 'Saldo estoque',
            rfid: 'SIM-RFID-0020',
          },
          {
            remessa: '8000456722',
            item: '00010',
            versao: '1',
            material: 'PA-TUBO-ESTR-80',
            denominacao: 'TUBO ESTRUTURAL RETANGULAR 80X40',
            lote_coletado: 'LT-TUB-520',
            peso_coletado: 7.0,
            lote_rfid: 'LT-TUB-520',
            quantidade_rfid: 3,
            status_lote: 'Lote OK',
            rfid: 'SIM-RFID-0021',
          },
        ],
        is_simulated: true,
      },
    ]

    for (const t of mockTransportes) {
      try {
        app.findFirstRecordByFilter(
          colName,
          `process_type = '${t.process_type}' && tknum = '${t.tknum}'`,
        )
      } catch (_) {
        const rec = new Record(transportesCol)
        rec.set('process_type', t.process_type)
        rec.set('tknum', t.tknum)
        rec.set('placa_veiculo', t.placa_veiculo)
        rec.set('data_processamento', t.data_processamento)
        rec.set('hora_processamento', t.hora_processamento)
        rec.set('status_picking', t.status_picking)
        rec.set('peso_bruto', t.peso_bruto)
        rec.set('tara', t.tara)
        rec.set('peso_coletado', t.peso_coletado)
        rec.set('peso_rfid', t.peso_rfid)
        rec.set('lotes_json', t.lotes_json)
        rec.set('is_simulated', t.is_simulated)
        app.save(rec)
      }
    }
  },
  (app) => {
    // Rollback: remove apenas os transportes simulados desta seed
    const colName = 'transportes_faturamento'
    try {
      const demos = app.findRecordsByFilter(
        colName,
        "process_type = 'faturamento_ciafal' && is_simulated = true",
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
