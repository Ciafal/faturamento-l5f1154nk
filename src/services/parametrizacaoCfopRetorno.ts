import pb from '@/lib/pocketbase/client'
import { GRID_RETORNO_PRODUTO_ACABADO, type LinhaRetornoSimulada } from './ediRetornoSubcontratacao'

/**
 * Camada de serviço da grid "Relação de NF de Retorno de Subcontratação"
 * (tela EDI Lançamento NF Subcontratação — Produto Acabado).
 *
 * - O conteúdo da grid é DADO DE DEMONSTRAÇÃO fixo (GridRetornoSimulada.ts),
 *   claramente identificado como simulado na UI.
 * - A PARAMETRIZAÇÃO do CFOP (NF/série/item/lote → CFOP de entrada) é
 *   persistida de verdade na coleção PocketBase `parametrizacao_cfop_retorno`
 *   (migration 0008) e carregada por cima da linha simulada correspondente.
 * - A correlação a pedido de compra é EXIBIDA com base no simulado; a
 *   parametrização persiste o pedido/item e é a fonte do status mostrado
 *   (mesma chave NF+série+item+material+lote).
 */

export const COLECAO_PARAMETRIZACAO_CFOP = 'parametrizacao_cfop_retorno'

/** CFOPs de entrada típicos de retorno de subcontratação (parametrização simulada, preparada para tabela SAP/backend futura). */
export const CFOPS_RETORNO_SUBCONTRATACAO = [
  { valor: '5101', descricao: 'Venda de produção do estabelecimento' },
  { valor: '5102', descricao: 'Venda de mercadoria adquirida ou recebida de terceiros' },
  { valor: '5949', descricao: 'Outra saída não especificada (retorno de subcontratação)' },
]

export type StatusCorrelacao = 'correlacionado' | 'pendente' | 'sem_pedido' | 'divergencia'

export const LABEL_STATUS_CORRELACAO: Record<StatusCorrelacao, string> = {
  correlacionado: 'Correlação encontrada',
  pendente: 'Correlação pendente',
  sem_pedido: 'Sem pedido vinculado',
  divergencia: 'Divergência de item/lote',
}

/** Registro persistido na coleção parametrizacao_cfop_retorno. */
export interface ParametrizacaoCfopRecord {
  id: string
  numero_nf: string
  serie_nf: string
  item_nf: string
  material_codigo: string
  lote: string
  cfop: string
  pedido_ciafal: string
  item_pedido_ciafal: string
  is_simulated: boolean
  created?: string
  updated?: string
}

/** Linha da grid: dados simulados + parametrização persistida por cima. */
export interface LinhaGridRetorno extends LinhaRetornoSimulada {
  /** true quando a linha tem parametrização de CFOP persistida no PocketBase */
  parametrizada: boolean
  /** Chave de parametrização no PocketBase (quando existir) */
  parametrizacaoId?: string
}

/** Chave única de uma linha de NF/item/lote usada para casar com a parametrização persistida. */
export function chaveParametrizacao(l: {
  numeroNf?: string
  serieNf?: string
  itemNf?: string
  materialCodigo?: string
  lote: string
}): string {
  return [l.numeroNf ?? '', l.serieNf ?? '', l.itemNf ?? '', l.materialCodigo ?? '', l.lote].join(
    '|',
  )
}

/** Carrega todas as parametrizações de CFOP persistidas e monta as linhas da grid. */
export async function listarLinhasGridRetorno(): Promise<LinhaGridRetorno[]> {
  let registros: ParametrizacaoCfopRecord[] = []
  try {
    registros = await pb
      .collection(COLECAO_PARAMETRIZACAO_CFOP)
      .getFullList<ParametrizacaoCfopRecord>({ sort: '-created' })
  } catch (error) {
    console.error('Erro ao listar parametrização CFOP de retorno:', error)
  }

  const porChave = new Map<string, ParametrizacaoCfopRecord>()
  for (const r of registros) {
    porChave.set(chaveParametrizacao(r), r)
  }

  return GRID_RETORNO_PRODUTO_ACABADO.map((l) => {
    const reg = porChave.get(chaveParametrizacao(l))
    return {
      ...l,
      cfop: reg?.cfop ?? l.cfop,
      pedidoCiafal: reg?.pedido_ciafal ?? l.pedidoCiafal,
      itemPedido: reg?.item_pedido_ciafal ?? l.itemPedido,
      parametrizada: Boolean(reg),
      parametrizacaoId: reg?.id,
    }
  })
}

/** Dados que a grid envia ao salvar a parametrização de uma linha. */
export interface DadosParametrizacaoCfop {
  numeroNf: string
  serieNf: string
  itemNf: string
  materialCodigo: string
  lote: string
  cfop: string
  pedidoCiafal: string
  itemPedidoCiafal: string
}

/**
 * Salva (create ou update) a parametrização de CFOP de uma linha no PocketBase
 * e registra a operação no Histórico de Processamentos existente.
 */
export async function salvarParametrizacaoCfop(
  dados: DadosParametrizacaoCfop,
  contextoHistorico: {
    user_id?: string
    user_email: string
    user_nome: string
    empresa: string
  },
): Promise<void> {
  const chave = chaveParametrizacao(dados)
  const existente = await pb
    .collection(COLECAO_PARAMETRIZACAO_CFOP)
    .getFirstListItem<ParametrizacaoCfopRecord>(
      `numero_nf='${dados.numeroNf}' && serie_nf='${dados.serieNf}' && item_nf='${dados.itemNf}' && material_codigo='${dados.materialCodigo}' && lote='${dados.lote}'`,
    )
    .catch(() => null)

  const payload = {
    numero_nf: dados.numeroNf,
    serie_nf: dados.serieNf,
    item_nf: dados.itemNf,
    material_codigo: dados.materialCodigo,
    lote: dados.lote,
    cfop: dados.cfop,
    pedido_ciafal: dados.pedidoCiafal,
    item_pedido_ciafal: dados.itemPedidoCiafal,
    is_simulated: true,
  }

  const registro = existente
    ? await pb
        .collection(COLECAO_PARAMETRIZACAO_CFOP)
        .update<ParametrizacaoCfopRecord>(existente.id, payload)
    : await pb.collection(COLECAO_PARAMETRIZACAO_CFOP).create<ParametrizacaoCfopRecord>(payload)

  await pb.collection('historico_processamentos').create({
    user_id: contextoHistorico.user_id,
    user_email: contextoHistorico.user_email,
    user_nome: contextoHistorico.user_nome,
    empresa: contextoHistorico.empresa,
    processo_id: 'edi-subcontratacao-pa',
    processo_nome: 'EDI – Lançamento NF Subcontratação (Produto Acabado)',
    tipo_operacao: 'entrada',
    numero_nf: dados.numeroNf,
    serie_nf: dados.serieNf,
    fornecedor: 'AÇOS DO BRASIL SUBCONTRATAÇÃO LTDA (simulado)',
    cliente: 'CIAFAL MATRIZ S/A',
    status_anterior: existente ? 'Parametrização existente' : 'Parametrização inexistente',
    status_posterior: 'Parametrização CFOP salva',
    resultado: 'sucesso',
    documento_sap: '-',
    mensagens: `Parametrização CFOP ${dados.cfop} salva para a NF ${dados.numeroNf} série ${dados.serieNf} item ${dados.itemNf} lote ${dados.lote} (dados de demonstração — sem lançamento no SAP).`,
    detalhes_json: {
      chave_parametrizacao: chave,
      cfop_parametrizado: dados.cfop,
      pedido_ciafal: dados.pedidoCiafal,
      item_pedido_ciafal: dados.itemPedidoCiafal,
      parametrizacao_id: registro.id,
      is_simulated: true,
    },
  })
}
