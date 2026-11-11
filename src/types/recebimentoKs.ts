// Tipos do processo ENT-08 "Recebimento KS" — Conferência de Lotes e Pesagem.

export interface LoteRecebimentoKs {
  bloco: string
  item: string
  versao: string
  material: string
  denominacao: string
  letra: string
  lote_coletado: string
  peso_coletado: number
  lote_rfid: string
  quantidade_rfid: number
  peso_rfid: number
  status_lote: string
  rfid: string
}

export interface PesosRecebimentoKs {
  pesoBruto: number
  tara: number
  pesoColetado: number
  pesoLotesRfid: number
  pesoLiquidoBalanca: number
  diferencaPesoT: number
  diferencaPesoPct: number
}
