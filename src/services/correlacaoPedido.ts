//
// Adaptador de pedidos SAP (FCA/RFC-BAPI) — Monitor NF-e, ETAPA 2.
//
// IMPORTANTE (decisão do usuário): a integração FCA (RFC/BAPI no SAP ECC) NÃO
// existe no HUB. Este módulo é o CONTRATO/ADAPTADOR preparado para a RFC futura,
// com as chamadas reais BLOQUEADAS: não há endpoint SAP, não há credenciais e
// NUNCA se simula sucesso de consulta real. Toda a correlação opera em MODO
// DEMONSTRAÇÃO sobre a coleção nfe_pedidos_sap (is_simulated=true, seed 0018).
//
import { pb } from '@/lib/pocketbase/client'
import type {
  CriterioSugestao,
  NfeDocumento,
  NfeItem,
  NfePedidoSap,
  NfeVinculoPedido,
} from '@/types/monitorNfe'

// ---------------------------------------------------------------------------
// Contrato da integração FUTURA (RFC/BAPI) — apenas declaração, sem endpoint.
// Quando a camada RFC existir no backend, a consulta de pedidos passa a
// chamá-la; hoje retorna explicitamente indisponível (nunca simula sucesso).
// ---------------------------------------------------------------------------
export interface ConsultaPedidosSapParams {
  fornecedor_codigo?: string
  material_sap?: string
  pedido_numero?: string
}

export interface ConsultaPedidosSapResultado {
  disponivel: boolean
  motivo: string
  pedidos: NfePedidoSap[]
}

export const SAP_INDISPONIVEL_MOTIVO =
  'Integração SAP (FCA/RFC-BAPI) não configurada no HUB — consulta real BLOQUEADA; dados de demonstração.'

export async function consultarPedidosSap(
  _params: ConsultaPedidosSapParams,
): Promise<ConsultaPedidosSapResultado> {
  return { disponivel: false, motivo: SAP_INDISPONIVEL_MOTIVO, pedidos: [] }
}

// ---------------------------------------------------------------------------
// Sugestões automáticas — prioridade (decisão do usuário):
// 1) Pedido informado no XML  2) Item do pedido informado no XML
// 3) Fornecedor  4) Código do material  5) Quantidade  6) Preço  7) Saldo
// A sugestão NUNCA grava vínculo — exige confirmação do usuário.
// ---------------------------------------------------------------------------
export const AVISO_SALDO = 'Saldo do pedido insuficiente para a quantidade da NF-e.'
export const AVISO_PRECO = 'Preço do pedido difere do valor unitário da NF-e.'

export interface AvaliacaoItemNfe {
  item: NfeItem
  vinculoAtivo?: NfeVinculoPedido
  sugestao?: NfePedidoSap & {
    sugestao: { criterio: CriterioSugestao; prioridade: number; aviso?: string }
  }
  aviso?: string
}

const saldoDisponivel = (p: NfePedidoSap) =>
  Number(p.quantidade_pedida || 0) - Number(p.quantidade_recebida || 0)

function avisosDo(ped: NfePedidoSap, item: NfeItem): string | undefined {
  if (saldoDisponivel(ped) < Number(item.quantidade || 0)) return AVISO_SALDO
  if (Math.abs(Number(ped.preco_unitario || 0) - Number(item.valor_unitario || 0)) > 0.009)
    return AVISO_PRECO
  return undefined
}

export function sugerirPedidoParaItem(
  item: NfeItem,
  doc: Pick<NfeDocumento, 'fornecedor_codigo'>,
  pedidos: NfePedidoSap[],
  vinculoAtivo?: NfeVinculoPedido,
): AvaliacaoItemNfe {
  const abertos = pedidos.filter((p) => p.status_item !== 'Encerrado')

  interface Cand {
    ped: NfePedidoSap
    criterio: CriterioSugestao
    prioridade: number
  }
  const candidatos: Cand[] = []
  const empurra = (ped: NfePedidoSap, criterio: CriterioSugestao, prioridade: number) => {
    if (candidatos.some((c) => c.ped.id === ped.id)) return
    candidatos.push({ ped, criterio, prioridade })
  }

  // 1) Pedido informado no XML + 2) item do pedido informado no XML
  const pedidoXml = String(item.pedido_informado_xml || item.pedido_sap || '').trim()
  if (pedidoXml) {
    const alvo = abertos.filter((p) => p.numero === pedidoXml)
    const itemXml = String(item.item_pedido || item.item_pedido_sap || '').trim()
    const comItem = itemXml ? alvo.find((p) => p.item === itemXml) : undefined
    const escolhido = comItem || alvo[0]
    if (escolhido) {
      empurra(
        escolhido,
        comItem ? 'Item do pedido informado no XML' : 'Pedido informado no XML',
        comItem ? 2 : 1,
      )
    }
  }

  // 3) Fornecedor (código do fornecedor da NF = fornecedor do pedido)
  const codForn = String(doc.fornecedor_codigo || '').trim()
  const porFornecedor = codForn ? abertos.filter((p) => p.fornecedor_codigo === codForn) : []

  // 4) Código do material (código do produto no XML da NF = material SAP)
  const mat = String(item.codigo_produto_fornecedor || '')
    .trim()
    .toUpperCase()
  const porMaterial = mat
    ? abertos.filter((p) => String(p.material_sap || '').toUpperCase() === mat)
    : []

  if (porMaterial.length > 0) {
    // Material igual: se o pedido também é do mesmo fornecedor, melhor ainda.
    const mesmoFornecedor = porMaterial.find((p) => p.fornecedor_codigo === codForn)
    if (mesmoFornecedor) {
      empurra(mesmoFornecedor, 'Material', 4)
    } else {
      empurra(porMaterial[0], 'Material', 4)
    }
  } else if (porFornecedor.length > 0) {
    // 5) Quantidade exata / 6) Preço exato / 7) saldo suficiente — refinam a
    // escolha DENTRO do mesmo fornecedor (não elegem pedido sozinhos).
    const qtd = Number(item.quantidade || 0)
    const porQtd = porFornecedor.filter((p) => Number(p.quantidade_pedida || 0) === qtd)
    const porPreco = porFornecedor.filter(
      (p) => Math.abs(Number(p.preco_unitario || 0) - Number(item.valor_unitario || 0)) <= 0.009,
    )
    const porSaldo = porFornecedor.filter((p) => saldoDisponivel(p) >= qtd)
    const escolhido =
      porQtd.find((p) => porPreco.includes(p)) ||
      porQtd[0] ||
      porPreco.find((p) => porSaldo.includes(p)) ||
      porPreco[0] ||
      porSaldo[0] ||
      porFornecedor[0]
    empurra(escolhido, 'Fornecedor', 3)
  }

  const melhor = candidatos.sort((a, b) => a.prioridade - b.prioridade)[0]
  if (melhor) {
    const aviso = avisosDo(melhor.ped, item)
    return {
      item,
      vinculoAtivo,
      sugestao: {
        ...melhor.ped,
        sugestao: { criterio: melhor.criterio, prioridade: melhor.prioridade, aviso },
      },
      aviso,
    }
  }
  return { item, vinculoAtivo, aviso: 'Nenhum pedido de demonstração compatível encontrado.' }
}

// ---------------------------------------------------------------------------
// Gravação do vínculo definitivo — chama o hook
// /backend/v1/ciafal/nfe/correlacao, que valida, propaga para nfe_itens e
// registra antes/depois em nfe_logs (append-only). O usuário SEMPRE confirma.
// ---------------------------------------------------------------------------
export interface PayloadVinculo {
  nfe_item_id: string
  pedido_numero: string
  pedido_item: string
  origem: 'automatica' | 'manual'
  criterio: string
}

export interface PayloadCorrelacao {
  nfe_id: string
  vinculos: PayloadVinculo[]
  desvincular: string[]
}

export interface ResultadoCorrelacao {
  sucesso: boolean
  mensagem: string
  vinculos_criados: number
  desvinculados: number
  correlacao_status?: string
}

export async function gravarCorrelacao(payload: PayloadCorrelacao): Promise<ResultadoCorrelacao> {
  return pb.send('/backend/v1/ciafal/nfe/correlacao', {
    method: 'POST',
    body: payload as unknown as Record<string, unknown>,
  })
}
