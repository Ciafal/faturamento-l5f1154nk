// Filtros de período e helpers de data do painel de consulta do Recebimento KS
// (ENT-08). Semana = segunda a domingo; mês = mês corrente. A contagem usa a
// DATA OPERACIONAL de cada situação (programação p/ Programados, saída p/
// Em Trânsito, recebimento p/ Recebidos) — nunca a data de criação do registro.

import {
  STATUS_PROGRAMADO,
  STATUS_EM_TRANSITO,
  STATUS_RECEBIDO,
  type EnvioRecebimentoKs,
} from '@/services/recebimentoKs'

export type PeriodoKs = 'ontem' | 'hoje' | 'semana' | 'mes'

export const PERIODOS_KS: PeriodoKs[] = ['ontem', 'hoje', 'semana', 'mes']

/** 'YYYY-MM-DD' no fuso local, sem depender de toISOString (UTC). */
export function isoLocal(d: Date): string {
  const m = d.getMonth() + 1
  const dia = d.getDate()
  return (
    d.getFullYear() + '-' + (m < 10 ? '0' + m : '' + m) + '-' + (dia < 10 ? '0' + dia : '' + dia)
  )
}

/** Dias (em 'YYYY-MM-DD') do intervalo fechado do período, relativo a hoje. */
export function periodoAtivo(p: PeriodoKs): { ini: string; fim: string } {
  const hoje = new Date()
  const h = isoLocal(hoje)
  switch (p) {
    case 'hoje':
      return { ini: h, fim: h }
    case 'ontem': {
      const o = new Date(hoje)
      o.setDate(o.getDate() - 1)
      const iso = isoLocal(o)
      return { ini: iso, fim: iso }
    }
    case 'semana': {
      const seg = new Date(hoje)
      const dow = hoje.getDay() // 0=dom … 6=sáb
      const delta = dow === 0 ? -6 : 1 - dow // segunda da semana corrente
      seg.setDate(hoje.getDate() + delta)
      const dom = new Date(seg)
      dom.setDate(seg.getDate() + 6)
      return { ini: isoLocal(seg), fim: isoLocal(dom) }
    }
    case 'mes': {
      const primeiro = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
      const ultimo = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0)
      return { ini: isoLocal(primeiro), fim: isoLocal(ultimo) }
    }
  }
}

export function rotuloPeriodo(p: PeriodoKs | 'personalizado'): string {
  if (p === 'personalizado') return 'personalizado'
  const { ini, fim } = periodoAtivo(p)
  if (ini === fim) return formatarDataKs(ini)
  return formatarDataKs(ini) + ' a ' + formatarDataKs(fim)
}

/**
 * Data OPERACIONAL do envio conforme a situação:
 * Programado → data programada; Em Trânsito → data de saída;
 * Recebido → data de recebimento. Fallback encadeado quando falta alguma.
 */
export function dataOperacionalDe(e: EnvioRecebimentoKs): string {
  switch (e.status) {
    case STATUS_RECEBIDO:
      return e.data_recebimento || e.data_saida || e.data_programada || ''
    case STATUS_EM_TRANSITO:
      return e.data_saida || e.data_programada || ''
    case STATUS_PROGRAMADO:
    default:
      return e.data_programada || e.data_saida || e.data_recebimento || ''
  }
}

/** true quando a data operacional (ISO) cai dentro do intervalo do período. */
export function dataNoPeriodo(dataIso: string, periodo: { ini: string; fim: string }): boolean {
  if (!dataIso) return false
  const d = dataIso.slice(0, 10) // 'YYYY-MM-DD'
  return d >= periodo.ini && d <= periodo.fim
}

/** 'dd/mm/aaaa' ou '' quando não há informação. */
export function formatarDataKs(iso: string): string {
  if (!iso) return ''
  const p = iso.slice(0, 10).split('-')
  if (p.length !== 3) return iso
  return p[2] + '/' + p[1] + '/' + p[0]
}

/** Data + hora de recebimento quando existirem. */
export function formatarDataHoraKs(dataIso: string, hora: string): string {
  if (!dataIso) return ''
  const d = formatarDataKs(dataIso)
  return hora ? d + ' ' + hora : d
}

export interface SituacaoExtraida {
  chave: 'parcial' | 'divergencia'
  rotulo: string
}

/**
 * Situações adicionais preservadas do sistema de origem — apenas exibidas,
 * não alteram o status do envio.
 */
export function extrairSituacao(e: EnvioRecebimentoKs): SituacaoExtraida | null {
  const s = (e.situacao_adicional || '').toLowerCase()
  if (s.includes('parcial')) return { chave: 'parcial', rotulo: 'Recebimento parcial' }
  if (s.includes('diverg')) return { chave: 'divergencia', rotulo: 'Divergência' }
  return null
}
