// Tela ENT-09 "Monitor NF-e de Entrada" — Fase 1.
// Dashboard (8 cards por status) + grade de 14 colunas + filtros combináveis +
// exportação CSV + botão "Sincronizar SEFAZ" (bloqueado por certificado, via
// pb_hooks) + detalhe da NF-e em 7 abas + "Acusar Recebimento" (sem
// manifestação à SEFAZ e sem lançamento SAP).
// Massa de dados de DEMONSTRAÇÃO (nfe_documentos, migrations 0014/0015) —
// claramente identificada como simulada.

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RefreshCw, Search, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import {
  acusarRecebimentoNfe,
  buscarNfeSyncState,
  listarNfeDocumentos,
  sincronizarSefaz,
  formatarDataHoraNfe,
  formatarMoedaNfe,
} from '@/services/monitorNfe'
import type { DadosRecebimento, NfeDocumento, StatusNfe } from '@/types/monitorNfe'
import type { NfeSyncState } from '@/types/monitorNfe'
import { STATUS_NFE, ROTULO_STATUS, CORES_STATUS_NFE, CARD_STATUS_NFE } from '@/types/monitorNfe'
import DashboardCards from './monitorNfe/DashboardCards'
import GradeNfe from './monitorNfe/GradeNfe'
import DetalheNfe from './monitorNfe/DetalheNfe'
import DialogAcusarRecebimento from './monitorNfe/DialogAcusarRecebimento'

export interface FiltrosNfe {
  empresa: string
  cnpjDestinatario: string
  fornecedor: string
  numeroNf: string
  chaveAcesso: string
  cfop: string
  pedidoSap: string
  status: string
  dataInicio: string
  dataFim: string
}

export const FILTROS_INICIAIS: FiltrosNfe = {
  empresa: 'todas',
  cnpjDestinatario: '',
  fornecedor: '',
  numeroNf: '',
  chaveAcesso: '',
  cfop: '',
  pedidoSap: '',
  status: 'todos',
  dataInicio: '',
  dataFim: '',
}

const MonitorNfeEntrada: React.FC = () => {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { user } = useAuth()
  const usuarioEmail = user?.email ?? ''
  const usuarioNome = user?.name ?? usuarioEmail

  const [documentos, setDocumentos] = useState<NfeDocumento[]>([])
  const [carregando, setCarregando] = useState(true)
  const [filtros, setFiltros] = useState<FiltrosNfe>(FILTROS_INICIAIS)
  const [pesquisa, setPesquisa] = useState('')
  const [syncState, setSyncState] = useState<NfeSyncState | null>(null)
  const [sincronizando, setSincronizando] = useState(false)
  const [selecionadas, setSelecionadas] = useState<string[]>([])
  const [docDetalhe, setDocDetalhe] = useState<NfeDocumento | null>(null)
  const [docRecebimento, setDocRecebimento] = useState<NfeDocumento | null>(null)
  const [processandoRecebimento, setProcessandoRecebimento] = useState(false)

  const carregar = useCallback(async () => {
    setCarregando(true)
    setDocumentos(await listarNfeDocumentos())
    setCarregando(false)
  }, [])

  useEffect(() => {
    carregar()
    buscarNfeSyncState().then(setSyncState)
  }, [carregar])

  // ---- Filtragem combinável (empresa, CNPJ, fornecedor, NF, chave, CFOP,
  // pedido SAP, status, período) + pesquisa geral --------------------------
  const documentosFiltrados = useMemo(() => {
    const termo = pesquisa.trim().toLowerCase()
    return documentos.filter((d) => {
      if (filtros.empresa !== 'todas' && d.empresa !== filtros.empresa) return false
      if (filtros.cnpjDestinatario && !d.cnpj_destinatario.includes(filtros.cnpjDestinatario))
        return false
      if (
        filtros.fornecedor &&
        !d.fornecedor_razao_social.toLowerCase().includes(filtros.fornecedor.toLowerCase())
      )
        return false
      if (filtros.numeroNf && !d.numero.includes(filtros.numeroNf)) return false
      if (filtros.chaveAcesso && !d.chave_acesso.includes(filtros.chaveAcesso)) return false
      if (filtros.cfop && d.cfop !== filtros.cfop) return false
      if (
        filtros.pedidoSap &&
        !d.pedido_sap.toLowerCase().includes(filtros.pedidoSap.toLowerCase())
      )
        return false
      if (filtros.status !== 'todos' && d.status !== filtros.status) return false
      if (filtros.dataInicio) {
        const dEmis = d.data_emissao.slice(0, 10)
        if (dEmis < filtros.dataInicio) return false
      }
      if (filtros.dataFim) {
        const dEmis = d.data_emissao.slice(0, 10)
        if (dEmis > filtros.dataFim) return false
      }
      if (termo) {
        const alvo = [
          d.numero,
          d.serie,
          d.fornecedor_razao_social,
          d.fornecedor_cnpj,
          d.chave_acesso,
          d.pedido_sap,
          d.entrada_sap_doc,
          d.usuario_recebedor,
        ]
          .join(' ')
          .toLowerCase()
        if (!alvo.includes(termo)) return false
      }
      return true
    })
  }, [documentos, filtros, pesquisa])

  const contagemPorStatus = useMemo(() => {
    const cont: Partial<Record<StatusNfe, number>> = {}
    for (const s of STATUS_NFE) cont[s] = 0
    for (const d of documentosFiltrados) {
      cont[d.status] = (cont[d.status] ?? 0) + 1
    }
    return cont
  }, [documentosFiltrados])

  const empresas = useMemo(() => {
    const lista = new Set(documentos.map((d) => d.empresa))
    return Array.from(lista).sort()
  }, [documentos])

  // ---- Ações --------------------------------------------------------------

  const aoClicarCard = (status: StatusNfe) => {
    setFiltros((f) => ({ ...f, status: f.status === status ? 'todos' : status }))
  }

  const aoSincronizar = async () => {
    setSincronizando(true)
    const usuario = usuarioEmail || 'usuário HUB'
    const res = await sincronizarSefaz(usuario)
    setSincronizando(false)
    toast({
      title: res.bloqueado ? 'Captura SEFAZ pendente' : 'Sincronização SEFAZ',
      description: res.motivo,
      variant: res.bloqueado ? 'default' : 'default',
    })
    if (res.nova_sincronizacao) {
      buscarNfeSyncState().then(setSyncState)
    }
  }

  const aoConfirmarRecebimento = async (dados: DadosRecebimento) => {
    if (!docRecebimento) return
    setProcessandoRecebimento(true)
    try {
      const docAtualizado = await acusarRecebimentoNfe(docRecebimento, dados)
      setDocumentos((docs) => docs.map((d) => (d.id === docAtualizado.id ? docAtualizado : d)))
      setDocDetalhe((atual) => (atual && atual.id === docAtualizado.id ? docAtualizado : atual))
      setDocRecebimento(null)
      toast({
        title: 'Recebimento registrado',
        description: `NF-e ${docAtualizado.numero}/${docAtualizado.serie} marcada como Recebida (sem manifestação fiscal à SEFAZ).`,
      })
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : String(err)
      toast({
        title: 'Erro ao registrar recebimento',
        description: msg,
        variant: 'destructive',
      })
    } finally {
      setProcessandoRecebimento(false)
    }
  }

  const alternarSelecao = (id: string) => {
    setSelecionadas((sel) => (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]))
  }

  const alternarTodos = () => {
    setSelecionadas((sel) =>
      sel.length === documentosFiltrados.length ? [] : documentosFiltrados.map((d) => d.id),
    )
  }

  const aoExportarCsv = () => {
    const linhas = documentosFiltrados.filter(
      (d) => selecionadas.length === 0 || selecionadas.includes(d.id),
    )
    const cabecalho = [
      'Status',
      'Empresa',
      'NF',
      'Série',
      'Emissão',
      'Fornecedor',
      'CNPJ emitente',
      'CFOP',
      'Valor (R$)',
      'Recebimento',
      'Responsável',
      'Pedido SAP',
      'Divergência',
      'Entrada SAP',
    ]
    const linhasCsv = linhas.map((d) => [
      d.status,
      d.empresa,
      d.numero,
      d.serie,
      formatarDataHoraNfe(d.data_emissao),
      d.fornecedor_razao_social,
      d.fornecedor_cnpj,
      d.cfop,
      formatarMoedaNfe(d.valor_total),
      formatarDataHoraNfe(d.data_recebimento),
      d.usuario_recebedor,
      d.pedido_sap,
      d.tem_divergencia ? 'Sim' : 'Não',
      d.entrada_sap_doc,
    ])
    const csv = [cabecalho, ...linhasCsv]
      .map((linha) => linha.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(';'))
      .join('\r\n')
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `monitor-nfe-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const ultimaSync = syncState
    ? formatarDataHoraNfe(syncState.updated || syncState.ultima_sincronizacao)
    : ''

  return (
    <div className="flex flex-col gap-3 p-4 lg:p-6">
      {/* Cabeçalho */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-start gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/processos/entradas')}
            title="Voltar"
            className="h-8 w-8 shrink-0"
          >
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-[#004c97] leading-tight">
              Monitor NF-e de Entrada
            </h1>
            <p className="text-xs text-slate-500">
              Acompanhamento de NF-e de fornecedores — fluxo HUB (Fase 1: estrutura + dados demo)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-slate-100 border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Dados simulados
          </span>
          <Button
            size="sm"
            onClick={aoSincronizar}
            disabled={sincronizando}
            className="bg-[#004c97] hover:bg-[#003a75] text-white text-xs h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${sincronizando ? 'animate-spin' : ''}`} />
            {sincronizando ? 'Sincronizando…' : 'Sincronizar SEFAZ'}
          </Button>
        </div>
      </div>

      {/* Pendência de sincronização */}
      {syncState && syncState.ultimo_status === 'bloqueado' && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-start gap-2">
          <RefreshCw className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">
              Captura SEFAZ pendente — certificado digital A1 não configurado
            </p>
            <p className="text-amber-700">{syncState.ultima_mensagem}</p>
            {ultimaSync && (
              <p className="text-amber-600 mt-0.5">
                Última tentativa: {ultimaSync} · Tentativas: {syncState.total_tentativas} · Erros:{' '}
                {syncState.total_erros}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Dashboard de 8 cards */}
      <DashboardCards
        contagem={contagemPorStatus}
        onClicarCard={aoClicarCard}
        statusAtivo={filtros.status}
      />

      {/* Filtros */}
      <div className="rounded-md border bg-white p-3 flex flex-wrap items-end gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            value={pesquisa}
            onChange={(e) => setPesquisa(e.target.value)}
            placeholder="Pesquisar NF, fornecedor, chave, pedido SAP…"
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Select
          value={filtros.empresa}
          onValueChange={(v) => setFiltros((f) => ({ ...f, empresa: v }))}
        >
          <SelectTrigger className="w-[220px] h-8 text-xs">
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as empresas</SelectItem>
            {empresas.map((e) => (
              <SelectItem key={e} value={e}>
                {e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          value={filtros.fornecedor}
          onChange={(e) => setFiltros((f) => ({ ...f, fornecedor: e.target.value }))}
          placeholder="Fornecedor"
          className="w-[160px] h-8 text-xs"
        />
        <Input
          value={filtros.numeroNf}
          onChange={(e) => setFiltros((f) => ({ ...f, numeroNf: e.target.value }))}
          placeholder="Nº NF"
          className="w-[90px] h-8 text-xs"
        />
        <Input
          value={filtros.cfop}
          onChange={(e) => setFiltros((f) => ({ ...f, cfop: e.target.value }))}
          placeholder="CFOP"
          className="w-[80px] h-8 text-xs"
        />
        <Input
          value={filtros.pedidoSap}
          onChange={(e) => setFiltros((f) => ({ ...f, pedidoSap: e.target.value }))}
          placeholder="Pedido SAP"
          className="w-[110px] h-8 text-xs"
        />
        <div className="flex items-center gap-1">
          <Input
            type="date"
            value={filtros.dataInicio}
            onChange={(e) => setFiltros((f) => ({ ...f, dataInicio: e.target.value }))}
            className="w-[140px] h-8 text-xs"
            title="Emissão de"
          />
          <span className="text-xs text-slate-400">a</span>
          <Input
            type="date"
            value={filtros.dataFim}
            onChange={(e) => setFiltros((f) => ({ ...f, dataFim: e.target.value }))}
            className="w-[140px] h-8 text-xs"
            title="Emissão até"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => {
            setFiltros(FILTROS_INICIAIS)
            setPesquisa('')
          }}
        >
          Limpar filtros
        </Button>
        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={aoExportarCsv}>
          Exportar CSV
        </Button>
      </div>

      {/* Grade principal */}
      <GradeNfe
        documentos={documentosFiltrados}
        carregando={carregando}
        selecionadas={selecionadas}
        onToggleSelecao={alternarSelecao}
        onToggleTodos={alternarTodos}
        onAbrirDetalhe={setDocDetalhe}
      />

      {/* Detalhe (Dialog) */}
      <DetalheNfe
        nfe={docDetalhe}
        onClose={() => setDocDetalhe(null)}
        onAcusarRecebimento={() => setDocRecebimento(docDetalhe)}
      />

      {/* Dialog Acusar Recebimento */}
      <DialogAcusarRecebimento
        nfe={docRecebimento}
        processando={processandoRecebimento}
        onConfirmar={aoConfirmarRecebimento}
        onCancelar={() => setDocRecebimento(null)}
      />
    </div>
  )
}

export default MonitorNfeEntrada
