import pb from '@/lib/pocketbase/client'

/**
 * Parametrização dinâmica de CFOPs (coleção PocketBase `parametrizacao_cfop`,
 * migration 0009). Substitui a lista fixa em código por cadastro no banco,
 * pronto para ser sincronizado com a tabela de CFOPs do SAP.
 *
 * - CFOPS_FALLBACK só entra quando a coleção está vazia ou inacessível
 *   (erro/sem seed) — nesse caso o uso do fallback é registrado no console.
 * - sincronizarCfopsDoSap() é o PONTO DE SINCRONIZAÇÃO preparado e NÃO
 *   ativado: não chama nada externo, apenas registra no Histórico de
 *   Processamentos que o sync SAP está pendente.
 */

export const COLECAO_PARAMETRIZACAO_CFOP = 'parametrizacao_cfop'

export type DirecaoCfop = 'entrada' | 'saida'
export type OrigemCfop = 'sap_sync' | 'manual'

/** Registro da coleção parametrizacao_cfop. */
export interface CfopParametrizado {
  id: string
  cfop: string
  descricao: string
  direcao: DirecaoCfop
  origem: OrigemCfop
  ativo: boolean
  created?: string
  updated?: string
}

/** Payload de criação/edição pela tela de parametrização. */
export interface DadosCfop {
  cfop: string
  descricao: string
  direcao: DirecaoCfop
  ativo?: boolean
}

/** Fallback: mesma lista que hoje alimenta o combo da grid EDI (hardcoded). */
export const CFOPS_FALLBACK = [
  { valor: '5101', descricao: 'Venda de produção do estabelecimento' },
  { valor: '5102', descricao: 'Venda de mercadoria adquirida ou recebida de terceiros' },
  { valor: '5949', descricao: 'Outra saída não especificada (retorno de subcontratação)' },
]

export type OpcaoComboCfop = { valor: string; descricao: string }

/** Cache simples em memória das opções de combo (por direção). */
let cacheOpcoes: Partial<Record<DirecaoCfop | 'todas', OpcaoComboCfop[]>> = {}

function guardarCache(direcao: DirecaoCfop | 'todas', opcoes: OpcaoComboCfop[]) {
  cacheOpcoes[direcao] = opcoes
}

export function limparCacheCfops() {
  cacheOpcoes = {}
}

function paraOpcao(c: CfopParametrizado): OpcaoComboCfop {
  return { valor: c.cfop, descricao: c.descricao }
}

function fallbackCfops(direcao: DirecaoCfop | 'todas'): CfopParametrizado[] {
  return CFOPS_FALLBACK.filter((f) => direcao === 'todas' || f.valor.startsWith('5')).map((f) => ({
    id: 'fallback-' + f.valor,
    cfop: f.valor,
    descricao: f.descricao,
    direcao: 'saida' as DirecaoCfop,
    origem: 'manual' as OrigemCfop,
    ativo: true,
  }))
}

/**
 * Lista os CFOPs ativos ordenados por código, opcionalmente filtrando por
 * direção. Consulta sempre o banco (a tela de parametrização precisa enxergar
 * inclusões/edições imediatamente); os COMBOS usam `listarOpcoesCfop`, que
 * guarda cache em memória. Em caso de erro de consulta (ou coleção sem seed),
 * cai no fallback hardcoded registrando no console que usou o fallback.
 */
export async function listarCfopsAtivos(
  direcao: DirecaoCfop | 'todas' = 'todas',
): Promise<CfopParametrizado[]> {
  try {
    const filtro =
      direcao === 'todas' ? 'ativo = true' : "ativo = true && direcao = '" + direcao + "'"
    const registros = await pb
      .collection(COLECAO_PARAMETRIZACAO_CFOP)
      .getFullList<CfopParametrizado>({ filter: filtro, sort: 'cfop' })

    if (registros.length === 0) {
      console.warn(
        '[cfops] Coleção parametrizacao_cfop vazia — usando lista hardcoded de fallback.',
      )
      return fallbackCfops(direcao)
    }
    return registros
  } catch (error) {
    console.error('[cfops] Erro ao consultar parametrizacao_cfop — usando fallback:', error)
    return fallbackCfops(direcao)
  }
}

/**
 * Opções de combo "código — descrição" para a grid EDI e demais telas.
 * A grid "Relação de NF de Retorno de Subcontratação" usa direcao 'saida'
 * (mesma composição da lista fixa atual: 5101/5102/5949 são CFOPs de saída);
 * o fallback hardcoded cobre o caso de coleção vazia/erro.
 */
export async function listarOpcoesCfop(
  direcao: DirecaoCfop | 'todas' = 'todas',
): Promise<OpcaoComboCfop[]> {
  const emCache = cacheOpcoes[direcao]
  if (emCache) return emCache
  const registros = await listarCfopsAtivos(direcao)
  if (registros.length === 0) return CFOPS_FALLBACK
  const opcoes = registros.map(paraOpcao)
  guardarCache(direcao, opcoes)
  return opcoes
}

/** Lista TODOS os CFOPs (ativos e inativos) — tela de parametrização. */
export async function listarTodosCfops(): Promise<CfopParametrizado[]> {
  try {
    return await pb
      .collection(COLECAO_PARAMETRIZACAO_CFOP)
      .getFullList<CfopParametrizado>({ sort: 'cfop' })
  } catch (error) {
    console.error('[cfops] Erro ao listar todos os CFOPs:', error)
    return []
  }
}

/** Cria um CFOP na parametrização (origem 'manual') e limpa o cache. */
export async function criarCfop(dados: DadosCfop): Promise<CfopParametrizado> {
  const registro = await pb.collection(COLECAO_PARAMETRIZACAO_CFOP).create<CfopParametrizado>({
    cfop: dados.cfop.trim(),
    descricao: dados.descricao.trim(),
    direcao: dados.direcao,
    origem: 'manual',
    ativo: dados.ativo ?? true,
  })
  limparCacheCfops()
  return registro
}

/** Atualiza um CFOP existente e limpa o cache. */
export async function atualizarCfop(id: string, dados: DadosCfop): Promise<CfopParametrizado> {
  const registro = await pb.collection(COLECAO_PARAMETRIZACAO_CFOP).update<CfopParametrizado>(id, {
    cfop: dados.cfop.trim(),
    descricao: dados.descricao.trim(),
    direcao: dados.direcao,
    ativo: dados.ativo ?? true,
  })
  limparCacheCfops()
  return registro
}

/** Desativa (soft-disable) um CFOP — continua no cadastro, some dos combos. */
export async function desativarCfop(id: string): Promise<CfopParametrizado> {
  const registro = await pb
    .collection(COLECAO_PARAMETRIZACAO_CFOP)
    .update<CfopParametrizado>(id, { ativo: false })
  limparCacheCfops()
  return registro
}

/** Reativa um CFOP. */
export async function ativarCfop(id: string): Promise<CfopParametrizado> {
  const registro = await pb
    .collection(COLECAO_PARAMETRIZACAO_CFOP)
    .update<CfopParametrizado>(id, { ativo: true })
  limparCacheCfops()
  return registro
}

/**
 * PONTO DE SINCRONIZAÇÃO SAP — preparado, NÃO ativado.
 *
 * Contrato: quando a integração SAP existir, esta função deve consultar a
 * tabela de CFOPs do SAP (via backend/hook, nunca direto do frontend) e
 * fazer upsert na coleção `parametrizacao_cfop` marcando origem='sap_sync'.
 * Hoje ela NÃO chama nada externo: apenas registra no Histórico de
 * Processamentos que a sincronização está pendente.
 */
export async function sincronizarCfopsDoSap(contextoHistorico?: {
  user_id?: string
  user_email?: string
  user_nome?: string
  empresa?: string
}): Promise<{ sincronizado: false; motivo: string }> {
  try {
    await pb.collection('historico_processamentos').create({
      user_id: contextoHistorico?.user_id,
      user_email: contextoHistorico?.user_email || 'sistema@ciafal.com.br',
      user_nome: contextoHistorico?.user_nome || 'Sistema',
      empresa: contextoHistorico?.empresa || 'CIAFAL MATRIZ S/A',
      processo_id: 'parametrizacao-cfops',
      processo_nome: 'Parametrização de CFOPs',
      tipo_operacao: 'entrada',
      numero_nf: '-',
      serie_nf: '-',
      resultado: 'pendente',
      documento_sap: '-',
      mensagens:
        'Sincronização de CFOPs com a tabela SAP está PENDENTE — integração SAP ainda não disponível neste ambiente. A coleção parametrizacao_cfop segue com registros de origem manual.',
      detalhes_json: {
        operacao: 'sincronizacao_cfops_sap',
        status: 'pendente_integracao_sap',
        colecao: COLECAO_PARAMETRIZACAO_CFOP,
      },
    })
  } catch (error) {
    console.error('[cfops] Falha ao registrar pendência de sync SAP no histórico:', error)
  }
  return { sincronizado: false, motivo: 'Integração SAP ainda não disponível (stub preparado).' }
}
