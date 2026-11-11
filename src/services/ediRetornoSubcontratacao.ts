/**
 * Dados de demonstração (SIMULADOS) da grid "Relação de NF de Retorno de
 * Subcontratação" — tela EDI Lançamento NF Subcontratação (Produto Acabado).
 *
 * Cenário: produto acabado fabricado na subcontratada, devolvido à Ciafal.
 * Cada linha é um item de NF de retorno, com a correlação para o pedido de
 * compra Ciafal e o CFOP parametrizável da entrada.
 *
 * Correlação item NF → pedido Ciafal: é identificada pelo MATERIAL. Quando a
 * mesma NF tem mais de um item com o mesmo material, o ITEM DA NF é usado
 * para casar com o item do pedido (a grid mostra o material dos dois lados).
 */
export interface LinhaRetornoSimulada {
  id: string
  dataEmissao: string // DD/MM/AAAA
  numeroNf: string
  serieNf: string
  codigoMaterial: string
  materialDescricao: string
  itemNf: string
  lote: string
  pedidoCiafal: string | null
  itemPedido: string | null
  cfop: string
  statusCorrelacao: 'correlacionado' | 'pendente' | 'sem_pedido' | 'divergencia'
  observacoes: string
}

export const GRID_RETORNO_PRODUTO_ACABADO: LinhaRetornoSimulada[] = [
  {
    id: 'ret-pa-001',
    dataEmissao: '10/03/2025',
    numeroNf: '000128450',
    serieNf: '1',
    codigoMaterial: 'PA-TUBO-ESTR-80',
    materialDescricao: 'TUBO ESTRUTURAL RETANGULAR 80X40',
    itemNf: '00010',
    lote: 'LT-PA-2025-001',
    pedidoCiafal: '4500891234',
    itemPedido: '00010',
    cfop: '5102',
    statusCorrelacao: 'correlacionado',
    observacoes:
      'Item da NF correlacionado ao pedido de compra 4500891234. Material, lote e quantidade conferem.',
  },
  {
    id: 'ret-pa-002',
    dataEmissao: '10/03/2025',
    numeroNf: '000128450',
    serieNf: '1',
    codigoMaterial: 'PA-TUBO-ESTR-80',
    materialDescricao: 'TUBO ESTRUTURAL RETANGULAR 80X40',
    itemNf: '00020',
    lote: 'LT-PA-2025-002',
    pedidoCiafal: '4500891234',
    itemPedido: '00010',
    cfop: '5102',
    statusCorrelacao: 'divergencia',
    observacoes:
      'Divergência de item/lote: item da NF 00020 não corresponde ao item 00010 do pedido 4500891234. Validar a remessa.',
  },
  {
    id: 'ret-pa-003',
    dataEmissao: '12/03/2025',
    numeroNf: '000128451',
    serieNf: '1',
    codigoMaterial: 'PA-TUBO-ESTR-80',
    materialDescricao: 'TUBO ESTRUTURAL RETANGULAR 80X40',
    itemNf: '00010',
    lote: 'LT-PA-2025-003',
    pedidoCiafal: '4500891299',
    itemPedido: '00020',
    cfop: '5101',
    statusCorrelacao: 'correlacionado',
    observacoes:
      'Correlação encontrada entre o item da NF e o item do pedido de compra. Sem pendências.',
  },
  {
    id: 'ret-pa-004',
    dataEmissao: '12/03/2025',
    numeroNf: '000128451',
    serieNf: '1',
    codigoMaterial: 'PA-CHAPA-FRIOA-2MM',
    materialDescricao: 'CHAPA DE AÇO FRIA 2.00MM',
    itemNf: '00020',
    lote: 'LT-PA-2025-004',
    pedidoCiafal: null,
    itemPedido: null,
    cfop: '5949',
    statusCorrelacao: 'sem_pedido',
    observacoes:
      'Nenhum pedido de compra Ciafal encontrado para o material/lote. Vincular pedido antes de processar a entrada.',
  },
  {
    id: 'ret-pa-005',
    dataEmissao: '13/03/2025',
    numeroNf: '000128452',
    serieNf: '2',
    codigoMaterial: 'PA-PERFIL-U-100',
    materialDescricao: 'PERFIL U ENRIJECIDO 100MM',
    itemNf: '00010',
    lote: 'LT-PA-2025-005',
    pedidoCiafal: '4500891302',
    itemPedido: '00010',
    cfop: '5102',
    statusCorrelacao: 'pendente',
    observacoes:
      'Correlação pendente: pedido indicado no retorno da subcontratada ainda não confirmado no EDI. Aguardando confirmação.',
  },
  {
    id: 'ret-pa-006',
    dataEmissao: '13/03/2025',
    numeroNf: '000128452',
    serieNf: '2',
    codigoMaterial: 'PA-PERFIL-U-100',
    materialDescricao: 'PERFIL U ENRIJECIDO 100MM',
    itemNf: '00020',
    lote: 'LT-PA-2025-006',
    pedidoCiafal: null,
    itemPedido: null,
    cfop: '5102',
    statusCorrelacao: 'sem_pedido',
    observacoes:
      'Sem pedido de compra vinculado. NF de retorno aguardando parametrização do pedido na Ciafal.',
  },
  {
    id: 'ret-pa-007',
    dataEmissao: '13/03/2025',
    numeroNf: '000128453',
    serieNf: '1',
    codigoMaterial: 'PA-ARAME-GALV-03',
    materialDescricao: 'ARAME RECOZIDO GALVANIZADO 3.00MM',
    itemNf: '00010',
    lote: 'LT-PA-2025-007',
    pedidoCiafal: '4500889912',
    itemPedido: '00010',
    cfop: '5102',
    statusCorrelacao: 'correlacionado',
    observacoes:
      'Item da NF correlacionado ao pedido de compra 4500889912. Material, lote e quantidade conferem.',
  },
]
