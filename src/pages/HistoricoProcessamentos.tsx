import React, { useState, useEffect } from 'react'
import { listarHistoricoProcessamentos } from '@/services/faturamento'
import { EMPRESAS_HOMOLOGADAS } from '@/context/AuthContext'
import { TODOS_PROCESSOS } from '@/types/processos'
import type { HistoricoProcessamentoRecord } from '@/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  History,
  Filter,
  RotateCcw,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  User,
  Building,
  Calendar,
  Layers,
  Eye,
} from 'lucide-react'

export default function HistoricoProcessamentos() {
  const [historico, setHistorico] = useState<HistoricoProcessamentoRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Filtros
  const [empresaFiltro, setEmpresaFiltro] = useState('')
  const [processoFiltro, setProcessoFiltro] = useState('')
  const [numeroNfFiltro, setNumeroNfFiltro] = useState('')
  const [resultadoFiltro, setResultadoFiltro] = useState('')
  const [usuarioFiltro, setUsuarioFiltro] = useState('')

  // Modal de Detalhes
  const [registroSelecionado, setRegistroSelecionado] =
    useState<HistoricoProcessamentoRecord | null>(null)

  const carregarDados = async () => {
    setIsLoading(true)
    const registros = await listarHistoricoProcessamentos({
      empresa: empresaFiltro || undefined,
      processoId: processoFiltro || undefined,
      numeroNf: numeroNfFiltro || undefined,
      resultado: resultadoFiltro || undefined,
      userEmail: usuarioFiltro || undefined,
    })
    setHistorico(registros)
    setIsLoading(false)
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const handleAplicarFiltros = (e: React.FormEvent) => {
    e.preventDefault()
    carregarDados()
  }

  const handleLimparFiltros = () => {
    setEmpresaFiltro('')
    setProcessoFiltro('')
    setNumeroNfFiltro('')
    setResultadoFiltro('')
    setUsuarioFiltro('')
    setTimeout(() => {
      listarHistoricoProcessamentos().then(setHistorico)
    }, 50)
  }

  const renderBadgeResultado = (resultado: string) => {
    switch (resultado) {
      case 'sucesso':
        return (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px] font-semibold">
            Sucesso
          </Badge>
        )
      case 'pendente':
        return (
          <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-semibold">
            Pendente
          </Badge>
        )
      case 'erro':
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200 text-[10px] font-semibold">
            Erro
          </Badge>
        )
      case 'ja_processado':
        return (
          <Badge className="bg-blue-100 text-[#004c97] border-blue-200 text-[10px] font-semibold">
            Já Processado
          </Badge>
        )
      default:
        return (
          <Badge variant="outline" className="text-[10px]">
            {resultado}
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded bg-blue-100 text-[#004c97]">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                Histórico de Processamentos e Auditoria
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Rastreabilidade de consultas, validações, alterações de status e registros de EDI do
                HUB Ciafal.
              </p>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded border">
          Registros Carregados: <strong className="text-slate-800">{historico.length}</strong>
        </div>
      </div>

      {/* Card de Filtros */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-[#004c97]" />
            <span>Filtros de Pesquisa e Auditoria</span>
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-4">
          <form onSubmit={handleAplicarFiltros} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Filtro Empresa */}
              <div className="space-y-1">
                <Label htmlFor="flt-emp" className="text-xs font-medium text-slate-600">
                  Empresa / Centro
                </Label>
                <select
                  id="flt-emp"
                  value={empresaFiltro}
                  onChange={(e) => setEmpresaFiltro(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#004c97]"
                >
                  <option value="">Todas as Empresas</option>
                  {EMPRESAS_HOMOLOGADAS.map((e) => (
                    <option key={e.codigo} value={e.razaoSocial}>
                      {e.razaoSocial}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro Processo */}
              <div className="space-y-1">
                <Label htmlFor="flt-proc" className="text-xs font-medium text-slate-600">
                  Processo
                </Label>
                <select
                  id="flt-proc"
                  value={processoFiltro}
                  onChange={(e) => setProcessoFiltro(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#004c97]"
                >
                  <option value="">Todos os Processos</option>
                  {TODOS_PROCESSOS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.codigo} - {p.titulo}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filtro Nota Fiscal */}
              <div className="space-y-1">
                <Label htmlFor="flt-nf" className="text-xs font-medium text-slate-600">
                  Número da NF
                </Label>
                <Input
                  id="flt-nf"
                  placeholder="Ex: 000128450"
                  value={numeroNfFiltro}
                  onChange={(e) => setNumeroNfFiltro(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>

              {/* Filtro Resultado */}
              <div className="space-y-1">
                <Label htmlFor="flt-res" className="text-xs font-medium text-slate-600">
                  Resultado
                </Label>
                <select
                  id="flt-res"
                  value={resultadoFiltro}
                  onChange={(e) => setResultadoFiltro(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-300 bg-white px-2.5 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#004c97]"
                >
                  <option value="">Todos os Resultados</option>
                  <option value="sucesso">Sucesso</option>
                  <option value="pendente">Pendente</option>
                  <option value="erro">Erro</option>
                  <option value="ja_processado">Já Processado</option>
                </select>
              </div>

              {/* Filtro Usuário */}
              <div className="space-y-1">
                <Label htmlFor="flt-usr" className="text-xs font-medium text-slate-600">
                  Usuário (E-mail)
                </Label>
                <Input
                  id="flt-usr"
                  placeholder="usuario@ciafal.com.br"
                  value={usuarioFiltro}
                  onChange={(e) => setUsuarioFiltro(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleLimparFiltros}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
                <span>Limpar Filtros</span>
              </Button>

              <Button
                type="submit"
                size="sm"
                className="bg-[#004c97] hover:bg-blue-900 text-white font-semibold text-xs gap-1.5 shadow"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Filtrar Histórico</span>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tabela de Resultados do Histórico */}
      <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-slate-500">
              Carregando registros de auditoria do banco de dados...
            </div>
          ) : historico.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">
                Nenhum registro encontrado com os filtros aplicados.
              </p>
              <p>
                Tente remover alguns filtros ou realizar novas consultas nos módulos de recebimento.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 border-b font-semibold">
                  <tr>
                    <th className="p-3">Data / Hora</th>
                    <th className="p-3">Empresa</th>
                    <th className="p-3">Processo</th>
                    <th className="p-3">NF / Série</th>
                    <th className="p-3">Parceiro</th>
                    <th className="p-3">Resultado</th>
                    <th className="p-3">Doc SAP</th>
                    <th className="p-3">Usuário</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {historico.map((h) => {
                    const dataFormatada = h.created
                      ? new Date(h.created).toLocaleString('pt-BR')
                      : 'Data N/D'

                    return (
                      <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                        <td className="p-3 font-mono text-slate-600 whitespace-nowrap">
                          {dataFormatada}
                        </td>
                        <td className="p-3 text-slate-700 max-w-[140px] truncate" title={h.empresa}>
                          {h.empresa}
                        </td>
                        <td className="p-3">
                          <span
                            className="font-semibold text-slate-800 line-clamp-1"
                            title={h.processo_nome}
                          >
                            {h.processo_nome}
                          </span>
                        </td>
                        <td className="p-3 font-mono font-bold text-[#004c97] whitespace-nowrap">
                          {h.numero_nf} (Série {h.serie_nf})
                        </td>
                        <td
                          className="p-3 text-slate-600 max-w-[140px] truncate"
                          title={h.fornecedor || h.cliente}
                        >
                          {h.fornecedor || h.cliente || '-'}
                        </td>
                        <td className="p-3">{renderBadgeResultado(h.resultado)}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-700">
                          {h.documento_sap || '-'}
                        </td>
                        <td
                          className="p-3 text-[11px] text-slate-500 max-w-[120px] truncate"
                          title={h.user_email}
                        >
                          {h.user_nome || h.user_email}
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setRegistroSelecionado(h)}
                            className="h-7 w-7 p-0 text-slate-500 hover:text-[#004c97] hover:bg-blue-50"
                            title="Ver detalhes de auditoria"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes da Auditoria */}
      <Dialog
        open={!!registroSelecionado}
        onOpenChange={(open) => !open && setRegistroSelecionado(null)}
      >
        <DialogContent className="max-w-2xl text-xs space-y-3">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#004c97] flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>Registro Detalhado de Auditoria</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Protocolo de rastreabilidade gravado no banco de dados do HUB Ciafal.
            </DialogDescription>
          </DialogHeader>

          {registroSelecionado && (
            <div className="space-y-3 pt-2">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded border">
                <div>
                  <span className="text-slate-400 font-medium">Processo:</span>
                  <p className="font-semibold text-slate-800">
                    {registroSelecionado.processo_nome}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Empresa:</span>
                  <p className="font-semibold text-slate-800">{registroSelecionado.empresa}</p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Nota Fiscal e Série:</span>
                  <p className="font-mono font-bold text-[#004c97]">
                    {registroSelecionado.numero_nf} • Série {registroSelecionado.serie_nf}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 font-medium">Documento SAP:</span>
                  <p className="font-mono font-semibold text-slate-800">
                    {registroSelecionado.documento_sap || 'Nenhum lançamento físico/fiscal'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded border p-2.5">
                  <span className="text-slate-400 font-medium">Status Anterior:</span>
                  <p className="text-slate-700">{registroSelecionado.status_anterior || 'N/D'}</p>
                </div>
                <div className="rounded border p-2.5">
                  <span className="text-slate-400 font-medium">Status Posterior / Atual:</span>
                  <p className="font-semibold text-slate-800">
                    {registroSelecionado.status_posterior || 'N/D'}
                  </p>
                </div>
              </div>

              <div className="rounded border p-3 bg-white space-y-1">
                <span className="text-slate-400 font-medium">
                  Mensagens do Sistema e Validações:
                </span>
                <p className="text-slate-800 leading-relaxed">{registroSelecionado.mensagens}</p>
              </div>

              {registroSelecionado.detalhes_json && (
                <div className="rounded border p-3 bg-slate-50 space-y-1">
                  <span className="text-slate-400 font-medium">Metadados Técnicos (JSON):</span>
                  <pre className="font-mono text-[11px] text-slate-700 bg-white p-2 rounded border overflow-x-auto">
                    {JSON.stringify(registroSelecionado.detalhes_json, null, 2)}
                  </pre>
                </div>
              )}

              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t pt-2">
                <span>
                  Operador: {registroSelecionado.user_nome} ({registroSelecionado.user_email})
                </span>
                <span>
                  Data:{' '}
                  {registroSelecionado.created
                    ? new Date(registroSelecionado.created).toLocaleString('pt-BR')
                    : '-'}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
