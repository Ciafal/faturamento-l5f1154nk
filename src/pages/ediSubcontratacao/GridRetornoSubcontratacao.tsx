import pb from '@/lib/pocketbase/client'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { toast } from '@/hooks/use-toast'
import { listarOpcoesCfop, CFOPS_FALLBACK, type OpcaoComboCfop } from '@/services/cfops'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { RefreshCw, Save, Link2, Link2Off, ShieldCheck, Info, AlertTriangle } from 'lucide-react'
import {
  LABEL_STATUS_CORRELACAO,
  listarLinhasGridRetorno,
  salvarParametrizacaoCfop,
  COLECAO_PARAMETRIZACAO_CFOP,
  type LinhaGridRetorno,
  type StatusCorrelacao,
} from '@/services/parametrizacaoCfopRetorno'

const PAGINA_TAMANHO = 5

type CampoOrdenacao =
  | 'dataEmissao'
  | 'numeroNf'
  | 'serieNf'
  | 'codigoMaterial'
  | 'itemNf'
  | 'lote'
  | 'pedidoCiafal'
  | 'itemPedido'
  | 'cfop'
  | 'statusCorrelacao'

interface Filtros {
  dataEmissao: string
  numeroNf: string
  serieNf: string
  codigoMaterial: string
  lote: string
  pedidoCiafal: string
  cfop: string
}

const FILTROS_INICIAIS: Filtros = {
  dataEmissao: '',
  numeroNf: '',
  serieNf: '',
  codigoMaterial: '',
  lote: '',
  pedidoCiafal: '',
  cfop: '',
}

function corStatus(status: StatusCorrelacao): string {
  switch (status) {
    case 'correlacionado':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200'
    case 'pendente':
      return 'bg-amber-50 text-amber-700 border-amber-200'
    case 'sem_pedido':
      return 'bg-slate-50 text-slate-600 border-slate-200'
    case 'divergencia':
      return 'bg-red-50 text-red-700 border-red-200'
  }
}

interface DialogVinculoProps {
  linha: LinhaGridRetorno | null
  pedido: string
  itemPedido: string
  onChangePedido: (v: string) => void
  onChangeItem: (v: string) => void
  onConfirmar: () => void
  onCancelar: () => void
}

function DialogVinculo({
  linha,
  pedido,
  itemPedido,
  onChangePedido,
  onChangeItem,
  onConfirmar,
  onCancelar,
}: DialogVinculoProps) {
  if (!linha) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white shadow-lg">
        <div className="border-b border-slate-100 px-4 py-3">
          <h3 className="text-sm font-bold text-[#004c97]">Vincular Pedido de Compra Ciafal</h3>
          <p className="text-xs text-slate-500">
            NF {linha.numeroNf} • Série {linha.serieNf} • Item {linha.itemNf} • Lote {linha.lote}
          </p>
        </div>
        <div className="space-y-3 px-4 py-4">
          <div className="space-y-1">
            <Label htmlFor="dlg-pedido" className="text-xs font-medium text-slate-600">
              Pedido de Compra Ciafal
            </Label>
            <Input
              id="dlg-pedido"
              value={pedido}
              onChange={(e) => onChangePedido(e.target.value.toUpperCase())}
              placeholder="4500891234"
              className="text-xs font-mono"
            />
            <span className="text-[10px] text-slate-400">
              Pedidos do cenário simulado: 4500891234, 4500891299, 4500891302, 4500889912
            </span>
          </div>
          <div className="space-y-1">
            <Label htmlFor="dlg-item" className="text-xs font-medium text-slate-600">
              Item do Pedido
            </Label>
            <Input
              id="dlg-item"
              value={itemPedido}
              onChange={(e) => onChangeItem(e.target.value)}
              placeholder="00010"
              className="text-xs font-mono"
            />
          </div>
          <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
            Correlação simulada para demonstração. A validação automática pelo backend/SAP será
            implementada futuramente.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={onCancelar} className="text-xs text-slate-600">
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={onConfirmar}
            disabled={!pedido.trim() || !itemPedido.trim()}
            className="bg-[#004c97] hover:bg-blue-900 text-white text-xs font-semibold"
          >
            Confirmar Vínculo
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function GridRetornoSubcontratacao() {
  const { user, empresaSelecionada } = useAuth()

  const [linhas, setLinhas] = useState<LinhaGridRetorno[]>([])
  const [carregando, setCarregando] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [validando, setValidando] = useState(false)
  const [selecionadas, setSelecionadas] = useState<Set<string>>(new Set())
  const [ordem, setOrdem] = useState<{ campo: CampoOrdenacao; asc: boolean }>({
    campo: 'dataEmissao',
    asc: true,
  })
  const [filtros, setFiltros] = useState<Filtros>(FILTROS_INICIAIS)
  const [pagina, setPagina] = useState(1)
  const [limitePaginas, setLimitePaginas] = useState(1)
  const [dialogVinculo, setDialogVinculo] = useState<LinhaGridRetorno | null>(null)
  const [pedidoDialog, setPedidoDialog] = useState('')
  const [itemPedidoDialog, setItemPedidoDialog] = useState('')
  const [opcoesCfop, setOpcoesCfop] = useState<OpcaoComboCfop[]>([])

  async function carregarGrid() {
    setCarregando(true)
    const lista = await listarLinhasGridRetorno()
    setLinhas(lista)
    setCarregando(false)
  }

  useEffect(() => {
    carregarGrid()
    // Combo de CFOP vem da parametrização dinâmica no banco (coleção
    // parametrizacao_cfop); a lista hardcoded entra só como fallback.
    listarOpcoesCfop('todas')
      .then(setOpcoesCfop)
      .catch(() => setOpcoesCfop(CFOPS_FALLBACK.map((c) => ({ ...c }))))
  }, [])

  /** Dados simulados + parametrizações persistidas: aplica filtros e ordenação sobre a base completa. */
  const baseFiltrada = useMemo(() => {
    const t = (v: string | null) => (v ?? '').toLowerCase()
    return linhas.filter((l) => {
      if (
        filtros.dataEmissao &&
        !l.dataEmissao.toLowerCase().includes(filtros.dataEmissao.toLowerCase())
      )
        return false
      if (filtros.numeroNf && !l.numeroNf.includes(filtros.numeroNf.trim())) return false
      if (filtros.serieNf && !l.serieNf.includes(filtros.serieNf.trim())) return false
      if (
        filtros.codigoMaterial &&
        !l.codigoMaterial.toLowerCase().includes(filtros.codigoMaterial.toLowerCase().trim())
      )
        return false
      if (filtros.lote && !l.lote.toLowerCase().includes(filtros.lote.toLowerCase().trim()))
        return false
      if (
        filtros.pedidoCiafal &&
        !t(l.pedidoCiafal).includes(filtros.pedidoCiafal.toLowerCase().trim())
      )
        return false
      if (filtros.cfop && !l.cfop.includes(filtros.cfop.trim())) return false
      return true
    })
  }, [linhas, filtros])

  /** Ordenação em memória sobre o conjunto filtrado. */
  const linhasOrdenadas = useMemo(() => {
    const arr = [...baseFiltrada]
    arr.sort((a, b) => {
      const va = a[ordem.campo] ?? ''
      const vb = b[ordem.campo] ?? ''
      const cmp = String(va).localeCompare(String(vb), 'pt-BR', { numeric: true })
      return ordem.asc ? cmp : -cmp
    })
    return arr
  }, [baseFiltrada, ordem])

  /** Carregamento progressivo: limite de linhas visíveis cresce com "Carregar mais". */
  useEffect(() => {
    setLimitePaginas(1)
  }, [baseFiltrada.length, ordem, filtros])

  const linhasVisiveis = linhasOrdenadas.slice(0, limitePaginas * PAGINA_TAMANHO)
  const haMais = linhasVisiveis.length < linhasOrdenadas.length

  const handleAtualizar = async () => {
    setAtualizando(true)
    await carregarGrid()
    setSelecionadas(new Set())
    setAtualizando(false)
    toast({
      title: 'Grid atualizada',
      description: 'Dados de demonstração + parametrizações salvas recarregados.',
    })
  }

  const handleToggleSelecao = (id: string) => {
    setSelecionadas((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleSalvarParametrizacao = async () => {
    const alvo = linhas.filter((l) => selecionadas.has(l.id))
    if (alvo.length === 0) {
      toast({
        title: 'Selecione ao menos uma linha',
        description: 'Marque o checkbox das linhas cuja parametrização de CFOP deve ser salva.',
        variant: 'destructive',
      })
      return
    }
    const semCfop = alvo.filter((l) => !l.cfop.trim())
    if (semCfop.length > 0) {
      toast({
        title: 'CFOP não preenchido',
        description: `Preencha o CFOP antes de salvar — linha(s) NF ${semCfop.map((l) => l.numeroNf).join(', ')}.`,
        variant: 'destructive',
      })
      return
    }
    setSalvando(true)
    try {
      for (const linha of alvo) {
        await salvarParametrizacaoCfop(
          {
            numeroNf: linha.numeroNf,
            serieNf: linha.serieNf,
            itemNf: linha.itemNf,
            materialCodigo: linha.codigoMaterial,
            lote: linha.lote,
            cfop: linha.cfop.trim(),
            pedidoCiafal: linha.pedidoCiafal ?? '',
            itemPedidoCiafal: linha.itemPedido ?? '',
          },
          {
            user_id: user?.id,
            user_email: user?.email || 'usuario@ciafal.com.br',
            user_nome: user?.name || 'Usuário Ciafal',
            empresa: empresaSelecionada.razaoSocial,
          },
        )
      }
      await carregarGrid()
      toast({
        title: 'Parametrização CFOP salva',
        description: `${alvo.length} linha(s) persistida(s) no banco e registrada(s) no Histórico de Processamentos.`,
      })
    } catch (error) {
      console.error('Erro ao salvar parametrização CFOP:', error)
      toast({
        title: 'Erro ao salvar parametrização',
        description: 'Verifique a conexão com o banco e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const abrirDialogVinculo = () => {
    const alvo = linhas.find((l) => selecionadas.has(l.id))
    if (!alvo) {
      toast({
        title: 'Selecione uma linha',
        description: 'Selecione exatamente uma linha da grid para vincular um pedido de compra.',
        variant: 'destructive',
      })
      return
    }
    setPedidoDialog(alvo.pedidoCiafal ?? '')
    setItemPedidoDialog(alvo.itemPedido ?? '')
    setDialogVinculo(alvo)
  }

  const confirmarVinculo = async () => {
    if (!dialogVinculo) return
    const linha = dialogVinculo
    setDialogVinculo(null)
    setSalvando(true)
    try {
      await salvarParametrizacaoCfop(
        {
          numeroNf: linha.numeroNf,
          serieNf: linha.serieNf,
          itemNf: linha.itemNf,
          materialCodigo: linha.codigoMaterial,
          lote: linha.lote,
          cfop: linha.cfop.trim(),
          pedidoCiafal: pedidoDialog.trim(),
          itemPedidoCiafal: itemPedidoDialog.trim(),
        },
        {
          user_id: user?.id,
          user_email: user?.email || 'usuario@ciafal.com.br',
          user_nome: user?.name || 'Usuário Ciafal',
          empresa: empresaSelecionada.razaoSocial,
        },
      )
      await carregarGrid()
      toast({
        title: 'Pedido vinculado',
        description: `Pedido ${pedidoDialog.trim()} item ${itemPedidoDialog.trim()} vinculado à NF ${linha.numeroNf} (simulado, persistido no banco).`,
      })
    } catch (error) {
      console.error('Erro ao vincular pedido:', error)
      toast({
        title: 'Erro ao vincular pedido',
        description: 'Verifique a conexão com o banco e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const handleDesvincular = async () => {
    const alvo = linhas.filter((l) => selecionadas.has(l.id) && l.parametrizada)
    if (alvo.length === 0) {
      toast({
        title: 'Nada para desvincular',
        description:
          'Selecione linhas com pedido já vinculado (parametrização salva) para desvincular.',
        variant: 'destructive',
      })
      return
    }
    setSalvando(true)
    try {
      for (const linha of alvo) {
        if (!linha.parametrizacaoId) continue
        await pb
          .collection(COLECAO_PARAMETRIZACAO_CFOP)
          .update(linha.parametrizacaoId, { pedido_ciafal: '', item_pedido_ciafal: '' })
      }
      await carregarGrid()
      toast({
        title: 'Pedido desvinculado',
        description: `${alvo.length} linha(s) tiveram o pedido de compra removido da parametrização.`,
      })
    } catch (error) {
      console.error('Erro ao desvincular pedido:', error)
      toast({
        title: 'Erro ao desvincular',
        description: 'Verifique a conexão com o banco e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setSalvando(false)
    }
  }

  const handleValidarCorrelacao = () => {
    setValidando(true)
    const alvo = selecionadas.size > 0 ? linhas.filter((l) => selecionadas.has(l.id)) : linhas
    setTimeout(() => {
      setValidando(false)
      const nOk = alvo.filter((l) => l.statusCorrelacao === 'correlacionado').length
      const nPend = alvo.filter((l) => l.statusCorrelacao === 'pendente').length
      const nSem = alvo.filter((l) => l.statusCorrelacao === 'sem_pedido').length
      const nDiv = alvo.filter((l) => l.statusCorrelacao === 'divergencia').length
      toast({
        title: 'Validação de correlação concluída (simulada)',
        description: `${nOk} correlacionada(s), ${nPend} pendente(s), ${nSem} sem pedido, ${nDiv} com divergência. Validação automática pelo backend/SAP será implementada futuramente.`,
      })
    }, 400)
  }

  const atualizarFiltro = (campo: keyof Filtros, valor: string) => {
    setFiltros((prev) => ({ ...prev, [campo]: valor }))
  }

  const ordenarPor = (campo: CampoOrdenacao) => {
    setOrdem((prev) => ({ campo, asc: prev.campo === campo ? !prev.asc : true }))
  }

  const setaOrdenacao = (campo: CampoOrdenacao) =>
    ordem.campo === campo ? (ordem.asc ? ' ▲' : ' ▼') : ''

  const thCls =
    'px-3 py-2.5 text-left text-[11px] font-bold text-slate-700 uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-[#004c97]'

  return (
    <Card className="border-slate-200 bg-white shadow-sm">
      <CardHeader className="pb-3 border-b border-slate-100">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <CardTitle className="text-sm font-bold text-[#004c97] uppercase tracking-wider">
              Relação de NF de Retorno de Subcontratação
            </CardTitle>
            <CardDescription className="text-xs">
              Exibir as notas fiscais de retorno encontradas e permitir a parametrização do CFOP
              para a entrada vinculada ao pedido de compra da Ciafal.
            </CardDescription>
          </div>
          <Badge className="bg-blue-100 text-[#004c97] border-blue-200 text-[10px] whitespace-nowrap">
            Dados Simulados
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        <Alert className="border-blue-200 bg-blue-50/80 text-blue-900 py-2.5 text-xs">
          <Info className="h-4 w-4 text-[#004c97]" />
          <AlertTitle className="text-xs font-bold text-[#004c97]">
            Grid com dados de demonstração — CFOP e correlação parametrizáveis
          </AlertTitle>
          <AlertDescription className="text-blue-800">
            As linhas são NF de retorno de produto acabado simuladas. O CFOP (combo por linha) e o
            pedido de compra vinculado podem ser salvos no banco e são registrados no Histórico de
            Processamentos.
          </AlertDescription>
        </Alert>

        {/* Filtros */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
          {(
            [
              ['dataEmissao', 'Data de Emissão'],
              ['numeroNf', 'NF'],
              ['serieNf', 'Série'],
              ['codigoMaterial', 'Código'],
              ['lote', 'Lote'],
              ['pedidoCiafal', 'Pedido de Compra'],
              ['cfop', 'CFOP'],
            ] as [keyof Filtros, string][]
          ).map(([campo, label]) => (
            <div key={campo} className="space-y-1">
              <Label className="text-[10px] font-medium text-slate-500">{label}</Label>
              <Input
                value={filtros[campo]}
                onChange={(e) => atualizarFiltro(campo, e.target.value)}
                placeholder={`Filtrar ${label}...`}
                className="h-8 text-xs"
              />
            </div>
          ))}
        </div>

        {/* Ações da grid */}
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
              <span>{atualizando ? 'Atualizando...' : 'Atualizar Grid'}</span>
            </Button>
            <Button
              size="sm"
              onClick={handleSalvarParametrizacao}
              disabled={salvando || carregando}
              className="bg-[#004c97] hover:bg-blue-900 text-white text-xs font-semibold gap-1.5"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{salvando ? 'Salvando...' : 'Salvar Parametrização CFOP'}</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={abrirDialogVinculo}
              disabled={salvando || carregando}
              className="text-xs border-slate-300 text-slate-700 gap-1.5"
            >
              <Link2 className="h-3.5 w-3.5 text-[#004c97]" />
              <span>Vincular Pedido</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDesvincular}
              disabled={salvando || carregando}
              className="text-xs border-slate-300 text-slate-700 gap-1.5"
            >
              <Link2Off className="h-3.5 w-3.5 text-red-500" />
              <span>Desvincular</span>
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleValidarCorrelacao}
              disabled={validando || carregando}
              className="text-xs border-slate-300 text-slate-700 gap-1.5"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              <span>{validando ? 'Validando...' : 'Validar Correlação'}</span>
            </Button>
          </div>
          <span className="text-[11px] text-slate-400">
            {selecionadas.size} linha(s) selecionada(s) • {linhasOrdenadas.length} registro(s)
          </span>
        </div>

        {/* Tabela */}
        <div
          className="rounded-md border border-slate-200 overflow-auto"
          style={{ maxHeight: 420 }}
        >
          <table className="w-full text-xs border-collapse min-w-[1250px]">
            <thead className="bg-slate-100 sticky top-0 z-10 shadow-[0_1px_0_0_#e2e8f0]">
              <tr>
                <th className="px-3 py-2.5 w-10">
                  <input
                    type="checkbox"
                    aria-label="Selecionar todas as linhas"
                    className="accent-[#004c97] h-3.5 w-3.5 cursor-pointer"
                    checked={
                      linhasVisiveis.length > 0 && selecionadas.size === linhasVisiveis.length
                    }
                    onChange={(e) =>
                      setSelecionadas(
                        e.target.checked ? new Set(linhasVisiveis.map((l) => l.id)) : new Set(),
                      )
                    }
                  />
                </th>
                <th className={thCls} onClick={() => ordenarPor('dataEmissao')}>
                  Data de Emissão{setaOrdenacao('dataEmissao')}
                </th>
                <th className={thCls} onClick={() => ordenarPor('numeroNf')}>
                  NF{setaOrdenacao('numeroNf')}
                </th>
                <th className={thCls} onClick={() => ordenarPor('serieNf')}>
                  Série{setaOrdenacao('serieNf')}
                </th>
                <th className={thCls} onClick={() => ordenarPor('codigoMaterial')}>
                  Código{setaOrdenacao('codigoMaterial')}
                </th>
                <th className={thCls} onClick={() => ordenarPor('itemNf')}>
                  Item{setaOrdenacao('itemNf')}
                </th>
                <th className={thCls} onClick={() => ordenarPor('lote')}>
                  Lote{setaOrdenacao('lote')}
                </th>
                <th className={thCls} onClick={() => ordenarPor('pedidoCiafal')}>
                  Pedido de Compra Ciafal{setaOrdenacao('pedidoCiafal')}
                </th>
                <th className={thCls} onClick={() => ordenarPor('itemPedido')}>
                  Item Pedido{setaOrdenacao('itemPedido')}
                </th>
                <th className={thCls} onClick={() => ordenarPor('cfop')}>
                  CFOP{setaOrdenacao('cfop')}
                </th>
                <th className={thCls} onClick={() => ordenarPor('statusCorrelacao')}>
                  Status de Correlação{setaOrdenacao('statusCorrelacao')}
                </th>
                <th className={thCls}>Observações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {carregando ? (
                <tr>
                  <td colSpan={12} className="px-3 py-8 text-center text-slate-400 text-xs">
                    Carregando dados simulados da grid...
                  </td>
                </tr>
              ) : linhasVisiveis.length === 0 ? (
                <tr>
                  <td colSpan={12} className="px-3 py-8 text-center text-slate-400 text-xs">
                    Nenhuma NF de retorno encontrada com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                linhasVisiveis.map((l) => {
                  const pendente = l.statusCorrelacao !== 'correlacionado'
                  return (
                    <tr
                      key={l.id}
                      className={`transition-colors ${
                        selecionadas.has(l.id)
                          ? 'bg-blue-50'
                          : pendente
                            ? 'bg-amber-50/40'
                            : 'bg-white'
                      } hover:bg-blue-50/70`}
                    >
                      <td className="px-3 py-2 text-center">
                        <input
                          type="checkbox"
                          aria-label={`Selecionar NF ${l.numeroNf} item ${l.itemNf}`}
                          className="accent-[#004c97] h-3.5 w-3.5 cursor-pointer"
                          checked={selecionadas.has(l.id)}
                          onChange={() => handleToggleSelecao(l.id)}
                        />
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono text-slate-600">
                        {l.dataEmissao}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono font-semibold text-slate-800">
                        {l.numeroNf}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-600">{l.serieNf}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <div className="font-mono font-semibold text-slate-800">
                          {l.codigoMaterial}
                        </div>
                        <div className="text-[10px] text-slate-400">{l.materialDescricao}</div>
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-600">{l.itemNf}</td>
                      <td className="px-3 py-2 font-mono text-slate-600">{l.lote}</td>
                      <td className="px-3 py-2 whitespace-nowrap font-mono font-semibold text-[#004c97]">
                        {l.pedidoCiafal ?? '—'}
                      </td>
                      <td className="px-3 py-2 font-mono text-slate-600">{l.itemPedido ?? '—'}</td>
                      <td className="px-3 py-2">
                        <select
                          aria-label={`CFOP da NF ${l.numeroNf} item ${l.itemNf}`}
                          value={l.cfop}
                          onChange={(e) =>
                            setLinhas((prev) =>
                              prev.map((x) => (x.id === l.id ? { ...x, cfop: e.target.value } : x)),
                            )
                          }
                          className="h-7 rounded border border-[#004c97]/40 bg-blue-50 text-[11px] font-mono font-semibold text-[#004c97] px-1.5 cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#004c97]"
                        >
                          {opcoesCfop.map((c) => (
                            <option key={c.valor} value={c.valor}>
                              {c.valor} — {c.descricao}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold ${corStatus(l.statusCorrelacao)}`}
                        >
                          {LABEL_STATUS_CORRELACAO[l.statusCorrelacao]}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 text-[11px] text-slate-600 max-w-[260px]">
                        <div className="flex items-start gap-1">
                          {pendente && (
                            <AlertTriangle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                          )}
                          <span>{l.observacoes}</span>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Carregar mais (carregamento progressivo) */}
        {haMais && (
          <div className="flex justify-center pt-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setLimitePaginas((p) => p + 1)}
              className="text-xs text-[#004c97] hover:bg-blue-50"
            >
              Carregar mais ({linhasOrdenadas.length - linhasVisiveis.length} restante(s))
            </Button>
          </div>
        )}
      </CardContent>

      <DialogVinculo
        linha={dialogVinculo}
        pedido={pedidoDialog}
        itemPedido={itemPedidoDialog}
        onChangePedido={setPedidoDialog}
        onChangeItem={setItemPedidoDialog}
        onConfirmar={confirmarVinculo}
        onCancelar={() => setDialogVinculo(null)}
      />
    </Card>
  )
}
