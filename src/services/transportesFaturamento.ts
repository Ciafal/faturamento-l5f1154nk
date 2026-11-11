import pb from '@/lib/pocketbase/client'
import type { TransporteFaturamentoRecord } from '@/types/faturamentoCiafal'

// Transportes do processo Faturamento Ciafal (referência VTTK-TKNUM).
// Dados atuais: coleção transportes_faturamento (demonstração, is_simulated = true).
// Leitura real do SAP (F_LOAD_TRANSPORTE) é pendente de especificação/homologação.

const PROCESS_TYPE = 'faturamento_ciafal'

/** Número do transporte: apenas dígitos (evita injeção no filtro). */
export const TKNUM_REGEX = /^\d{1,20}$/

/** Retorna null quando o transporte não existe (404). Demais erros são propagados. */
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
    console.error('Erro ao listar transportes:', error)
    return []
  }
}
