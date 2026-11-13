// Grade operacional do Monitor NF-e de Entrada (ETAPA 1) — 22 colunas.
// Recursos: cabeçalho fixo, checkbox individual + seleção múltipla com barra
// de ações, ordenação por coluna, paginação, rolagem horizontal interna com
// colunas principais fixadas à esquerda, largura de coluna ajustável,
// valores no padrão brasileiro, clique no Nº NF-e abre o detalhe.
// Colunas ainda sem dado no HUB (Pedido SAP, Correlação) mostram "—" —
// estado vazio honesto, nunca fictício; são preenchidas nas Etapas 2–5.
import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  Download,
  Eye,
  Link2,
  MoreVertical,
  X,
} from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatarDataNfe, formatarHoraNfe, formatarMoedaNfe } from '@/services/monitorNfe'
import {
  CORES_CORRELACAO,
  CORES_RECEBIMENTO_STATUS,
  CORES_STATUS_NFE,
  type NfeDocumento,
} from '@/types/monitorNfe'

interface GradeNfeProps {
  documentos: NfeDocumento[]
  carregando: boolean
  selecionadas: string[]
  onToggleSelecao: (id: string) => void
  onToggleTodos: (ids: string[]) => void
  onLimparSelecao: () => void
  onAbrirDetalhe: (doc: NfeDocumento) => void
  onAcusarRecebimento: (doc: NfeDocumento) => void
  onCorrelacionar: (docs: NfeDocumento[]) => void
  onExportarCsv: () => void
}

type Alinhamento = 'left' | 'right' | 'center'

interface ColunaConfig {
  id: string
  rotulo: string
  largura: number
  ordenavel?: boolean
  alinhar?: Alinhamento
  fixa?: boolean // fixada à esquerda durante a rolagem horizontal
  semRedimensionar?: boolean
}

// 22 colunas, na ordem definida para o monitor operacional.
const COLUNAS: ColunaConfig[] = [
  { id: 'selecao', rotulo: '', largura: 36, fixa: true, semRedimensionar: true },
  { id: 'status', rotulo: 'Status', largura: 150, ordenavel: true, fixa: true },
  { id: 'empresa', rotulo: 'Empresa', largura: 160, ordenavel: true, fixa: true },
  { id: 'filial', rotulo: 'Filial', largura: 130, ordenavel: true },
  { id: 'numero', rotulo: 'Nº NF-e', largura: 100, ordenavel: true, fixa: true },
  { id: 'serie', rotulo: 'Série', largura: 55 },
  { id: 'chave_acesso', rotulo: 'Chave de acesso (44 díg.)', largura: 250 },
  { id: 'natureza_operacao', rotulo: 'Natureza operação', largura: 180 },
  { id: 'fornecedor_cnpj', rotulo: 'CNPJ emitente', largura: 125 },
  { id: 'fornecedor_codigo', rotulo: 'Cód. fornecedor', largura: 95, ordenavel: true },
  { id: 'fornecedor_razao_social', rotulo: 'Fornecedor', largura: 180, ordenavel: true },
  { id: 'uf_emitente', rotulo: 'UF', largura: 45 },
  { id: 'cnpj_destinatario', rotulo: 'CNPJ destinatário', largura: 140 },
  { id: 'data_emissao', rotulo: 'Data emissão', largura: 90, ordenavel: true },
  { id: 'hora_emissao', rotulo: 'Hora', largura: 60 },
  { id: 'valor_total', rotulo: 'Valor NF (R$)', largura: 110, ordenavel: true, alinhar: 'right' },
  { id: 'pedido_sap', rotulo: 'Pedido SAP', largura: 100 },
  { id: 'correlacao_status', rotulo: 'Correlação', largura: 105 },
  { id: 'tem_divergencia', rotulo: 'Divergência', largura: 90 },
  { id: 'alertas_count', rotulo: 'Alertas', largura: 65, ordenavel: true, alinhar: 'right' },
  { id: 'recebimento_status', rotulo: 'Recebimento', largura: 95 },
  { id: 'acoes', rotulo: 'Ações', largura: 55, semRedimensionar: true },
]

const COLUNAS_FIXAS = COLUNAS.filter((c) => c.fixa).map((c) => c.id)
const PAGINAS_TAMANHOS = [10, 20, 50]

const thBase =
  'relative px-2 h-7 text-[10px] font-semibold text-slate-600 whitespace-nowrap select-none'
const tdBase = 'px-2 py-1 text-[11px] whitespace-nowrap'

function Chip({ cor, children }: { cor?: string; children: React.ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[9px] font-medium ${cor ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}
    >
      {children}
    </span>
  )
}

function TextoVazio() {
  return <span className="text-slate-300">—</span>
}

const podeAcusarRecebimento = (d: NfeDocumento) =>
  d.status === 'NF-e Nova' || d.status === 'Aguardando Recebimento'

const GradeNfe: React.FC<GradeNfeProps> = ({
  documentos,
  carregando,
  selecionadas,
  onToggleSelecao,
  onToggleTodos,
  onLimparSelecao,
  onAbrirDetalhe,
  onAcusarRecebimento,
  onCorrelacionar,
  onExportarCsv,
}) => {
  const [ordenacao, setOrdenacao] = useState<{ id: string; dir: 'asc' | 'desc' } | null>(null)
  const [larguras, setLarguras] = useState<Record<string, number>>({})
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(PAGINAS_TAMANHOS[0])
  const refScroll = useRef<HTMLDivElement>(null)

  const larguraDe = (id: string) => larguras[id] ?? COLUNAS.find((c) => c.id === id)?.largura ?? 100

  // ---- Ordenação ----------------------------------------------------------
  const ordenados = useMemo(() => {
    if (!ordenacao) return documentos
    const dir = ordenacao.dir === 'asc' ? 1 : -1
    return [...documentos].sort((a, b) => {
      let va: string | number
      let vb: string | number
      if (ordenacao.id === 'data_emissao') {
        va = a.data_emissao || ''
        vb = b.data_emissao || ''
      } else if (ordenacao.id === 'valor_total') {
        va = Number(a.valor_total || 0)
        vb = Number(b.valor_total || 0)
      } else if (ordenacao.id === 'alertas_count') {
        va = Number(a.alertas_count ?? 0)
        vb = Number(b.alertas_count ?? 0)
      } else {
        va = String((a as unknown as Record<string, unknown>)[ordenacao.id] ?? '').toLowerCase()
        vb = String((b as unknown as Record<string, unknown>)[ordenacao.id] ?? '').toLowerCase()
      }
      if (va < vb) return -dir
      if (va > vb) return dir
      return 0
    })
  }, [documentos, ordenacao])

  // ---- Paginação ----------------------------------------------------------
  const totalPaginas = Math.max(1, Math.ceil(ordenados.length / porPagina))
  const paginaAtual = Math.min(pagina, totalPaginas)
  const registros = useMemo(
    () => ordenados.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina),
    [ordenados, paginaAtual, porPagina],
  )
  useEffect(() => setPagina(1), [documentos.length])

  const todosDaPaginaSelecionados =
    registros.length > 0 && registros.every((d) => selecionadas.includes(d.id))

  // ---- Offsets sticky das colunas fixadas ---------------------------------
  const offsets = useMemo(() => {
    const acc: Record<string, number> = {}
    let soma = 0
    for (const id of COLUNAS_FIXAS) {
      acc[id] = soma
      soma += larguraDe(id)
    }
    return acc
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [larguras])

  const alternarOrdenacao = (id: string) =>
    setOrdenacao((o) =>
      o?.id !== id ? { id, dir: 'asc' } : o.dir === 'asc' ? { id, dir: 'desc' } : null,
    )

  // ---- Redimensionamento de colunas ---------------------------------------
  const iniciarResize = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    e.stopPropagation()
    const startX = e.clientX
    const larguraInicial = larguraDe(id)
    const aoMover = (ev: MouseEvent) => {
      setLarguras((l) => ({ ...l, [id]: Math.max(36, larguraInicial + ev.clientX - startX) }))
    }
    const aoSoltar = () => {
      window.removeEventListener('mousemove', aoMover)
      window.removeEventListener('mouseup', aoSoltar)
    }
    window.addEventListener('mousemove', aoMover)
    window.addEventListener('mouseup', aoSoltar)
  }

  // ---- Conteúdo de cada célula --------------------------------------------
  const celula = (d: NfeDocumento, id: string): React.ReactNode => {
    switch (id) {
      case 'status':
        return <Chip cor={CORES_STATUS_NFE[d.status]}>{d.status}</Chip>
      case 'numero':
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onAbrirDetalhe(d)
            }}
            className="font-semibold text-[#004c97] hover:underline"
          >
            {d.numero}
          </button>
        )
      case 'chave_acesso':
        return <span className="font-mono text-[10px] text-slate-500">{d.chave_acesso}</span>
      case 'data_emissao':
        return formatarDataNfe(d.data_emissao) || <TextoVazio />
      case 'hora_emissao':
        return formatarHoraNfe(d.data_emissao) || <TextoVazio />
      case 'valor_total':
        return <span className="font-medium">{formatarMoedaNfe(d.valor_total)}</span>
      case 'correlacao_status':
        return d.correlacao_status ? (
          <Chip cor={CORES_CORRELACAO[d.correlacao_status]}>{d.correlacao_status}</Chip>
        ) : (
          <TextoVazio />
        )
      case 'tem_divergencia':
        return d.tem_divergencia ? (
          <Chip cor="bg-red-50 text-red-700 border-red-200">Sim</Chip>
        ) : (
          <TextoVazio />
        )
      case 'alertas_count':
        return (
          <span className={d.alertas_count ? 'font-semibold text-amber-700' : 'text-slate-500'}>
            {d.alertas_count ?? 0}
          </span>
        )
      case 'recebimento_status':
        return d.recebimento_status ? (
          <Chip cor={CORES_RECEBIMENTO_STATUS[d.recebimento_status]}>{d.recebimento_status}</Chip>
        ) : (
          <TextoVazio />
        )
      case 'pedido_sap':
        return d.pedido_sap || <TextoVazio />
      case 'acoes':
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-6 w-6" title="Ações da NF-e">
                <MoreVertical className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs">
              <DropdownMenuItem onClick={() => onAbrirDetalhe(d)}>
                <Eye className="mr-2 h-3.5 w-3.5" /> Abrir detalhe
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onCorrelacionar([d])}>
                <Link2 className="mr-2 h-3.5 w-3.5" /> Correlacionar Pedido SAP
              </DropdownMenuItem>
              {podeAcusarRecebimento(d) && (
                <DropdownMenuItem onClick={() => onAcusarRecebimento(d)}>
                  <ClipboardCheck className="mr-2 h-3.5 w-3.5" /> Acusar recebimento
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )
      default: {
        const v = (d as unknown as Record<string, unknown>)[id]
        const texto = v === null || v === undefined || v === '' ? '' : String(v)
        const truncavel =
          id === 'empresa' ||
          id === 'filial' ||
          id === 'natureza_operacao' ||
          id === 'fornecedor_razao_social'
        return texto ? (
          truncavel ? (
            <span className="block max-w-[170px] truncate" title={texto}>
              {texto}
            </span>
          ) : (
            texto
          )
        ) : (
          <TextoVazio />
        )
      }
    }
  }

  if (carregando) {
    return (
      <div className="rounded-md border bg-white p-8 text-center text-xs text-slate-400">
        Carregando notas fiscais…
      </div>
    )
  }

  if (documentos.length === 0) {
    return (
      <div className="rounded-md border bg-white p-8 text-center text-xs text-slate-400">
        Nenhuma NF-e encontrada com os filtros atuais.
      </div>
    )
  }

  const larguraTotal = COLUNAS.reduce((s, c) => s + larguraDe(c.id), 0)
  const primeiro = (paginaAtual - 1) * porPagina + 1
  const ultimo = Math.min(paginaAtual * porPagina, ordenados.length)

  return (
    <div className="flex flex-col gap-1">
      {/* ---- Barra de ações da seleção múltipla ---- */}
      {selecionadas.length > 0 && (
        <div className="flex items-center justify-between rounded-md border border-[#004c97]/30 bg-[#eef4fb] px-2 py-1.5 text-[11px]">
          <span className="font-medium text-[#004c97]">
            {selecionadas.length} NF-e selecionada{selecionadas.length > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px]"
              onClick={() => onCorrelacionar(documentos.filter((d) => selecionadas.includes(d.id)))}
            >
              <Link2 className="mr-1 h-3 w-3" /> Correlacionar Pedido SAP
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-[11px]" onClick={onExportarCsv}>
              <Download className="mr-1 h-3 w-3" /> Exportar CSV
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-slate-500"
              onClick={onLimparSelecao}
            >
              <X className="mr-1 h-3 w-3" /> Limpar seleção
            </Button>
          </div>
        </div>
      )}

      {/* ---- Contêiner de rolagem interna (horizontal e vertical) ---- */}
      <div ref={refScroll} className="rounded-md border bg-white overflow-auto max-h-[65vh]">
        <table className="border-collapse" style={{ width: larguraTotal, minWidth: larguraTotal }}>
          <thead>
            <tr>
              {COLUNAS.map((c) => {
                const fixa = c.fixa
                const estilo: React.CSSProperties = {
                  width: larguraDe(c.id),
                  minWidth: larguraDe(c.id),
                  maxWidth: larguraDe(c.id),
                  position: 'sticky',
                  top: 0,
                  ...(fixa ? { left: offsets[c.id], zIndex: 30 } : { zIndex: 20 }),
                }
                return (
                  <th
                    key={c.id}
                    className={`${thBase} bg-slate-50 ${c.alinhar === 'right' ? 'text-right' : 'text-left'} ${c.ordenavel ? 'cursor-pointer hover:text-[#004c97]' : ''}`}
                    style={estilo}
                    onClick={c.ordenavel ? () => alternarOrdenacao(c.id) : undefined}
                    title={c.ordenavel ? `Ordenar por ${c.rotulo}` : undefined}
                  >
                    {c.id === 'selecao' ? (
                      <Checkbox
                        checked={todosDaPaginaSelecionados}
                        onCheckedChange={() => onToggleTodos(registros.map((d) => d.id))}
                        aria-label="Selecionar todas as NF-e da página"
                      />
                    ) : (
                      <>
                        {c.rotulo}
                        {c.ordenavel &&
                          ordenacao?.id === c.id &&
                          (ordenacao.dir === 'asc' ? (
                            <ArrowUpAZ className="ml-0.5 inline h-3 w-3" />
                          ) : (
                            <ArrowDownAZ className="ml-0.5 inline h-3 w-3" />
                          ))}
                        {!c.semRedimensionar && (
                          <span
                            onMouseDown={(e) => iniciarResize(e, c.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-[#004c97]/50"
                          />
                        )}
                      </>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {registros.map((d) => (
              <tr
                key={d.id}
                className="group cursor-pointer hover:bg-slate-50"
                onClick={() => onAbrirDetalhe(d)}
              >
                {COLUNAS.map((c) => {
                  const fixa = c.fixa
                  const estilo: React.CSSProperties = fixa
                    ? { left: offsets[c.id], position: 'sticky', zIndex: 10 }
                    : undefined
                  return (
                    <td
                      key={c.id}
                      className={`${tdBase} bg-white group-hover:bg-slate-50 ${c.alinhar === 'right' ? 'text-right' : ''} ${fixa ? 'shadow-[2px_0_4px_-2px_rgba(0,0,0,0.12)]' : ''}`}
                      style={estilo}
                      onClick={
                        c.id === 'selecao' || c.id === 'acoes'
                          ? (e) => e.stopPropagation()
                          : undefined
                      }
                    >
                      {c.id === 'selecao' ? (
                        <Checkbox
                          checked={selecionadas.includes(d.id)}
                          onCheckedChange={() => onToggleSelecao(d.id)}
                          aria-label={`Selecionar NF-e ${d.numero}`}
                        />
                      ) : (
                        celula(d, c.id)
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ---- Rodapé de paginação ---- */}
      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
        <span>
          Exibindo {primeiro}–{ultimo} de {ordenados.length} NF-e
        </span>
        <div className="flex items-center gap-2">
          <Select
            value={String(porPagina)}
            onValueChange={(v) => {
              setPorPagina(Number(v))
              setPagina(1)
            }}
          >
            <SelectTrigger className="h-7 w-[110px] text-[11px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGINAS_TAMANHOS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n} por página
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={paginaAtual <= 1}
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
            aria-label="Página anterior"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <span>
            Página {paginaAtual} de {totalPaginas}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            disabled={paginaAtual >= totalPaginas}
            onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
            aria-label="Próxima página"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default GradeNfe
