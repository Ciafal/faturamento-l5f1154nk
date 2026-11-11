// Processo SAI-01 "Faturamento Ciafal" — tela SAPMZSD076 "Lotes Coletados X Lotes Faturados".
// Rota: /processos/saidas/faturamento-vendas

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { registrarHistoricoProcessamento } from '@/services/faturamento'
import {
  carregarTransporte,
  listarTransportesDemo,
  MENSAGEM_TRANSPORTE_NAO_ENCONTRADO,
  type EtapaCarregamento,
} from '@/services/transportesFaturamento'
import { adaptadorBalancaSimulado } from '@/services/balancaSimulada'
import { MENSAGENS_ERRO_BALANCA } from '@/services/balancaFaturamento'
import {
  calcularPesos,
  formatarToneladas,
  formatarPercentual,
  tonalidadeStatusLote,
  haDivergenciaRfid,
  loteInconsistente,
} from '@/lib/faturamentoCiafal/calculos'
import type {
  TransporteCarregado,
  TransporteFaturamentoRecord,
  PesosTransporte,
} from '@/types/faturamentoCiafal'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Search, Scale, Play, Loader2, ShoppingBag, Lock } from 'lucide-react'
import PainelSuperior from './faturamentoCiafal/PainelSuperior'
import TabelaLotes from './faturamentoCiafal/TabelaLotes'
import DialogExecutar from './faturamentoCiafal/DialogExecutar'

const CODIGO_PROCESSO = 'saida-faturamento-vendas'
const NOME_PROCESSO = 'Faturamento Ciafal'

const FUNCIONALIDADES = [
  {
    rotulo: 'Interface implementada',
    classe: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  { rotulo: 'Simulação funcional', classe: 'bg-blue-100 text-blue-800 border-blue-200' },
  { rotulo: 'Integração pendente', classe: 'bg-amber-100 text-amber-800 border-amber-200' },
  { rotulo: 'Homologado', classe: 'bg-slate-100 text-slate-500 border-slate-200' },
]

const FaturamentoCiafalForm: React.FC = () => {
  const { user, empresaSelecionada } = useAuth()

  const [numeroTransporte, setNumeroTransporte] = useState('')
  const [sugestoes, setSugestoes] = useState<TransporteFaturamentoRecord[]>([])
  const [transporte, setTransporte] = useState<TransporteCarregado | null>(null)
  const [etapas, setEtapas] = useState<EtapaCarregamento[]>([])
  const [isCarregando, setIsCarregando] = useState(false)
  const [isBuscandoPeso, setIsBuscandoPeso] = useState(false)
  const [pesoBrutoLido, setPesoBrutoLido] = useState<number | null>(null)
  const [ultimaLeituraBalanca, setUltimaLeituraBalanca] = useState<string | null>(null)
  const [dialogExecutarOpen, setDialogExecutarOpen] = useState(false)

  useEffect(() => {
    listarTransportesDemo().then(setSugestoes)
  }, [])

  const registrarNoHistorico = useCallback(
    async (resultado: 'sucesso' | 'pendente' | 'erro', mensagem: string) => {
      try {
        await registrarHistoricoProcessamento({
          user_email: user?.email || 'anonimo@ciafal.com.br',
          user_nome: user?.name || 'Usuário Ciafal',
          empresa: empresaSelecionada.razaoSocial,
          processo_id: CODIGO_PROCESSO,
          processo_nome: NOME_PROCESSO,
          tipo_operacao: 'saida',
          numero_nf: '-',
          serie_nf: '-',
          cliente: '',
          resultado,
          documento_sap: '',
          mensagens: mensagem,
          detalhes_json: { modo: 'demonstracao', tela: 'SAPMZSD076' },
        })
      } catch (e) {
        console.warn('Falha ao registrar histórico (modo demonstração):', e)
      }
    },
    [user, empresaSelecionada],
  )

  // Cálculo do resumo (CALCULAR_RESUMO) — sempre a partir do estado atual.
  const pesos: PesosTransporte | null = useMemo(() => {
    if (!transporte) return null
    const bruto = pesoBrutoLido ?? transporte.peso_bruto
    return calcularPesos(bruto, transporte.tara, transporte.peso_coletado, transporte.peso_rfid)
  }, [transporte, pesoBrutoLido])

  const inconsistencias = useMemo(
    () => (transporte ? transporte.lotes.filter(loteInconsistente).length : 0),
    [transporte],
  )

  // BOTÃO "Buscar Lotes" (F_LOAD_TRANSPORTE + F_LER_DADOS_RFID2)
  const handleBuscarLotes = async () => {
    setIsCarregando(true)
    try {
      const res = await carregarTransporte(numeroTransporte)
      if ('erro' in res) {
        setTransporte(null)
        setEtapas([])
        if (res.erro === 'NAO_ENCONTRADO') {
          toast({
            title: 'Transporte não encontrado',
            description: MENSAGEM_TRANSPORTE_NAO_ENCONTRADO,
            variant: 'destructive',
          })
        } else if (res.erro === 'CAMPO_OBRIGATORIO') {
          toast({
            title: 'Informe o Nº Transporte',
            description: 'Digite o número do transporte para buscar os lotes.',
            variant: 'destructive',
          })
        } else if (res.erro === 'FORMATO_INVALIDO') {
          toast({
            title: 'Número inválido',
            description:
              'O Nº Transporte deve conter apenas dígitos (até 10 posições, VTTK-TKNUM).',
            variant: 'destructive',
          })
        } else {
          toast({
            title: 'Falha na consulta',
            description: 'Erro ao consultar o transporte. Tente novamente.',
            variant: 'destructive',
          })
        }
        return
      }
      setTransporte(res.transporte)
      setEtapas(res.etapas)
      setPesoBrutoLido(null)
      setUltimaLeituraBalanca(null)
      const divergencias = res.transporte.lotes.filter(haDivergenciaRfid).length
      const pendencias = res.transporte.lotes.filter((l) => {
        const tom = tonalidadeStatusLote(l.status_lote)
        return tom === 'amarelo'
      }).length
      toast({
        title: 'Lotes carregados (demonstração)',
        description: `${res.transporte.lotes.length} lote(s) — ${divergencias} divergência(s) RFID, ${pendencias} pendência(s) de saldo.`,
        variant: divergencias > 0 ? 'destructive' : 'default',
      })
      await registrarNoHistorico(
        divergencias > 0 ? 'erro' : 'sucesso',
        `Buscar Lotes (demo): transporte ${res.transporte.tknum} — ${res.transporte.lotes.length} lote(s), ${divergencias} divergência(s) RFID.`,
      )
    } finally {
      setIsCarregando(false)
    }
  }

  // BOTÃO "Buscar Peso" (BUSCAR_PESO + CAPTURA_BALANCA_IP_SAP + CALCULAR_RESUMO)
  const handleBuscarPeso = async () => {
    if (!transporte) {
      toast({
        title: 'Carregue um transporte primeiro',
        description: 'Use "Buscar Lotes" antes de solicitar a leitura da balança.',
        variant: 'destructive',
      })
      return
    }
    setIsBuscandoPeso(true)
    // Modo demonstração: peso SIMULADO, claramente identificado. A captura real
    // (CAPTURA_BALANCA_IP_SAP) aconteceria no backend e permanece bloqueada.
    const resultado = await adaptadorBalancaSimulado.lerPesoBruto(transporte.tknum)
    setIsBuscandoPeso(false)

    if (resultado.ok === false) {
      const msgFalha = MENSAGENS_ERRO_BALANCA[resultado.erro]
      toast({
        title: 'Falha na leitura da balança',
        description: msgFalha,
        variant: 'destructive',
      })
      await registrarNoHistorico('erro', `Buscar Peso: ${msgFalha}`)
      return
    }
    const leitura = resultado.leitura

    setPesoBrutoLido(leitura.pesoBrutoT)
    setUltimaLeituraBalanca(leitura.lidoEm)
    const novos = calcularPesos(
      leitura.pesoBrutoT,
      transporte.tara,
      transporte.peso_coletado,
      transporte.peso_rfid,
    )
    toast({
      title: 'Peso lido (simulado)',
      description: `Peso bruto ${formatarToneladas(novos.pesoBruto)} t · Líquido ${formatarToneladas(novos.pesoLiquidoBalanca)} t · Diferença ${formatarToneladas(novos.diferencaPesoT)} t (${formatarPercentual(novos.diferencaPesoPct)}%).`,
    })
    await registrarNoHistorico(
      'pendente',
      `Buscar Peso (simulado): bruto ${formatarToneladas(novos.pesoBruto)} t, diferença ${formatarToneladas(novos.diferencaPesoT)} t.`,
    )
  }

  // BOTÃO "Executar" (EXEC_VT02N, EXEC_ZSDR050, F_UPDATE_DB, WAITING_NF_APROVE)
  const handleExecutar = () => {
    if (!transporte || !pesos) {
      toast({
        title: 'Nada para executar',
        description: 'Carregue um transporte com "Buscar Lotes" antes de executar.',
        variant: 'destructive',
      })
      return
    }
    setDialogExecutarOpen(true)
  }

  return (
    <div className="w-full space-y-3">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded bg-blue-100 text-[#004c97]">
            <ShoppingBag className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
              Faturamento Ciafal
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Lotes Coletados X Lotes Faturados · Processo SAI-01 · Grupo Saídas · HUB CIAFAL |
              FATURAMENTO
            </p>
          </div>
        </div>
        {/* Badges de funcionalidades (discretos, sem bloquear a página) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {FUNCIONALIDADES.map((f) => (
            <Badge
              key={f.rotulo}
              variant="outline"
              className={'text-[10px] font-medium ' + f.classe}
            >
              {f.rotulo}
            </Badge>
          ))}
        </div>
      </div>

      {/* Painel superior compacto */}
      <PainelSuperior
        numeroTransporte={numeroTransporte}
        onNumeroTransporteChange={setNumeroTransporte}
        sugestoes={sugestoes}
        transporte={transporte}
        pesos={pesos}
        isCarregando={isCarregando}
        ultimaLeituraBalanca={ultimaLeituraBalanca}
      />

      {/* Barra de ações */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          disabled={isCarregando}
          onClick={handleBuscarLotes}
          className="bg-[#004c97] hover:bg-blue-900 text-white font-semibold text-xs gap-1.5 shadow"
        >
          {isCarregando ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
          <span>Buscar Lotes</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isBuscandoPeso}
          onClick={handleBuscarPeso}
          className="text-xs gap-1.5 border-[#004c97] text-[#004c97] hover:bg-blue-50"
        >
          {isBuscandoPeso ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Scale className="h-3.5 w-3.5" />
          )}
          <span>Buscar Peso</span>
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={handleExecutar}
          className="text-xs gap-1.5 border-emerald-600 text-emerald-700 hover:bg-emerald-50"
        >
          <Play className="h-3.5 w-3.5" />
          <span>Executar</span>
        </Button>
        <span className="ml-auto flex items-center gap-1 text-[10px] text-slate-400">
          <Lock className="h-3 w-3" />
          Lançamento real bloqueado até homologação das integrações (SAP/RFID/balança)
        </span>
      </div>

      {/* Etapas do carregamento (F_LOAD_TRANSPORTE) */}
      {etapas.length > 0 && (
        <div className="rounded-md border border-slate-200 bg-white px-3 py-2 flex flex-wrap gap-x-4 gap-y-1">
          {etapas.map((e) => (
            <span key={e.id} className="text-[10px] text-slate-500 flex items-center gap-1">
              <span
                className={
                  'h-1.5 w-1.5 rounded-full ' +
                  (e.status === 'ok'
                    ? 'bg-emerald-500'
                    : e.status === 'erro'
                      ? 'bg-red-500'
                      : 'bg-slate-300')
                }
              />
              {e.descricao}
            </span>
          ))}
        </div>
      )}

      {/* Tabela principal */}
      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="pb-2 border-b border-slate-100">
          <CardTitle className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Lotes do transporte {transporte ? `· ${transporte.tknum}` : ''}
          </CardTitle>
          <CardDescription className="text-xs">
            {transporte
              ? `${transporte.lotes.length} lote(s) · ${inconsistencias} com inconsistência(s) · ${transporte.is_simulated ? 'dados de demonstração' : 'dados do transporte'}`
              : 'Informe o Nº Transporte e clique em "Buscar Lotes".'}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-3">
          {transporte ? (
            <TabelaLotes lotes={transporte.lotes} />
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">
              Nenhum transporte carregado. Transportes de demonstração: 0800012345, 0800012346 e
              0800012347.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Diálogo Executar */}
      {transporte && pesos && (
        <DialogExecutar
          open={dialogExecutarOpen}
          onOpenChange={setDialogExecutarOpen}
          transporte={transporte}
          pesos={pesos}
          qtdLotes={transporte.lotes.length}
          qtdInconsistencias={inconsistencias}
          onRegistrarHistorico={registrarNoHistorico}
        />
      )}
    </div>
  )
}

export default FaturamentoCiafalForm
