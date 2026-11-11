// Adaptador da balança do processo Faturamento Ciafal (referências SAP: BUSCAR_PESO,
// CAPTURA_BALANCA_IP_SAP, PESOBRUTO, CALCULAR_RESUMO — código ABAP não fornecido).
//
// A comunicação com a balança deve ocorrer por um adaptador no BACKEND (nunca direto
// pelo navegador). Enquanto essa integração não existir, o modo de demonstração
// (src/services/balancaSimulada.ts) gera um peso CLARAMENTE IDENTIFICADO como
// simulado — nunca apresentado como captura de equipamento real. Em produção, sem
// integração homologada, o resultado é PRODUCAO_BLOQUEADA.

export type ErroBalanca =
  | 'FALHA_COMUNICACAO'
  | 'TEMPO_EXCEDIDO'
  | 'PESO_NAO_IDENTIFICADO'
  | 'BALANCA_INSTAVEL'
  | 'RETORNO_INCONSISTENTE'
  | 'PRODUCAO_BLOQUEADA'

export const MENSAGENS_ERRO_BALANCA: Record<ErroBalanca, string> = {
  FALHA_COMUNICACAO:
    'Falha de comunicação com a balança. Nenhuma integração com a balança está disponível neste ambiente; o peso bruto não foi lido.',
  TEMPO_EXCEDIDO: 'Tempo de leitura da balança excedido. Tente novamente.',
  PESO_NAO_IDENTIFICADO: 'Peso não identificado pela balança. Verifique o veículo na plataforma.',
  BALANCA_INSTAVEL: 'Balança instável. Aguarde a estabilização do peso e tente novamente.',
  RETORNO_INCONSISTENTE: 'Retorno inconsistente da balança. A leitura foi descartada.',
  PRODUCAO_BLOQUEADA:
    'A captura real da balança (CAPTURA_BALANCA_IP_SAP) permanece bloqueada até a homologação da integração.',
}

export type ModoBalanca = 'simulado' | 'real'

export interface LeituraBalanca {
  /** Toneladas */
  pesoBrutoT: number
  /** ISO 8601 */
  lidoEm: string
  /** Origem da leitura — sempre 'simulado' enquanto não houver integração homologada. */
  modo: ModoBalanca
}

export type ResultadoLeituraBalanca =
  | { ok: true; leitura: LeituraBalanca }
  | { ok: false; erro: ErroBalanca; mensagem: string }

export interface AdaptadorBalanca {
  lerPesoBruto(numeroTransporte: string): Promise<ResultadoLeituraBalanca>
}

const falha = (erro: ErroBalanca): ResultadoLeituraBalanca => ({
  ok: false,
  erro,
  mensagem: MENSAGENS_ERRO_BALANCA[erro],
})

/**
 * Interpreta o retorno bruto de um futuro adaptador (backend) da balança.
 * Qualquer retorno fora do contrato vira RETORNO_INCONSISTENTE.
 */
export function interpretarRetornoBalanca(bruto: unknown): ResultadoLeituraBalanca {
  if (bruto === null || typeof bruto !== 'object') return falha('RETORNO_INCONSISTENTE')
  const r = bruto as { status?: string; peso_bruto_t?: unknown; lido_em?: unknown }
  switch (r.status) {
    case 'timeout':
      return falha('TEMPO_EXCEDIDO')
    case 'peso_nao_identificado':
      return falha('PESO_NAO_IDENTIFICADO')
    case 'instavel':
      return falha('BALANCA_INSTAVEL')
    case 'ok': {
      const peso = Number(r.peso_bruto_t)
      if (!Number.isFinite(peso) || peso <= 0 || typeof r.lido_em !== 'string') {
        return falha('RETORNO_INCONSISTENTE')
      }
      return { ok: true, leitura: { pesoBrutoT: peso, lidoEm: r.lido_em, modo: 'real' } }
    }
    default:
      return falha('RETORNO_INCONSISTENTE')
  }
}

/**
 * Adaptador de produção: bloqueado até a homologação da integração real da balança
 * (CAPTURA_BALANCA_IP_SAP, no backend). Nenhum peso é gerado aqui.
 */
export const adaptadorBalancaFaturamento: AdaptadorBalanca = {
  async lerPesoBruto() {
    return falha('PRODUCAO_BLOQUEADA')
  },
}
