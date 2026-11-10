import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  buscarNotaFiscalPorChave,
  listarNotasFiscais,
  registrarHistoricoProcessamento,
} from '@/services/faturamento'
import { SapIntegrationAdapter, type SapValidationResponse } from '@/services/sapAdapter'
import type { NotaFiscalRecord } from '@/types/database'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Search,
  CheckCircle2,
  RotateCcw,
  History,
  AlertTriangle,
  Info,
  Package,
  Layers,
  ArrowRightLeft,
  FileText,
  Building,
  Calendar,
  DollarSign,
  Truck,
  ShieldCheck,
  Ban,
} from 'lucide-react'

interface EdiSubcontratacaoFormProps {
  processType: 'produto_acabado' | 'sucata_carepa_argola'
}

export default function EdiSubcontratacaoForm({ processType }: EdiSubcontratacaoFormProps) {
  const isProdutoAcabado = processType === 'produto_acabado'
  const tituloProcesso = isProdutoAcabado
    ? 'EDI – Lançamento NF Subcontratação (Produto Acabado)'
    : 'EDI – Lançamento NF Subcontratação (Argola/Sucata/Carepa)'
  const codigoProcesso = isProdutoAcabado ? 'ENT-01' : 'ENT-02'
  const processoId = isProdutoAcabado ? 'edi-subcontratacao-pa' : 'edi-subcontratacao-sucata'

  const { user, empresaSelecionada, temPermissao } = useAuth()
  const navigate = useNavigate()

  // Grupo 1: Fornecedor, Cliente, Nota Fiscal, Série
  const [fornecedorCodigo, setFornecedorCodigo] = useState('')
  const [clienteCodigo, setClienteCodigo] = useState('')
  const [numeroNf, setNumeroNf] = useState('')
  const [serieNf, setSerieNf] = useState('1')

  // Grupo 2: Categoria da NF iniciando...
  const [categoriaNf, setCategoriaNf] = useState(
    isProdutoAcabado
      ? 'E1 - Entrada Mercadoria Subcontratação (SDC)'
      : 'E3 - Entrada Argola / Sucata / Carepa',
  )

  // Estados de Operação
  const [isConsultando, setIsConsultando] = useState(false)
  const [isValidando, setIsValidando] = useState(false)
  const [notaConsultada, setNotaConsultada] = useState<NotaFiscalRecord | null>(null)
  const [resultadoValidacao, setResultadoValidacao] = useState<SapValidationResponse | null>(null)
  const [mensagemAviso, setMensagemAviso] = useState<string | null>(null)
  const [notasDisponiveisDemo, setNotasDisponiveisDemo] = useState<NotaFiscalRecord[]>([])

  // Carregar notas disponíveis de demonstração
  useEffect(() => {
    async function carregarNotas() {
      const lista = await listarNotasFiscais(processType)
      setNotasDisponiveisDemo(lista)
      if (lista.length > 0) {
        // Pré-preenche o primeiro item para facilitar a demonstração imediata
        const primeira = lista[0]
        setNumeroNf(primeira.numero_nf)
        setSerieNf(primeira.serie_nf)
        setFornecedorCodigo(primeira.fornecedor_codigo)
        setClienteCodigo(primeira.cliente_codigo || '')
      }
    }
    carregarNotas()
  }, [processType])

  const handleConsultarNf = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!numeroNf || !serieNf) {
      setMensagemAviso('Preencha ao menos o Número da NF e a Série para consultar.')
      return
    }

    setIsConsultando(true)
    setMensagemAviso(null)
    setResultadoValidacao(null)

    const nota = await buscarNotaFiscalPorChave(processType, numeroNf, serieNf, fornecedorCodigo)
    setIsConsultando(false)

    if (nota) {
      setNotaConsultada(nota)
      setFornecedorCodigo(nota.fornecedor_codigo)
      setClienteCodigo(nota.cliente_codigo || '')
      setCategoriaNf(nota.categoria_nf)

      // Registra consulta no histórico de auditoria
      await registrarHistoricoProcessamento({
        user_id: user?.id,
        user_email: user?.email || 'usuario@ciafal.com.br',
        user_nome: user?.name || 'Usuário Ciafal',
        empresa: empresaSelecionada.razaoSocial,
        processo_id: processoId,
        processo_nome: tituloProcesso,
        tipo_operacao: 'entrada',
        numero_nf: nota.numero_nf,
        serie_nf: nota.serie_nf,
        fornecedor: nota.fornecedor_nome,
        cliente: nota.cliente_nome || empresaSelecionada.razaoSocial,
        status_anterior: nota.status_sap_descricao,
        status_posterior: nota.status_sap_descricao,
        resultado: 'sucesso',
        documento_sap: nota.doc_sap_migo ? `MIGO: ${nota.doc_sap_migo}` : '-',
        mensagens: `Consulta detalhada de NF simulada realizada com sucesso no HUB. Categoria: ${nota.categoria_nf}`,
        detalhes_json: {
          valor_total: nota.valor_total,
          itens_qtd: nota.itens_json?.length || 0,
          pedidos_qtd: nota.pedidos_json?.length || 0,
        },
      })
    } else {
      setNotaConsultada(null)
      setMensagemAviso(
        `Nota Fiscal ${numeroNf} Série ${serieNf} não foi encontrada na base de demonstração para ${tituloProcesso}. Selecione um dos exemplos sugeridos abaixo.`,
      )
    }
  }

  const handleValidarNota = async () => {
    if (!notaConsultada) return
    setIsValidando(true)

    // Executa contrato do adaptador SAP
    const validacao = SapIntegrationAdapter.validarNotaFiscal(notaConsultada)
    setResultadoValidacao(validacao)
    setIsValidando(false)

    // Auditoria da validação
    await registrarHistoricoProcessamento({
      user_id: user?.id,
      user_email: user?.email || 'usuario@ciafal.com.br',
      user_nome: user?.name || 'Usuário Ciafal',
      empresa: empresaSelecionada.razaoSocial,
      processo_id: processoId,
      processo_nome: tituloProcesso,
      tipo_operacao: 'entrada',
      numero_nf: notaConsultada.numero_nf,
      serie_nf: notaConsultada.serie_nf,
      fornecedor: notaConsultada.fornecedor_nome,
      cliente: notaConsultada.cliente_nome || empresaSelecionada.razaoSocial,
      status_anterior: notaConsultada.status_sap_codigo,
      status_posterior: validacao.codigoSap,
      resultado: validacao.valido ? 'sucesso' : 'pendente',
      documento_sap: notaConsultada.doc_sap_migo || '-',
      mensagens: validacao.descricao,
      detalhes_json: {
        interface_rfc: validacao.detalhesTecnicos.interfaceRfc,
        movimento: validacao.detalhesTecnicos.movimentoEstoque,
        deposito: validacao.detalhesTecnicos.deposito,
      },
    })
  }

  const handleLimpar = () => {
    setFornecedorCodigo('')
    setClienteCodigo('')
    setNumeroNf('')
    setSerieNf('1')
    setNotaConsultada(null)
    setResultadoValidacao(null)
    setMensagemAviso(null)
  }

  const selecionarNotaExemplo = (n: NotaFiscalRecord) => {
    setNumeroNf(n.numero_nf)
    setSerieNf(n.serie_nf)
    setFornecedorCodigo(n.fornecedor_codigo)
    setClienteCodigo(n.cliente_codigo || '')
    setCategoriaNf(n.categoria_nf)
    setNotaConsultada(n)
    setResultadoValidacao(null)
    setMensagemAviso(null)
  }

  const podeExecutarRecebimento = temPermissao('executar_recebimento')

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho do Processo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-bold text-[#004c97] bg-blue-100 px-2 py-0.5 rounded">
              {codigoProcesso}
            </span>
            <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
              Modo Demonstração Homologado
            </Badge>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 mt-1">
            {tituloProcesso}
          </h1>
          <p className="text-xs text-slate-500">
            {isProdutoAcabado
              ? 'Conferência física e fiscal de produto acabado de subcontratação industrial (Movimento SAP 101/543).'
              : 'Tratamento de retorno de retalhos, argolas, carepas e subprodutos industriais (Movimento SAP 545/311, Depósito DP34).'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/historico')}
            className="text-xs text-slate-700 border-slate-300 gap-1.5"
          >
            <History className="h-3.5 w-3.5 text-slate-500" />
            <span>Histórico do Módulo</span>
          </Button>
        </div>
      </div>

      {/* Aviso de Dados Simulados */}
      <Alert className="border-blue-200 bg-blue-50/80 text-blue-900 py-3 text-xs">
        <Info className="h-4 w-4 text-[#004c97]" />
        <AlertTitle className="text-xs font-bold text-[#004c97]">
          Ambiente de Demonstração — Dados de Simulação Homologados
        </AlertTitle>
        <AlertDescription className="text-blue-800">
          Todas as notas fiscais, fornecedores, pedidos e materiais exibidos nesta tela são
          simulados para demonstração do HUB Ciafal. Sem lançamentos reais no SAP ERP nesta versão.
        </AlertDescription>
      </Alert>

      {/* Sugestões de Notas Rápidas para Teste */}
      {notasDisponiveisDemo.length > 0 && (
        <div className="rounded-md border border-slate-200 bg-white p-3 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
            <span>Notas de Demonstração cadastradas no banco de dados para este processo:</span>
            <span className="text-[11px] text-slate-400">Clique para carregar</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {notasDisponiveisDemo.map((n) => (
              <button
                key={n.id}
                type="button"
                onClick={() => selecionarNotaExemplo(n)}
                className={`flex items-center gap-2 rounded border px-2.5 py-1 text-xs transition-colors ${
                  notaConsultada?.id === n.id
                    ? 'border-[#004c97] bg-blue-50 text-[#004c97] font-semibold'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span>
                  NF {n.numero_nf} (Série {n.serie_nf})
                </span>
                <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                  {n.fornecedor_nome}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Formulário Principal: Grupo 1 e Grupo 2 */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-[#004c97] uppercase tracking-wider">
            Critérios de Pesquisa da Nota Fiscal
          </CardTitle>
          <CardDescription className="text-xs">
            Seleção única para Fornecedor, Cliente e Nota Fiscal seguindo máscaras e padrões do SAP.
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          <form onSubmit={handleConsultarNf} className="space-y-4">
            {/* Grupo 1: Fornecedor, Cliente, Nota Fiscal, Série */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                Grupo 1: Identificação de Parceiros e Documento Fiscal
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="forn" className="text-xs font-medium text-slate-600">
                    Fornecedor (Código SAP)
                  </Label>
                  <Input
                    id="forn"
                    placeholder="FORN-001042"
                    value={fornecedorCodigo}
                    onChange={(e) => setFornecedorCodigo(e.target.value.toUpperCase())}
                    className="text-xs font-mono uppercase"
                  />
                  <span className="text-[10px] text-slate-400">
                    Ex: FORN-001042 (Aços do Brasil)
                  </span>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="cli" className="text-xs font-medium text-slate-600">
                    Cliente / Destinatário
                  </Label>
                  <Input
                    id="cli"
                    placeholder="CLI-000501"
                    value={clienteCodigo}
                    onChange={(e) => setClienteCodigo(e.target.value.toUpperCase())}
                    className="text-xs font-mono uppercase"
                  />
                  <span className="text-[10px] text-slate-400">Ex: CLI-000501 (Ciafal Matriz)</span>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="nf" className="text-xs font-medium text-slate-600">
                    Nota Fiscal (Número SAP / SEFAZ) *
                  </Label>
                  <Input
                    id="nf"
                    placeholder="000128450"
                    value={numeroNf}
                    onChange={(e) => setNumeroNf(e.target.value)}
                    required
                    className="text-xs font-mono font-semibold"
                  />
                  <span className="text-[10px] text-slate-400">
                    Número da NF com zeros à esquerda
                  </span>
                </div>

                <div className="space-y-1">
                  <Label htmlFor="serie" className="text-xs font-medium text-slate-600">
                    Série da NF *
                  </Label>
                  <Input
                    id="serie"
                    placeholder="1"
                    value={serieNf}
                    onChange={(e) => setSerieNf(e.target.value)}
                    required
                    className="text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Padrão 1 ou 2</span>
                </div>
              </div>
            </div>

            {/* Grupo 2: Categoria da NF iniciando... */}
            <div className="space-y-1 pt-1">
              <Label
                htmlFor="cat"
                className="text-xs font-bold text-slate-700 uppercase tracking-wide"
              >
                Grupo 2: Categoria da NF iniciando com prefixo SAP
              </Label>
              <Input
                id="cat"
                value={categoriaNf}
                onChange={(e) => setCategoriaNf(e.target.value)}
                placeholder="Ex: E1 - Entrada Mercadoria Subcontratação (SDC)"
                className="text-xs"
              />
              <span className="text-[10px] text-slate-400">
                Iniciando com E1 (SDC Produto Acabado), E2 (Retorno Insumos) ou E3
                (Sucata/Argola/Carepa).
              </span>
            </div>

            {/* Ações do Formulário */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="submit"
                  disabled={isConsultando}
                  className="bg-[#004c97] hover:bg-blue-900 text-white font-semibold text-xs gap-1.5 shadow"
                >
                  <Search className="h-3.5 w-3.5" />
                  <span>{isConsultando ? 'Consultando...' : 'Consultar NF'}</span>
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleValidarNota}
                  disabled={!notaConsultada || isValidando}
                  className="border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-semibold gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>{isValidando ? 'Validando...' : 'Validar Regras SAP'}</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleLimpar}
                  className="text-xs text-slate-500 hover:text-slate-800 gap-1"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Limpar</span>
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => navigate('/historico')}
                  className="text-xs text-slate-600 hover:text-slate-900 gap-1"
                >
                  <History className="h-3 w-3" />
                  <span>Histórico</span>
                </Button>
              </div>

              {/* Botão Processar Recebimento (Visível porém desabilitado) */}
              <div className="flex items-center gap-2">
                <div
                  title="Funcionalidade prevista para após homologação da integração SAP RFC/S4HANA"
                  className="inline-block"
                >
                  <Button
                    type="button"
                    disabled
                    className="bg-slate-200 text-slate-400 cursor-not-allowed text-xs font-semibold gap-1.5 border border-slate-300"
                  >
                    <Ban className="h-3.5 w-3.5 text-slate-400" />
                    <span>Processar Recebimento (Desabilitado)</span>
                  </Button>
                </div>
              </div>
            </div>
          </form>

          {/* Mensagem de Aviso se não encontrar */}
          {mensagemAviso && (
            <Alert className="border-amber-200 bg-amber-50 text-amber-900 text-xs py-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-xs font-semibold">Registro Não Localizado</AlertTitle>
              <AlertDescription>{mensagemAviso}</AlertDescription>
            </Alert>
          )}

          {/* Resultado da Validação SAP */}
          {resultadoValidacao && (
            <div className="rounded-md border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-800">
                  <ShieldCheck className="h-4 w-4 text-[#004c97]" />
                  <span>
                    Resultado da Validação do Contrato SAP ({resultadoValidacao.codigoSap})
                  </span>
                </div>
                <Badge
                  className={
                    resultadoValidacao.valido
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }
                >
                  {resultadoValidacao.valido ? 'Apto para MIGO' : 'Com Inconsistências'}
                </Badge>
              </div>

              <p className="text-xs text-slate-600">{resultadoValidacao.descricao}</p>

              <div className="space-y-1.5 pt-1">
                {resultadoValidacao.mensagens.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex items-start gap-2 p-2 rounded text-xs ${
                      msg.tipo === 'E'
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : msg.tipo === 'W'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : msg.tipo === 'S'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    <span className="font-bold uppercase text-[10px] shrink-0 mt-0.5">
                      [{msg.tipo}]
                    </span>
                    <span>{msg.texto}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                <div>
                  RFC:{' '}
                  <strong className="text-slate-700">
                    {resultadoValidacao.detalhesTecnicos.interfaceRfc}
                  </strong>
                </div>
                <div>
                  Prog. ABAP:{' '}
                  <strong className="text-slate-700">
                    {resultadoValidacao.detalhesTecnicos.programaAbapPrevisto}
                  </strong>
                </div>
                <div>
                  Movimento:{' '}
                  <strong className="text-slate-700">
                    {resultadoValidacao.detalhesTecnicos.movimentoEstoque}
                  </strong>
                </div>
                <div>
                  Depósito:{' '}
                  <strong className="text-slate-700">
                    {resultadoValidacao.detalhesTecnicos.deposito}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Painéis da Consulta Detalhada em Abas (Cabeçalho, Itens, Pedidos, Integração) */}
      {notaConsultada && (
        <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/70 border-b border-slate-200 py-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900">
                  NF-e {notaConsultada.numero_nf} • Série {notaConsultada.serie_nf}
                </span>
                <Badge className="bg-blue-100 text-[#004c97] border-blue-200 text-[10px]">
                  Simulado
                </Badge>
              </div>
              <p className="text-xs text-slate-500">
                {notaConsultada.fornecedor_nome} (CNPJ: {notaConsultada.fornecedor_cnpj})
              </p>
            </div>

            {/* Controle de Status dos Recebimentos com código SAP e descrição amigável */}
            <div className="flex flex-col sm:items-end">
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 font-medium">
                  Status do Recebimento:
                </span>
                <Badge
                  className={`text-xs font-semibold ${
                    notaConsultada.status_recebimento === 'concluido'
                      ? 'bg-emerald-100 text-emerald-800'
                      : notaConsultada.status_recebimento === 'fisico_concluido_pendente_fiscal'
                        ? 'bg-blue-100 text-[#004c97]'
                        : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {notaConsultada.status_sap_codigo}
                </Badge>
              </div>
              <span className="text-[11px] text-slate-600 font-medium mt-0.5 max-w-sm truncate text-right">
                {notaConsultada.status_sap_descricao}
              </span>
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            <Tabs defaultValue="cabecalho" className="space-y-4">
              <TabsList className="bg-slate-100 p-1 border">
                <TabsTrigger value="cabecalho" className="text-xs font-semibold gap-1.5">
                  <Building className="h-3.5 w-3.5" />
                  <span>Cabeçalho</span>
                </TabsTrigger>
                <TabsTrigger value="itens" className="text-xs font-semibold gap-1.5">
                  <Package className="h-3.5 w-3.5" />
                  <span>Itens da Nota ({notaConsultada.itens_json?.length || 0})</span>
                </TabsTrigger>
                <TabsTrigger value="pedidos" className="text-xs font-semibold gap-1.5">
                  <Layers className="h-3.5 w-3.5" />
                  <span>Pedidos Relacionados ({notaConsultada.pedidos_json?.length || 0})</span>
                </TabsTrigger>
                <TabsTrigger value="integracao" className="text-xs font-semibold gap-1.5">
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  <span>Situação da Integração</span>
                </TabsTrigger>
              </TabsList>

              {/* Aba 1: Cabeçalho */}
              <TabsContent value="cabecalho" className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                  <div className="rounded border p-3 bg-slate-50/50 space-y-1">
                    <span className="text-slate-400 font-medium text-[11px]">Fornecedor</span>
                    <p className="font-semibold text-slate-800">{notaConsultada.fornecedor_nome}</p>
                    <p className="text-slate-500 font-mono">
                      Cód: {notaConsultada.fornecedor_codigo}
                    </p>
                    <p className="text-slate-500 font-mono">
                      CNPJ: {notaConsultada.fornecedor_cnpj}
                    </p>
                  </div>

                  <div className="rounded border p-3 bg-slate-50/50 space-y-1">
                    <span className="text-slate-400 font-medium text-[11px]">
                      Cliente / Destinatário
                    </span>
                    <p className="font-semibold text-slate-800">{notaConsultada.cliente_nome}</p>
                    <p className="text-slate-500 font-mono">Cód: {notaConsultada.cliente_codigo}</p>
                    <p className="text-slate-500 font-mono">CNPJ: {notaConsultada.cliente_cnpj}</p>
                  </div>

                  <div className="rounded border p-3 bg-slate-50/50 space-y-1">
                    <span className="text-slate-400 font-medium text-[11px]">
                      Valores e Emissão
                    </span>
                    <p className="font-semibold text-slate-800 text-sm">
                      {notaConsultada.valor_total.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })}
                    </p>
                    <p className="text-slate-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-slate-400" />
                      <span>Data de Emissão: {notaConsultada.data_emissao}</span>
                    </p>
                    <p className="text-slate-500 flex items-center gap-1">
                      <Truck className="h-3 w-3 text-slate-400" />
                      <span>Placa Veículo: {notaConsultada.placa_veiculo || 'NÃO INFORMADA'}</span>
                    </p>
                  </div>
                </div>

                <div className="rounded border p-3 bg-slate-50 space-y-1 text-xs">
                  <span className="text-slate-500 font-semibold">
                    Chave de Acesso SEFAZ (44 dígitos):
                  </span>
                  <p className="font-mono font-medium text-slate-800 break-all select-all">
                    {notaConsultada.chave_acesso || '35250345123890000112550010001284501029384756'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div className="rounded border p-3 bg-white space-y-1">
                    <span className="text-slate-500 font-semibold">
                      Documento de Material SAP (MIGO):
                    </span>
                    <p className="font-mono text-sm font-bold text-[#004c97]">
                      {notaConsultada.doc_sap_migo ||
                        'Ainda não registrado (Pendente conferência física)'}
                    </p>
                  </div>
                  <div className="rounded border p-3 bg-white space-y-1">
                    <span className="text-slate-500 font-semibold">
                      Documento de Faturamento SAP (MIRO):
                    </span>
                    <p className="font-mono text-sm font-bold text-slate-700">
                      {notaConsultada.doc_sap_miro ||
                        'Ainda não registrado (Pendente escrituração fiscal)'}
                    </p>
                  </div>
                </div>
              </TabsContent>

              {/* Aba 2: Itens da Nota */}
              <TabsContent value="itens" className="space-y-3 pt-1">
                <div className="overflow-x-auto rounded border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 border-b font-semibold">
                      <tr>
                        <th className="p-2.5">Item</th>
                        <th className="p-2.5">Código / Descrição</th>
                        <th className="p-2.5">NCM / CFOP</th>
                        <th className="p-2.5 text-right">Qtd NF</th>
                        <th className="p-2.5 text-right">Preço Unit.</th>
                        <th className="p-2.5 text-right">Total Item</th>
                        <th className="p-2.5">Lote / Depósito</th>
                        <th className="p-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {notaConsultada.itens_json?.map((it, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono text-slate-500">{it.item}</td>
                          <td className="p-2.5">
                            <div className="font-semibold text-slate-800">{it.material_codigo}</div>
                            <div className="text-[11px] text-slate-500">
                              {it.material_descricao}
                            </div>
                          </td>
                          <td className="p-2.5 font-mono text-[11px] text-slate-600">
                            {it.ncm} • {it.cfop}
                          </td>
                          <td className="p-2.5 text-right font-mono font-medium">
                            {it.quantidade_nf.toLocaleString('pt-BR')} {it.unidade}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-600">
                            {it.valor_unitario.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                            {it.valor_total.toLocaleString('pt-BR', {
                              style: 'currency',
                              currency: 'BRL',
                            })}
                          </td>
                          <td className="p-2.5 text-[11px]">
                            <div className="font-mono text-slate-700">{it.lote_fornecedor}</div>
                            <div className="text-slate-400">{it.deposito_destino}</div>
                          </td>
                          <td className="p-2.5">
                            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                              {it.status_item}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* Aba 3: Pedidos Relacionados */}
              <TabsContent value="pedidos" className="space-y-3 pt-1">
                <div className="overflow-x-auto rounded border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 border-b font-semibold">
                      <tr>
                        <th className="p-2.5">Pedido SAP</th>
                        <th className="p-2.5">Item</th>
                        <th className="p-2.5">Tipo / Centro</th>
                        <th className="p-2.5">Material</th>
                        <th className="p-2.5 text-right">Qtd Prevista</th>
                        <th className="p-2.5 text-right">Qtd Recebida</th>
                        <th className="p-2.5 text-right">Saldo</th>
                        <th className="p-2.5">Status Pedido</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {notaConsultada.pedidos_json?.map((ped, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="p-2.5 font-mono font-bold text-[#004c97]">
                            {ped.pedido_sap}
                          </td>
                          <td className="p-2.5 font-mono text-slate-500">{ped.item_pedido}</td>
                          <td className="p-2.5 text-[11px] text-slate-600">
                            <div>{ped.tipo_pedido}</div>
                            <div className="font-mono text-slate-400">Centro: {ped.centro}</div>
                          </td>
                          <td className="p-2.5 font-semibold text-slate-800">{ped.material}</td>
                          <td className="p-2.5 text-right font-mono text-slate-600">
                            {ped.quantidade_prevista.toLocaleString('pt-BR')} {ped.unidade}
                          </td>
                          <td className="p-2.5 text-right font-mono font-semibold text-emerald-700">
                            {ped.quantidade_recebida.toLocaleString('pt-BR')} {ped.unidade}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-amber-700">
                            {ped.saldo.toLocaleString('pt-BR')} {ped.unidade}
                          </td>
                          <td className="p-2.5">
                            <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-[#004c97]">
                              {ped.status_pedido}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </TabsContent>

              {/* Aba 4: Situação da Integração */}
              <TabsContent value="integracao" className="space-y-4 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="rounded border p-3 bg-slate-50 space-y-1">
                    <span className="text-slate-400 font-medium text-[11px]">Interface EDI</span>
                    <p className="font-mono font-bold text-[#004c97]">
                      {notaConsultada.integracao_json?.interface_edi || 'ZMMI0009_SC'}
                    </p>
                  </div>
                  <div className="rounded border p-3 bg-slate-50 space-y-1">
                    <span className="text-slate-400 font-medium text-[11px]">
                      Canal de Comunicação
                    </span>
                    <p className="font-mono font-bold text-slate-800">
                      {notaConsultada.integracao_json?.canal_comunicacao || 'RFC_ECC_PRD_S4H'}
                    </p>
                  </div>
                  <div className="rounded border p-3 bg-slate-50 space-y-1">
                    <span className="text-slate-400 font-medium text-[11px]">
                      Leitura do Arquivo EDI
                    </span>
                    <p className="font-medium text-slate-800">
                      {notaConsultada.integracao_json?.data_leitura_edi || '12/03/2025 14:22:10'}
                    </p>
                  </div>
                  <div className="rounded border p-3 bg-slate-50 space-y-1">
                    <span className="text-slate-400 font-medium text-[11px]">
                      Protocolo de Integração
                    </span>
                    <p className="font-mono text-slate-700">
                      {notaConsultada.integracao_json?.protocolo_integracao ||
                        'EDI-20250312-998124'}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                    Regras de Validação Automática de Entrada
                  </span>
                  <div className="space-y-2">
                    {notaConsultada.integracao_json?.validacao_regras?.map((rg, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded border border-slate-200 bg-white text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-800">{rg.regra}</span>
                          <p className="text-slate-500 text-[11px]">{rg.mensagem}</p>
                        </div>
                        <Badge
                          className={
                            rg.status === 'OK'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rg.status === 'PENDENTE'
                                ? 'bg-blue-100 text-[#004c97]'
                                : 'bg-amber-100 text-amber-800'
                          }
                        >
                          {rg.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
