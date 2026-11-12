// Aba 1 "Consulta de Envios" do processo ENT-08 Recebimento KS:
// painel operacional com indicadores (Programados/Em Trânsito/Recebidos),
// filtros de período (Ontem|Hoje|Semana|Mês + personalizado), pesquisa e
// relação de envios. Todos os dados vêm da coleção recebimentos_ks_demo
// (migrations 0010/0011/0013) — massa de DEMONSTRAÇÃO, sem chamada SAP real.

import React, { useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Eye, ClipboardCheck, FileSearch, X, PackageOpen } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  STATUS_PROGRAMADO,
  STATUS_EM_TRANSITO,
  STATUS_RECEBIDO,
  type EnvioRecebimentoKs,
} from '@/services/recebimentoKs'
import { formatarToneladasKs } from '@/lib/recebimentoKs/calculos'
import IndicadoresEnvios from './ConsultaIndicadores'
import {
  PeriodoKs,
  PERIODOS_KS,
  rotuloPeriodo,
  dataNoPeriodo,
  periodoAtivo,
  formatarDataKs,
  formatarDataHoraKs,
  SituacaoExtraida,
  extrairSituacao,
  dataOperacionalDe,
} from './ConsultaFiltros'

interface AbaConsultaEnviosProps {
  envios: EnvioRecebimentoKs[]
  carregando: boolean
  onAbrirEnvio: (envio: EnvioRecebimentoKs) => void
}

type FiltroPeriodo = PeriodoKs | 'personalizado'

function badgeStatusKs(status: string, situacao: SituacaoExtraida | null) {
  const base: Record<string, string> = {
    [STATUS_PROGRAMADO]: 'bg-blue-50 text-blue-700 border-blue-200',
    [STATUS_EM_TRANSITO]: 'bg-orange-50 text-orange-700 border-orange-200',
    [STATUS_RECEBIDO]: 'bg-green-50 text-green-700 border-green-200',
  }
  return (
    <div className="flex flex-col items-start gap-1">
      <Badge
        variant="outline"
        className={
          'text-[10px] font-semibold ' +
          (base[status] ?? 'bg-slate-100 text-slate-600 border-slate-200')
        }
      >
        {status || '—'}
      </Badge>
      {situacao && (
        <Badge
          variant="outline"
          className="text-[10px] bg-amber-50 text-amber-700 border-amber-200"
        >
          {situacao.rotulo}
        </Badge>
      )}
    </div>
  )
}

function CampoInfo({ label, value }: { label: string; value: string }) {
  if (!value) {
    return (
      <div className="flex flex-col">
        <span className="text-[10px] uppercase tracking-wide text-slate-400">{label}</span>
        <span className="text-[11px] text-slate-400 italic" title="Sem informação">
          sem informação
        </span>
      </div>
    )
  }
  return (
    <div className="flex flex-col">
      <span className="text-[10px] uppercase tracking-wide text-slate-400">{label}</span>
      <span className="text-[11px] font-medium text-slate-700">{value}</span>
    </div>
  )
}

const AbaConsultaEnvios: React.FC<AbaConsultaEnviosProps> = ({
  envios,
  carregando,
  onAbrirEnvio,
}) => {
  const [filtroPeriodo, setFiltroPeriodo] = useState<FiltroPeriodo>('mes')
  const [dataInicial, setDataInicial] = useState('')
  const [dataFinal, setDataFinal] = useState('')
  const [pesquisa, setPesquisa] = useState('')
  const [fPlaca, setFPlaca] = useState('')
  const [fStatus, setFStatus] = useState('todos')
  const [fOrigem, setFOrigem] = useState('todas')

  const periodos: { valor: FiltroPeriodo; rotulo: string }[] = [
    { valor: 'ontem', rotulo: 'Ontem' },
    { valor: 'hoje', rotulo: 'Hoje' },
    { valor: 'semana', rotulo: 'Semana' },
    { valor: 'mes', rotulo: 'Mês' },
  ]

  const origensDisponiveis = useMemo(
    () =>
      Array.from(new Set(envios.map((e) => e.origem).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'pt-BR'),
      ),
    [envios],
  )

  const aplicandoFiltros = filtroPeriodo !== 'personalizado' || (dataInicial && dataFinal)

  const emPeriodo = useMemo(
    () => (e: EnvioRecebimentoKs) => {
      if (filtroPeriodo === 'personalizado') {
        if (!dataInicial || !dataFinal) return true
        const ini = dataInicial.replaceAll('-', '')
        const fim = dataFinal.replaceAll('-', '')
        const dOp = dataOperacionalDe(e)
        return dOp >= ini && dOp <= fim
      }
      const ativo = periodoAtivo(filtroPeriodo)
      return dataNoPeriodo(dataOperacionalDe(e), ativo)
    },
    [filtroPeriodo, dataInicial, dataFinal],
  )

  const enviosFiltrados = useMemo(() => {
    const p = pesquisa.trim().toLowerCase()
    const placa = fPlaca.trim().toLowerCase()
    return envios
      .filter(emPeriodo)
      .filter((e) => {
        if (p && !e.numero_envio.toLowerCase().includes(p)) return false
        if (placa && !e.placa_veiculo.toLowerCase().includes(placa)) return false
        if (fStatus !== 'todos' && e.status !== fStatus) return false
        if (fOrigem !== 'todas' && e.origem !== fOrigem) return false
        return true
      })
      .sort((a, b) => b.numero_envio.localeCompare(a.numero_envio))
  }, [envios, emPeriodo, pesquisa, fPlaca, fStatus, fOrigem])

  const situacaoDe = (e: EnvioRecebimentoKs) => extrairSituacao(e)

  const botaoAcao = (e: EnvioRecebimentoKs) => {
    const sit = situacaoDe(e)
    const suffix = sit ? ` (${sit.rotulo})` : ''
    switch (e.status) {
      case STATUS_PROGRAMADO:
        return { icone: <Eye className="h-3.5 w-3.5" />, texto: 'Visualizar Envio' + suffix }
      case STATUS_EM_TRANSITO:
        return {
          icone: <ClipboardCheck className="h-3.5 w-3.5" />,
          texto: 'Conferir Recebimento' + suffix,
        }
      case STATUS_RECEBIDO:
        return {
          icone: <FileSearch className="h-3.5 w-3.5" />,
          texto: 'Consultar Recebimento' + suffix,
        }
      default:
        return { icone: <Eye className="h-3.5 w-3.5" />, texto: 'Visualizar Envio' }
    }
  }

  const limparFiltros = () => {
    setPesquisa('')
    setFPlaca('')
    setFStatus('todos')
    setFOrigem('todas')
    setFiltroPeriodo('mes')
    setDataInicial('')
    setDataFinal('')
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Aviso de dados de demonstração */}
      <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
        <PackageOpen className="h-4 w-4 shrink-0 text-amber-600" />
        <p className="text-[11px] text-amber-700">
          <strong>Modo demonstração:</strong> envios, blocos, lotes e pesos são uma massa de dados
          simulada (coleção <code className="text-[10px]">recebimentos_ks_demo</code>). Nenhuma
          operação SAP real é executada.
        </p>
      </div>

      {/* Indicadores */}
      <IndicadoresEnvios envios={envios.filter(emPeriodo)} carregando={carregando} />

      {/* Filtros de período */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-medium text-slate-500">Período:</span>
        <div className="flex rounded-md border border-slate-200 overflow-hidden">
          {periodos.map((p) => (
            <button
              key={p.valor}
              type="button"
              onClick={() => setFiltroPeriodo(p.valor)}
              className={
                'px-3 py-1.5 text-xs font-medium transition-colors border-r border-slate-200 last:border-r-0 ' +
                (filtroPeriodo === p.valor
                  ? 'bg-[#004c97] text-white'
                  : 'bg-white text-slate-600 hover:bg-slate-50')
              }
            >
              {p.rotulo}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <Input
            type="date"
            value={dataInicial}
            onChange={(e) => {
              setDataInicial(e.target.value)
              if (e.target.value && dataFinal) setFiltroPeriodo('personalizado')
            }}
            className="h-8 w-36 text-xs"
            title="Data inicial (personalizado)"
          />
          <span className="text-xs text-slate-400">até</span>
          <Input
            type="date"
            value={dataFinal}
            onChange={(e) => {
              setDataFinal(e.target.value)
              if (e.target.value && dataInicial) setFiltroPeriodo('personalizado')
            }}
            className="h-8 w-36 text-xs"
            title="Data final (personalizado)"
          />
        </div>
        {aplicandoFiltros && (
          <span className="text-[10px] text-slate-400 italic">{rotuloPeriodo(filtroPeriodo)}</span>
        )}
      </div>

      {/* Pesquisa e filtros combináveis */}
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2 h-8 w-56 focus-within:ring-1 focus-within:ring-[#004c97]">
          <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
          <input
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar Nº Envio…"
            className="h-full w-full bg-transparent text-xs outline-none placeholder:text-slate-400"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] text-slate-400">Placa</label>
          <Input
            value={fPlaca}
            onChange={(e) => setFPlaca(e.target.value)}
            placeholder="Filtrar placa…"
            className="h-8 w-32 text-xs"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] text-slate-400">Status</label>
          <Select value={fStatus} onValueChange={setFStatus}>
            <SelectTrigger className="h-8 w-36 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value={STATUS_PROGRAMADO}>Programado</SelectItem>
              <SelectItem value={STATUS_EM_TRANSITO}>Em Trânsito</SelectItem>
              <SelectItem value={STATUS_RECEBIDO}>Recebido</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-0.5">
          <label className="text-[10px] text-slate-400">Unidade de origem</label>
          <Select value={fOrigem} onValueChange={setFOrigem}>
            <SelectTrigger className="h-8 w-40 text-xs">
              <SelectValue placeholder="Origem" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as unidades</SelectItem>
              {origensDisponiveis.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={limparFiltros}
          className="h-8 text-xs gap-1 border-slate-300"
        >
          <X className="h-3.5 w-3.5" />
          Limpar Filtros
        </Button>
      </div>

      {/* Relação de Envios KS */}
      <Card className="border-slate-200">
        <CardHeader className="pb-2 pt-3 px-4">
          <CardTitle className="text-sm font-semibold text-[#004c97]">
            Relação de Envios KS
            <span className="ml-2 text-[11px] font-normal text-slate-400">
              {enviosFiltrados.length} envio(s) no período {rotuloPeriodo(filtroPeriodo)}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4 pt-0">
          {enviosFiltrados.length === 0 ? (
            <div className="flex h-28 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
              Nenhum envio corresponde aos filtros aplicados.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {enviosFiltrados.map((envio) => {
                const acao = botaoAcao(envio)
                return (
                  <div
                    key={envio.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onAbrirEnvio(envio)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') onAbrirEnvio(envio)
                    }}
                    className="cursor-pointer rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md hover:border-[#004c97]/40 focus:outline-none focus:ring-1 focus:ring-[#004c97]"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold text-[#004c97]">
                          {envio.numero_envio}
                        </span>
                        {envio.is_simulated && (
                          <Badge
                            variant="outline"
                            className="text-[9px] bg-slate-100 text-slate-500 border-slate-200"
                          >
                            DEMO
                          </Badge>
                        )}
                      </div>
                      {badgeStatusKs(envio.status, situacaoDe(envio))}
                    </div>

                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5">
                      <CampoInfo
                        label="Data Programada"
                        value={formatarDataKs(envio.data_programada)}
                      />
                      <CampoInfo label="Data de Saída" value={formatarDataKs(envio.data_saida)} />
                      <CampoInfo
                        label="Data de Recebimento"
                        value={formatarDataHoraKs(envio.data_recebimento, envio.hora_processamento)}
                      />
                      <CampoInfo label="Origem" value={envio.origem} />
                      <CampoInfo label="Destino (KS)" value={envio.destino} />
                      <CampoInfo label="Placa" value={envio.placa_veiculo} />
                    </div>

                    <div className="mt-2 flex items-center justify-between gap-2 rounded bg-slate-50 px-2.5 py-1.5">
                      <CampoInfo label="Nº de Blocos" value={String(envio.lotes.length)} />
                      <CampoInfo
                        label="Peso Previsto (t)"
                        value={
                          envio.peso_previsto > 0 ? formatarToneladasKs(envio.peso_previsto) : ''
                        }
                      />
                      <CampoInfo
                        label="Peso Enviado (t)"
                        value={
                          envio.peso_enviado > 0 ? formatarToneladasKs(envio.peso_enviado) : ''
                        }
                      />
                      <CampoInfo
                        label="Peso Recebido (t)"
                        value={
                          envio.peso_recebido > 0 ? formatarToneladasKs(envio.peso_recebido) : ''
                        }
                      />
                    </div>

                    <div className="mt-2 flex justify-end">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(ev) => {
                          ev.stopPropagation()
                          onAbrirEnvio(envio)
                        }}
                        className="h-7 text-[11px] gap-1 border-[#004c97]/30 text-[#004c97] hover:bg-[#004c97]/5"
                      >
                        {acao.icone}
                        {acao.texto}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default AbaConsultaEnvios
