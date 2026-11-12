// Abas estruturais novas do detalhe NF-e (ETAPA 1) — conteúdo mínimo honesto:
// as abas "Pedido SAP", "Pontos de Correção" e "Recebimento Físico" serão
// preenchidas nas Etapas 2–4; aqui apenas estruturam o estado atual real.
import type { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { ClipboardList, PackageCheck, ShoppingCart } from 'lucide-react'
import { ROTULO_TIPO_DIVERGENCIA, type NfeDocumento, type PontoCorrecao } from '@/types/monitorNfe'

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

// ---- Aba "Pedido SAP" ------------------------------------------------------
export function AbaPedidoSap({ nfe }: { nfe: NfeDocumento }) {
  return (
    <div className="flex flex-col gap-3">
      <CabecalhoAba
        icone={<ShoppingCart className="h-4 w-4" />}
        titulo="Pedido SAP / Correlação compra x NF-e"
        descricao="Vinculação entre os itens da NF-e e os pedidos de compra SAP (correlação automática — Etapa 2)."
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-md border bg-white p-3">
        <Campo r="Pedido SAP (cabeçalho)" v={nfe.pedido_sap} />
        <Campo r="Código fornecedor (SAP)" v={nfe.fornecedor_codigo} />
        <Campo r="Correlação" v={nfe.correlacao_status ?? 'Pendente'} />
        <Campo r="Divergências" v={nfe.tem_divergencia ? 'Sim' : 'Não'} />
      </div>
      <EstadoVazio
        texto={
          nfe.pedido_sap
            ? 'Detalhamento dos itens do pedido SAP (posição, saldo, valor) será exibido na Etapa 2 — Correlação automática.'
            : 'Nenhum pedido SAP vinculado a esta NF-e ainda — a correlação compra x NF-e será executada na Etapa 2.'
        }
      />
    </div>
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
