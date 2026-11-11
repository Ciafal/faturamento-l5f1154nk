import type { LoteFaturamento, PesosTransporte, ToneStatusLote } from '@/types/faturamentoCiafal'

// Cálculos do painel de pesos (SAPMZSD076 — regras preservadas da especificação).
// Pesos em toneladas com 3 casas; percentuais com 2 casas.

const arredondar = (valor: number, casas: number): number => {
  const fator = Math.pow(10, casas)
  return Math.round((valor + Number.EPSILON) * fator) / fator
}

export function calcularPesos(
  pesoBruto: number,
  tara: number,
  pesoColetado: number,
  pesoLoteRfid: number,
): PesosTransporte {
  const pesoLiquidoBalanca = arredondar(pesoBruto - tara, 3)
  const diferencaPesoT = arredondar(pesoLiquidoBalanca - pesoColetado, 3)
  // Tratamento de divisão por zero: sem peso coletado não há percentual calculável.
  const diferencaPesoPct =
    pesoColetado === 0 ? null : arredondar((diferencaPesoT / pesoColetado) * 100, 2)
  // Regra provisória (pendente do ABAP): peso líquido com base no peso coletado e na tara.
  const pesoLiquidoCalculado = arredondar(pesoColetado - tara, 3)

  return {
    pesoBruto,
    tara,
    pesoColetado,
    pesoLoteRfid,
    pesoLiquidoBalanca,
    diferencaPesoT,
    diferencaPesoPct,
    pesoLiquidoCalculado,
  }
}

const fmtToneladas = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
})
const fmtPercentual = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const fmtQuantidade = new Intl.NumberFormat('pt-BR')

export const formatarToneladas = (valor: number): string => fmtToneladas.format(valor)
export const formatarPercentual = (valor: number | null): string =>
  valor === null ? '—' : fmtPercentual.format(valor)
export const formatarQuantidade = (valor: number): string => fmtQuantidade.format(valor)

/** Status vindos dos dados demo. A prioridade real entre status vem do ABAP (pendente). */
export function tonalidadeStatusLote(status: string): ToneStatusLote {
  switch (status) {
    case 'Lote OK':
      return 'verde'
    case 'Saldo estoque':
    case 'Saldo remessa':
      return 'amarelo'
    case 'Excesso peso':
    case 'Divergência RFID':
      return 'vermelho'
    default:
      // Não identificado / não consultado
      return 'cinza'
  }
}

/** Divergência entre lote coletado e lote RFID (só quando o RFID foi lido). */
export function haDivergenciaRfid(lote: LoteFaturamento): boolean {
  return lote.lote_rfid !== '' && lote.lote_rfid !== lote.lote_coletado
}

/** Lote com inconsistência: divergência RFID ou status de atenção/erro. */
export function loteInconsistente(lote: LoteFaturamento): boolean {
  const tom = tonalidadeStatusLote(lote.status_lote)
  return haDivergenciaRfid(lote) || tom === 'amarelo' || tom === 'vermelho'
}

/** Fator de verificação de excesso de peso (SAPMZSD076): 1,30 sobre a quantidade do item. */
export const FATOR_EXCESSO_PESO = 1.3

/**
 * Verificação de EXCESSO DE PESO com fator 1,30 sobre a quantidade do item.
 * ATENÇÃO: isto é uma checagem pontual de conferência do lote — NÃO é uma
 * tolerância geral de aprovação do faturamento.
 * Sem a integração MCHB/LIPS real, `quantidadeItem` vem dos dados de demonstração.
 */
export function temExcessoPeso(pesoColetado: number, quantidadeItem: number | null): boolean {
  if (quantidadeItem === null || !Number.isFinite(quantidadeItem) || quantidadeItem <= 0) {
    return false
  }
  return pesoColetado > quantidadeItem * FATOR_EXCESSO_PESO
}

export const CLASSES_TONALIDADE: Record<ToneStatusLote, string> = {
  verde: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  amarelo: 'bg-amber-100 text-amber-800 border-amber-200',
  vermelho: 'bg-red-100 text-red-800 border-red-200',
  cinza: 'bg-slate-100 text-slate-600 border-slate-200',
}
