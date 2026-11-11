// Funções puras de cálculo e formatação para a tela Recebimento KS (ENT-08).
import type { LoteRecebimentoKs, PesosRecebimentoKs } from '@/types/recebimentoKs'

export function calcularPesosKs(
  pesoBruto: number,
  tara: number,
  lotes: LoteRecebimentoKs[],
): PesosRecebimentoKs {
  const pesoColetado = lotes.reduce((acc, l) => acc + (l.peso_coletado || 0), 0)
  const pesoLotesRfid = lotes.reduce((acc, l) => acc + (l.peso_rfid || 0), 0)
  const pesoLiquidoBalanca = pesoBruto - tara
  const diferencaPesoT = pesoLiquidoBalanca - pesoColetado
  const diferencaPesoPct = pesoColetado > 0 ? (diferencaPesoT / pesoColetado) * 100 : 0
  return {
    pesoBruto,
    tara,
    pesoColetado,
    pesoLotesRfid,
    pesoLiquidoBalanca,
    diferencaPesoT,
    diferencaPesoPct,
  }
}

export function formatarToneladasKs(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 })
}

export function formatarPercentualKs(v: number): string {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** true quando lotes coletado e RFID divergem OU quando há excesso de peso. */
export function eInconsistenteKs(l: LoteRecebimentoKs): boolean {
  return (
    l.status_lote === 'Divergência' ||
    l.status_lote === 'Excesso peso' ||
    (l.lote_coletado !== l.lote_rfid && l.lote_rfid !== '')
  )
}

export type ToneStatusKs = 'ok' | 'saldo' | 'erro' | 'neutro'

export function tonalidadeStatusKs(status: string): ToneStatusKs {
  switch (status) {
    case 'Lote OK':
      return 'ok'
    case 'Saldo':
      return 'saldo'
    case 'Excesso peso':
    case 'Divergência':
      return 'erro'
    default:
      return 'neutro'
  }
}

export const CLASSES_TONALIDADE_KS: Record<ToneStatusKs, string> = {
  ok: 'bg-green-100 text-green-800 border-green-200',
  saldo: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  erro: 'bg-red-100 text-red-800 border-red-200',
  neutro: 'bg-slate-100 text-slate-500 border-slate-200',
}
