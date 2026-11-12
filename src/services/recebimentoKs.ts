// Camada de serviço do processo ENT-08 "Recebimento KS".
// Dados de DEMONSTRAÇÃO vindos da coleção recebimentos_ks_demo (migrations
// 0011/0012) — nenhuma chamada SAP real; regras pendentes do programa ABAP.
import pb from '@/lib/pocketbase/client'
import type { LoteRecebimentoKs } from '@/types/recebimentoKs'

export const COLECAO_RECEBIMENTOS_KS = 'recebimentos_ks_demo'

export const MENSAGEM_ENVIO_NAO_ENCONTRADO =
  'Nº Envio não encontrado nos dados de demonstração (tente 1800010001 a 1800010009).'

export const STATUS_PROGRAMADO = 'Programado'
export const STATUS_EM_TRANSITO = 'Em Trânsito'
export const STATUS_RECEBIDO = 'Recebido'
export type StatusEnvioKs =
  | typeof STATUS_PROGRAMADO
  | typeof STATUS_EM_TRANSITO
  | typeof STATUS_RECEBIDO

export interface EnvioRecebimentoKs {
  id: string
  numero_envio: string
  placa_veiculo: string
  data_processamento: string
  hora_processamento: string
  status_picking: string
  peso_bruto: number
  tara: number
  lotes: LoteRecebimentoKs[]
  is_simulated: boolean
  // Campos do painel de consulta (migration 0013):
  status: string // Programado | Em Trânsito | Recebido
  origem: string
  destino: string
  data_programada: string // 'YYYY-MM-DD'
  data_saida: string // 'YYYY-MM-DD'
  data_recebimento: string // 'YYYY-MM-DD'
  peso_previsto: number
  peso_enviado: number
  peso_recebido: number
  situacao_adicional: string // 'Recebimento parcial' | 'Divergência de peso' | ''
}

function paraEnvio(record: Record<string, unknown>): EnvioRecebimentoKs {
  return {
    id: String(record.id),
    numero_envio: String(record.numero_envio ?? ''),
    placa_veiculo: String(record.placa_veiculo ?? ''),
    data_processamento: String(record.data_processamento ?? ''),
    hora_processamento: String(record.hora_processamento ?? ''),
    status_picking: String(record.status_picking ?? ''),
    peso_bruto: Number(record.peso_bruto ?? 0),
    tara: Number(record.tara ?? 0),
    lotes: (record.lotes_json as LoteRecebimentoKs[] | undefined) ?? [],
    is_simulated: Boolean(record.is_simulated),
    status: String(record.status ?? ''),
    origem: String(record.origem ?? ''),
    destino: String(record.destino ?? ''),
    data_programada: String(record.data_programada ?? ''),
    data_saida: String(record.data_saida ?? ''),
    data_recebimento: String(record.data_recebimento ?? ''),
    peso_previsto: Number(record.peso_previsto ?? 0),
    peso_enviado: Number(record.peso_enviado ?? 0),
    peso_recebido: Number(record.peso_recebido ?? 0),
    situacao_adicional: String(record.situacao_adicional ?? ''),
  }
}

/** Busca um envio KS de demonstração pelo Nº Envio. */
export async function buscarEnvioKsPorNumero(numeroEnvio: string): Promise<EnvioRecebimentoKs> {
  const record = await pb
    .collection(COLECAO_RECEBIMENTOS_KS)
    .getFirstListItem(`numero_envio = '${numeroEnvio.trim()}'`)
  return paraEnvio(record as unknown as Record<string, unknown>)
}

/** Lista todos os envios KS de demonstração (usado para sugerir números). */
export async function listarEnviosKsDemo(): Promise<EnvioRecebimentoKs[]> {
  const records = await pb.collection(COLECAO_RECEBIMENTOS_KS).getFullList({
    sort: 'numero_envio',
  })
  return records.map((r) => paraEnvio(r as unknown as Record<string, unknown>))
}
