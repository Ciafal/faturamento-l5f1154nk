// Serviço do Monitor NF-e de Entrada (ENT-09) — Fase 1 (estrutura + demo).
// Sem ONTAX/Pontual, sem scraping fiscal, sem chamada real à SEFAZ/SAP:
// a sincronização vai ao hook pb_hooks/nfeSyncSefaz.pb.js, que registra a
// pendência de certificado digital A1/credenciais SEFAZ e retorna bloqueado.
import pb from '@/lib/pocketbase/client'
import type {
  DadosRecebimento,
  NfeConfig,
  NfeDivergencia,
  NfeDocumento,
  NfeEntradaSap,
  NfeItem,
  NfeLog,
  NfeRecebimento,
  NfeSyncState,
  ResultadoSyncSefaz,
} from '@/types/monitorNfe'

export const COLECAO_NFE_DOCS = 'nfe_documentos'
export const COLECAO_NFE_ITENS = 'nfe_itens'
export const COLECAO_NFE_RECEB = 'nfe_recebimentos'
export const COLECAO_NFE_DIV = 'nfe_divergencias'
export const COLECAO_NFE_ENTSAP = 'nfe_entrada_sap'
export const COLECAO_NFE_LOGS = 'nfe_logs'
export const COLECAO_NFE_SYNC = 'nfe_sync_state'
export const COLECAO_NFE_CONFIG = 'nfe_config'

// ---------------------------------------------------------------------------
// Consultas
// ---------------------------------------------------------------------------

export async function listarNfeDocumentos(): Promise<NfeDocumento[]> {
  try {
    const recs = await pb.collection(COLECAO_NFE_DOCS).getFullList({
      sort: '-data_emissao',
    })
    return recs as unknown as NfeDocumento[]
  } catch {
    // Backend indisponível (ex.: migração ainda não aplicada): tela segue
    // vazia — nada é simulado no front.
    return []
  }
}

export async function listarNfeItens(nfeId: string): Promise<NfeItem[]> {
  try {
    const recs = await pb.collection(COLECAO_NFE_ITENS).getFullList({
      filter: `nfe = "${nfeId}"`,
      sort: 'item',
    })
    return recs as unknown as NfeItem[]
  } catch {
    return []
  }
}

export async function listarNfeDivergencias(nfeId: string): Promise<NfeDivergencia[]> {
  try {
    const recs = await pb.collection(COLECAO_NFE_DIV).getFullList({
      filter: `nfe = "${nfeId}"`,
      sort: 'data_deteccao',
    })
    return recs as unknown as NfeDivergencia[]
  } catch {
    return []
  }
}

export async function listarNfeEntradaSap(nfeId: string): Promise<NfeEntradaSap[]> {
  try {
    const recs = await pb.collection(COLECAO_NFE_ENTSAP).getFullList({
      filter: `nfe = "${nfeId}"`,
      sort: '-data_entrada',
    })
    return recs as unknown as NfeEntradaSap[]
  } catch {
    return []
  }
}

export async function listarNfeLogs(nfeNumero: string): Promise<NfeLog[]> {
  try {
    const recs = await pb.collection(COLECAO_NFE_LOGS).getFullList({
      filter: `nfe_numero = "${nfeNumero}"`,
      sort: '-created',
    })
    return recs as unknown as NfeLog[]
  } catch {
    return []
  }
}

export async function listarNfeRecebimentos(nfeId: string): Promise<NfeRecebimento[]> {
  try {
    const recs = await pb.collection(COLECAO_NFE_RECEB).getFullList({
      filter: `nfe = "${nfeId}"`,
      sort: '-created',
    })
    return recs as unknown as NfeRecebimento[]
  } catch {
    return []
  }
}

export async function buscarNfeSyncState(servico = 'sefaz'): Promise<NfeSyncState | null> {
  try {
    const recs = await pb.collection(COLECAO_NFE_SYNC).getList(1, 1, {
      filter: `servico = "${servico}"`,
    })
    return (recs.items[0] as unknown as NfeSyncState) ?? null
  } catch {
    return null
  }
}

export async function buscarNfeConfig(chave = 'sefaz'): Promise<NfeConfig | null> {
  try {
    const recs = await pb.collection(COLECAO_NFE_CONFIG).getList(1, 1, {
      filter: `chave = "${chave}"`,
    })
    return (recs.items[0] as unknown as NfeConfig) ?? null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Sincronização SEFAZ (Fase 1: bloqueada por falta de certificado digital A1)
// ---------------------------------------------------------------------------

export async function sincronizarSefaz(usuario: string): Promise<ResultadoSyncSefaz> {
  try {
    return (await pb.send('/backend/v1/ciafal/nfe/sync-sefaz', {
      method: 'POST',
      body: JSON.stringify({ usuario }),
    })) as ResultadoSyncSefaz
  } catch (err: unknown) {
    const msg =
      err && typeof err === 'object' && 'message' in err
        ? String((err as { message?: unknown }).message)
        : String(err)
    return {
      bloqueado: true,
      motivo: `Falha ao acionar o serviço de sincronização: ${msg}`,
      pendencia: 'Verificar disponibilidade do serviço de integração no backend.',
      total_documentos: 0,
      nova_sincronizacao: '',
    }
  }
}

// ---------------------------------------------------------------------------
// Acusar recebimento (sem manifestação à SEFAZ; sem lançamento SAP)
// ---------------------------------------------------------------------------

export async function acusarRecebimentoNfe(
  nfe: NfeDocumento,
  dados: DadosRecebimento,
): Promise<NfeDocumento> {
  // 1. Atualiza o documento (status → Recebida + dados de recebimento)
  const docAtualizado = (await pb.collection(COLECAO_NFE_DOCS).update(nfe.id, {
    status: 'Recebida',
    data_recebimento: `${dados.data_recebimento} ${dados.hora_recebimento}:00.000Z`,
    usuario_recebedor: dados.usuario_recebedor,
    centro: dados.centro,
    local_recebimento: dados.local_recebimento,
    observacoes_recebimento: dados.observacoes,
  })) as unknown as NfeDocumento

  // 2. Grava em nfe_recebimentos (histórico/auditoria de recebimento)
  await pb.collection(COLECAO_NFE_RECEB).create({
    nfe: nfe.id,
    empresa: dados.empresa,
    numero: dados.numero,
    serie: dados.serie,
    fornecedor: dados.fornecedor,
    data_recebimento: `${dados.data_recebimento} ${dados.hora_recebimento}:00.000Z`,
    hora_recebimento: dados.hora_recebimento,
    usuario_recebedor: dados.usuario_recebedor,
    centro: dados.centro,
    local_recebimento: dados.local_recebimento,
    observacoes: dados.observacoes,
    recebimento_fisico_confirmado: dados.recebimento_fisico_confirmado,
    is_simulated: nfe.is_simulated,
  })

  // 3. Log de auditoria (append-only) — status anterior → novo
  await pb.collection(COLECAO_NFE_LOGS).create({
    usuario: dados.usuario_recebedor,
    empresa: dados.empresa,
    acao: 'ACUSAR_RECEBIMENTO',
    nfe_numero: nfe.numero,
    nfe_chave_acesso: nfe.chave_acesso,
    status_anterior: nfe.status,
    status_novo: 'Recebida',
    mensagem: `Recebimento acusado por ${dados.usuario_recebedor} em ${dados.data_recebimento} ${dados.hora_recebimento} — ${dados.centro} / ${dados.local_recebimento}. Sem manifestação à SEFAZ; sem lançamento SAP.`,
    detalhes_json: JSON.stringify({
      is_simulated: nfe.is_simulated,
      recebimento_fisico_confirmado: dados.recebimento_fisico_confirmado,
    }),
  })

  return docAtualizado
}

// ---------------------------------------------------------------------------
// Formatação (fuso America/Sao_Paulo, 24h)
// ---------------------------------------------------------------------------

const TZ = 'America/Sao_Paulo'

export function formatarDataHoraNfe(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const data = d.toLocaleDateString('pt-BR', { timeZone: TZ })
  const hora = d.toLocaleTimeString('pt-BR', { timeZone: TZ, hour12: false })
  return `${data} ${hora}`
}

export function formatarDataNfe(iso?: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  return d.toLocaleDateString('pt-BR', { timeZone: TZ })
}

export function formatarMoedaNfe(valor?: number | null): string {
  if (valor === null || valor === undefined || isNaN(valor)) return ''
  return valor.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}
