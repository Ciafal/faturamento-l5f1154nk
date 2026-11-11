// Diálogo "Executar" do processo SAI-01 (SAPMZSD076): resumo + fluxo em etapas
// (EXEC_VT02N, EXEC_ZSDR050, F_UPDATE_DB, WAITING_NF_APROVE). O lançamento real
// permanece BLOQUEADO até a homologação das integrações; a autorização da NF-e é
// etapa obrigatória — sem ela o faturamento não é finalizado.

import React, { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Lock, CheckCircle2, XCircle, Circle } from 'lucide-react'
import { formatarToneladas, formatarPercentual } from '@/lib/faturamentoCiafal/calculos'
import type { TransporteCarregado, PesosTransporte } from '@/types/faturamentoCiafal'

interface DialogExecutarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transporte: TransporteCarregado
  pesos: PesosTransporte
  qtdLotes: number
  qtdInconsistencias: number
  onRegistrarHistorico: (resultado: 'pendente' | 'erro', mensagem: string) => void
}

type EstadoEtapa = 'pendente' | 'executando' | 'ok' | 'erro'

const ETAPAS: { id: string; titulo: string; descricao: string }[] = [
  {
    id: 'transporte',
    titulo: 'Transporte (EXEC_VT02N)',
    descricao: 'Fechamento do transporte em VT02N',
  },
  {
    id: 'fiscal',
    titulo: 'Fiscal (EXEC_ZSDR050)',
    descricao: 'Bloqueio/desbloqueio fiscal e gravação (F_UPDATE_DB)',
  },
  {
    id: 'nfe',
    titulo: 'Autorização da NF-e (WAITING_NF_APROVE)',
    descricao: 'Aguarda a autorização da NF-e antes de finalizar',
  },
]

const DialogExecutar: React.FC<DialogExecutarProps> = ({
  open,
  onOpenChange,
  transporte,
  pesos,
  qtdLotes,
  qtdInconsistencias,
  onRegistrarHistorico,
}) => {
  const [etapas, setEtapas] = useState<EstadoEtapa[]>(ETAPAS.map(() => 'pendente'))
  const [emAndamento, setEmAndamento] = useState(false)
  const [bloqueadoFinal, setBloqueadoFinal] = useState(false)

  const reiniciar = () => {
    setEtapas(ETAPAS.map(() => 'pendente'))
    setEmAndamento(false)
    setBloqueadoFinal(false)
  }

  const aguardar = (ms: number) => new Promise((r) => setTimeout(r, ms))

  const executar = async () => {
    setEmAndamento(true)
    const nova = [...etapas]

    // Etapa 1 — EXEC_VT02N (simulação; chamada real pendente de fonte ABAP)
    nova[0] = 'executando'
    setEtapas([...nova])
    await aguardar(700)
    nova[0] = 'ok'
    setEtapas([...nova])

    // Etapa 2 — EXEC_ZSDR050 + F_UPDATE_DB (simulação; pendente de fonte ABAP)
    nova[1] = 'executando'
    setEtapas([...nova])
    await aguardar(700)
    nova[1] = 'ok'
    setEtapas([...nova])

    // Etapa 3 — WAITING_NF_APROVE: sem confirmação da autorização da NF-e,
    // o faturamento NÃO é finalizado. Sem integração real, a etapa termina
    // em erro e o lançamento permanece bloqueado.
    nova[2] = 'executando'
    setEtapas([...nova])
    await aguardar(700)
    nova[2] = 'erro'
    setEtapas([...nova])
    setBloqueadoFinal(true)
    setEmAndamento(false)
    onRegistrarHistorico(
      'pendente',
      `Execução (demo) do transporte ${transporte.tknum}: etapas VT02N e ZSDR050 simuladas; autorização da NF-e NÃO confirmada (integração pendente). Nenhum lançamento real executado.`,
    )
  }

  const iconeEtapa = (estado: EstadoEtapa) => {
    switch (estado) {
      case 'executando':
        return <Loader2 className="h-4 w-4 animate-spin text-[#004c97]" />
      case 'ok':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      case 'erro':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Circle className="h-4 w-4 text-slate-300" />
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) reiniciar()
        onOpenChange(o)
      }}
    >
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-base font-bold text-[#004c97]">
            Executar faturamento
          </DialogTitle>
          <DialogDescription className="text-xs">
            Resumo do transporte antes da execução. O lançamento real permanece bloqueado até a
            homologação das integrações (SAP/RFID/balança).
          </DialogDescription>
        </DialogHeader>

        {/* Resumo */}
        <div className="grid grid-cols-2 gap-2 text-xs rounded-md border border-slate-200 p-3 bg-slate-50">
          <div>
            <p className="text-[10px] text-slate-500 uppercase">Nº Transporte</p>
            <p className="font-mono font-semibold text-[#004c97]">{transporte.tknum}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase">Placa</p>
            <p className="font-mono font-semibold">{transporte.placa_veiculo}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase">Quantidade de lotes</p>
            <p className="font-mono font-semibold">{qtdLotes}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase">Itens com inconsistências</p>
            <p
              className={
                'font-mono font-semibold ' +
                (qtdInconsistencias > 0 ? 'text-red-700' : 'text-emerald-700')
              }
            >
              {qtdInconsistencias}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase">Peso Coletado (t)</p>
            <p className="font-mono font-semibold">{formatarToneladas(pesos.pesoColetado)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase">Peso Lotes RFID (t)</p>
            <p className="font-mono font-semibold">{formatarToneladas(pesos.pesoLoteRfid)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase">Peso Líquido Balança (t)</p>
            <p className="font-mono font-semibold">{formatarToneladas(pesos.pesoLiquidoBalanca)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase">Diferença de Peso (t / %)</p>
            <p className="font-mono font-semibold">
              {formatarToneladas(pesos.diferencaPesoT)} /{' '}
              {formatarPercentual(pesos.diferencaPesoPct)}
            </p>
          </div>
        </div>

        {/* Fluxo em etapas */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-700">Fluxo de processamento</p>
          {ETAPAS.map((etapa, i) => (
            <div key={etapa.id} className="flex items-start gap-2">
              <span className="mt-0.5">{iconeEtapa(etapas[i])}</span>
              <div>
                <p className="text-xs font-medium text-slate-800">{etapa.titulo}</p>
                <p className="text-[10px] text-slate-500">{etapa.descricao}</p>
              </div>
              {i === 2 && (
                <Badge
                  variant="outline"
                  className="ml-auto text-[9px] bg-amber-50 text-amber-700 border-amber-200 shrink-0"
                >
                  Etapa obrigatória
                </Badge>
              )}
            </div>
          ))}
        </div>

        {bloqueadoFinal && (
          <div className="rounded-md border border-amber-300 bg-amber-50 p-2.5 text-[11px] text-amber-900 flex items-start gap-1.5">
            <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>
              A autorização da NF-e (WAITING_NF_APROVE) não foi confirmada — integração pendente de
              homologação. O faturamento <strong>não foi finalizado</strong> e nenhum lançamento
              real foi executado.
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            onClick={reiniciar}
            disabled={emAndamento}
            className="text-xs"
          >
            Limpar etapas
          </Button>
          <Button
            size="sm"
            disabled={emAndamento}
            onClick={executar}
            className="bg-[#004c97] hover:bg-blue-900 text-white text-xs gap-1.5"
          >
            {emAndamento ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            <span>{emAndamento ? 'Processando…' : 'Iniciar execução (demo)'}</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DialogExecutar
