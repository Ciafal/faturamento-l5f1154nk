export interface NotaFiscalItem {
  item: string
  material_codigo: string
  material_descricao: string
  ncm: string
  cfop: string
  unidade: string
  quantidade_nf: number
  valor_unitario: number
  valor_total: number
  lote_fornecedor: string
  deposito_destino: string
  status_item: string
}

export interface PedidoRelacionadoItem {
  pedido_sap: string
  item_pedido: string
  tipo_pedido: string
  material: string
  quantidade_prevista: number
  quantidade_recebida: number
  saldo: number
  unidade: string
  centro: string
  status_pedido: string
}

export interface ValidacaoRegra {
  regra: string
  status: 'OK' | 'ALERTA' | 'ERRO' | 'PENDENTE'
  mensagem: string
}

export interface IntegracaoDetalhes {
  interface_edi: string
  canal_comunicacao: string
  data_leitura_edi: string
  protocolo_integracao: string
  validacao_regras: ValidacaoRegra[]
}

export interface NotaFiscalRecord {
  id: string
  process_type: 'produto_acabado' | 'sucata_carepa_argola'
  numero_nf: string
  serie_nf: string
  fornecedor_codigo: string
  fornecedor_nome: string
  fornecedor_cnpj?: string
  cliente_codigo?: string
  cliente_nome?: string
  cliente_cnpj?: string
  categoria_nf: string
  data_emissao: string
  valor_total: number
  placa_veiculo?: string
  chave_acesso?: string
  status_recebimento:
    | 'nao_concluido'
    | 'fisico_concluido_pendente_fiscal'
    | 'concluido'
    | 'erro_integracao'
  status_sap_codigo: string
  status_sap_descricao: string
  doc_sap_migo?: string
  doc_sap_miro?: string
  itens_json: NotaFiscalItem[]
  pedidos_json: PedidoRelacionadoItem[]
  integracao_json: IntegracaoDetalhes
  is_simulated: boolean
  created?: string
  updated?: string
}

export interface HistoricoProcessamentoRecord {
  id: string
  user_id?: string
  user_email: string
  user_nome: string
  empresa: string
  processo_id: string
  processo_nome: string
  tipo_operacao: 'entrada' | 'saida'
  numero_nf: string
  serie_nf: string
  fornecedor?: string
  cliente?: string
  status_anterior?: string
  status_posterior?: string
  resultado: 'sucesso' | 'pendente' | 'erro' | 'ja_processado'
  documento_sap?: string
  mensagens: string
  detalhes_json?: Record<string, unknown>
  created?: string
  updated?: string
}

export interface ParametroModuloRecord {
  id: string
  chave: string
  categoria: string
  descricao?: string
  valor_json: unknown
}

export type PapelUsuario =
  | 'consultor'
  | 'operador_recebimento'
  | 'operador_saida'
  | 'reprocessador'
  | 'auditor'
  | 'administrador'

export interface UsuarioAutenticado {
  id: string
  email: string
  name: string
  role: PapelUsuario
  company: string
}
