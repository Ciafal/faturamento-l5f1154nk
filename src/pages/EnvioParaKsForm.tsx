import React, { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import {
  listarNotasFiscais,
  buscarNotaFiscalPorChave,
  registrarHistoricoProcessamento,
} from '@/services/faturamento'
import type { NotaFiscalRecord } from '@/types/database'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import {
  PackageOpen,
  Search,
  Eraser,
  History,
  ShieldCheck,
  FlaskConical,
  Lock,
  FileText,
} from 'lucide-react'
import { ResultadoTabs, validarGenericas } from './faturamento/ResultadoTabs'

const CODIGO_PROCESSO = 'saida-envio-ks'
const NOME_PROCESSO = 'Envio para KS'
const PROCESS_TYPE = 'envio_ks' as const

const EnvioParaKsForm: React.FC = () => {
  const { user, empresaSelecionada } = useAuth()
  const [notasDemo, setNotasDemo] = useState<NotaFiscalRecord[]>([])
  const [numeroNf, setNumeroNf] = useState('')
  const [serieNf, setSerieNf] = useState('')
  const [parceiro, setParceiro] = useState('')
  const [notaSelecionada, setNotaSelecionada] = useState<NotaFiscalRecord | null>(null)
  const [validacoes, setValidacoes] = useState<ReturnType<typeof validarGenericas>>([])
  const [isConsultando, setIsConsultando] = useState(false)
  const [isValidando, setIsValidando] = useState(false)
  const [dialogHistoricoOpen, setDialogHistoricoOpen] = useState(false)

  useEffect(() => {
    listarNotasFiscais(PROCESS_TYPE).then(setNotasDemo)
  }, [])

  const registrarNoHistorico = useCallback(
    async (
      resultado: 'sucesso' | 'pendente' | 'erro',
      mensagem: string,
      nf?: string,
      serie?: string,
    ) => {
      try {
        await registrarHistoricoProcessamento({
          user_email: user?.email || 'anonimo@ciafal.com.br',
          user_nome: user?.name || 'Usuário Ciafal',
          empresa: empresaSelecionada.razaoSocial,
          processo_id: CODIGO_PROCESSO,
          processo_nome: NOME_PROCESSO,
          tipo_operacao: 'saida',
          numero_nf: nf || numeroNf || '-',
          serie_nf: serie || serieNf || '-',
          cliente: notaSelecionada?.cliente_nome || '',
          resultado,
          documento_sap: '',
          mensagens: mensagem,
          detalhes_json: { modo: 'demonstracao', especificacao: 'aguardando PDF ABAP' },
        })
      } catch (e) {
        console.warn('Falha ao registrar histórico (modo demonstração):', e)
      }
    },
    [user, empresaSelecionada, numeroNf, serieNf, notaSelecionada],
  )

  const handleConsultar = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!numeroNf.trim() || !serieNf.trim()) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Informe o número da NF e a série para consultar.',
        variant: 'destructive',
      })
      return
    }
    setIsConsultando(true)
    setNotaSelecionada(null)
    setValidacoes([])

    const nota = await buscarNotaFiscalPorChave(PROCESS_TYPE, numeroNf, serieNf)
    setIsConsultando(false)

    if (!nota) {
      toast({
        title: 'Nota não encontrada',
        description: 'Nenhuma nota de demonstração corresponde aos dados informados.',
        variant: 'destructive',
      })
      await registrarNoHistorico('erro', `Consulta sem resultado para NF ${numeroNf}/${serieNf}.`)
      return
    }

    setNotaSelecionada(nota)
    toast({
      title: 'Nota localizada (demonstração)',
      description: `NF ${nota.numero_nf}/${nota.serie_nf} — dados simulados, aguardando especificação funcional.`,
    })
    await registrarNoHistorico(
      'pendente',
      `Consulta de NF ${nota.numero_nf}/${nota.serie_nf} realizada em modo demonstração.`,
      nota.numero_nf,
      nota.serie_nf,
    )
  }

  const handleValidar = async () => {
    if (!notaSelecionada) {
      toast({
        title: 'Consulte uma nota primeiro',
        description: 'A validação genérica roda sobre uma nota já consultada.',
        variant: 'destructive',
      })
      return
    }
    setIsValidando(true)
    await new Promise((r) => setTimeout(r, 400))
    const regras = validarGenericas(notaSelecionada)
    setValidacoes(regras)
    setIsValidando(false)

    const erros = regras.filter((r) => r.status === 'ERRO').length
    const alertas = regras.filter((r) => r.status === 'ALERTA').length

    if (erros > 0) {
      toast({
        title: 'Validação concluída com erros',
        description: `${erros} inconsistência(s) encontrada(s). Verifique a aba Validação.`,
        variant: 'destructive',
      })
    } else if (alertas > 0) {
      toast({
        title: 'Validação concluída com alertas',
        description: `${alertas} alerta(s) de consistência. Verifique a aba Validação.`,
        variant: 'default',
      })
    } else {
      toast({
        title: 'Validação genérica OK',
        description: 'Nenhuma inconsistência estrutural encontrada. Sem lançamentos gerados.',
      })
    }
    await registrarNoHistorico(
      erros > 0 ? 'erro' : 'sucesso',
      `Validação genérica da NF ${notaSelecionada.numero_nf}/${notaSelecionada.serie_nf}: ${erros} erro(s), ${alertas} alerta(s). Sem lançamentos gerados.`,
      notaSelecionada.numero_nf,
      notaSelecionada.serie_nf,
    )
  }

  const handleLimpar = () => {
    setNumeroNf('')
    setSerieNf('')
    setParceiro('')
    setNotaSelecionada(null)
    setValidacoes([])
    toast({ title: 'Formulário limpo', description: 'Campos de consulta redefinidos.' })
  }

  const filtrarNotas = notasDemo.filter((n) => {
    const termo = parceiro.trim().toLowerCase()
    if (!termo) return true
    return (
      n.cliente_nome?.toLowerCase().includes(termo) ||
      n.fornecedor_nome?.toLowerCase().includes(termo) ||
      n.numero_nf.includes(termo)
    )
  })

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded bg-blue-100 text-[#004c97]">
            <PackageOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Envio para KS
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Processo SAI-03 · Grupo Saídas · HUB CIAFAL | FATURAMENTO
            </p>
          </div>
        </div>
        <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[11px] font-semibold gap-1">
          <FlaskConical className="h-3 w-3" />
          Modo demonstração
        </Badge>
      </div>

      {/* Banner aguardando especificação */}
      <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 space-y-1">
        <p className="font-semibold flex items-center gap-1.5">
          <Lock className="h-3.5 w-3.5" />
          Aguardando especificação funcional
        </p>
        <p>
          A estrutura visual deste processo existe, mas as regras fiscais, tipos de movimento,
          categorias de nota e integração SAP (RFC/BAPI) ainda não foram especificadas. Nenhuma
          regra foi inventada: consultas e validações genéricas são registradas no histórico e o
          envio real permanece desabilitado.
        </p>
      </div>

      {/* Consulta */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Consulta de Nota Fiscal (dados simulados)
          </CardTitle>
          <CardDescription className="text-xs">
            Utilize os números de demonstração: 000202210, 000202211 ou 000202212 (série 9).
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleConsultar} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="ks-num" className="text-xs font-medium text-slate-600">
                  Número da NF
                </Label>
                <Input
                  id="ks-num"
                  placeholder="000202210"
                  maxLength={9}
                  value={numeroNf}
                  onChange={(e) => setNumeroNf(e.target.value.replace(/\D/g, ''))}
                  className="text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ks-serie" className="text-xs font-medium text-slate-600">
                  Série
                </Label>
                <Input
                  id="ks-serie"
                  placeholder="9"
                  maxLength={3}
                  value={serieNf}
                  onChange={(e) => setSerieNf(e.target.value)}
                  className="text-xs font-mono"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="ks-parc" className="text-xs font-medium text-slate-600">
                  Cliente / Fornecedor (filtro)
                </Label>
                <Input
                  id="ks-parc"
                  placeholder="Nome ou CNPJ"
                  value={parceiro}
                  onChange={(e) => setParceiro(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
              <Button
                type="submit"
                size="sm"
                disabled={isConsultando}
                className="bg-[#004c97] hover:bg-blue-900 text-white font-semibold text-xs gap-1.5 shadow"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Consultar NF</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isValidando}
                onClick={handleValidar}
                className="text-xs gap-1.5 border-[#004c97] text-[#004c97] hover:bg-blue-50"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Validar</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={handleLimpar}
                className="text-xs text-slate-500 hover:text-slate-800 gap-1.5"
              >
                <Eraser className="h-3.5 w-3.5" />
                <span>Limpar</span>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setDialogHistoricoOpen(true)}
                className="text-xs text-slate-500 hover:text-slate-800 gap-1.5"
              >
                <History className="h-3.5 w-3.5" />
                <span>Histórico</span>
              </Button>

              {/* Envio real: visível, porém desabilitado */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="ml-auto">
                    <Button
                      type="button"
                      size="sm"
                      disabled
                      className="bg-emerald-600 text-white font-semibold text-xs gap-1.5 opacity-60 cursor-not-allowed"
                    >
                      <Lock className="h-3.5 w-3.5" />
                      <span>Processar Envio</span>
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Aguardando especificação funcional e homologação da integração SAP (RFC/BAPI)
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-[11px] text-slate-400">
              O botão "Processar Envio" permanece desabilitado até a especificação funcional (PDF
              ABAP) e a homologação da integração SAP (RFC/BAPI).
            </p>
          </form>
        </CardContent>
      </Card>

      {/* Resultado */}
      {notaSelecionada && (
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="pb-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold text-[#004c97] flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span>
                NF {notaSelecionada.numero_nf} · Série {notaSelecionada.serie_nf}
              </span>
            </CardTitle>
            <CardDescription className="text-xs">
              Dados de demonstração (coleção notas_fiscais) — não utilizados em ambiente produtivo.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <ResultadoTabs nota={notaSelecionada} validacoes={validacoes} />
          </CardContent>
        </Card>
      )}

      {/* Lista de notas de demonstração */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Notas de demonstração disponíveis ({filtrarNotas.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4 space-y-2">
          {filtrarNotas.length === 0 && (
            <p className="text-xs text-slate-500">Nenhuma nota de demonstração encontrada.</p>
          )}
          {filtrarNotas.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => {
                setNumeroNf(n.numero_nf)
                setSerieNf(n.serie_nf)
                setParceiro(n.cliente_nome || '')
              }}
              className="w-full text-left flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 rounded border border-slate-200 bg-slate-50 hover:bg-blue-50 transition-colors p-2.5 text-xs"
            >
              <span className="font-mono font-bold text-[#004c97]">
                NF {n.numero_nf}/{n.serie_nf}
              </span>
              <span className="text-slate-600 flex-1 truncate">{n.cliente_nome}</span>
              <span className="text-slate-500">
                {n.data_emissao} ·{' '}
                {n.valor_total.toLocaleString('pt-BR', {
                  style: 'currency',
                  currency: 'BRL',
                })}
              </span>
              <Badge
                variant="outline"
                className="text-[10px] bg-amber-50 text-amber-700 border-amber-200 shrink-0"
              >
                Simulada
              </Badge>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Diálogo de histórico da tela */}
      <Dialog open={dialogHistoricoOpen} onOpenChange={setDialogHistoricoOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-[#004c97] flex items-center gap-2">
              <History className="h-4 w-4" />
              <span>Histórico deste processo</span>
            </DialogTitle>
            <DialogDescription className="text-xs">
              Consultas e validações deste processo são registradas no Histórico de Processamentos.
            </DialogDescription>
          </DialogHeader>
          <div className="text-xs space-y-2">
            <p className="text-slate-600">
              Abra a página dedicada para ver todos os registros de auditoria:
            </p>
            <Link to="/historico">
              <Button
                size="sm"
                className="bg-[#004c97] hover:bg-blue-900 text-white text-xs gap-1.5"
              >
                <History className="h-3.5 w-3.5" />
                <span>Ir para Histórico de Processamentos</span>
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default EnvioParaKsForm
