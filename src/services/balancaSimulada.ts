// Adaptador da balança do processo Faturamento Ciafal (referências SAP: BUSCAR_PESO,
// CAPTURA_BALANCA_IP_SAP, PESOBRUTO, CALCULAR_RESUMO — código ABAP não fornecido).
//
// A leitura real da balança deve ocorrer por um adaptador no backend (nunca direto
// pelo navegador). Sem essa integração, o modo de demonstração abaixo gera um peso
// CLARAMENTE IDENTIFICADO como simulado — nunca apresentado como captura de
// equipamento real. A produção permanece bloqueada (PRODUCAO_BLOQUEADA).

import type { ResultadoLeituraBalanca, AdaptadorBalanca } from '@/services/balancaFaturamento'
import { MENSAGENS_ERRO_BALANCA } from '@/services/balancaFaturamento'

export type ErroBalanca =
  | 'FALHA_COMUNICACAO'
  | 'TEMPO_EXCEDIDO'
  | 'PESO_NAO_IDENTIFICADO'
  | 'BALANCA_INSTAVEL'
  | 'RETORNO_INCONSISTENTE'
  | 'PRODUCAO_BLOQUEADA'

export const MODO_BALANCA: 'simulado' | 'real' = 'simulado'

/** Gera um peso bruto de demonstração, claramente identificado como simulado. */
export function gerarPesoSimulado(numeroTransporte: string): number {
  let h = 0
  for (let i = 0; i < numeroTransporte.length; i++) {
    h = (h * 31 + numeroTransporte.charCodeAt(i)) % 100000
  }
  // 30,000–39,995 kg, variação estável por transporte (determinística).
  const kg = 30000 + (h % 1000) * 10
  return Math.round(kg) / 1000
}

/** Adaptador do MODO DE DEMONSTRAÇÃO: peso simulado, nunca apresentado como real. */
export const adaptadorBalancaSimulado: AdaptadorBalanca = {
  async lerPesoBruto(numeroTransporte: string): Promise<ResultadoLeituraBalanca> {
    // Pequena latência para representar a leitura (nunca encenando hardware real).
    await new Promise((r) => setTimeout(r, 500))
    const pesoT = gerarPesoSimulado(numeroTransporte)
    return {
      ok: true,
      leitura: { pesoBrutoT: pesoT, lidoEm: new Date().toISOString(), modo: 'simulado' },
    }
  },
}

/** Adaptador de produção: bloqueado até homologação da integração (CAPTURA_BALANCA_IP_SAP). */
export const adaptadorBalancaProducao: AdaptadorBalanca = {
  async lerPesoBruto(): Promise<ResultadoLeituraBalanca> {
    return {
      ok: false,
      erro: 'PRODUCAO_BLOQUEADA',
      mensagem:
        'A captura real da balança (CAPTURA_BALANCA_IP_SAP) permanece bloqueada até a homologação da integração.',
    }
  },
}

export { MENSAGENS_ERRO_BALANCA }
