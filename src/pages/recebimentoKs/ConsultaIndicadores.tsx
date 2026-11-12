// Indicadores da Aba 1 do Recebimento KS (ENT-08): Programados (azul),
// Em Trânsito (laranja), Recebidos (verde). Valores calculados dos registros
// filtrados pelo período escolhido — sem números fictícios.

import React from 'react'
import { CalendarClock, Truck, PackageCheck } from 'lucide-react'
import {
  STATUS_PROGRAMADO,
  STATUS_EM_TRANSITO,
  STATUS_RECEBIDO,
  type EnvioRecebimentoKs,
} from '@/services/recebimentoKs'
import { formatarToneladasKs } from '@/lib/recebimentoKs/calculos'

interface IndicadoresEnviosProps {
  envios: EnvioRecebimentoKs[]
  carregando: boolean
}

interface TotaisEnvios {
  qtdEnvios: number
  qtdBlocos: number
  pesoTotal: number
}

function totalizar(
  envios: EnvioRecebimentoKs[],
  status: string,
  peso: 'previsto' | 'enviado' | 'recebido',
): TotaisEnvios {
  const doStatus = envios.filter((e) => e.status === status)
  const campo =
    peso === 'previsto' ? 'peso_previsto' : peso === 'enviado' ? 'peso_enviado' : 'peso_recebido'
  return {
    qtdEnvios: doStatus.length,
    qtdBlocos: doStatus.reduce((s, e) => s + e.lotes.length, 0),
    pesoTotal: Number(doStatus.reduce((s, e) => s + e[campo], 0).toFixed(3)),
  }
}

const CARDS: {
  status: string
  titulo: string
  peso: 'previsto' | 'enviado' | 'recebido'
  rotuloPeso: string
  icone: React.ReactNode
  classes: { borda: string; fundo: string; titulo: string; valor: string }
}[] = [
  {
    status: STATUS_PROGRAMADO,
    titulo: 'PROGRAMADOS',
    peso: 'previsto',
    rotuloPeso: 'peso total previsto',
    icone: <CalendarClock className="h-5 w-5" />,
    classes: {
      borda: 'border-blue-200',
      fundo: 'bg-blue-50/60',
      titulo: 'text-blue-700',
      valor: 'text-blue-900',
    },
  },
  {
    status: STATUS_EM_TRANSITO,
    titulo: 'EM TRÂNSITO',
    peso: 'enviado',
    rotuloPeso: 'peso total enviado',
    icone: <Truck className="h-5 w-5" />,
    classes: {
      borda: 'border-orange-200',
      fundo: 'bg-orange-50/60',
      titulo: 'text-orange-700',
      valor: 'text-orange-900',
    },
  },
  {
    status: STATUS_RECEBIDO,
    titulo: 'RECEBIDOS',
    peso: 'recebido',
    rotuloPeso: 'peso total recebido',
    icone: <PackageCheck className="h-5 w-5" />,
    classes: {
      borda: 'border-green-200',
      fundo: 'bg-green-50/60',
      titulo: 'text-green-700',
      valor: 'text-green-900',
    },
  },
]

const IndicadoresEnvios: React.FC<IndicadoresEnviosProps> = ({ envios, carregando }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      {CARDS.map((c) => {
        const t = totalizar(envios, c.status, c.peso)
        return (
          <div
            key={c.status}
            className={'rounded-lg border p-3 ' + c.classes.borda + ' ' + c.classes.fundo}
          >
            <div className="flex items-center justify-between">
              <span className={'text-[11px] font-bold tracking-wider ' + c.classes.titulo}>
                {c.titulo}
              </span>
              <span className={c.classes.titulo}>{c.icone}</span>
            </div>
            {carregando ? (
              <div className="mt-2 h-10 animate-pulse rounded bg-white/60" />
            ) : (
              <div className={'mt-1.5 flex items-baseline gap-1.5 ' + c.classes.valor}>
                <span className="text-2xl font-bold leading-none">{t.qtdEnvios}</span>
                <span className="text-[11px] text-slate-500">
                  envio(s) · {t.qtdBlocos} bloco(s)
                </span>
              </div>
            )}
            <div className={'mt-1 text-[11px] font-medium ' + c.classes.valor}>
              {c.rotuloPeso}: {carregando ? '…' : formatarToneladasKs(t.pesoTotal)} t
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default IndicadoresEnvios
