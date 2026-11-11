// Diálogo "Executar" do processo ENT-08 "Recebimento KS": confirmação com
// resumo (envio, placa, lotes, pesos, inconsistências) e fluxo em etapas.
// O lançamento real permanece BLOQUEADO — as regras SAP específicas do
// Recebimento KS ficam pendentes do programa ABAP (nenhuma rotina do
// SAPMZSD076 é reutilizada).

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
import { formatarToneladasKs, formatarPercentualKs } from '@/lib/recebimentoKs/calculos'
import type { PesosRecebimentoKs } from '@/types/recebimentoKs'

interface DialogExecutarKsProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  numeroEnvio: string
  observacoes?: string
  placa: string
  pesos: PesosRecebimentoKs
  qtdLotes: number
  qtdInconsistencias: number
  onRegistrarHistorico: (resultado: 'pendente' | 'erro', mensagem: string) => void
}

type EstadoEtapa = 'pendente' | 'executando' | 'ok' | 'erro'

// Etapas ilustrativas do recebimento KS — PENDENTES de especificação ABAP.
// Nenhuma corresponde a uma chamada real; a última sempre termina bloqueada.
const ETAPAS_KS: { id: string; titulo: string; descricao: string }[] = [
  {
    id: 'conferencia',
    titulo: 'Conferência dos blocos (a especificar)',
    descricao: 'Baixa/conferência dos blocos recebidos — regras pendentes do programa ABAP',
  },
  {
    id: 'pesagem',
    titulo: 'Gravação da pesagem (a especificar)',
    descricao: 'Consolidação de bruto/tara/líquido — regras pendentes do programa ABAP',
  },
  {
    id: 'lancamento',
    titulo: 'Lançamento no SAP (a especificar)',
    descricao: 'Integração pendente — etapa obrigatória, sem confirmação disponível',
  },
]

const DialogExecutarKs: React.FC<DialogExecutarKsProps> = ({
  open,
  onOpenChange,
  numeroEnvio,
  observacoes,
  placa,
  pesos,
  qtdLotes,
  qtdInconsistencias,
  onRegistrarHistorico,
}) => {
  const [etapas, setEtapas] = useState<EstadoEtapa[]>(ETAPAS_KS.map(() => 'pendente'))
  const [emAndamento, setEmAndamento] = useState(false)
  const [bloqueadoFinal, setBloqueadoFinal] = useState(false)

  const reiniciar = () => {
    setEtapas(ETAPAS_KS.map(() => 'pendente'))
    setEmAndamento(false)
    setBloqueadoFinal(false)
  }

  const aguardar = (ms: number) => new Promise((r) => setTimeout(r, ms))

  const executar = async () => {
    setEmAndamento(true)
    const nova = [...etapas]

    // Etapas 1 e 2 — simulação local (sem chamada a SAP)
    for (let i = 0; i < 2; i++) {
      nova[i] = 'executando'
      setEtapas([...nova])
      await aguardar(600)
      nova[i] = 'ok'
      setEtapas([...nova])
    }

    // Etapa 3 — lançamento no SAP: pendente de ABAP, termina em erro e o
    // recebimento NÃO é finalizado.
    nova[2] = 'executando'
    setEtapas([...nova])
    await aguardar(600)
    nova[2] = 'erro'
    setEtapas([...nova])
    setBloqueadoFinal(true)
    setEmAndamento(false)
    const obsFormatada = observacoes?.trim()
      ? ` Observações registradas: ${observacoes.trim()}.`
      : ''
    onRegistrarHistorico(
      'pendente',
      `Execução (demo) do envio ${numeroEnvio}: etapas de conferência e pesagem simuladas; lançamento no SAP NÃO confirmado (especificação ABAP pendente). Nenhum lançamento real executado.${obsFormatada}`,
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
            Executar recebimento KS
          </DialogTitle>
          <DialogDescription className="text-xs">
            Resumo do envio antes da execução. O lançamento real permanece bloqueado — regras SAP do
            Recebimento KS pendentes do programa ABAP.
          </DialogDescription>
        </DialogHeader>

        {/* Resumo */}
        <div className="grid grid-cols-2 gap-2 text-xs rounded-md border border-slate-200 p-3 bg-slate-50">
          <div>
            <p className="text-[10px] text-slate-500 uppercase">Nº Envio</p>
            <p className="font-mono font-semibold text-[#004c97]">{numeroEnvio}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase">Placa</p>
            <p className="font-mono font-semibold">{placa || '—'}</p>
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
            <p className="font-mono font-semibold">{formatarToneladasKs(pesos.pesoColetado)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase">Peso Lotes RFID (t)</p>
            <p className="font-mono font-semibold">{formatarToneladasKs(pesos.pesoLotesRfid)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase">Peso Líquido Balança (t)</p>
            <p className="font-mono font-semibold">
              {formatarToneladasKs(pesos.pesoLiquidoBalanca)}
            </p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500 uppercase">Diferença de Peso (t / %)</p>
            <p className="font-mono font-semibold">
              {formatarToneladasKs(pesos.diferencaPesoT)} /{' '}
              {formatarPercentualKs(pesos.diferencaPesoPct)}
            </p>
          </div>
          {observacoes && observacoes.trim().length > 0 && (
            <div className="col-span-2">
              <p className="text-[10px] text-slate-500 uppercase">Observações</p>
              <p className="font-mono font-semibold whitespace-pre-wrap break-words">
                {observacoes.trim()}
              </p>
            </div>
          )}
        </div>

        {/* Fluxo em etapas */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-700">Fluxo de processamento</p>
          {ETAPAS_KS.map((etapa, i) => (
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
              O lançamento no SAP não foi confirmado — especificação ABAP do Recebimento KS
              pendente. O recebimento <strong>não foi finalizado</strong> e nenhum lançamento real
              foi executado.
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

export default DialogExecutarKs
