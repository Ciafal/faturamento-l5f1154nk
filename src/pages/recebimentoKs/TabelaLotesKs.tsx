// Tabela de conferência do processo ENT-08 "Recebimento KS".
// 12 colunas na ordem exata: Nº Bloco, Item, Versão, Material, Denominação,
// Letra, Lote Coletado, Peso Coletado, Lote RFID, Quantidade RFID, Status Lote, RFID.
// Cabeçalho fixo, rolagem vertical/horizontal, filtros, ordenação, seleção de
// linhas, totais de peso e destaque de divergências (mesma lógica de status da
// tela de referência SAI-01).

import React, { useMemo, useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  formatarToneladasKs,
  tonalidadeStatusKs,
  CLASSES_TONALIDADE_KS,
} from '@/lib/recebimentoKs/calculos'
import type { LoteRecebimentoKs } from '@/types/recebimentoKs'

interface TabelaLotesKsProps {
  lotes: LoteRecebimentoKs[]
}

type Ordem = {
  campo: keyof LoteRecebimentoKs
  dir: 'asc' | 'desc'
}

const COLUNAS: { chave: Ordem['campo']; titulo: string }[] = [
  { chave: 'bloco', titulo: 'Nº Bloco' },
  { chave: 'item', titulo: 'Item' },
  { chave: 'versao', titulo: 'Versão' },
  { chave: 'material', titulo: 'Material' },
  { chave: 'denominacao', titulo: 'Denominação' },
  { chave: 'letra', titulo: 'Letra' },
  { chave: 'lote_coletado', titulo: 'Lote Coletado' },
  { chave: 'peso_coletado', titulo: 'Peso Coletado' },
  { chave: 'lote_rfid', titulo: 'Lote RFID' },
  { chave: 'quantidade_rfid', titulo: 'Quantidade RFID' },
  { chave: 'status_lote', titulo: 'Status Lote' },
  { chave: 'rfid', titulo: 'RFID' },
]

const valorOrdenacao = (l: LoteRecebimentoKs, campo: Ordem['campo']): string | number => {
  if (campo === 'peso_coletado' || campo === 'quantidade_rfid' || campo === 'peso_rfid') {
    return l[campo] as number
  }
  return String(l[campo] ?? '')
}

const TabelaLotesKs: React.FC<TabelaLotesKsProps> = ({ lotes }) => {
  const [selecionadas, setSelecionadas] = useState<Set<number>>(new Set())
  const [ordem, setOrdem] = useState<Ordem | null>(null)
  const [fBloco, setFBloco] = useState('')
  const [fMaterial, setFMaterial] = useState('')
  const [fLote, setFLote] = useState('')
  const [fStatus, setFStatus] = useState('todos')

  const statusDisponiveis = useMemo(
    () => Array.from(new Set(lotes.map((l) => l.status_lote))).sort(),
    [lotes],
  )

  const filtrados = useMemo(() => {
    let out = lotes.filter((l) => {
      if (fBloco && !l.bloco.toLowerCase().includes(fBloco.toLowerCase())) return false
      if (fMaterial && !l.material.toLowerCase().includes(fMaterial.toLowerCase())) return false
      if (fLote && !l.lote_coletado.toLowerCase().includes(fLote.toLowerCase())) return false
      if (fStatus !== 'todos' && l.status_lote !== fStatus) return false
      return true
    })
    if (ordem) {
      const { campo, dir } = ordem
      out = [...out].sort((a, b) => {
        const va = valorOrdenacao(a, campo)
        const vb = valorOrdenacao(b, campo)
        const cmp =
          typeof va === 'number' && typeof vb === 'number'
            ? va - vb
            : String(va).localeCompare(String(vb), 'pt-BR')
        return dir === 'asc' ? cmp : -cmp
      })
    }
    return out
  }, [lotes, fBloco, fMaterial, fLote, fStatus, ordem])

  const totais = useMemo(
    () => ({
      pesoColetado: Number(filtrados.reduce((s, l) => s + l.peso_coletado, 0).toFixed(3)),
      qtdRfid: filtrados.reduce((s, l) => s + l.quantidade_rfid, 0),
    }),
    [filtrados],
  )

  const alternarOrdenacao = (campo: Ordem['campo']) =>
    setOrdem((atual) =>
      atual && atual.campo === campo
        ? atual.dir === 'asc'
          ? { campo, dir: 'desc' }
          : null
        : { campo, dir: 'asc' },
    )

  const alternarSelecao = (idx: number) =>
    setSelecionadas((s) => {
      const n = new Set(s)
      if (n.has(idx)) n.delete(idx)
      else n.add(idx)
      return n
    })

  return (
    <div className="space-y-2">
      {/* Filtros */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Input
          placeholder="Filtrar Nº Bloco…"
          value={fBloco}
          onChange={(e) => setFBloco(e.target.value)}
          className="h-7 text-[11px]"
        />
        <Input
          placeholder="Filtrar material…"
          value={fMaterial}
          onChange={(e) => setFMaterial(e.target.value)}
          className="h-7 text-[11px]"
        />
        <Input
          placeholder="Filtrar lote…"
          value={fLote}
          onChange={(e) => setFLote(e.target.value)}
          className="h-7 text-[11px]"
        />
        <Select value={fStatus} onValueChange={setFStatus}>
          <SelectTrigger className="h-7 text-[11px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {statusDisponiveis.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="rounded-md border border-slate-200 overflow-auto max-h-[50vh] relative">
        <table className="w-full text-[11px] border-collapse">
          <thead className="bg-slate-100 sticky top-0 z-10">
            <tr>
              <th className="sticky left-0 z-20 bg-slate-100 px-2 py-1.5 w-8">
                <Checkbox
                  checked={filtrados.length > 0 && selecionadas.size === filtrados.length}
                  onCheckedChange={(v) =>
                    setSelecionadas(v ? new Set(filtrados.map((_, i) => i)) : new Set<number>())
                  }
                  aria-label="Selecionar todas"
                  className="h-3 w-3"
                />
              </th>
              {COLUNAS.map(({ chave, titulo }) => (
                <th
                  key={String(chave)}
                  onClick={() => alternarOrdenacao(chave)}
                  className="px-2 py-1.5 text-left font-semibold text-slate-700 uppercase tracking-wide whitespace-nowrap cursor-pointer select-none hover:text-[#004c97]"
                >
                  {titulo}
                  {ordem?.campo === chave && (ordem.dir === 'asc' ? ' ▲' : ' ▼')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr>
                <td colSpan={13} className="px-2 py-6 text-center text-slate-500">
                  Nenhum lote corresponde aos filtros.
                </td>
              </tr>
            )}
            {filtrados.map((lote, idx) => {
              const tom = tonalidadeStatusKs(lote.status_lote)
              const divergente = lote.lote_rfid !== '' && lote.lote_rfid !== lote.lote_coletado
              return (
                <tr
                  key={`${lote.bloco}-${lote.item}-${lote.lote_coletado}-${idx}`}
                  className={
                    'border-t border-slate-100 ' +
                    (divergente ? 'bg-red-50/60 ' : '') +
                    (selecionadas.has(idx) ? 'bg-blue-50 ' : '') +
                    'hover:bg-blue-50/50 transition-colors'
                  }
                >
                  <td className="sticky left-0 bg-white px-2 py-1.5 z-10">
                    <Checkbox
                      checked={selecionadas.has(idx)}
                      onCheckedChange={() => alternarSelecao(idx)}
                      aria-label={`Selecionar lote ${lote.lote_coletado}`}
                      className="h-3 w-3"
                    />
                  </td>
                  <td className="px-2 py-1.5 font-mono">{lote.bloco}</td>
                  <td className="px-2 py-1.5 font-mono">{lote.item}</td>
                  <td className="px-2 py-1.5 font-mono">{lote.versao}</td>
                  <td className="px-2 py-1.5 font-mono">{lote.material}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap">{lote.denominacao}</td>
                  <td className="px-2 py-1.5 font-mono text-center font-bold text-[#004c97]">
                    {lote.letra}
                  </td>
                  <td className="px-2 py-1.5 font-mono">{lote.lote_coletado}</td>
                  <td className="px-2 py-1.5 font-mono text-right">
                    {formatarToneladasKs(lote.peso_coletado)}
                  </td>
                  <td
                    className={
                      'px-2 py-1.5 font-mono ' + (divergente ? 'text-red-700 font-bold' : '')
                    }
                  >
                    {lote.lote_rfid || '—'}
                  </td>
                  <td className="px-2 py-1.5 font-mono text-right">
                    {lote.quantidade_rfid > 0 ? lote.quantidade_rfid.toLocaleString('pt-BR') : '—'}
                  </td>
                  <td className="px-2 py-1.5">
                    <Badge
                      variant="outline"
                      className={'text-[10px] ' + CLASSES_TONALIDADE_KS[tom]}
                    >
                      {lote.status_lote}
                    </Badge>
                  </td>
                  <td className="px-2 py-1.5 font-mono text-slate-500">{lote.rfid || '—'}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot className="bg-slate-50 sticky bottom-0">
            <tr className="border-t-2 border-slate-200 font-semibold">
              <td className="sticky left-0 bg-slate-50 px-2 py-1.5 z-10" />
              <td className="px-2 py-1.5" colSpan={7}>
                Totais ({filtrados.length} lote{filtrados.length === 1 ? '' : 's'})
              </td>
              <td className="px-2 py-1.5 font-mono text-right">
                {formatarToneladasKs(totais.pesoColetado)}
              </td>
              <td className="px-2 py-1.5" />
              <td className="px-2 py-1.5 font-mono text-right">
                {totais.qtdRfid.toLocaleString('pt-BR')}
              </td>
              <td className="px-2 py-1.5" colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
      <p className="text-[10px] text-slate-400">
        Clique no cabeçalho de uma coluna para ordenar. Linhas em vermelho indicam divergência entre
        lote coletado e lote RFID.
      </p>
    </div>
  )
}

export default TabelaLotesKs
