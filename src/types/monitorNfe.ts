// Tipos do Monitor NF-e de Entrada (ENT-09) — Fase 1 (estrutura + demo).
import type { NotaFiscalRecord } from '@/types/database'

export type StatusNfe =
  | 'NF-e Nova'
  | 'Aguardando Recebimento'
  | 'Recebida'
  | 'Aguardando Vinculação SAP'
  | 'Com Divergência'
  | 'Apta para Entrada'
  | 'Entrada SAP Realizada'
  | 'Cancelada'

export const STATUSES_NFE: StatusNfe[] = [
  'NF-e Nova',
  'Aguardando Recebimento',
  'Recebida',
  'Aguardando Vinculação SAP',
  'Com Divergência',
  'Apta para Entrada',
  'Entrada SAP Realizada',
  'Cancelada',
]

// Alias usado pela tela (DashboardCards, grade, filtros).
export const STATUS_NFE = STATUSES_NFE

export type DivergenciaTipo = 'Informativa' | 'Atenção' | 'Bloqueante'

export const ROTULO_TIPO_DIVERGENCIA: Record<DivergenciaTipo, string> = {
  Informativa: 'Informativa',
  Atenção: 'Atenção',
  Bloqueante: 'Bloqueante',
}

// Rótulos e cores por status (grade + detalhe + cards).
export const ROTULO_STATUS: Record<StatusNfe, string> = {
  'NF-e Nova': 'NF-e Nova',
  'Aguardando Recebimento': 'Aguardando Recebimento',
  Recebida: 'Recebida',
  'Aguardando Vinculação SAP': 'Aguardando Vinculação SAP',
  'Com Divergência': 'Com Divergência',
  'Apta para Entrada': 'Apta para Entrada',
  'Entrada SAP Realizada': 'Entrada SAP Realizada',
  Cancelada: 'Cancelada',
}

export const CORES_STATUS_NFE: Record<StatusNfe, string> = {
  'NF-e Nova': 'bg-sky-50 text-sky-700 border-sky-200',
  'Aguardando Recebimento': 'bg-amber-50 text-amber-700 border-amber-200',
  Recebida: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Aguardando Vinculação SAP': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Com Divergência': 'bg-red-50 text-red-700 border-red-200',
  'Apta para Entrada': 'bg-violet-50 text-violet-700 border-violet-200',
  'Entrada SAP Realizada': 'bg-blue-50 text-blue-700 border-blue-200',
  Cancelada: 'bg-slate-100 text-slate-500 border-slate-200',
}

export interface CardStatusNfe {
  status: StatusNfe
  rotulo: string
  cor: string // cor do "bolinha" indicador do card
}

// Os 8 cards do dashboard, na ordem do fluxo HUB.
export const CARD_STATUS_NFE: CardStatusNfe[] = [
  { status: 'NF-e Nova', rotulo: 'NF-e Nova', cor: 'bg-sky-500' },
  { status: 'Aguardando Recebimento', rotulo: 'Aguardando Recebimento', cor: 'bg-amber-500' },
  { status: 'Recebida', rotulo: 'Recebida', cor: 'bg-emerald-500' },
  {
    status: 'Aguardando Vinculação SAP',
    rotulo: 'Aguardando Vinculação SAP',
    cor: 'bg-indigo-500',
  },
  { status: 'Com Divergência', rotulo: 'Com Divergência', cor: 'bg-red-500' },
  { status: 'Apta para Entrada', rotulo: 'Apta para Entrada', cor: 'bg-violet-500' },
  { status: 'Entrada SAP Realizada', rotulo: 'Entrada SAP Realizada', cor: 'bg-blue-500' },
  { status: 'Cancelada', rotulo: 'Cancelada', cor: 'bg-slate-400' },
]

export type CorrelacaoStatus = 'Pendente' | 'Correlacionada' | 'Sem Pedido' | 'Divergente'

export type RecebimentoStatus = 'Pendente' | 'Parcial' | 'Total'

export const CORES_CORRELACAO: Record<CorrelacaoStatus, string> = {
  Pendente: 'bg-amber-50 text-amber-700 border-amber-200',
  Correlacionada: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Sem Pedido': 'bg-slate-100 text-slate-500 border-slate-200',
  Divergente: 'bg-red-50 text-red-700 border-red-200',
}

export const CORES_RECEBIMENTO_STATUS: Record<RecebimentoStatus, string> = {
  Pendente: 'bg-slate-100 text-slate-500 border-slate-200',
  Parcial: 'bg-amber-50 text-amber-700 border-amber-200',
  Total: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

export interface PontoCorrecao {
  campo: string
  item: number
  origem: string
  problema: string
}

export interface NfeDocumento {
  id: string
  empresa: string
  cnpj_destinatario: string
  numero: string
  serie: string
  chave_acesso: string
  data_emissao: string
  fornecedor_razao_social: string
  fornecedor_cnpj: string
  fornecedor_ie: string
  cfop: string
  natureza_operacao: string
  valor_total: number
  valor_produtos: number
  valor_icms: number
  valor_ipi: number
  valor_st: number
  valor_frete: number
  status: StatusNfe
  data_recebimento: string
  usuario_recebedor: string
  centro: string
  local_recebimento: string
  observacoes_recebimento: string
  pedido_sap: string
  entrada_sap_doc: string
  tem_divergencia: boolean
  is_simulated: boolean
  xml_demo: string
  protocolo_autorizacao: string
  data_autorizacao: string
  // Campos novos da Etapa 1 (monitor operacional) — podem ficar vazios.
  filial?: string
  fornecedor_codigo?: string
  uf_emitente?: string
  correlacao_status?: CorrelacaoStatus
  alertas_count?: number
  recebimento_status?: RecebimentoStatus
  pontos_correcao?: PontoCorrecao[]
  created: string
  updated: string
}

export interface NfeItem {
  id: string
  nfe: string
  item: number
  codigo_produto_fornecedor: string
  descricao: string
  ncm: string
  cfop: string
  quantidade: number
  unidade: string
  valor_unitario: number
  valor_total: number
  pedido_informado_xml: string
  item_pedido: string
  // Campos novos da Etapa 1 (por item) — podem ficar vazios.
  filial?: string
  recebimento_status?: RecebimentoStatus
  pedido_sap?: string
  item_pedido_sap?: string
  quantidade_recebida?: number
}

export interface NfeRecebimento {
  id: string
  nfe: string
  empresa: string
  numero: string
  serie: string
  fornecedor: string
  data_recebimento: string
  hora_recebimento: string
  usuario_recebedor: string
  centro: string
  local_recebimento: string
  observacoes: string
  recebimento_fisico_confirmado: boolean
  is_simulated: boolean
}

export interface NfeDivergencia {
  id: string
  nfe: string
  tipo: DivergenciaTipo
  descricao: string
  origem: string
  data_deteccao: string
}

export interface NfeEntradaSap {
  id: string
  nfe: string
  numero_documento: string
  data_entrada: string
  usuario: string
  centro: string
  observacoes: string
  is_simulated: boolean
}

export interface NfeLog {
  id: string
  usuario: string
  empresa: string
  acao: string
  nfe_numero: string
  nfe_chave_acesso: string
  status_anterior: string
  status_novo: string
  mensagem: string
  detalhes_json: string
  created: string
}

export interface NfePedidoSap {
  id: string
  numero: string
  item: string
  fornecedor_codigo: string
  fornecedor_nome: string
  material_sap: string
  material_descricao: string
  quantidade_pedida: number
  quantidade_recebida: number
  unidade: string
  preco_unitario: number
  centro: string
  deposito: string
  status_item: string
  data_pedido: string
  is_simulated: boolean
}

export type OrigemVinculo = 'automatica' | 'manual'

export interface NfeVinculoPedido {
  id: string
  nfe: string
  nfe_item: string
  nfe_numero: string
  item_numero: number
  pedido_numero: string
  pedido_item: string
  material_sap: string
  quantidade_vinculada: number
  origem: OrigemVinculo
  criterio: string
  usuario: string
  vinculado: boolean
  is_simulated: boolean
  created: string
}

export type CriterioSugestao =
  | 'Pedido informado no XML'
  | 'Item do pedido informado no XML'
  | 'Fornecedor'
  | 'Material'
  | 'Quantidade'
  | 'Preço'
  | 'Saldo do pedido'

export interface SugestaoCorrelacao {
  criterio: CriterioSugestao
  prioridade: number
  aviso?: string // divergência observada na sugestão (ex.: preço/saldo)
}

export interface NfeSyncState {
  id: string
  servico: string
  ultima_sincronizacao: string
  ultimo_status: string
  ultima_mensagem: string
  total_tentativas: number
  total_erros: number
  updated?: string
}

export interface NfeConfig {
  id: string
  chave: string
  ambiente: string
  certificado_presente: boolean
  descricao: string
}

// ---- Resultado do serviço de sincronização SEFAZ (backend) ----------------

export interface ResultadoSyncSefaz {
  bloqueado: boolean
  motivo: string
  pendencia: string
  total_documentos: number
  nova_sincronizacao: string
}

// ---- Payload de acusação de recebimento -----------------------------------

export interface DadosRecebimento {
  empresa: string
  numero: string
  serie: string
  fornecedor: string
  data_recebimento: string // yyyy-mm-dd
  hora_recebimento: string // HH:mm
  usuario_recebedor: string
  centro: string
  local_recebimento: string
  observacoes: string
  recebimento_fisico_confirmado: boolean
}

// Reuso dos validadores genéricos de notas do projeto (validarGenericas).
export type { NotaFiscalRecord }
