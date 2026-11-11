export interface ProcessItem {
  id: string
  route: string
  codigo: string
  titulo: string
  tipo: 'entrada' | 'saida'
  descricao: string
  statusImplementacao: 'funcional_demonstracao' | 'aguardando_especificacao'
  categoriaSap?: string
  iconeNome: string
}

export const PROCESSOS_ENTRADAS: ProcessItem[] = [
  {
    id: 'edi-subcontratacao-pa',
    route: '/processos/entradas/edi-subcontratacao-pa',
    codigo: 'ENT-01',
    titulo: 'EDI – Lançamento NF Subcontratação (Produto Acabado)',
    tipo: 'entrada',
    descricao:
      'Recepção de NF-e via EDI para recebimento físico (MIGO) e contábil/fiscal de produtos acabados industrializados por terceiros.',
    statusImplementacao: 'funcional_demonstracao',
    categoriaSap: 'E1',
    iconeNome: 'PackageCheck',
  },
  {
    id: 'edi-subcontratacao-sucata',
    route: '/processos/entradas/edi-subcontratacao-sucata',
    codigo: 'ENT-02',
    titulo: 'EDI – Lançamento NF Subcontratação (Argola/Sucata/Carepa)',
    tipo: 'entrada',
    descricao:
      'Recepção e tratamento de retorno físico e fiscal de subprodutos, retalhos, argolas, sucatas e carepas gerados em industrialização externa.',
    statusImplementacao: 'funcional_demonstracao',
    categoriaSap: 'E3',
    iconeNome: 'Recycle',
  },
  {
    id: 'entrada-compras-mercadoria',
    route: '/processos/entradas/compras-mercadoria',
    codigo: 'ENT-03',
    titulo: 'Entrada de Compras de Matéria-Prima e Mercadorias',
    tipo: 'entrada',
    descricao:
      'Conferência física de portaria, pesagem, batimento de pedido de compras (PO) e escrituração fiscal standard.',
    statusImplementacao: 'aguardando_especificacao',
    categoriaSap: 'E0',
    iconeNome: 'Truck',
  },
  {
    id: 'entrada-retorno-beneficiamento',
    route: '/processos/entradas/retorno-beneficiamento',
    codigo: 'ENT-04',
    titulo: 'Entrada de Retorno Simbólico / Beneficiamento',
    tipo: 'entrada',
    descricao:
      'Controle de saldo em poder de terceiros, baixa de insumos (movimento 543) e retorno simbólico de ordens de serviço.',
    statusImplementacao: 'aguardando_especificacao',
    categoriaSap: 'E2',
    iconeNome: 'ArrowLeftRight',
  },
  {
    id: 'entrada-transferencia-filiais',
    route: '/processos/entradas/transferencia-filiais',
    codigo: 'ENT-05',
    titulo: 'Entrada de Transferência entre Centros e Filiais',
    tipo: 'entrada',
    descricao:
      'Recepção de remessas com movimento 862/861 entre Matriz 0100 e Filiais Industriais com reconciliação em trânsito.',
    statusImplementacao: 'aguardando_especificacao',
    categoriaSap: 'E4',
    iconeNome: 'Building2',
  },
  {
    id: 'entrada-devolucao-cliente',
    route: '/processos/entradas/devolucao-cliente',
    codigo: 'ENT-06',
    titulo: 'Entrada por Devolução de Mercadoria de Clientes',
    tipo: 'entrada',
    descricao:
      'Inspeção de qualidade (QM), estorno de faturamento original e reentrada no estoque expedível.',
    statusImplementacao: 'aguardando_especificacao',
    categoriaSap: 'E5',
    iconeNome: 'RotateCcw',
  },
  {
    id: 'entrada-servicos-diversos',
    route: '/processos/entradas/servicos-diversos',
    codigo: 'ENT-07',
    titulo: 'Entrada de Notas de Serviços e Fretes (CT-e / NFS-e)',
    tipo: 'entrada',
    descricao:
      'Apropriação de custos de transporte rodoviário, conferência de fretes e lançamento de faturas de terceiros.',
    statusImplementacao: 'aguardando_especificacao',
    categoriaSap: 'E6',
    iconeNome: 'FileText',
  },
  {
    id: 'entrada-recebimento-ks',
    route: '/processos/entradas/recebimento-ks',
    codigo: 'ENT-08',
    titulo: 'Recebimento KS',
    tipo: 'entrada',
    descricao:
      'Conferência de Lotes e Pesagem — KS: batimento de blocos/lotes coletados x RFID e pesagem na balança, em modo demonstração.',
    statusImplementacao: 'funcional_demonstracao',
    categoriaSap: 'E7',
    iconeNome: 'PackageCheck',
  },
]

export const PROCESSOS_SAIDAS: ProcessItem[] = [
  {
    id: 'saida-faturamento-vendas',
    route: '/processos/saidas/faturamento-vendas',
    codigo: 'SAI-01',
    titulo: 'Faturamento Ciafal',
    tipo: 'saida',
    descricao:
      'Faturamento de saída Ciafal (SD): emissão de NF-e a partir de ordens de venda — estrutura navegável em modo demonstração, aguardando especificação funcional.',
    statusImplementacao: 'funcional_demonstracao',
    categoriaSap: 'S0',
    iconeNome: 'ShoppingBag',
  },
  {
    id: 'saida-envio-tarugos-sucata',
    route: '/processos/saidas/envio-tarugos-sucata',
    codigo: 'SAI-02',
    titulo: 'Envio Tarugos e Sucata para SDC',
    tipo: 'saida',
    descricao:
      'Envio de tarugos de aço e sucata (carepa, argola) para a SDC — consulta de NF em modo demonstração, aguardando especificação funcional.',
    statusImplementacao: 'funcional_demonstracao',
    categoriaSap: 'S1',
    iconeNome: 'Send',
  },
  {
    id: 'saida-envio-ks',
    route: '/processos/saidas/envio-ks',
    codigo: 'SAI-03',
    titulo: 'Envio para KS',
    tipo: 'saida',
    descricao:
      'Envio de material para a KS — consulta de NF em modo demonstração, aguardando especificação funcional.',
    statusImplementacao: 'funcional_demonstracao',
    categoriaSap: 'S3',
    iconeNome: 'PackageOpen',
  },
  {
    id: 'saida-venda-sucatas-subprodutos',
    route: '/processos/saidas/venda-sucatas',
    codigo: 'SAI-04',
    titulo: 'Faturamento de Venda de Sucatas e Subprodutos',
    descricao:
      'Faturamento de lotes de carepa, retalhos e argolas com pesagem integrada e regras de diferimento de ICMS.',
    statusImplementacao: 'aguardando_especificacao',
    categoriaSap: 'S3',
    iconeNome: 'Boxes',
    tipo: 'saida',
  },
  {
    id: 'saida-transferencia-filiais',
    route: '/processos/saidas/transferencia-filiais',
    codigo: 'SAI-05',
    titulo: 'Transferência para Armazenagem Ferradura',
    tipo: 'saida',
    descricao:
      'Geração de NF de transferência entre centros Ciafal (0100 -> 0200/0300) com destaque tributário e controle de frete.',
    statusImplementacao: 'aguardando_especificacao',
    categoriaSap: 'S4',
    iconeNome: 'Share2',
  },
  {
    id: 'saida-devolucao-fornecedor',
    route: '/processos/saidas/devolucao-fornecedor',
    codigo: 'SAI-06',
    titulo: 'Saída por Devolução de Mercadorias / Insumos a Fornecedores',
    tipo: 'saida',
    descricao:
      'Emissão de NF-e de devolução com estorno de crédito tributário e compensação de duplicata com fornecedor.',
    statusImplementacao: 'aguardando_especificacao',
    categoriaSap: 'S5',
    iconeNome: 'Undo2',
  },
  {
    id: 'saida-remessa-conserto-demonstracao',
    route: '/processos/saidas/remessa-conserto',
    codigo: 'SAI-07',
    titulo: 'Remessa para Conserto',
    tipo: 'saida',
    descricao:
      'Operações não comerciais com prazo de retorno fiscal, controle patrimonial e emissão de guias de acompanhamento.',
    statusImplementacao: 'aguardando_especificacao',
    categoriaSap: 'S6',
    iconeNome: 'Wrench',
  },
  {
    id: 'saida-faturamento-servicos',
    route: '/processos/saidas/faturamento-servicos',
    codigo: 'SAI-08',
    titulo: 'Faturamento de Prestação de Serviços Industriais e Locações',
    tipo: 'saida',
    descricao:
      'Emissão de NFS-e municipal ou NF-e conjugada com incidência de ISS e retenções tributárias federais.',
    statusImplementacao: 'aguardando_especificacao',
    categoriaSap: 'S7',
    iconeNome: 'BadgePercent',
  },
  {
    id: 'saida-amostra-gratis',
    route: '/processos/saidas/amostra-gratis',
    codigo: 'SAI-09',
    titulo: 'Amostra Grátis para Clientes',
    tipo: 'saida',
    descricao:
      'Remessa gratuita de amostras para clientes, com controle fiscal da saída sem fato gerador de ICMS/IPI e prazo de avaliação.',
    statusImplementacao: 'funcional_demonstracao',
    categoriaSap: 'S8',
    iconeNome: 'Gift',
  },
]

export const TODOS_PROCESSOS: ProcessItem[] = [...PROCESSOS_ENTRADAS, ...PROCESSOS_SAIDAS]

export function obterProcessoPorId(id: string): ProcessItem | undefined {
  return TODOS_PROCESSOS.find((p) => p.id === id)
}
