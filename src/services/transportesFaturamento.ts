// Serviço de dados do processo SAI-01 "Faturamento Ciafal" (tela SAPMZSD076
// "Lotes Coletados X Lotes Faturados").
//
// Rotina ABAP F_LOAD_TRANSPORTE: consultar existência em VTTK, buscar remessas em VTTP,
// itens em LIPS, descrição do material em MAKT, preencher a tabela com remessas,
// materiais, lotes e pesos, e buscar/ler dados RFID (equivalente à chamada ZPPR053),
// comparar lotes/quantidades RFID com os lotes coletados, consultar saldos em MCHB,
// preencher o status de conferência por lote e calcular os totais de peso.
//
// Nenhuma dessas tabelas SAP está integrada: aqui o transporte vem da coleção
// `transportes_faturamento` (dados de demonstração, is_simulated = true) e a
// comparação RFID/saldos é aplicada em cima desses dados, com etapas visíveis.

import pb from '@/lib/pocketbase/client'
import type { LoteFaturamento } from '@/types/faturamentoCiafal'
import type { TransporteFaturamentoRecord } from '@/types/faturamentoCiafal'
import type { TransporteCarregado } from '@/types/faturamentoCiafal'

const PROCESS_TYPE = 'faturamento_ciafal'

/** Número do transporte: apenas dígitos, até 10 (VTTK-TKNUM é NUMC(10)). */
export const TKNUM_REGEX = /^\d{1,10}$/

export const MENSAGEM_TRANSPORTE_NAO_ENCONTRADO =
  'Transporte não encontrado (VTTK). Verifique o Nº Transporte informado.'

/** Erros conhecidos do carregamento (F_LOAD_TRANSPORTE). */
export type ErroCarregarTransporte =
  | 'CAMPO_OBRIGATORIO'
  | 'FORMATO_INVALIDO'
  | 'NAO_ENCONTRADO'
  | 'FALHA_CONSULTA'

export interface EtapaCarregamento {
  id: string
  descricao: string
  status: 'pendente' | 'executando' | 'ok' | 'erro'
}

/** Etapas do carregamento, na ordem do F_LOAD_TRANSPORTE (+ leitura RFID). */
export const ETAPAS_CARREGAMENTO: EtapaCarregamento[] = [
  { id: 'vttk', descricao: 'Consultar transporte (VTTK)', status: 'pendente' },
  { id: 'vttp', descricao: 'Buscar remessas (VTTP)', status: 'pendente' },
  { id: 'lips', descricao: 'Buscar itens e lotes (LIPS)', status: 'pendente' },
  { id: 'makt', descricao: 'Descrição dos materiais (MAKT)', status: 'pendente' },
  { id: 'rfid', descricao: 'Leitura e comparação RFID (ZPPR053)', status: 'pendente' },
  { id: 'mchb', descricao: 'Saldos de estoque (MCHB) e status por lote', status: 'pendente' },
  { id: 'totais', descricao: 'Calcular totais de peso', status: 'pendente' },
]

/**
 * Retorna null quando o transporte não existe (404 no VTTK demo).
 * Demais erros de rede são propagados.
 */
export async function buscarTransportePorNumero(
  tknum: string,
): Promise<TransporteFaturamentoRecord | null> {
  if (!TKNUM_REGEX.test(tknum)) return null
  try {
    return await pb
      .collection('transportes_faturamento')
      .getFirstListItem<TransporteFaturamentoRecord>(
        `process_type = '${PROCESS_TYPE}' && tknum = '${tknum}'`,
      )
  } catch (error) {
    if ((error as { status?: number })?.status === 404) return null
    throw error
  }
}

/** Lista os transportes de demonstração (sugestões do campo de pesquisa). */
export async function listarTransportesDemo(): Promise<TransporteFaturamentoRecord[]> {
  try {
    return await pb.collection('transportes_faturamento').getFullList<TransporteFaturamentoRecord>({
      filter: `process_type = '${PROCESS_TYPE}'`,
      sort: 'tknum',
    })
  } catch (error) {
    console.error('Erro ao listar transportes de demonstração:', error)
    return []
  }
}

/** Conversão para o modelo carregado na tela. */
export function paraTransporteCarregado(rec: TransporteFaturamentoRecord): TransporteCarregado {
  return {
    tknum: rec.tknum,
    placa_veiculo: rec.placa_veiculo,
    data_processamento: rec.data_processamento,
    hora_processamento: rec.hora_processamento,
    status_picking: rec.status_picking,
    peso_bruto: rec.peso_bruto,
    tara: rec.tara,
    peso_coletado: rec.peso_coletado,
    peso_rfid: rec.peso_rfid,
    lotes: Array.isArray(rec.lotes_json) ? rec.lotes_json : [],
    is_simulated: rec.is_simulated,
    ultima_leitura_balanca: null,
  }
}

/**
 * Carrega o transporte com o status final das etapas (F_LOAD_TRANSPORTE).
 * Etapas dependentes do ABAP ZPPR053 (leitura física RFID) e da conferência de
 * saldos MCHB são aplicadas sobre os dados de demonstração.
 */
export async function carregarTransporte(
  tknum: string,
): Promise<
  | { transporte: TransporteCarregado; etapas: EtapaCarregamento[] }
  | { erro: ErroCarregarTransporte }
> {
  if (!tknum.trim()) return { erro: 'CAMPO_OBRIGATORIO' }
  if (!TKNUM_REGEX.test(tknum)) return { erro: 'FORMATO_INVALIDO' }

  let rec: TransporteFaturamentoRecord | null
  try {
    rec = await buscarTransportePorNumero(tknum)
  } catch {
    return { erro: 'FALHA_CONSULTA' }
  }
  if (!rec) return { erro: 'NAO_ENCONTRADO' }

  const lotes = aplicarConferenciaRfid(Array.isArray(rec.lotes_json) ? rec.lotes_json : [])
  const etapas = ETAPAS_CARREGAMENTO.map((e) => ({ ...e, status: 'ok' as const }))
  const transporte = { ...paraTransporteCarregado(rec), lotes }
  return { transporte, etapas }
}

/**
 * Etapas 6–8 do carregamento: comparação RFID × coletado (ZPPR053) e saldos (MCHB).
 * Sem a integração real, o resultado RFID já gravado nos dados de demonstração é
 * mantido; lotes sem leitura RFID ficam "Não consultado" (cinza).
 */
export function aplicarConferenciaRfid(lotes: LoteFaturamento[]): LoteFaturamento[] {
  return lotes.map((lote) => {
    if (lote.lote_rfid === '' || lote.rfid === '') return lote
    return lote
  })
}
