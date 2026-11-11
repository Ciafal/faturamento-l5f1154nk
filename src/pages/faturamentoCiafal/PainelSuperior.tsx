// Painel superior compacto do processo SAI-01 (SAPMZSD076).
// Linha 1: Nº Transporte, Peso Bruto, Peso Coletado, Peso Líquido Balança, Diferença (t)
// Linha 2: Placa, Tara, Peso Lotes RFID, Diferença (%)
// Linha 3: Data, Hora, Status (picking)

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Truck, Loader2, Search } from 'lucide-react'
import { formatarToneladas, formatarPercentual } from '@/lib/faturamentoCiafal/calculos'
import type { TransporteCarregado, PesosTransporte } from '@/types/faturamentoCiafal'
import type { TransporteFaturamentoRecord } from '@/types/faturamentoCiafal'

interface PainelSuperiorProps {
  numeroTransporte: string
  onNumeroTransporteChange: (v: string) => void
  sugestoes: TransporteFaturamentoRecord[]
  transporte: TransporteCarregado | null
  pesos: PesosTransporte | null
  isCarregando: boolean
  ultimaLeituraBalanca: string | null
}

const CampoPainel: React.FC<{ label: string; valor: string; destacado?: boolean }> = ({
  label,
  valor,
  destacado,
}) => (
  <div className="space-y-0.5">
    <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide truncate">
      {label}
    </p>
    <p
      className={
        'font-mono text-sm font-semibold ' + (destacado ? 'text-[#004c97]' : 'text-slate-700')
      }
    >
      {valor}
    </p>
  </div>
)

const PainelSuperior: React.FC<PainelSuperiorProps> = ({
  numeroTransporte,
  onNumeroTransporteChange,
  sugestoes,
  transporte,
  pesos,
  isCarregando,
  ultimaLeituraBalanca,
}) => {
  const [aberto, setAberto] = React.useState(false)

  return (
    <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-x-3 gap-y-3 p-3">
        {/* Linha 1 */}
        <div className="col-span-2 sm:col-span-3 lg:col-span-1 space-y-0.5">
          <Label
            htmlFor="fat-tknum"
            className="text-[10px] font-medium text-slate-500 uppercase tracking-wide"
          >
            Nº Transporte
          </Label>
          <Popover open={aberto} onOpenChange={setAberto}>
            <PopoverTrigger asChild>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  id="fat-tknum"
                  inputMode="numeric"
                  placeholder="Ex.: 0800012345"
                  maxLength={10}
                  disabled={isCarregando}
                  value={numeroTransporte}
                  onChange={(e) => onNumeroTransporteChange(e.target.value.replace(/\D/g, ''))}
                  className="h-8 pl-7 text-xs font-mono"
                />
                {isCarregando && (
                  <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 animate-spin" />
                )}
              </div>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="start">
              <Command>
                <CommandList>
                  <CommandGroup heading="Transportes de demonstração">
                    {sugestoes.length === 0 && (
                      <p className="px-2 py-3 text-xs text-slate-500">
                        Nenhum transporte de demonstração encontrado.
                      </p>
                    )}
                    {sugestoes.map((t) => (
                      <CommandItem
                        key={t.id}
                        value={t.tknum}
                        onSelect={() => {
                          onNumeroTransporteChange(t.tknum)
                          setAberto(false)
                        }}
                        className="text-xs"
                      >
                        <Truck className="mr-1.5 h-3.5 w-3.5 text-slate-400" />
                        <span className="font-mono">{t.tknum}</span>
                        <span className="ml-auto text-slate-400">{t.placa_veiculo}</span>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
        <CampoPainel
          label="Peso Bruto (t)"
          valor={pesos ? formatarToneladas(pesos.pesoBruto) : '—'}
        />
        <CampoPainel
          label="Peso Coletado (t)"
          valor={pesos ? formatarToneladas(pesos.pesoColetado) : '—'}
        />
        <CampoPainel
          label="Peso Líquido Balança (t)"
          valor={pesos ? formatarToneladas(pesos.pesoLiquidoBalanca) : '—'}
          destacado
        />
        <CampoPainel
          label="Diferença de Peso (t)"
          valor={pesos ? formatarToneladas(pesos.diferencaPesoT) : '—'}
        />

        {/* Linha 2 */}
        <CampoPainel label="Placa" valor={transporte ? transporte.placa_veiculo : '—'} />
        <CampoPainel label="Tara (t)" valor={pesos ? formatarToneladas(pesos.tara) : '—'} />
        <CampoPainel
          label="Peso Lotes RFID (t)"
          valor={pesos ? formatarToneladas(pesos.pesoLoteRfid) : '—'}
        />
        <CampoPainel
          label="Diferença de Peso (%)"
          valor={pesos ? formatarPercentual(pesos.diferencaPesoPct) : '—'}
        />
        <div className="hidden lg:block" />

        {/* Linha 3 */}
        <CampoPainel label="Data" valor={transporte ? transporte.data_processamento : '—'} />
        <CampoPainel label="Hora" valor={transporte ? transporte.hora_processamento : '—'} />
        <div className="space-y-0.5">
          <p className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">Status</p>
          {transporte ? (
            <Badge
              className={
                'text-[10px] font-semibold ' +
                (transporte.status_picking === 'Completo'
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                  : transporte.status_picking === 'Parcial'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-slate-100 text-slate-600 border-slate-200')
              }
            >
              {transporte.status_picking}
            </Badge>
          ) : (
            <p className="font-mono text-sm font-semibold text-slate-400">—</p>
          )}
        </div>
      </div>
      {ultimaLeituraBalanca && (
        <div className="border-t border-slate-100 px-3 py-1.5 text-[10px] text-slate-500">
          Peso bruto lido em {new Date(ultimaLeituraBalanca).toLocaleString('pt-BR')} ·{' '}
          <span className="font-semibold text-amber-700">
            peso simulado (balança real não integrada)
          </span>
        </div>
      )}
      {transporte?.is_simulated && (
        <div className="border-t border-slate-100 px-3 py-1.5 text-[10px] text-slate-500">
          Transporte <span className="font-mono font-semibold">{transporte.tknum}</span> · dados de
          demonstração (VTTK/VTTP/LIPS/MAKT/MCHB não integrados).
        </div>
      )}
    </div>
  )
}

export default PainelSuperior
