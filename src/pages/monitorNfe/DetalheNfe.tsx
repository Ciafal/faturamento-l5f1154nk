// Detalhe da NF-e — Dialog com 7 abas:
//   1. Dados Gerais (infos do XML) | 2. Itens | 3. Recebimento |
//   4. Pedido SAP/FCA | 5. Divergências | 6. Documentos (XML) | 7. Histórico
import React, { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ClipboardCheck, FileText, X } from 'lucide-react'
import {
  formatarDataHoraNfe,
  formatarMoedaNfe,
  listarNfeDivergencias,
  listarNfeEntradaSap,
  listarNfeItens,
  listarNfeLogs,
} from '@/services/monitorNfe'
import {
  CORES_STATUS_NFE,
  ROTULO_TIPO_DIVERGENCIA,
  type NfeDivergencia,
  type NfeDocumento,
  type NfeEntradaSap,
  type NfeItem,
  type NfeLog,
} from '@/types/monitorNfe'

interface DetalheNfeProps {
  nfe: NfeDocumento | null
  onClose: () => void
  onAcusarRecebimento: () => void
}

const rotulo = 'text-[10px] font-semibold text-slate-400 uppercase tracking-wide'
const valor = 'text-xs text-slate-700'

function Campo({ r, v, strong }: { r: string; v: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className={rotulo}>{r}</span>
      <span className={`${valor} ${strong ? 'font-semibold text-[#004c97]' : ''}`}>{v || '—'}</span>
    </div>
  )
}

const DetalheNfe: React.FC<DetalheNfeProps> = ({ nfe, onClose, onAcusarRecebimento }) => {
  const [itens, setItens] = useState<NfeItem[]>([])
  const [divergencias, setDivergencias] = useState<NfeDivergencia[]>([])
  const [entradasSap, setEntradasSap] = useState<NfeEntradaSap[]>([])
  const [logs, setLogs] = useState<NfeLog[]>([])

  useEffect(() => {
    if (!nfe) {
      setItens([])
      setDivergencias([])
      setEntradasSap([])
      setLogs([])
      return
    }
    let vivo = true
    listarNfeItens(nfe.id).then((r) => vivo && setItens(r))
    listarNfeDivergencias(nfe.id).then((r) => vivo && setDivergencias(r))
    listarNfeEntradaSap(nfe.id).then((r) => vivo && setEntradasSap(r))
    listarNfeLogs(nfe.numero).then((r) => vivo && setLogs(r))
    return () => {
      vivo = false
    }
  }, [nfe])

  if (!nfe) return null

  const podeReceber = nfe.status === 'NF-e Nova' || nfe.status === 'Aguardando Recebimento'

  return (
    <Dialog open={!!nfe} onOpenChange={(aberto) => !aberto && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <div className="flex items-start justify-between gap-2 pr-6">
            <div>
              <DialogTitle className="text-base text-[#004c97]">
                NF-e {nfe.numero}/{nfe.serie} — {nfe.fornecedor_razao_social}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Chave de acesso: {nfe.chave_acesso}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${CORES_STATUS_NFE[nfe.status] ?? ''}`}
              >
                {nfe.status}
              </span>
              {nfe.is_simulated && (
                <Badge
                  variant="outline"
                  className="text-[10px] border-amber-300 text-amber-700 bg-amber-50"
                >
                  DEMO
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs defaultValue="dados-gerais" className="w-full flex-1 overflow-hidden flex flex-col">
          <TabsList className="h-9 bg-slate-100 p-0.5 rounded-md w-fit flex-wrap">
            <TabsTrigger
              value="dados-gerais"
              className="text-xs px-3 data-[state=active]:bg-[#004c97] data-[state=active]:text-white"
            >
              Dados Gerais
            </TabsTrigger>
            <TabsTrigger
              value="itens"
              className="text-xs px-3 data-[state=active]:bg-[#004c97] data-[state=active]:text-white"
            >
              Itens
            </TabsTrigger>
            <TabsTrigger
              value="recebimento"
              className="text-xs px-3 data-[state=active]:bg-[#004c97] data-[state=active]:text-white"
            >
              Recebimento
            </TabsTrigger>
            <TabsTrigger
              value="pedido-sap"
              className="text-xs px-3 data-[state=active]:bg-[#004c97] data-[state=active]:text-white"
            >
              Pedido SAP/FCA
            </TabsTrigger>
            <TabsTrigger
              value="divergencias"
              className="text-xs px-3 data-[state=active]:bg-[#004c97] data-[state=active]:text-white"
            >
              Divergências
            </TabsTrigger>
            <TabsTrigger
              value="documentos"
              className="text-xs px-3 data-[state=active]:bg-[#004c97] data-[state=active]:text-white"
            >
              Documentos
            </TabsTrigger>
            <TabsTrigger
              value="historico"
              className="text-xs px-3 data-[state=active]:bg-[#004c97] data-[state=active]:text-white"
            >
              Histórico
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto mt-3">
            {/* ---- 1. Dados Gerais ---- */}
            <TabsContent value="dados-gerais" className="mt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 rounded-md border bg-white p-3">
                <Campo r="Número" v={nfe.numero} />
                <Campo r="Série" v={nfe.serie} />
                <Campo r="Emissão" v={formatarDataHoraNfe(nfe.data_emissao)} />
                <Campo r="Autorização" v={formatarDataHoraNfe(nfe.data_autorizacao)} />
                <Campo r="Protocolo" v={nfe.protocolo_autorizacao} />
                <Campo r="Natureza da operação" v={nfe.natureza_operacao} />
                <Campo r="Fornecedor" v={nfe.fornecedor_razao_social} />
                <Campo r="CNPJ emitente" v={nfe.fornecedor_cnpj} />
                <Campo r="Inscrição estadual" v={nfe.fornecedor_ie} />
                <Campo r="CNPJ destinatário" v={nfe.cnpj_destinatario} />
                <Campo r="Empresa" v={nfe.empresa} />
                <Campo r="CFOP" v={nfe.cfop} />
                <Campo r="Valor produtos" v={`R$ ${formatarMoedaNfe(nfe.valor_produtos)}`} />
                <Campo r="ICMS" v={`R$ ${formatarMoedaNfe(nfe.valor_icms)}`} />
                <Campo r="IPI" v={`R$ ${formatarMoedaNfe(nfe.valor_ipi)}`} />
                <Campo r="Substituição tributária" v={`R$ ${formatarMoedaNfe(nfe.valor_st)}`} />
                <Campo r="Frete" v={`R$ ${formatarMoedaNfe(nfe.valor_frete)}`} />
                <Campo
                  r="Valor total da nota"
                  v={`R$ ${formatarMoedaNfe(nfe.valor_total)}`}
                  strong
                />
                <div className="col-span-2 md:col-span-4">
                  <div className="rounded bg-amber-50 border border-amber-200 px-2 py-1.5 text-[11px] text-amber-700">
                    Dados de demonstração (XML simulado) — não provenientes da SEFAZ.
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ---- 2. Itens ---- */}
            <TabsContent value="itens" className="mt-0">
              <div className="rounded-md border bg-white overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-slate-50">
                      {[
                        'Item',
                        'Cód. prod. fornecedor',
                        'Descrição',
                        'NCM',
                        'CFOP',
                        'Qtd.',
                        'Un.',
                        'Preço unit.',
                        'Valor total',
                        'Pedido informado',
                        'Item pedido',
                      ].map((c) => (
                        <th
                          key={c}
                          className="px-2 py-1.5 text-left font-semibold text-slate-600 whitespace-nowrap"
                        >
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {itens.length === 0 && (
                      <tr>
                        <td colSpan={11} className="px-2 py-4 text-center text-slate-400">
                          Nenhum item cadastrado.
                        </td>
                      </tr>
                    )}
                    {itens.map((i) => (
                      <tr key={i.id} className="border-t hover:bg-slate-50">
                        <td className="px-2 py-1.5">{i.item}</td>
                        <td className="px-2 py-1.5">{i.codigo_produto_fornecedor}</td>
                        <td className="px-2 py-1.5 max-w-[220px] truncate" title={i.descricao}>
                          {i.descricao}
                        </td>
                        <td className="px-2 py-1.5">{i.ncm}</td>
                        <td className="px-2 py-1.5">{i.cfop}</td>
                        <td className="px-2 py-1.5 text-right">
                          {i.quantidade.toLocaleString('pt-BR')}
                        </td>
                        <td className="px-2 py-1.5">{i.unidade}</td>
                        <td className="px-2 py-1.5 text-right">
                          {formatarMoedaNfe(i.valor_unitario)}
                        </td>
                        <td className="px-2 py-1.5 text-right font-medium">
                          {formatarMoedaNfe(i.valor_total)}
                        </td>
                        <td className="px-2 py-1.5">{i.pedido_informado_xml}</td>
                        <td className="px-2 py-1.5">{i.item_pedido}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* ---- 3. Recebimento ---- */}
            <TabsContent value="recebimento" className="mt-0">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 rounded-md border bg-white p-3">
                <Campo r="Data/hora do recebimento" v={formatarDataHoraNfe(nfe.data_recebimento)} />
                <Campo r="Usuário recebedor" v={nfe.usuario_recebedor} />
                <Campo r="Centro" v={nfe.centro} />
                <Campo r="Local de recebimento" v={nfe.local_recebimento} />
                <Campo r="Observações" v={nfe.observacoes_recebimento} />
                <Campo
                  r="Manifestação à SEFAZ"
                  v="Não enviada (funcionalidade futura independente)"
                />
              </div>
            </TabsContent>

            {/* ---- 4. Pedido SAP/FCA ---- */}
            <TabsContent value="pedido-sap" className="mt-0">
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 rounded-md border bg-white p-3">
                  <Campo r="Pedido SAP" v={nfe.pedido_sap} />
                  <Campo r="Entrada SAP (nº documento)" v={nfe.entrada_sap_doc} />
                  <Campo
                    r="Status de vinculação"
                    v={nfe.pedido_sap ? 'Vinculada' : 'Aguardando vinculação SAP'}
                  />
                </div>
                <div className="rounded-md border bg-white overflow-x-auto">
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="bg-slate-50">
                        {['Nº documento', 'Data', 'Usuário', 'Centro', 'Observações'].map((c) => (
                          <th
                            key={c}
                            className="px-2 py-1.5 text-left font-semibold text-slate-600"
                          >
                            {c}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {entradasSap.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-2 py-4 text-center text-slate-400">
                            Nenhum documento de entrada SAP registrado.
                          </td>
                        </tr>
                      )}
                      {entradasSap.map((e) => (
                        <tr key={e.id} className="border-t hover:bg-slate-50">
                          <td className="px-2 py-1.5 font-medium">{e.numero_documento}</td>
                          <td className="px-2 py-1.5">{formatarDataHoraNfe(e.data_entrada)}</td>
                          <td className="px-2 py-1.5">{e.usuario}</td>
                          <td className="px-2 py-1.5">{e.centro}</td>
                          <td className="px-2 py-1.5">{e.observacoes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {entradasSap.some((e) => e.is_simulated) && (
                    <div className="border-t bg-amber-50 px-2 py-1.5 text-[11px] text-amber-700">
                      Documento de entrada SAP simulado (demo) — nenhum lançamento real no SAP ECC.
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ---- 5. Divergências ---- */}
            <TabsContent value="divergencias" className="mt-0">
              <div className="rounded-md border bg-white overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-slate-50">
                      {['Classificação', 'Descrição', 'Origem', 'Detectada em'].map((c) => (
                        <th key={c} className="px-2 py-1.5 text-left font-semibold text-slate-600">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {divergencias.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-2 py-4 text-center text-slate-400">
                          Nenhuma divergência registrada para esta NF-e.
                        </td>
                      </tr>
                    )}
                    {divergencias.map((dv) => (
                      <tr key={dv.id} className="border-t hover:bg-slate-50">
                        <td className="px-2 py-1.5">
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${
                              dv.tipo === 'Bloqueante'
                                ? 'border-red-300 text-red-700 bg-red-50'
                                : dv.tipo === 'Atenção'
                                  ? 'border-amber-300 text-amber-700 bg-amber-50'
                                  : 'border-sky-300 text-sky-700 bg-sky-50'
                            }`}
                          >
                            {ROTULO_TIPO_DIVERGENCIA[dv.tipo] ?? dv.tipo}
                          </Badge>
                        </td>
                        <td className="px-2 py-1.5">{dv.descricao}</td>
                        <td className="px-2 py-1.5">{dv.origem}</td>
                        <td className="px-2 py-1.5">{formatarDataHoraNfe(dv.data_deteccao)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            {/* ---- 6. Documentos ---- */}
            <TabsContent value="documentos" className="mt-0">
              <div className="rounded-md border bg-white p-3 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-xs text-slate-700">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span className="font-medium">XML original da NF-e</span>
                  {nfe.is_simulated && (
                    <Badge
                      variant="outline"
                      className="text-[10px] border-amber-300 text-amber-700 bg-amber-50"
                    >
                      XML de demonstração
                    </Badge>
                  )}
                </div>
                <pre className="text-[10px] leading-relaxed bg-slate-900 text-slate-100 rounded-md p-3 overflow-x-auto max-h-72 whitespace-pre-wrap">
                  {nfe.xml_demo}
                </pre>
              </div>
            </TabsContent>

            {/* ---- 7. Histórico ---- */}
            <TabsContent value="historico" className="mt-0">
              <div className="rounded-md border bg-white overflow-x-auto">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-slate-50">
                      {[
                        'Data/hora',
                        'Usuário',
                        'Ação',
                        'Status anterior',
                        'Status novo',
                        'Mensagem',
                      ].map((c) => (
                        <th key={c} className="px-2 py-1.5 text-left font-semibold text-slate-600">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {logs.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-2 py-4 text-center text-slate-400">
                          Nenhum evento registrado.
                        </td>
                      </tr>
                    )}
                    {logs.map((l) => (
                      <tr key={l.id} className="border-t hover:bg-slate-50">
                        <td className="px-2 py-1.5 whitespace-nowrap">
                          {formatarDataHoraNfe(l.created)}
                        </td>
                        <td className="px-2 py-1.5">{l.usuario}</td>
                        <td className="px-2 py-1.5 font-medium">{l.acao}</td>
                        <td className="px-2 py-1.5">{l.status_anterior || '—'}</td>
                        <td className="px-2 py-1.5">{l.status_novo || '—'}</td>
                        <td className="px-2 py-1.5 max-w-[280px] truncate" title={l.mensagem}>
                          {l.mensagem}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="pt-2 border-t flex items-center justify-between sm:justify-between">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <X className="h-3 w-3" />
            Feche para voltar à grade
          </div>
          <div className="flex items-center gap-2">
            {podeReceber && (
              <Button
                size="sm"
                onClick={onAcusarRecebimento}
                className="bg-[#004c97] hover:bg-[#003a75] text-white text-xs h-8"
              >
                <ClipboardCheck className="h-3.5 w-3.5 mr-1" />
                ACUSAR RECEBIMENTO
              </Button>
            )}
            <Button variant="outline" size="sm" className="text-xs h-8" onClick={onClose}>
              Fechar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default DetalheNfe
