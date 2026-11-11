import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/hooks/use-toast'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RefreshCw, Plus, Pencil, Power, Save, X, RefreshCcwDot } from 'lucide-react'
import {
  listarTodosCfops,
  criarCfop,
  atualizarCfop,
  desativarCfop,
  ativarCfop,
  sincronizarCfopsDoSap,
  COLECAO_PARAMETRIZACAO_CFOP,
  type CfopParametrizado,
  type DirecaoCfop,
} from '@/services/cfops'

/** Rótulos e cores padronizados (Pantone 2945 = #004c97). */
const LABEL_DIRECAO: Record<DirecaoCfop, string> = {
  entrada: 'Entrada',
  saida: 'Saída',
}

/** Formulário do dialog de inclusão/edição. */
interface FormCfop {
  cfop: string
  descricao: string
  direcao: DirecaoCfop
  ativo: boolean
}

const FORM_INICIAL: FormCfop = { cfop: '', descricao: '', direcao: 'saida', ativo: true }

function dataBr(iso?: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (isNaN(d.getTime())) return '—'
  const dia = String(d.getUTCDate()).padStart(2, '0')
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0')
  return `${dia}/${mes}/${d.getUTCFullYear()}`
}

export default function ParametrizacaoCfops() {
  const { user, empresaSelecionada } = useAuth()

  const [registros, setRegistros] = useState<CfopParametrizado[]>([])
  const [carregando, setCarregando] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [sincronizando, setSincronizando] = useState(false)
  const [dialogAberto, setDialogAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [form, setForm] = useState<FormCfop>(FORM_INICIAL)

  async function carregar() {
    setCarregando(true)
    const lista = await listarTodosCfops()
    setRegistros(lista)
    setCarregando(false)
  }

  useEffect(() => {
    carregar()
  }, [])

  const handleAtualizar = async () => {
    setAtualizando(true)
    await carregar()
    setAtualizando(false)
    toast({ title: 'Parametrização atualizada', description: 'CFOPs recarregados do banco.' })
  }

  const abrirIncluir = () => {
    setEditandoId(null)
    setForm(FORM_INICIAL)
    setDialogAberto(true)
  }

  const abrirEditar = (r: CfopParametrizado) => {
    setEditandoId(r.id)
    setForm({
      cfop: r.cfop,
      descricao: r.descricao,
      direcao: r.direcao,
      ativo: r.ativo,
    })
    setDialogAberto(true)
  }

  const handleSalvar = async () => {
    const cfop = form.cfop.trim()
    const descricao = form.descricao.trim()
    if (!/^\d{4,5}$/.test(cfop)) {
      toast({
        title: 'CFOP inválido',
        description: 'Informe o código numérico do CFOP com 4 ou 5 dígitos (ex.: 5101).',
        variant: 'destructive',
      })
      return
    }
    if (!descricao) {
      toast({
        title: 'Descrição obrigatória',
        description: 'Informe a descrição do CFOP.',
        variant: 'destructive',
      })
      return
    }
    setSalvando(true)
    try {
      if (editandoId) {
        await atualizarCfop(editandoId, {
          cfop,
          descricao,
          direcao: form.direcao,
          ativo: form.ativo,
        })
      } else {
        await criarCfop({ cfop, descricao, direcao: form.direcao, ativo: form.ativo })
      }
      setDialogAberto(false)
      await carregar()
      toast({
        title: editandoId ? 'CFOP atualizado' : 'CFOP incluído',
        description: `CFOP ${cfop} salvo na parametrização — já aparece nos combos após atualizar a página.`,
      })
    } catch (error) {
      console.error('Erro ao salvar CFOP:', error)
      toast({
        title: 'Erro ao salvar CFOP',
        description:
          'Verifique a conexão com o banco. Se o código já existir no cadastro, edite o registro existente (código único).',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const alternarAtivo = async (r: CfopParametrizado) => {
    setSalvando(true)
    try {
      if (r.ativo) {
        await desativarCfop(r.id)
        toast({
          title: `CFOP ${r.cfop} desativado`,
          description: 'Ele deixa de aparecer nos combos e só volta se for reativado.',
        })
      } else {
        await ativarCfop(r.id)
        toast({ title: `CFOP ${r.cfop} reativado`, description: 'Volta a aparecer nos combos.' })
      }
      await carregar()
    } catch (error) {
      console.error('Erro ao alterar status do CFOP:', error)
      toast({
        title: 'Erro ao alterar status',
        description: 'Verifique a conexão com o banco e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const handleSincronizar = async () => {
    setSincronizando(true)
    try {
      const resultado = await sincronizarCfopsDoSap({
        user_id: user?.id,
        user_email: user?.email,
        user_nome: user?.name,
        empresa: empresaSelecionada.razaoSocial,
      })
      toast({
        title: 'Sincronização SAP pendente',
        description:
          resultado.motivo + ' A pendência foi registrada no Histórico de Processamentos.',
      })
    } finally {
      setSincronizando(false)
    }
  }

  const nAtivos = registros.filter((r) => r.ativo).length

  return (
    <div className="space-y-4 p-4 lg:p-6">
      {/* Cabeçalho da tela */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-bold text-[#004c97] uppercase tracking-wider">
            Parametrização de CFOPs
          </h2>
          <p className="text-xs text-slate-500">
            Cadastro dinâmico de CFOPs usado pelos combos do módulo (coleção{' '}
            <span className="font-mono">{COLECAO_PARAMETRIZACAO_CFOP}</span>). A lista em código é
            apenas fallback quando o banco está vazio.
          </p>
        </div>
        <Badge className="bg-blue-100 text-[#004c97] border-blue-200 text-[10px] whitespace-nowrap">
          Dados de Parametrização
        </Badge>
      </div>

      <Alert className="border-amber-200 bg-amber-50/80 text-amber-900 py-2.5 text-xs">
        <RefreshCcwDot className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-xs font-bold text-amber-800">
          Aguardando integração SAP
        </AlertTitle>
        <AlertDescription className="text-amber-800">
          A sincronização automática com a tabela de CFOPs do SAP ainda não está ativa — os
          registros têm origem <span className="font-semibold">manual</span>. O ponto de
          sincronização já está preparado no serviço (contrato{' '}
          <span className="font-mono">sincronizarCfopsDoSap()</span>) e, quando ativado, passará a
          marcar a origem como <span className="font-semibold">SAP sync</span>.
        </AlertDescription>
      </Alert>

      {/* Ações */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAtualizar}
            disabled={atualizando || carregando}
            className="text-xs border-slate-300 text-slate-700 gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${atualizando ? 'animate-spin' : ''}`} />
            <span>{atualizando ? 'Atualizando...' : 'Atualizar'}</span>
          </Button>
          <Button
            size="sm"
            onClick={abrirIncluir}
            disabled={salvando}
            className="bg-[#004c97] hover:bg-blue-900 text-white text-xs font-semibold gap-1.5"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Incluir CFOP</span>
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={handleSincronizar}
            disabled={sincronizando || carregando}
            className="text-xs border-slate-300 text-slate-700 gap-1.5"
          >
            <RefreshCcwDot className="h-3.5 w-3.5 text-[#004c97]" />
            <span>{sincronizando ? 'Registrando...' : 'Sincronizar com SAP'}</span>
          </Button>
        </div>
        <span className="text-[11px] text-slate-400">
          {nAtivos} ativo(s) de {registros.length} CFOP(s) cadastrado(s)
        </span>
      </div>

      {/* Tabela */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-3 border-b border-slate-100">
          <CardTitle className="text-sm font-bold text-[#004c97] uppercase tracking-wider">
            CFOPs Cadastrados
          </CardTitle>
          <CardDescription className="text-xs">
            Origem manual = cadastrado nesta tela (ou seed inicial); origem SAP sync = trazido pela
            integração com o SAP (ainda não ativa).
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto">
            <table className="w-full text-xs border-collapse min-w-[720px]">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-3 py-2.5 text-left text-[11px] font-bold text-slate-700 uppercase tracking-wide whitespace-nowrap">
                    CFOP
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-bold text-slate-700 uppercase tracking-wide whitespace-nowrap">
                    Descrição
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-bold text-slate-700 uppercase tracking-wide whitespace-nowrap">
                    Direção
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-bold text-slate-700 uppercase tracking-wide whitespace-nowrap">
                    Origem
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-bold text-slate-700 uppercase tracking-wide whitespace-nowrap">
                    Status
                  </th>
                  <th className="px-3 py-2.5 text-left text-[11px] font-bold text-slate-700 uppercase tracking-wide whitespace-nowrap">
                    Atualizado em
                  </th>
                  <th className="px-3 py-2.5 text-right text-[11px] font-bold text-slate-700 uppercase tracking-wide whitespace-nowrap">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {carregando ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-400 text-xs">
                      Carregando CFOPs da parametrização...
                    </td>
                  </tr>
                ) : registros.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-slate-400 text-xs">
                      Nenhum CFOP cadastrado — os combos usam a lista de fallback em código enquanto
                      o cadastro estiver vazio.
                    </td>
                  </tr>
                ) : (
                  registros.map((r) => (
                    <tr
                      key={r.id}
                      className={`transition-colors ${r.ativo ? 'bg-white' : 'bg-slate-50 text-slate-400'} hover:bg-blue-50/70`}
                    >
                      <td className="px-3 py-2 whitespace-nowrap font-mono font-semibold text-[#004c97]">
                        {r.cfop}
                      </td>
                      <td className="px-3 py-2 text-slate-700">{r.descricao}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            r.direcao === 'entrada'
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-blue-200 bg-blue-50 text-[#004c97]'
                          }`}
                        >
                          {LABEL_DIRECAO[r.direcao] ?? r.direcao}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            r.origem === 'sap_sync'
                              ? 'border-violet-200 bg-violet-50 text-violet-700'
                              : 'border-slate-200 bg-slate-50 text-slate-600'
                          }`}
                        >
                          {r.origem === 'sap_sync' ? 'SAP sync' : 'Manual'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${
                            r.ativo
                              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                              : 'border-red-200 bg-red-50 text-red-600'
                          }`}
                        >
                          {r.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-slate-600">
                        {dataBr(r.updated ?? r.created)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => abrirEditar(r)}
                            disabled={salvando}
                            className="h-7 px-2 text-[11px] text-[#004c97] hover:bg-blue-50 gap-1"
                          >
                            <Pencil className="h-3 w-3" />
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => alternarAtivo(r)}
                            disabled={salvando}
                            className={`h-7 px-2 text-[11px] gap-1 ${
                              r.ativo
                                ? 'text-red-600 hover:bg-red-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            <Power className="h-3 w-3" />
                            {r.ativo ? 'Desativar' : 'Reativar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog incluir/editar */}
      {dialogAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
              <h3 className="text-sm font-bold text-[#004c97]">
                {editandoId ? 'Editar CFOP' : 'Incluir CFOP'}
              </h3>
              <button
                type="button"
                onClick={() => setDialogAberto(false)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3 px-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label htmlFor="cfop-codigo" className="text-xs font-medium text-slate-600">
                    Código CFOP
                  </Label>
                  <Input
                    id="cfop-codigo"
                    value={form.cfop}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cfop: e.target.value.replace(/\D/g, '') }))
                    }
                    placeholder="5101"
                    maxLength={5}
                    className="text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="cfop-direcao" className="text-xs font-medium text-slate-600">
                    Direção
                  </Label>
                  <select
                    id="cfop-direcao"
                    value={form.direcao}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, direcao: e.target.value as DirecaoCfop }))
                    }
                    className="h-9 w-full rounded-md border border-slate-300 bg-white px-2 text-xs focus:outline-none focus:ring-1 focus:ring-[#004c97]"
                  >
                    <option value="saida">Saída</option>
                    <option value="entrada">Entrada</option>
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="cfop-descricao" className="text-xs font-medium text-slate-600">
                  Descrição
                </Label>
                <Input
                  id="cfop-descricao"
                  value={form.descricao}
                  onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                  placeholder="Venda de produção do estabelecimento"
                  className="text-xs"
                  maxLength={200}
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  className="accent-[#004c97] h-3.5 w-3.5 cursor-pointer"
                  checked={form.ativo}
                  onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
                />
                Ativo (aparece nos combos do módulo)
              </label>
              {editandoId === null && (
                <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                  O CFOP será salvo com origem <span className="font-semibold">manual</span>. Quando
                  a sincronização com o SAP for ativada, registros vindos de lá serão marcados como
                  SAP sync.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDialogAberto(false)}
                className="text-xs text-slate-600"
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleSalvar}
                disabled={salvando}
                className="bg-[#004c97] hover:bg-blue-900 text-white text-xs font-semibold gap-1.5"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{salvando ? 'Salvando...' : 'Salvar'}</span>
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
