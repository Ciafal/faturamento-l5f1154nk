// Painel superior da tela Recebimento KS (ENT-08): dados do envio + pesos.
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Search } from 'lucide-react'
import { formatarPercentualKs, formatarToneladasKs } from '@/lib/recebimentoKs/calculos'
import type { PesosRecebimentoKs } from '@/types/recebimentoKs'

interface PainelSuperiorKsProps {
  numeroEnvio: string
  onNumeroEnvioChange: (v: string) => void
  placa: string
  dataProcessamento: string
  horaProcessamento: string
  statusPicking: string
  pesos: PesosRecebimentoKs | null
  isBuscandoLotes: boolean
  onBuscarLotes: () => void
}

function CampoCompacto({
  label,
  value,
  onChange,
  placeholder,
  disabled,
  onKeyDown,
}: {
  label: string
  value: string
  onChange?: (v: string) => void
  placeholder?: string
  disabled?: boolean
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-slate-600">{label}</label>
      <Input
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        onKeyDown={onKeyDown}
        className="h-8 text-xs"
      />
    </div>
  )
}

function CampoSomenteLeitura({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-medium text-slate-600">{label}</label>
      <div className="h-8 rounded-md border border-slate-200 bg-slate-50 px-2.5 flex items-center text-xs text-slate-700">
        {value || '—'}
      </div>
    </div>
  )
}

export function PainelSuperiorKs({
  numeroEnvio,
  onNumeroEnvioChange,
  placa,
  dataProcessamento,
  horaProcessamento,
  statusPicking,
  pesos,
  isBuscandoLotes,
  onBuscarLotes,
}: PainelSuperiorKsProps) {
  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-2 pt-3 px-4">
        <CardTitle className="text-sm font-semibold text-[#004c97]">Dados do Envio</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-medium text-slate-600">Nº Envio</label>
            <div className="flex gap-1">
              <Input
                value={numeroEnvio}
                onChange={(e) => onNumeroEnvioChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onBuscarLotes()
                }}
                placeholder="Ex.: 1800010001"
                disabled={isBuscandoLotes}
                className="h-8 text-xs"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={onBuscarLotes}
                disabled={isBuscandoLotes || !numeroEnvio.trim()}
                title="Buscar lotes do envio"
                className="h-8 w-8 shrink-0"
              >
                {isBuscandoLotes ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Search className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </div>
          <CampoSomenteLeitura label="Placa" value={placa} />
          <CampoSomenteLeitura label="Data do processamento" value={dataProcessamento} />
          <CampoSomenteLeitura label="Hora do processamento" value={horaProcessamento} />
          <CampoSomenteLeitura label="Status global de picking" value={statusPicking} />
          <div className="hidden xl:block" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2 mt-3">
          <CampoSomenteLeitura
            label="Peso Bruto (t)"
            value={pesos ? formatarToneladasKs(pesos.pesoBruto) : ''}
          />
          <CampoSomenteLeitura
            label="Tara (t)"
            value={pesos ? formatarToneladasKs(pesos.tara) : ''}
          />
          <CampoSomenteLeitura
            label="Peso Coletado (t)"
            value={pesos ? formatarToneladasKs(pesos.pesoColetado) : ''}
          />
          <CampoSomenteLeitura
            label="Peso Lotes RFID (t)"
            value={pesos ? formatarToneladasKs(pesos.pesoLotesRfid) : ''}
          />
          <CampoSomenteLeitura
            label="Peso Líquido Balança (t)"
            value={pesos ? formatarToneladasKs(pesos.pesoLiquidoBalanca) : ''}
          />
          <CampoSomenteLeitura
            label="Diferença de Peso (t)"
            value={pesos ? formatarToneladasKs(pesos.diferencaPesoT) : ''}
          />
          <CampoSomenteLeitura
            label="Diferença de Peso (%)"
            value={pesos ? formatarPercentualKs(pesos.diferencaPesoPct) : ''}
          />
        </div>
      </CardContent>
    </Card>
  )
}
