// Camada de serviço do processo ENT-08 "Recebimento KS".
// Dados de DEMONSTRAÇÃO vindos da coleção recebimentos_ks_demo (migrations
// 0011/0012) — nenhuma chamada SAP real; regras pendentes do programa ABAP.
import pb from '@/lib/pocketbase/client'
import type { LoteRecebimentoKs } from '@/types/recebimentoKs'

export const COLECAO_RECEBIMENTOS_KS = 'recebimentos_ks_demo'

export const MENSAGEM_ENVIO_NAO_ENCONTRADO =
  'Nº Envio não encontrado nos dados de demonstração (tente 1800010001, 1800010002 ou 1800010003).'

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
