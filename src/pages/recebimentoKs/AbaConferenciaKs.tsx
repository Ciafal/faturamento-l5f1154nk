// Aba 2 "Conferência e Recebimento" do processo ENT-08 — conteúdo da tela
// original de Recebimento KS mantido EXATAMENTE como estava (Nº Envio, Placa,
// data/hora, status de picking, pesos, Observações, botões Buscar Lotes /
// Buscar Peso / Executar / Limpar e grid de 12 colunas), agora recebendo um
// envio pré-carregado a partir da Aba 1 e suportando MODO CONSULTA (envio
// Recebido: sem novo processamento sem autorização).

import React, { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Scale, RefreshCw, Search, Lock, Loader2, Play, EyeOff } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import { registrarHistoricoProcessamento } from '@/services/faturamento'
import { PainelSuperiorKs } from './PainelSuperiorKs'
import TabelaLotesKs from './TabelaLotesKs'
import DialogExecutarKs from './DialogExecutarKs'
import {
  buscarEnvioKsPorNumero,
  MENSAGEM_ENVIO_NAO_ENCONTRADO,
  STATUS_RECEBIDO,
  type EnvioRecebimentoKs,
} from '@/services/recebimentoKs'
import { calcularPesosKs, eInconsistenteKs } from '@/lib/recebimentoKs/calculos'
import type { LoteRecebimentoKs, PesosRecebimentoKs } from '@/types/recebimentoKs'

interface AbaConferenciaKsProps {
  /** Envio selecionado na Aba 1 (abre com dados carregados). */
  envioSelecionado: EnvioRecebimentoKs | null
  /** true quando o envio veio da Aba 1 com status Recebido. */
  modoConsulta: boolean
  /** Notifica o pai quando o usuário limpa o envio selecionado. */
  onLimparSelecao: () => void
}

const PESOS_ZERADOS: PesosRecebimentoKs = {
  pesoBruto: 0,
  tara: 0,
  pesoColetado: 0,
  pesoLotesRfid: 0,
  pesoLiquidoBalanca: 0,
  diferencaPesoT: 0,
  diferencaPesoPct: 0,
}

const AbaConferenciaKs: React.FC<AbaConferenciaKsProps> = ({
  envioSelecionado,
  modoConsulta,
  onLimparSelecao,
}) => {
  const { user, empresaSelecionada } = useAuth()

  const [numeroEnvio, setNumeroEnvio] = useState('')
  const [placa, setPlaca] = useState('')
  const [dataProcessamento, setDataProcessamento] = useState('')
  const [horaProcessamento, setHoraProcessamento] = useState('')
  const [statusPicking, setStatusPicking] = useState('')
  const [lotes, setLotes] = useState<LoteRecebimentoKs[]>([])
  const [pesos, setPesos] = useState<PesosRecebimentoKs | null>(null)
  const [isBuscandoLotes, setIsBuscandoLotes] = useState(false)
  const [isBuscandoPeso, setIsBuscandoPeso] = useState(false)
  const [isExecutando, setIsExecutando] = useState(false)
  const [dialogExecutarAberto, setDialogExecutarAberto] = useState(false)
  const [lendoBalanca, setLendoBalanca] = useState(false)
  const [envioCarregado, setEnvioCarregado] = useState<EnvioRecebimentoKs | null>(null)
  const [observacoes, setObservacoes] = useState('')

  const aplicarEnvio = (envio: EnvioRecebimentoKs) => {
    setEnvioCarregado(envio)
    setNumeroEnvio(envio.numero_envio)
    setPlaca(envio.placa_veiculo)
    setDataProcessamento(envio.data_processamento)
    setHoraProcessamento(envio.hora_processamento)
    setStatusPicking(envio.status_picking)
    setLotes(envio.lotes)
    setPesos(calcularPesosKs(envio.peso_bruto, envio.tara, envio.lotes))
    setLendoBalanca(false)
  }

  // Envio vindo da Aba 1: preenche Nº Envio e carrega os dados automaticamente.
  useEffect(() => {
    if (envioSelecionado) {
      aplicarEnvio(envioSelecionado)
    }
  }, [envioSelecionado])

  const handleBuscarLotes = async () => {
    if (!numeroEnvio.trim()) {
      toast({
        title: 'Nº Envio obrigatório',
        description: 'Informe o número do envio para buscar os lotes.',
        variant: 'destructive',
      })
      return
    }
    setIsBuscandoLotes(true)
    try {
      const envio = await buscarEnvioKsPorNumero(numeroEnvio)
      if (!envio) {
        toast({
          title: 'Envio não encontrado',
          description: MENSAGEM_ENVIO_NAO_ENCONTRADO,
          variant: 'destructive',
        })
        return
      }
      aplicarEnvio(envio)
      onLimparSelecao()
      toast({
        title: 'Lotes carregados',
        description: `${envio.lotes.length} lote(s) do envio ${envio.numero_envio} carregado(s) para conferência.`,
      })
    } catch (error) {
      toast({
        title: 'Erro ao buscar lotes',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive',
      })
    } finally {
      setIsBuscandoLotes(false)
    }
  }

  const handleBuscarPeso = async () => {
    if (!envioCarregado) {
      toast({
        title: 'Nenhum envio carregado',
        description: 'Clique em "Buscar Lotes" antes de buscar o peso da balança.',
        variant: 'destructive',
      })
      return
    }
    setIsBuscandoPeso(true)
    setLendoBalanca(true)
    try {
      // Simulação de balança claramente identificada (peso bruto/tara demo).
      await new Promise((r) => setTimeout(r, 800))
      aplicarEnvio(envioCarregado)
      toast({
        title: 'Peso lido (simulação de balança)',
        description: `Bruto ${envioCarregado.peso_bruto.toFixed(3)} t / Tara ${envioCarregado.tara.toFixed(3)} t — indicadores recalculados.`,
      })
    } finally {
      setIsBuscandoPeso(false)
      setLendoBalanca(false)
    }
  }

  const handleExecutar = () => {
    if (modoConsulta && envioCarregado?.status === STATUS_RECEBIDO) {
      toast({
        title: 'Modo consulta',
        description:
          'Envio Recebido é aberto apenas para consulta — novo processamento requer autorização.',
        variant: 'destructive',
      })
      return
    }
    if (!envioCarregado || !pesos) {
      toast({
        title: 'Nenhum envio carregado',
        description: 'Busque os lotes do envio antes de executar.',
        variant: 'destructive',
      })
      return
    }
    setDialogExecutarAberto(true)
  }

  const handleRegistrarHistorico = async (resultado: 'pendente' | 'erro', mensagem: string) => {
    try {
      await registrarHistoricoProcessamento({
        user_email: user?.email || 'anonimo@ciafal.com.br',
        user_nome: user?.name || 'Usuário Ciafal',
        empresa: empresaSelecionada.razaoSocial,
        processo_id: 'entrada-recebimento-ks',
        processo_nome: 'Recebimento KS (Conferência de Lotes e Pesagem)',
        tipo_operacao: 'entrada',
        numero_nf: numeroEnvio || '-',
        serie_nf: '-',
        resultado,
        documento_sap: '',
        mensagens: mensagem,
        detalhes_json: {
          modo: 'demonstracao',
          especificacao: 'regras SAP do Recebimento KS pendentes do programa ABAP',
          qtd_lotes: lotes.length,
          observacoes: observacoes.trim(),
        },
      })
    } catch (error) {
      console.warn('Falha ao registrar histórico (modo demonstração):', error)
    }
  }

  const limparTudo = () => {
    setNumeroEnvio('')
    setPlaca('')
    setDataProcessamento('')
    setHoraProcessamento('')
    setStatusPicking('')
    setLotes([])
    setPesos(null)
    setEnvioCarregado(null)
    setObservacoes('')
    onLimparSelecao()
  }

  const qtdInconsistencias = lotes.filter(eInconsistenteKs).length
  const podeExecutar =
    !!envioCarregado && !!pesos && !(modoConsulta && envioCarregado?.status === STATUS_RECEBIDO)

  return (
    <div className="flex flex-col gap-3">
      {/* Painel superior: dados + pesos */}
      <PainelSuperiorKs
        numeroEnvio={numeroEnvio}
        onNumeroEnvioChange={setNumeroEnvio}
        placa={placa}
        dataProcessamento={dataProcessamento}
        horaProcessamento={horaProcessamento}
        statusPicking={statusPicking}
        pesos={pesos}
        isBuscandoLotes={isBuscandoLotes}
        onBuscarLotes={handleBuscarLotes}
      />

      {/* Modo consulta ativo */}
      {modoConsulta && envioCarregado?.status === STATUS_RECEBIDO && (
        <div className="flex items-center gap-2 rounded-md border border-slate-300 bg-slate-100 px-3 py-2">
          <EyeOff className="h-4 w-4 shrink-0 text-slate-600" />
          <p className="text-[11px] text-slate-700">
            <strong>Modo consulta:</strong> o envio {envioCarregado.numero_envio} já está Recebido —
            novo processamento bloqueado sem autorização.
          </p>
        </div>
      )}

      {/* Observações — texto livre mantido durante as ações da tela */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] font-medium text-slate-600">Observações</label>
        <Textarea
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          placeholder="Observações sobre o recebimento (livre)…"
          className="min-h-[60px] text-xs"
        />
      </div>

      {/* Barra de ações */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          onClick={handleBuscarLotes}
          disabled={isBuscandoLotes || !numeroEnvio.trim()}
          className="bg-[#004c97] hover:bg-blue-900 text-white text-xs gap-1.5"
        >
          {isBuscandoLotes ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Search className="h-3.5 w-3.5" />
          )}
          Buscar Lotes
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={handleBuscarPeso}
          disabled={isBuscandoPeso || !envioCarregado}
          className="text-xs gap-1.5 border-slate-300"
        >
          {isBuscandoPeso ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Scale className="h-3.5 w-3.5" />
          )}
          {lendoBalanca ? 'Lendo balança…' : 'Buscar Peso'}
        </Button>
        <Button
          size="sm"
          onClick={handleExecutar}
          disabled={!podeExecutar || isExecutando}
          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs gap-1.5"
        >
          <Play className="h-3.5 w-3.5" />
          Executar
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={limparTudo}
          disabled={isBuscandoLotes || isBuscandoPeso || isExecutando}
          className="text-xs gap-1.5 border-slate-300 ml-auto"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Limpar
        </Button>
        <span
          className="inline-flex items-center gap-1 rounded bg-amber-50 border border-amber-200 px-2 py-1 text-[10px] font-semibold text-amber-700"
          title="Lançamento no SAP pendente de especificação ABAP"
        >
          <Lock className="h-3 w-3" />
          Processamento SAP bloqueado (ABAP pendente)
        </span>
      </div>

      {/* Grid de conferência — ocupa a maior área */}
      <div className="flex-1">
        {lotes.length === 0 ? (
          <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-xs text-slate-500">
            Informe o Nº Envio e clique em "Buscar Lotes" para carregar a conferência.
          </div>
        ) : (
          <TabelaLotesKs lotes={lotes} />
        )}
      </div>

      <DialogExecutarKs
        open={dialogExecutarAberto}
        onOpenChange={setDialogExecutarAberto}
        numeroEnvio={numeroEnvio}
        observacoes={observacoes}
        placa={placa}
        pesos={pesos ?? PESOS_ZERADOS}
        qtdLotes={lotes.length}
        qtdInconsistencias={qtdInconsistencias}
        onRegistrarHistorico={handleRegistrarHistorico}
      />
    </div>
  )
}

export default AbaConferenciaKs
