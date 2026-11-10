import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react'
import type {
  NotaFiscalItem,
  NotaFiscalRecord,
  PedidoRelacionadoItem,
  ValidacaoRegra,
} from '@/types/database'

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function formatarData(data?: string): string {
  if (!data) return '-'
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(data)) return data
  const d = new Date(data)
  if (Number.isNaN(d.getTime())) return data
  return d.toLocaleDateString('pt-BR')
}

export function validarGenericas(nota: NotaFiscalRecord): ValidacaoRegra[] {
  const regras: ValidacaoRegra[] = []

  regras.push({
    regra: 'Campos obrigatórios',
    status: nota.numero_nf && nota.serie_nf ? 'OK' : 'ERRO',
    mensagem:
      nota.numero_nf && nota.serie_nf
        ? `NF ${nota.numero_nf} série ${nota.serie_nf} identificada`
        : 'Número/série da NF ausentes',
  })

  regras.push({
    regra: 'Data de emissão',
    status: nota.data_emissao ? 'OK' : 'ERRO',
    mensagem: nota.data_emissao
      ? `Emissão em ${formatarData(nota.data_emissao)}`
      : 'Data de emissão não informada',
  })

  regras.push({
    regra: 'Valor total',
    status: nota.valor_total > 0 ? 'OK' : 'ERRO',
    mensagem: `Total de R$ ${brl(nota.valor_total)} informado na nota`,
  })

  const itens = Array.isArray(nota.itens_json) ? nota.itens_json : []
  if (itens.length === 0) {
    regras.push({
      regra: 'Itens da nota',
      status: 'ERRO',
      mensagem: 'Nenhum item associado à nota fiscal',
    })
  } else {
    regras.push({
      regra: 'Itens da nota',
      status: 'OK',
      mensagem: `${itens.length} item(ns) com material, quantidade, unidade e valor informados`,
    })
    itens.forEach((it) => {
      const esperado = Math.round(it.quantidade_nf * it.valor_unitario * 100) / 100
      if (Math.abs(esperado - it.valor_total) > 0.01) {
        regras.push({
          regra: `Item ${it.item} — valor`,
          status: 'ALERTA',
          mensagem: `Valor do item (R$ ${brl(it.valor_total)}) difere de quantidade × unitário (R$ ${brl(esperado)})`,
        })
      }
    })
  }

  regras.push({
    regra: 'Situação da nota',
    status: nota.status_recebimento === 'aguardando_especificacao' ? 'PENDENTE' : 'OK',
    mensagem:
      nota.status_recebimento === 'aguardando_especificacao'
        ? 'Aguardando especificação funcional — regras fiscais específicas ainda não definidas'
        : `Situação: ${nota.status_recebimento}`,
  })

  return regras
}

const StatusIcon: React.FC<{ status: ValidacaoRegra['status'] }> = ({ status }) => {
  switch (status) {
    case 'OK':
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />
    case 'ALERTA':
      return <AlertTriangle className="h-4 w-4 text-amber-500" />
    case 'ERRO':
      return <XCircle className="h-4 w-4 text-red-600" />
    default:
      return <Clock className="h-4 w-4 text-slate-400" />
  }
}

const badgeClass: Record<ValidacaoRegra['status'], string> = {
  OK: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  ALERTA: 'bg-amber-100 text-amber-800 border-amber-200',
  ERRO: 'bg-red-100 text-red-800 border-red-200',
  PENDENTE: 'bg-slate-100 text-slate-600 border-slate-200',
}

const badgeLabel: Record<ValidacaoRegra['status'], string> = {
  OK: 'OK',
  ALERTA: 'Alerta',
  ERRO: 'Erro',
  PENDENTE: 'Pendente',
}

export function ResultadoTabs({
  nota,
  validacoes,
}: {
  nota: NotaFiscalRecord
  validacoes: ValidacaoRegra[]
}) {
  const itens: NotaFiscalItem[] = Array.isArray(nota.itens_json) ? nota.itens_json : []
  const pedidos: PedidoRelacionadoItem[] = Array.isArray(nota.pedidos_json) ? nota.pedidos_json : []

  return (
    <Tabs defaultValue="cabecalho" className="w-full">
      <TabsList className="flex-wrap h-auto">
        <TabsTrigger value="cabecalho">Cabeçalho</TabsTrigger>
        <TabsTrigger value="itens">Itens ({itens.length})</TabsTrigger>
        <TabsTrigger value="validacao">Validação ({validacoes.length})</TabsTrigger>
        <TabsTrigger value="integracao">Situação da Integração</TabsTrigger>
      </TabsList>

      {/* Cabeçalho */}
      <TabsContent value="cabecalho" className="mt-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
          {[
            ['Número da NF', nota.numero_nf],
            ['Série', nota.serie_nf],
            ['Categoria (simulada)', nota.categoria_nf],
            ['Emissão', formatarData(nota.data_emissao)],
            ['Valor total', `R$ ${brl(nota.valor_total)}`],
            ['Cliente', nota.cliente_nome || '-'],
            ['CNPJ do cliente', nota.cliente_cnpj || '-'],
            ['Fornecedor/Origem', nota.fornecedor_nome || '-'],
            ['Placa do veículo', nota.placa_veiculo || '-'],
            ['Chave de acesso', nota.chave_acesso || '-'],
            ['Status SAP', nota.status_sap_descricao || '-'],
          ].map(([label, value]) => (
            <div key={label} className="rounded border border-slate-200 bg-slate-50 p-2.5">
              <span className="text-slate-400 font-medium block">{label}</span>
              <span className="font-semibold text-slate-800 break-words">{value || '-'}</span>
            </div>
          ))}
        </div>
      </TabsContent>

      {/* Itens */}
      <TabsContent value="itens" className="mt-3">
        <div className="rounded border border-slate-200 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-100">
                <TableHead>Item</TableHead>
                <TableHead>Material</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Unid.</TableHead>
                <TableHead className="text-right">Qtd.</TableHead>
                <TableHead className="text-right">Vlr. Unit.</TableHead>
                <TableHead className="text-right">Vlr. Total</TableHead>
                <TableHead>Lote</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.map((it) => (
                <TableRow key={it.item}>
                  <TableCell className="font-mono">{it.item}</TableCell>
                  <TableCell className="font-mono text-[#004c97] font-semibold">
                    {it.material_codigo}
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate" title={it.material_descricao}>
                    {it.material_descricao}
                  </TableCell>
                  <TableCell>{it.unidade}</TableCell>
                  <TableCell className="text-right">
                    {it.quantidade_nf.toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-right font-mono">{brl(it.valor_unitario)}</TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {brl(it.valor_total)}
                  </TableCell>
                  <TableCell className="font-mono text-[11px]">{it.lote_fornecedor}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </TabsContent>

      {/* Validação */}
      <TabsContent value="validacao" className="mt-3 space-y-2">
        {validacoes.map((v, idx) => (
          <div
            key={`${v.regra}-${idx}`}
            className="flex items-start gap-2.5 rounded border border-slate-200 bg-white p-2.5 text-xs"
          >
            <StatusIcon status={v.status} />
            <div className="flex-1">
              <p className="font-semibold text-slate-800">{v.regra}</p>
              <p className="text-slate-600">{v.mensagem}</p>
            </div>
            <Badge variant="outline" className={`text-[10px] ${badgeClass[v.status]}`}>
              {badgeLabel[v.status]}
            </Badge>
          </div>
        ))}
      </TabsContent>

      {/* Integração */}
      <TabsContent value="integracao" className="mt-3 space-y-2 text-xs">
        <div className="rounded border border-slate-200 bg-slate-50 p-3 space-y-1">
          <p>
            <span className="text-slate-400 font-medium">Canal:</span>{' '}
            <span className="font-semibold text-slate-800">
              {nota.integracao_json?.canal_comunicacao || 'N/D'}
            </span>
          </p>
          <p>
            <span className="text-slate-400 font-medium">Protocolo:</span>{' '}
            <span className="font-mono font-semibold text-slate-800">
              {nota.integracao_json?.protocolo_integracao || 'N/D'}
            </span>
          </p>
          <p>
            <span className="text-slate-400 font-medium">Leitura (simulada):</span>{' '}
            <span className="text-slate-700">
              {nota.integracao_json?.data_leitura_edi || 'N/D'}
            </span>
          </p>
        </div>
        {(nota.integracao_json?.validacao_regras || []).map((v, idx) => (
          <div
            key={`${v.regra}-${idx}`}
            className="flex items-start gap-2.5 rounded border border-slate-200 bg-white p-2.5"
          >
            <StatusIcon status={v.status} />
            <div className="flex-1">
              <p className="font-semibold text-slate-800">{v.regra}</p>
              <p className="text-slate-600">{v.mensagem}</p>
            </div>
            <Badge variant="outline" className={`text-[10px] ${badgeClass[v.status]}`}>
              {badgeLabel[v.status]}
            </Badge>
          </div>
        ))}
        {pedidos.length > 0 && (
          <div className="rounded border border-slate-200 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-100">
                  <TableHead>Pedido</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Material</TableHead>
                  <TableHead className="text-right">Qtd. prevista</TableHead>
                  <TableHead className="text-right">Qtd. atendida</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidos.map((p) => (
                  <TableRow key={`${p.pedido_sap}-${p.item_pedido}`}>
                    <TableCell className="font-mono">{p.pedido_sap}</TableCell>
                    <TableCell className="font-mono">{p.item_pedido}</TableCell>
                    <TableCell className="font-mono">{p.material}</TableCell>
                    <TableCell className="text-right">
                      {p.quantidade_prevista.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.quantidade_recebida.toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>{p.status_pedido}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}
