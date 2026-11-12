// Dialog "Acusar Recebimento" — ENT-09 Monitor NF-e.
// Registra data/hora/usuário, atualiza status para Recebida e grava
// auditoria. NÃO envia manifestação à SEFAZ (funcionalidade futura
// independente) e NÃO lança nada no SAP.
import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { useAuth } from '@/context/AuthContext'
import type { DadosRecebimento, NfeDocumento } from '@/types/monitorNfe'

interface DialogAcusarRecebimentoProps {
  nfe: NfeDocumento | null
  processando: boolean
  onConfirmar: (dados: DadosRecebimento) => void
  onCancelar: () => void
}

function agoraSp(): { data: string; hora: string } {
  const agora = new Date()
  const data = agora.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })
  const hora = agora.toLocaleTimeString('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
  })
  const [dia, mes, ano] = data.split('/')
  return { data: `${ano}-${mes}-${dia}`, hora }
}

const DialogAcusarRecebimento: React.FC<DialogAcusarRecebimentoProps> = ({
  nfe,
  processando,
  onConfirmar,
  onCancelar,
}) => {
  const { user, empresaSelecionada } = useAuth()
  const inicial = agoraSp()
  const [data, setData] = useState(inicial.data)
  const [hora, setHora] = useState(inicial.hora)
  const [usuario, setUsuario] = useState('')
  const [centro, setCentro] = useState('0100 - Ciafal Matriz')
  const [local, setLocal] = useState('Doca de recebimento')
  const [observacoes, setObservacoes] = useState('')
  const [confirmado, setConfirmado] = useState(false)

  useEffect(() => {
    if (nfe) {
      const agora = agoraSp()
      setData(agora.data)
      setHora(agora.hora)
      setUsuario(user?.name || user?.email || '')
      setCentro('0100 - Ciafal Matriz')
      setLocal('Doca de recebimento')
      setObservacoes('')
      setConfirmado(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nfe])

  if (!nfe) return null

  const podeConfirmar = confirmado && data && hora && usuario

  const aoConfirmar = () => {
    onConfirmar({
      empresa: empresaSelecionada.razaoSocial,
      numero: nfe.numero,
      serie: nfe.serie,
      fornecedor: nfe.fornecedor_razao_social,
      data_recebimento: data,
      hora_recebimento: hora,
      usuario_recebedor: usuario,
      centro,
      local_recebimento: local,
      observacoes,
      recebimento_fisico_confirmado: confirmado,
    })
  }

  return (
    <Dialog open={!!nfe} onOpenChange={(aberto) => !aberto && onCancelar()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base text-[#004c97]">
            Acusar Recebimento — NF-e {nfe.numero}/{nfe.serie}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {nfe.fornecedor_razao_social} · Sem manifestação fiscal à SEFAZ e sem lançamento SAP.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-1">
          <div className="flex flex-col gap-1">
            <Label className="text-[11px]">Empresa</Label>
            <Input value={empresaSelecionada.razaoSocial} disabled className="h-8 text-xs" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[11px]">NF-e</Label>
            <Input value={`${nfe.numero}/${nfe.serie}`} disabled className="h-8 text-xs" />
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <Label className="text-[11px]">Fornecedor</Label>
            <Input value={nfe.fornecedor_razao_social} disabled className="h-8 text-xs" />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[11px]">Data do recebimento</Label>
            <Input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[11px]">Hora do recebimento</Label>
            <Input
              type="time"
              value={hora}
              onChange={(e) => setHora(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[11px]">Usuário recebedor</Label>
            <Input
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex flex-col gap-1">
            <Label className="text-[11px]">Centro</Label>
            <Input
              value={centro}
              onChange={(e) => setCentro(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <Label className="text-[11px]">Local de recebimento</Label>
            <Input
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-1">
            <Label className="text-[11px]">Observações</Label>
            <textarea
              value={observacoes}
              onChange={(e) => setObservacoes(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-xs shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#004c97]"
              placeholder="Observações do recebimento (opcional)"
            />
          </div>
          <label className="col-span-2 flex items-center gap-2 rounded-md border bg-slate-50 px-3 py-2 cursor-pointer">
            <Checkbox checked={confirmado} onCheckedChange={(v) => setConfirmado(Boolean(v))} />
            <span className="text-[11px] text-slate-700">
              Confirmo que o recebimento físico dos materiais desta NF-e foi realizado.
            </span>
          </label>
        </div>

        <DialogFooter className="pt-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-8"
            onClick={onCancelar}
            disabled={processando}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            className="bg-[#004c97] hover:bg-[#003a75] text-white text-xs h-8"
            onClick={aoConfirmar}
            disabled={!podeConfirmar || processando}
          >
            {processando ? 'Registrando…' : 'Confirmar recebimento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DialogAcusarRecebimento
