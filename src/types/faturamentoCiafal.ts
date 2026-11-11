// Tipos do processo SAI-01 "Faturamento Ciafal" (baseado no programa SAP SAPMZSD076).
// Especificação funcional parcial: as regras de status/priorização vêm do ABAP ainda não fornecido.

export interface LoteFaturamento {
  remessa: string
  item: string
  versao: string
  material: string
  denominacao: string
  lote_coletado: string
  /** Peso coletado do lote, em toneladas */
  peso_coletado: number
  lote_rfid: string
  quantidade_rfid: number
  /** Status do lote (ex.: "Lote OK", "Saldo estoque", "Saldo remessa", "Excesso peso") */
  status_lote: string
  rfid: string
}

export interface TransporteFaturamentoRecord {
  id: string
  process_type: 'faturamento_ciafal'
  /** Número do transporte — referência VTTK-TKNUM */
  tknum: string
  placa_veiculo: string
  /** DD/MM/AAAA */
  data_processamento: string
  /** HH:MM:SS */
  hora_processamento: string
  status_picking: string
  /** Toneladas */
  peso_bruto: number
  /** Toneladas */
  tara: number
  /** Toneladas */
  peso_coletado: number
  /** Toneladas */
  peso_rfid: number
  lotes_json: LoteFaturamento[]
  is_simulated: boolean
  created: string
  updated: string
}

/** Transporte carregado na tela (pode ter o peso bruto atualizado pela balança). */
export interface TransporteCarregado {
  tknum: string
  placa_veiculo: string
  data_processamento: string
  hora_processamento: string
  status_picking: string
  peso_bruto: number
  tara: number
  peso_coletado: number
  peso_rfid: number
  lotes: LoteFaturamento[]
  is_simulated: boolean
  /** ISO — data/hora da última leitura da balança (null enquanto não houver leitura real) */
  ultima_leitura_balanca: string | null
}

export interface PesosTransporte {
  pesoBruto: number
  tara: number
  pesoColetado: number
  pesoLoteRfid: number
  /** Peso Líquido Balança = Peso Bruto − Tara */
  pesoLiquidoBalanca: number
  /** Diferença de Peso (t) = Peso Líquido Balança − Peso Coletado */
  diferencaPesoT: number
  /** Diferença de Peso (%) = Diferença de Peso / Peso Coletado × 100; null quando Peso Coletado = 0 */
  diferencaPesoPct: number | null
  /** Campo interno (NÃO exibido como Peso Líquido Balança) — regra provisória, pendente do ABAP */
  pesoLiquidoCalculado: number
}

export type ToneStatusLote = 'verde' | 'amarelo' | 'vermelho' | 'cinza'
