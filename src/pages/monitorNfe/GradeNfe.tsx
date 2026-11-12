// Grade principal do Monitor NF-e — 14 colunas, densa, responsiva (HUB).
import React from 'react'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatarDataHoraNfe, formatarMoedaNfe } from '@/services/monitorNfe'
import { CORES_STATUS_NFE, type NfeDocumento } from '@/types/monitorNfe'

interface GradeNfeProps {
  documentos: NfeDocumento[]
  carregando: boolean
  selecionadas: string[]
  onToggleSelecao: (id: string) => void
  onToggleTodos: () => void
  onAbrirDetalhe: (doc: NfeDocumento) => void
}

const th = 'px-2 py-1.5 text-[11px] font-semibold text-slate-600 whitespace-nowrap'
const td = 'px-2 py-1.5 text-[11px] whitespace-nowrap'

const GradeNfe: React.FC<GradeNfeProps> = ({
  documentos,
  carregando,
  selecionadas,
  onToggleSelecao,
  onToggleTodos,
  onAbrirDetalhe,
}) => {
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

  return (
    <div className="rounded-md border bg-white overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 hover:bg-slate-50">
            <TableHead className={`${th} w-8`}>
              <Checkbox
                checked={documentos.length > 0 && selecionadas.length === documentos.length}
                onCheckedChange={onToggleTodos}
                aria-label="Selecionar todas"
              />
            </TableHead>
            <TableHead className={th}>Status</TableHead>
            <TableHead className={th}>Empresa</TableHead>
            <TableHead className={th}>NF</TableHead>
            <TableHead className={th}>Série</TableHead>
            <TableHead className={th}>Emissão</TableHead>
            <TableHead className={th}>Fornecedor</TableHead>
            <TableHead className={th}>CNPJ emitente</TableHead>
            <TableHead className={th}>CFOP</TableHead>
            <TableHead className={`${th} text-right`}>Valor (R$)</TableHead>
            <TableHead className={th}>Recebimento</TableHead>
            <TableHead className={th}>Responsável</TableHead>
            <TableHead className={th}>Pedido SAP</TableHead>
            <TableHead className={th}>Divergência</TableHead>
            <TableHead className={th}>Entrada SAP</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {documentos.map((d) => (
            <TableRow
              key={d.id}
              className="cursor-pointer hover:bg-slate-50"
              onClick={() => onAbrirDetalhe(d)}
            >
              <TableCell className={td} onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  checked={selecionadas.includes(d.id)}
                  onCheckedChange={() => onToggleSelecao(d.id)}
                  aria-label={`Selecionar NF ${d.numero}`}
                />
              </TableCell>
              <TableCell className={td}>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${CORES_STATUS_NFE[d.status] ?? 'bg-slate-100 text-slate-600 border-slate-200'}`}
                >
                  {d.status}
                </span>
              </TableCell>
              <TableCell className={td}>{d.empresa}</TableCell>
              <TableCell className={`${td} font-medium text-[#004c97]`}>{d.numero}</TableCell>
              <TableCell className={td}>{d.serie}</TableCell>
              <TableCell className={td}>{formatarDataHoraNfe(d.data_emissao)}</TableCell>
              <TableCell
                className={`${td} max-w-[220px] truncate`}
                title={d.fornecedor_razao_social}
              >
                {d.fornecedor_razao_social}
              </TableCell>
              <TableCell className={td}>{d.fornecedor_cnpj}</TableCell>
              <TableCell className={td}>{d.cfop}</TableCell>
              <TableCell className={`${td} text-right font-medium`}>
                {formatarMoedaNfe(d.valor_total)}
              </TableCell>
              <TableCell className={td}>{formatarDataHoraNfe(d.data_recebimento)}</TableCell>
              <TableCell className={`${td} max-w-[150px] truncate`} title={d.usuario_recebedor}>
                {d.usuario_recebedor}
              </TableCell>
              <TableCell className={td}>{d.pedido_sap}</TableCell>
              <TableCell className={td}>
                {d.tem_divergencia ? (
                  <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                    Sim
                  </Badge>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </TableCell>
              <TableCell className={td}>
                {d.entrada_sap_doc || <span className="text-slate-400">—</span>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default GradeNfe
