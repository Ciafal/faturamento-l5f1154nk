import pb from '@/lib/pocketbase/client'
import type {
  NotaFiscalRecord,
  HistoricoProcessamentoRecord,
  ParametroModuloRecord,
} from '@/types/database'

export type ProcessTypeFiltro =
  | 'produto_acabado'
  | 'sucata_carepa_argola'
  | 'faturamento_ciafal'
  | 'envio_tarugos_sucata'

export async function listarNotasFiscais(
  processType?: ProcessTypeFiltro,
): Promise<NotaFiscalRecord[]> {
  try {
    const filter = processType ? `process_type = '${processType}'` : ''
    const records = await pb.collection('notas_fiscais').getFullList<NotaFiscalRecord>({
      filter,
      sort: '-created',
    })
    return records
  } catch (error) {
    console.error('Erro ao listar notas fiscais:', error)
    return []
  }
}

export async function buscarNotaFiscalPorChave(
  processType: ProcessTypeFiltro,
  numeroNf: string,
  serieNf: string,
  fornecedorCodigo?: string,
): Promise<NotaFiscalRecord | null> {
  try {
    let filter = `process_type = '${processType}' && numero_nf = '${numeroNf.trim()}' && serie_nf = '${serieNf.trim()}'`
    if (fornecedorCodigo && fornecedorCodigo.trim()) {
      filter += ` && fornecedor_codigo = '${fornecedorCodigo.trim()}'`
    }

    const record = await pb.collection('notas_fiscais').getFirstListItem<NotaFiscalRecord>(filter)
    return record
  } catch (_) {
    return null
  }
}

export async function criarOuAtualizarNotaFiscal(
  data: Partial<NotaFiscalRecord>,
): Promise<NotaFiscalRecord> {
  if (data.id) {
    return await pb.collection('notas_fiscais').update<NotaFiscalRecord>(data.id, data)
  }
  return await pb.collection('notas_fiscais').create<NotaFiscalRecord>(data)
}

export async function listarHistoricoProcessamentos(filtros?: {
  empresa?: string
  processoId?: string
  numeroNf?: string
  resultado?: string
  userEmail?: string
}): Promise<HistoricoProcessamentoRecord[]> {
  try {
    const conditions: string[] = []
    if (filtros?.empresa) conditions.push(`empresa = '${filtros.empresa}'`)
    if (filtros?.processoId) conditions.push(`processo_id = '${filtros.processoId}'`)
    if (filtros?.numeroNf) conditions.push(`numero_nf ~ '${filtros.numeroNf}'`)
    if (filtros?.resultado) conditions.push(`resultado = '${filtros.resultado}'`)
    if (filtros?.userEmail) conditions.push(`user_email ~ '${filtros.userEmail}'`)

    const filter = conditions.join(' && ')
    const records = await pb
      .collection('historico_processamentos')
      .getFullList<HistoricoProcessamentoRecord>({
        filter,
        sort: '-created',
      })
    return records
  } catch (error) {
    console.error('Erro ao listar histórico:', error)
    return []
  }
}

export async function registrarHistoricoProcessamento(
  dados: Omit<HistoricoProcessamentoRecord, 'id' | 'created' | 'updated'>,
): Promise<HistoricoProcessamentoRecord> {
  return await pb.collection('historico_processamentos').create<HistoricoProcessamentoRecord>(dados)
}

export async function buscarParametroPorChave<T = unknown>(chave: string): Promise<T | null> {
  try {
    const record = await pb
      .collection('parametros_modulo')
      .getFirstListItem<ParametroModuloRecord>(`chave = '${chave}'`)
    return record.valor_json as T
  } catch (_) {
    return null
  }
}
