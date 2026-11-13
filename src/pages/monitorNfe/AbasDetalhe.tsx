// Abas do detalhe NF-e. A aba "Pedido SAP" lista os vínculos reais NF-e x
// pedido (ETAPA 2) com o banner de modo demonstração; "Pontos de Correção" e
// "Recebimento Físico" permanecem estruturais (Etapas 3–4).
import { useEffect, useState, type ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, PackageCheck, ShoppingCart } from 'lucide-react'
import {
  ROTULO_TIPO_DIVERGENCIA,
  CORES_CORRELACAO,
  type NfeDocumento,
  type NfeVinculoPedido,
  type PontoCorrecao,
} from '@/types/monitorNfe'
import { listarVinculosPedido } from '@/services/monitorNfe'
import { formatarMoedaNfe, formatarDataHoraNfe } from '@/services/monitorNfe'

const rotulo = 'text-[10px] font-semibold text-slate-400 uppercase tracking-wide'
const valor = 'text-xs text-slate-700'

function Campo({ r, v }: { r: string; v: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={rotulo}>{r}</span>
      <span className={valor}>{v || '—'}</span>
    </div>
  )
}

function CabecalhoAba({
  icone,
  titulo,
  descricao,
}: {
  icone: ReactNode
  titulo: string
  descricao: string
}) {
  return (
    <div className="flex items-start gap-2 mb-2">
      <div className="mt-0.5 text-[#004c97]">{icone}</div>
      <div>
        <p className="text-xs font-semibold text-[#004c97]">{titulo}</p>
        <p className="text-[11px] text-slate-500">{descricao}</p>
      </div>
    </div>
  )
}

function EstadoVazio({ texto }: { texto: string }) {
  return (
    <div className="rounded-md border border-dashed bg-slate-50 px-3 py-6 text-center text-[11px] text-slate-400">
      {texto}
    </div>
  )
}

// ---- Aba "Pedido SAP": vínculos reais por item (ETAPA 2) --------------------
export function AbaPedidoSap({ nfe }: { nfe: NfeDocumento }) {
  const [vinculos, setVinculos] = useState<NfeVinculoPedido[]>([])

  useEffect(() => {
    let vivo = true
    listarVinculosPedido(nfe.id).then((r) => vivo && setVinculos(r))
    return () => {
      vivo = false
    }
  }, [nfe.id])

  return (
    <div className="flex flex-col gap-3">
      <CabecalhoAba
        icone={<ShoppingCart className="h-4 w-4" />}
        titulo="Pedido SAP / Correlação compra x NF-e"
        descricao="Vínculos gravados entre os itens desta NF-e e os pedidos de compra SAP (Etapa 2)."
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-md border bg-white p-3">
        <Campo r="Pedido SAP (cabeçalho)" v={nfe.pedido_sap} />
        <Campo r="Código fornecedor (SAP)" v={nfe.fornecedor_codigo} />
        <Campo r="Correlação" v={nfe.correlacao_status ?? 'Pendente'} />
        <Campo r="Divergências" v={nfe.tem_divergencia ? 'Sim' : 'Não'} />
      </div>
      <div className="rounded bg-amber-50 border border-amber-200 px-2 py-1.5 text-[11px] text-amber-700">
        SAP indisponível — dados de demonstração (pedidos simulados; integração real será via
        RFC/BAPI).
      </div>
      {vinculos.length === 0 ? (
        <EstadoVazio texto="Nenhum vínculo gravado para esta NF-e — use “Correlacionar Pedido SAP” na grade para vincular os itens." />
      ) : (
        <div className="rounded-md border bg-white overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-slate-50">
                {[
                  'Item NF',
                  'Pedido',
                  'Item pedido',
                  'Material SAP',
                  'Qtd. vinculada',
                  'Vínculo',
                  'Status',
                  'Origem',
                  'Vinculado em',
                  'Usuário',
                ].map((c) => (
                  <th
                    key={c}
                    className="px-2 py-1.5 text-left font-semibold text-slate-600 whitespace-nowrap"
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vinculos.map((v) => (
                <tr key={v.id} className="border-t hover:bg-slate-50">
                  <td className="px-2 py-1.5">{v.item_nfe}</td>
                  <td className="px-2 py-1.5 font-medium text-[#004c97]">{v.pedido_numero}</td>
                  <td className="px-2 py-1.5">{v.pedido_item}</td>
                  <td className="px-2 py-1.5">{v.material_sap || '—'}</td>
                  <td className="px-2 py-1.5 text-right">{v.quantidade.toLocaleString('pt-BR')}</td>
                  <td className="px-2 py-1.5">
                    <Chip cor={CORES_CORRELACAO[v.tipo_vinculo]}>{v.tipo_vinculo}</Chip>
                  </td>
                  <td className="px-2 py-1.5">{v.status}</td>
                  <td className="px-2 py-1.5">
                    {v.origem === 'sugestao' ? 'Sugestão confirmada' : 'Manual'}
                  </td>
                  <td className="px-2 py-1.5 whitespace-nowrap">
                    {formatarDataHoraNfe(v.created)}
                  </td>
                  <td className="px-2 py-1.5">{v.usuario}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {vinculos.some((v) => v.observacao) && (
        <div className="rounded border bg-slate-50 px-2 py-1.5 text-[10px] text-slate-500">
          {vinculos
            .filter((v) => v.observacao)
            .map((v) => `Item ${v.item_nfe}: ${v.observacao}`)
            .join(' · ')}
        </div>
      )}
    </div>
  )
}

function Chip({ cor, children }: { cor?: string; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-1.5 py-0 text-[9px] font-medium ${cor ?? 'bg-slate-100 text-slate-500 border-slate-200'}`}
    >
      {children}
    </span>
  )
}

// ---- Aba "Pontos de Correção" ----------------------------------------------
export function AbaPontosCorrecao({ nfe, pontos }: { nfe: NfeDocumento; pontos: PontoCorrecao[] }) {
  return (
    <div className="flex flex-col gap-2">
      <CabecalhoAba
        icone={<ClipboardList className="h-4 w-4" />}
        titulo="Pontos de correção"
        descricao="Campos com inconsistência a corrigir antes da entrada SAP (validações da Etapa 3)."
      />
      {pontos.length === 0 ? (
        <EstadoVazio texto="Nenhum ponto de correção pendente para esta NF-e." />
      ) : (
        <div className="rounded-md border bg-white overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="bg-slate-50">
                {['Item', 'Campo', 'Problema', 'Origem'].map((c) => (
                  <th key={c} className="px-2 py-1.5 text-left font-semibold text-slate-600">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pontos.map((p, idx) => (
                <tr key={`${p.campo}-${p.item}-${idx}`} className="border-t hover:bg-slate-50">
                  <td className="px-2 py-1.5">{p.item || '—'}</td>
                  <td className="px-2 py-1.5 font-medium">{p.campo}</td>
                  <td className="px-2 py-1.5">{p.problema}</td>
                  <td className="px-2 py-1.5">
                    <Badge variant="outline" className="text-[10px]">
                      {p.origem}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[10px] text-slate-400">
        Nota: {nfe.numero}/{nfe.serie} — a validação automática de pontos de correção entra na Etapa
        3.
      </p>
    </div>
  )
}

// ---- Aba "Recebimento Físico" ----------------------------------------------
export function AbaRecebimentoFisico({ nfe }: { nfe: NfeDocumento }) {
  return (
    <div className="flex flex-col gap-2">
      <CabecalhoAba
        icone={<PackageCheck className="h-4 w-4" />}
        titulo="Recebimento físico"
        descricao="Conferência física por item (qtd. entregue x recebida x divergência) — operação da Etapa 4."
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-md border bg-white p-3">
        <Campo r="Status do recebimento" v={nfe.recebimento_status ?? 'Pendente'} />
        <Campo r="Data/hora" v={nfe.data_recebimento} />
        <Campo r="Usuário recebedor" v={nfe.usuario_recebedor} />
        <Campo r="Centro" v={nfe.centro} />
      </div>
      <EstadoVazio
        texto={
          nfe.recebimento_status === 'Total'
            ? 'Recebimento físico total confirmado — o detalhamento por item (qtd. entregue x recebida) será exibido na Etapa 4.'
            : 'Nenhum recebimento físico por item registrado — a conferência item a item será habilitada na Etapa 4.'
        }
      />
      {(nfe.recebimento_status ?? 'Pendente') === 'Pendente' && (
        <p className="text-[10px] text-slate-400">
          Use “Acusar Recebimento” para confirmar o recebimento físico desta NF-e.
        </p>
      )}
    </div>
  )
}
