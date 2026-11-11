import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/** Nomes EXATOS dos campos do painel (ordem fixa). */
export const LABELS_CAMPOS = {
  tknum: 'Nº Transporte',
  pesoBruto: 'Peso Bruto (t)',
  pesoColetado: 'Peso Coletado (t)',
  pesoLiquidoBalanca: 'Peso Líquido Balança (t)',
  diferencaT: 'Diferença de Peso (t)',
  placa: 'Placa',
  tara: 'Tara (t)',
  pesoRfid: 'Peso Lotes RFID (t)',
  diferencaPct: 'Diferença de Peso (%)',
  data: 'Data',
  hora: 'Hora',
  statusPicking: 'Status',
} as const

export const DEMO_TKNUMS = ['0800012345', '0800012346', '0800012347']

export interface CampoPainelProps {
  transporte: {
    tknum: string
    placa_veiculo: string
    data_processamento: string
    hora_processamento: string
    status_picking: string
    tara: number
    peso_coletado: number
  }
  pesos: {
    pesoBruto: number
    pesoColetado: number
    pesoLiquidoBalanca: number
    diferencaPesoT: number
    diferencaPesoPct: number | null
  }
  formatarToneladas: (v: number) => string
  formatarPercentual: (v: number | null) => string
}

export const CampoPainel: React.FC<CampoPainelProps> = ({
  transporte,
  pesos,
  formatarToneladas,
  formatarPercentual,
}) => {
  const isZero = (v: number) => !v || v === 0
  const temDados = transporte.tknum !== ''

  return (
    <div className="space-y-3">
      {/* Linha 1 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="space-y-1">
          <Label htmlFor="fat-tknum" className="text-xs font-medium text-slate-600">
            {LABELS_CAMPOS.tknum}
          </Label>
          <Input
            id="fat-tknum"
            placeholder="Informe o Nº do transporte"
            inputMode="numeric"
            maxLength={10}
            value={transporte.tknum}
            onChange={(e) => {
              const v = e.target.value.replace(/\D/g, '')
              const el = e.target as HTMLInputElement
              const setter = (el as unknown as { __setTknum?: (v: string) => void }).__setTknum
              if (setter) setter(v)
            }}
            className="text-xs font-mono"
          />
          <p className="text-[10px] text-slate-400">
            Transportes de demonstração: {DEMO_TKNUMS.join(', ')}
          </p>
        </div>
        <CampoPeso
          id="fat-pbruto"
          label={LABELS_CAMPOS.pesoBruto}
          value={formatarToneladas(pesos.pesoBruto)}
          destaque={!temDados || isZero(pesos.pesoBruto)}
        />
        <CampoPeso
          id="fat-pcoletado"
          label={LABELS_CAMPOS.pesoColetado}
          value={formatarToneladas(pesos.pesoColetado)}
        />
        <CampoPeso
          id="fat-pliquido"
          label={LABELS_CAMPOS.pesoLiquidoBalanca}
          value={formatarToneladas(pesos.pesoLiquidoBalanca)}
        />
        <CampoPeso
          id="fat-dif-t"
          label={LABELS_CAMPOS.diferencaT}
          value={formatarToneladas(pesos.diferencaPesoT)}
          destaque={!temDados || isZero(pesos.diferencaPesoT)}
        />
      </div>

      {/* Linha 2 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <CampoTexto id="fat-placa" label={LABELS_CAMPOS.placa} value={transporte.placa_veiculo} />
        <CampoPeso
          id="fat-tara"
          label={LABELS_CAMPOS.tara}
          value={formatarToneladas(transporte.tara)}
        />
        <CampoPeso
          id="fat-prfid"
          label={LABELS_CAMPOS.pesoRfid}
          value={formatarToneladas(pesos.pesoColetado)}
        />
        <CampoPeso
          id="fat-dif-pct"
          label={LABELS_CAMPOS.diferencaPct}
          value={formatarPercentual(pesos.diferencaPesoPct)}
        />
      </div>

      {/* Linha 3 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <CampoTexto
          id="fat-data"
          label={LABELS_CAMPOS.data}
          value={transporte.data_processamento}
        />
        <CampoTexto
          id="fat-hora"
          label={LABELS_CAMPOS.hora}
          value={transporte.hora_processamento}
        />
        <CampoTexto
          id="fat-status"
          label={LABELS_CAMPOS.statusPicking}
          value={transporte.status_picking}
        />
      </div>
    </div>
  )
}

interface CampoPesoProps {
  id: string
  label: string
  value: string
  destaque?: boolean
}

const CampoPeso: React.FC<CampoPesoProps> = ({ id, label, value, destaque }) => (
  <div className="space-y-1">
    <Label htmlFor={id} className="text-xs font-medium text-slate-600">
      {label}
    </Label>
    <Input
      id={id}
      readOnly
      value={value}
      className={cn(
        'text-xs font-mono text-right bg-slate-50',
        destaque && 'text-slate-400 italic',
      )}
    />
  </div>
)

interface CampoTextoProps {
  id: string
  label: string
  value: string
}

const CampoTexto: React.FC<CampoTextoProps> = ({ id, label, value }) => (
  <div className="space-y-1">
    <Label htmlFor={id} className="text-xs font-medium text-slate-600">
      {label}
    </Label>
    <Input id={id} readOnly value={value || '—'} className="text-xs font-mono bg-slate-50" />
  </div>
)

export const BadgesFuncionalidades: React.FC = () => {
  const badges: Array<{ texto: string; classe: string }> = [
    {
      texto: 'Interface implementada',
      classe: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    },
    { texto: 'Simulação funcional', classe: 'bg-blue-100 text-blue-800 border-blue-200' },
    { texto: 'Integração pendente', classe: 'bg-amber-100 text-amber-800 border-amber-200' },
    { texto: 'Homologado', classe: 'bg-slate-100 text-slate-600 border-slate-200' },
  ]
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {badges.map((b) => (
        <Badge
          key={b.texto}
          variant="outline"
          className={cn('text-[10px] font-semibold', b.classe)}
        >
          {b.texto}
        </Badge>
      ))}
    </div>
  )
}
