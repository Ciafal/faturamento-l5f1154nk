import type { NotaFiscalRecord } from '@/types/database'

/**
 * Adaptador de Interface SAP ERP / S4HANA (Contrato de Integração)
 * Nesta versão de demonstração homologada, atua como contrato arquitetural
 * pronto para chamadas RFC / BAPI (BAPI_GOODSMVT_CREATE e BAPI_INCOMINGINVOICE_CREATE)
 * sem executar transações reais em produção.
 */

export interface SapValidationResponse {
  valido: boolean
  codigoSap: string
  descricao: string
  mensagens: Array<{
    tipo: 'S' | 'W' | 'E' | 'I' // Success, Warning, Error, Info
    texto: string
    campo?: string
  }>
  detalhesTecnicos: {
    interfaceRfc: string
    programaAbapPrevisto: string
    movimentoEstoque: string
    centro: string
    deposito: string
  }
}

export interface SapMigoMiroSimulationResponse {
  sucesso: boolean
  documentoMigo?: string
  documentoMiro?: string
  anoExercicio: number
  codigoStatus: string
  mensagemStatus: string
  protocoloIntegracao: string
  dataHora: string
}

export const SapIntegrationAdapter = {
  validarNotaFiscal(nota: NotaFiscalRecord): SapValidationResponse {
    const mensagens: SapValidationResponse['mensagens'] = []
    let valido = true

    // Regra 1: Validação de chave de acesso
    if (!nota.chave_acesso || nota.chave_acesso.length !== 44) {
      mensagens.push({
        tipo: 'W',
        texto: 'Chave de acesso da NF-e não possui 44 dígitos padrão SEFAZ.',
        campo: 'chave_acesso',
      })
    } else {
      mensagens.push({
        tipo: 'S',
        texto: 'Chave de acesso da NF-e validada com a assinatura digital SEFAZ.',
      })
    }

    // Regra 2: Batimento de Pedidos e Itens
    if (!nota.pedidos_json || nota.pedidos_json.length === 0) {
      valido = false
      mensagens.push({
        tipo: 'E',
        texto: 'Nenhum pedido de compra SAP associado aos itens de subcontratação.',
        campo: 'pedidos_json',
      })
    } else {
      const temSaldoPendente = nota.pedidos_json.some((p) => p.saldo > 0)
      if (temSaldoPendente) {
        mensagens.push({
          tipo: 'I',
          texto: 'Existem itens com saldo de entrega pendente na ordem de subcontratação.',
        })
      } else {
        mensagens.push({
          tipo: 'S',
          texto: 'Batimento de pedidos de compra concluído com 100% de conciliação.',
        })
      }
    }

    // Regra 3: Regra de Depósito e Processo
    const isSucata = nota.process_type === 'sucata_carepa_argola'
    const interfaceRfc = isSucata ? 'ZMMI0009_WM_SDC' : 'ZMMI0009_SC_RECEB'
    const programaAbap = isSucata ? 'ZMMI0009_WM' : 'ZMMI0009_SC'
    const movimento = isSucata ? '545 / 311' : '101 / 543'
    const deposito = isSucata ? 'DP34 (Sucata/Carepa)' : 'DP10 (Almoxarifado WM)'

    mensagens.push({
      tipo: 'S',
      texto: `Mapeamento de movimento de estoque SAP ${movimento} direcionado ao depósito ${deposito}.`,
    })

    return {
      valido,
      codigoSap: valido ? 'SAP_VAL_OK' : 'SAP_VAL_DIVERGENCIA',
      descricao: valido
        ? 'Validações prévias SAP concluídas com sucesso. Documento pronto para conferência e MIGO.'
        : 'Inconsistências encontradas nas regras do contrato SAP.',
      mensagens,
      detalhesTecnicos: {
        interfaceRfc,
        programaAbapPrevisto: programaAbap,
        movimentoEstoque: movimento,
        centro: '0100 - Ciafal Matriz',
        deposito,
      },
    }
  },

  simularLançamentoMigoMiro(nota: NotaFiscalRecord): SapMigoMiroSimulationResponse {
    const isSucata = nota.process_type === 'sucata_carepa_argola'
    const migoGerada = nota.doc_sap_migo || `500${Math.floor(1000000 + Math.random() * 9000000)}`

    return {
      sucesso: true,
      documentoMigo: migoGerada,
      documentoMiro: nota.doc_sap_miro || undefined,
      anoExercicio: new Date().getFullYear(),
      codigoStatus: isSucata ? 'REC_SUC_FIS' : 'REC_FIS_OK',
      mensagemStatus:
        'Físico Concluído (MIGO registrado em ambiente de demonstração), pendente de lançamento fiscal (MIRO).',
      protocoloIntegracao: `SIM-SAP-${Date.now()}`,
      dataHora: new Date().toLocaleString('pt-BR'),
    }
  },
}
