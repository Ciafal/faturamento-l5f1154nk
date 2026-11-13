// Diálogo "Correlacionar Pedido SAP" — ETAPA 2 do Monitor NF-e.
// Duas grades LADO A LADO: itens da NF-e (esquerda) x itens de pedidos SAP de
// demonstração (direita). Sugestão automática (prioridades 1–7) NUNCA grava
// vínculo — apenas pré-marca; o vínculo só é gravado no botão CONFIRMAR,
// via hook /backend/v1/ciafal/nfe/correlacao (auditoria antes/depois em
// nfe_logs). Vínculo manual item a item também é permitido.
// MODO DEMONSTRAÇÃO: pedidos vêm de nfe_pedidos_sap (is_simulated=true, seed
// 0018); banner permanente "SAP indisponível — dados de demonstração". Nunca
// simula lançamento/entrada SAP (RFC/BAPI futura — decisão do usuário).
import React, { useEffect, useMemo, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  AlertTriangle,
  CheckCircle2,
  Link2,
  Link2Off,
  Loader2,
  TriangleAlert,
  Wand2,
  X,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { formatarMoedaNfe } from '@/services/monitorNfe'
import {
  AVISO_PRECO,
  AVISO_SALDO,
  SAP_INDISPONIVEL_MOTIVO,
  gravarCorrelacao,
  sugerirPedidoParaItem,
} from '@/services/correlacaoPedido'
import type { NfeDocumento, NfeItem, NfePedidoSap, NfeVinculoPedido } from '@/types/monitorNfe'
import { listarNfeItens, listarNfePedidosSap, listarVinculosPedido } from '@/services/monitorNfe'

const CRITERIO_MANUAL = 'Vínculo manual informado pelo usuário'

interface Par {
  pedidoRowId: string
  origem: 'automatica' | 'manual'
  criterio: string
}

interface DialogCorrelacaoProps {
  nfe: NfeDocumento
  restam: number // quantas NF-e vêm depois desta na fila de correlação em lote
  onConfirmado: () => void
  onFechar: () => void
}

const th =
  'px-1.5 py-1 text-left font-semibold text-slate-600 whitespace-nowrap sticky top-0 bg-slate-100 z-10'
const td = 'px-1.5 py-1 whitespace-nowrap text-slate-700'

const saldoDe = (p: NfePedidoSap) =>
  Number(p.quantidade_pedida || 0) - Number(p.quantidade_recebida || 0)

function avisosDoPar(ped: NfePedidoSap, item: NfeItem): string[] {
  const avisos: string[] = []
  if (saldoDe(ped) < Number(item.quantidade || 0)) avisos.push(AVISO_SALDO)
  if (Math.abs(Number(ped.preco_unitario || 0) - Number(item.valor_unitario || 0)) > 0.009)
    avisos.push(AVISO_PRECO)
  return avisos
}

const DialogCorrelacao: React.FC<DialogCorrelacaoProps> = ({
  nfe,
  restam,
  onConfirmado,
  onFechar,
}) => {
  const { toast } = useToast()
  const [itens, setItens] = useState<NfeItem[]>([])
  const [pedidos, setPedidos] = useState<NfePedidoSap[]>([])
  const [vinculos, setVinculos] = useState<NfeVinculoPedido[]>([])
  const [carregando, setCarregando] = useState(true)
  const [gravando, setGravando] = useState(false)
  const [itemSelecionado, setItemSelecionado] = useState<string | null>(null)
  // Pares atuais na tela (ainda não gravados): itemNfeId → pedido escolhido.
  const [pares, setPares] = useState<Record<string, Par>>({})

  useEffect(() => {
    let vivo = true
    setCarregando(true)
    Promise.all([listarNfeItens(nfe.id), listarNfePedidosSap(), listarVinculosPedido(nfe.id)]).then(
      ([it, peds, vinc]) => {
        if (!vivo) return
        setItens(it)
        setPedidos(peds)
        setVinculos(vinc)
        // Pares iniciais = vínculos ATIVOS já gravados (estado real do HUB).
        const iniciais: Record<string, Par> = {}
        for (const v of vinc) {
          if (!v.vinculado) continue
          const row = peds.find((p) => p.id === v.pedidoRowRef)
          iniciais[v.nfe_item] = {
            pedidoRowId: row ? row.id : `${v.pedido_numero}/${v.pedido_item}`,
            origem: v.origem,
            criterio: v.criterio,
          }
        }
        setPares(iniciais)
        setItemSelecionado(it[0]?.id ?? null)
        setCarregando(false)
      },
    )
    return () => {
      vivo = false
    }
  }, [nfe.id])

  const ativos = useMemo(() => vinculos.filter((v) => v.vinculado), [vinculos])
  const vinculoAtivoDe = (itemId: string) => ativos.find((v) => v.nfe_item === itemId)

  // Sugestão automática (1–7) para o item — NUNCA grava, só mostra/pré-marca.
  const sugestoes = useMemo(() => {
    const mapa: Record<string, ReturnType<typeof sugerirPedidoParaItem>> = {}
    for (const it of itens) {
      mapa[it.id] = sugerirPedidoParaItem(it, nfe, pedidos, vinculoAtivoDe(it.id))
    }
    return mapa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itens, pedidos, vinculos, nfe])

  const rowIdDe = (p: NfePedidoSap) => p.id
  const pedidoPorRowId = (rowId: string) => pedidos.find((p) => rowIdDe(p) === rowId)

  const aplicarSugestao = (item: NfeItem) => {
    const s = sugestoes[item.id]
    if (!s?.sugestao) return
    setPares((p) => ({
      ...p,
      [item.id]: {
        pedidoRowId: rowIdDe(s.sugestao!),
        origem: 'automatica',
        criterio: s.sugestao!.sugestao.criterio,
      },
    }))
  }

  const diferencas = useMemo(() => {
    const novos: { item: NfeItem; par: Par }[] = []
    const removidos: NfeVinculoPedido[] = []
    for (const it of itens) {
      const par = pares[it.id]
      const ativo = vinculoAtivoDe(it.id)
      if (par) {
        const row = pedidoPorRowId(par.pedidoRowId)
        if (!row) continue
        const igual = ativo && ativo.pedido_numero === row.numero && ativo.pedido_item === row.item
        if (!igual) novos.push({ item: it, par })
      } else if (ativo) {
        removidos.push(ativo)
      }
    }
    return { novos, removidos }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itens, pares, vinculos, pedidos])

  const confirmar = async () => {
    setGravando(true)
    try {
      const res = await gravarCorrelacao({
        nfe_id: nfe.id,
        vinculos: diferencas.novos.map(({ item, par }) => {
          const row = pedidoPorRowId(par.pedidoRowId)!
          return {
            nfe_item_id: item.id,
            pedido_numero: row.numero,
            pedido_item: row.item,
            origem: par.origem,
            criterio: par.criterio,
          }
        }),
        desvincular: diferencas.removidos.map((v) => v.id),
      })
      toast({
        title: res.sucesso ? 'Correlação gravada' : 'Correlação não gravada',
        description: res.mensagem,
        variant: res.sucesso ? 'default' : 'destructive',
      })
      if (res.sucesso) onConfirmado()
    } catch (err: unknown) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : String(err)
      toast({ title: 'Erro ao gravar correlação', description: msg, variant: 'destructive' })
    } finally {
      setGravando(false)
    }
  }

  return (
    <Dialog open onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent className="max-w-[1400px] w-[95vw] max-h-[92vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-base text-[#004c97] flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Correlacionar Pedido SAP — NF-e {nfe.numero}/{nfe.serie}
            {restam > 0 && (
              <Badge variant="outline" className="text-[10px]">
                +{restam} na fila
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {nfe.fornecedor_razao_social} · Cód. fornecedor {nfe.fornecedor_codigo || '—'} · Valor
            NF R$ {formatarMoedaNfe(nfe.valor_total)}
          </DialogDescription>
        </DialogHeader>

        {/* Banner permanente — modo demonstração */}
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 flex items-start gap-2">
          <TriangleAlert className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">SAP indisponível — dados de demonstração</p>
            <p className="text-amber-700">{SAP_INDISPONIVEL_MOTIVO}</p>
          </div>
        </div>

        {carregando ? (
          <div className="flex items-center justify-center gap-2 py-10 text-xs text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Carregando itens e pedidos de demonstração…
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
            {/* ---- ESQUERDA: itens da NF-e ---- */}
            <div className="flex flex-col min-h-0 gap-1">
              <p className="text-[11px] font-semibold text-[#004c97]">
                Itens da NF-e ({itens.length})
              </p>
              <div className="rounded-md border bg-white overflow-auto flex-1 max-h-[44vh]">
                <table className="w-full text-[10px] border-collapse">
                  <thead>
                    <tr>
                      {[
                        'Item',
                        'Cód. fornecedor',
                        'Descrição',
                        'Qtd.',
                        'Un.',
                        'Vlr unitário',
                        'Vlr total',
                        '',
                      ].map((c, i) => (
                        <th key={i} className={`${th} ${i >= 3 && i <= 6 ? 'text-right' : ''}`}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {itens.map((it) => {
                      const par = pares[it.id]
                      const row = par ? pedidoPorRowId(par.pedidoRowId) : undefined
                      const sug = sugestoes[it.id]?.sugestao
                      const selecionado = itemSelecionado === it.id
                      return (
                        <tr
                          key={it.id}
                          onClick={() => setItemSelecionado(it.id)}
                          className={`cursor-pointer border-t ${selecionado ? 'bg-sky-50' : 'hover:bg-slate-50'}`}
                        >
                          <td className={`${td} font-semibold`}>{it.item}</td>
                          <td className={td}>{it.codigo_produto_fornecedor}</td>
                          <td className={`${td} max-w-[150px] truncate`} title={it.descricao}>
                            {it.descricao}
                          </td>
                          <td className={`${td} text-right`}>
                            {it.quantidade.toLocaleString('pt-BR')}
                          </td>
                          <td className={td}>{it.unidade}</td>
                          <td className={`${td} text-right`}>
                            {formatarMoedaNfe(it.valor_unitario)}
                          </td>
                          <td className={`${td} text-right font-medium`}>
                            {formatarMoedaNfe(it.valor_total)}
                          </td>
                          <td className={`${td} text-right`}>
                            <div className="flex items-center justify-end gap-0.5">
                              {sug && (!par || par.origem === 'manual') && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  title={`Usar sugestão: ${sug.sugestao.criterio} → pedido ${sug.numero}/${sug.item}`}
                                  onClick={(ev) => {
                                    ev.stopPropagation()
                                    setItemSelecionado(it.id)
                                    aplicarSugestao(it)
                                  }}
                                >
                                  <Wand2 className="h-3 w-3 text-amber-600" />
                                </Button>
                              )}
                              {par && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-5 w-5"
                                  title="Remover vínculo (desvincular ao confirmar)"
                                  onClick={(ev) => {
                                    ev.stopPropagation()
                                    setPares((p) => {
                                      const c = { ...p }
                                      delete c[it.id]
                                      return c
                                    })
                                  }}
                                >
                                  <Link2Off className="h-3 w-3 text-red-600" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              {/* Vínculo/aviso do item selecionado */}
              {(() => {
                const it = itens.find((i) => i.id === itemSelecionado)
                if (!it) return null
                const par = pares[it.id]
                const row = par ? pedidoPorRowId(par.pedidoRowId) : undefined
                const sug = sugestoes[it.id]
                const ativo = vinculoAtivoDe(it.id)
                return (
                  <div className="rounded-md border bg-slate-50 px-2 py-1.5 text-[10px] text-slate-600 flex flex-col gap-0.5">
                    {row && par ? (
                      <>
                        <span className="font-semibold text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Vinculado a {row.numero}/{row.item} —{' '}
                          {par.origem === 'automatica' ? `sugestão (${par.criterio})` : 'manual'}
                        </span>
                        {avisosDoPar(row, it).map((a) => (
                          <span key={a} className="text-amber-700 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> {a}
                          </span>
                        ))}
                        {ativo && !diferencas.novos.some((n) => n.item.id === it.id) && (
                          <span className="text-slate-500">
                            Vínculo já gravado no HUB (aguardando confirmação para alterar).
                          </span>
                        )}
                      </>
                    ) : sug?.sugestao ? (
                      <span className="text-amber-700 flex items-center gap-1">
                        <Wand2 className="h-3 w-3" /> Sugestão: pedido {sug.sugestao.numero}/
                        {sug.sugestao.item} ({sug.sugestao.sugestao.criterio}) — clique na linha do
                        pedido à direita para vincular.
                      </span>
                    ) : (
                      <span className="text-slate-500">
                        {sug?.aviso ?? 'Selecione um pedido à direita para vincular manualmente.'}
                      </span>
                    )}
                  </div>
                )
              })()}
            </div>

            {/* ---- DIREITA: itens dos pedidos SAP (demonstração) ---- */}
            <div className="flex flex-col min-h-0 gap-1">
              <p className="text-[11px] font-semibold text-[#004c97]">
                Itens do Pedido SAP — demonstração ({pedidos.length})
              </p>
              <div className="rounded-md border bg-white overflow-auto flex-1 max-h-[44vh]">
                <table className="w-full text-[10px] border-collapse">
                  <thead>
                    <tr>
                      {[
                        'Pedido',
                        'Item',
                        'Material SAP',
                        'Descrição',
                        'Qtd. pedida',
                        'Qtd. recebida',
                        'Saldo',
                        'Preço',
                        'Centro',
                        'Dep.',
                      ].map((c, i) => (
                        <th key={i} className={`${th} ${i >= 4 && i <= 7 ? 'text-right' : ''}`}>
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {pedidos.map((p) => {
                      const itemSel = itens.find((i) => i.id === itemSelecionado)
                      const parSel = itemSel ? pares[itemSel.id] : undefined
                      const parado = parSel?.pedidoRowId === rowIdDe(p)
                      const sugerido =
                        itemSel && sugestoes[itemSel.id]?.sugestao?.id === p.id && !parado
                      const avisos = itemSel ? avisosDoPar(p, itemSel) : []
                      return (
                        <tr
                          key={p.id}
                          onClick={() => {
                            if (!itemSel) return
                            setPares((prev) => ({
                              ...prev,
                              [itemSel.id]: {
                                pedidoRowId: rowIdDe(p),
                                origem: 'manual',
                                criterio: CRITERIO_MANUAL,
                              },
                            }))
                          }}
                          className={`cursor-pointer border-t ${
                            parado
                              ? 'bg-emerald-50'
                              : sugerido
                                ? 'bg-amber-50/70'
                                : 'hover:bg-slate-50'
                          }`}
                          title={
                            itemSel
                              ? `Clique para vincular o item ${itemSel.item} da NF-e a este pedido`
                              : 'Selecione um item da NF-e à esquerda primeiro'
                          }
                        >
                          <td className={`${td} font-semibold`}>{p.numero}</td>
                          <td className={td}>{p.item}</td>
                          <td className={td}>{p.material_sap}</td>
                          <td
                            className={`${td} max-w-[140px] truncate`}
                            title={p.material_descricao}
                          >
                            {p.material_descricao}
                          </td>
                          <td className={`${td} text-right`}>
                            {p.quantidade_pedida.toLocaleString('pt-BR')}
                          </td>
                          <td className={`${td} text-right`}>
                            {p.quantidade_recebida.toLocaleString('pt-BR')}
                          </td>
                          <td
                            className={`${td} text-right font-medium ${saldoDe(p) <= 0 ? 'text-red-600' : ''}`}
                          >
                            {saldoDe(p).toLocaleString('pt-BR')}
                          </td>
                          <td className={`${td} text-right`}>
                            {formatarMoedaNfe(p.preco_unitario)}
                          </td>
                          <td className={td}>{p.centro}</td>
                          <td className={td}>{p.deposito}</td>
                          {avisos.length > 0 && (
                            <td className={`${td} text-right`} title={avisos.join(' ')}>
                              <TriangleAlert className="h-3 w-3 inline text-amber-600" />
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-slate-400">
                Clique num item da NF-e e depois na linha do pedido para vincular manualmente; o
                botão varinha aplica a sugestão automática. Nada é gravado sem CONFIRMAR.
              </p>
            </div>
          </div>
        )}

        <DialogFooter className="pt-2 border-t flex items-center justify-between sm:justify-between">
          <div className="text-[10px] text-slate-500">
            A vincular: <strong>{diferencas.novos.length}</strong> · A desvincular:{' '}
            <strong>{diferencas.removidos.length}</strong> — auditoria com usuário, data/hora e
            antes/depois em nfe_logs.
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8"
              onClick={onFechar}
              disabled={gravando}
            >
              <X className="h-3.5 w-3.5 mr-1" /> Cancelar
            </Button>
            <Button
              size="sm"
              className="bg-[#004c97] hover:bg-[#003a75] text-white text-xs h-8"
              onClick={confirmar}
              disabled={
                gravando || (diferencas.novos.length === 0 && diferencas.removidos.length === 0)
              }
            >
              {gravando ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Link2 className="h-3.5 w-3.5 mr-1" />
              )}
              CONFIRMAR
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DialogCorrelacao
