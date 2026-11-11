// Tela ENT-08 "Recebimento KS" — Conferência de Lotes e Pesagem (KS).
// Estrutura espelha a tela SAI-01 Faturamento Ciafal (painel superior +
// barra de ações + tabela de conferência), com as diferenças pedidas:
// campo principal "Nº Envio", coluna "Nº Bloco", coluna "Letra" e
// processamento BLOQUEADO (regras SAP pendentes do ABAP).

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Scale, RefreshCw, Search, Lock, Loader2, ArrowLeft, Play } from 'lucide-react'
import { toast } from '@/hooks/use-toast'
import { useAuth } from '@/context/AuthContext'
import {
  listarHistoricoProcessamentos,
  registrarHistoricoProcessamento,
} from '@/services/faturamento'
import { PainelSuperiorKs } from './recebimentoKs/PainelSuperiorKs'
import TabelaLotesKs from './recebimentoKs/TabelaLotesKs'
import DialogExecutarKs from './recebimentoKs/DialogExecutarKs'
import {
  buscarEnvioKsPorNumero,
  MENSAGEM_ENVIO_NAO_ENCONTRADO,
  type EnvioRecebimentoKs,
} from '@/services/recebimentoKs'
import { calcularPesosKs, eInconsistenteKs } from '@/lib/recebimentoKs/calculos'
import type { LoteRecebimentoKs, PesosRecebimentoKs } from '@/types/recebimentoKs'

const RecebimentoKsForm: React.FC = () => {
  const navigate = useNavigate()
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

  const aplicarEnvio = (envio: EnvioRecebimentoKs) => {
    setEnvioCarregado(envio)
    setPlaca(envio.placa_veiculo)
    setDataProcessamento(envio.data_processamento)
    setHoraProcessamento(envio.hora_processamento)
    setStatusPicking(envio.status_picking)
    setLotes(envio.lotes)
    setPesos(calcularPesosKs(envio.peso_bruto, envio.tara, envio.lotes))
    setLendoBalanca(false)
  }

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
        },
      })
    } catch (error) {
      console.warn('Falha ao registrar histórico (modo demonstração):', error)
    }
  }

  const qtdInconsistencias = lotes.filter(eInconsistenteKs).length
  const podeExecutar = !!envioCarregado && !!pesos

  return (
    <div className="flex flex-col gap-3 p-4 lg:p-6">
      {/* Cabeçalho da tela */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/processos/entradas')}
            title="Voltar"
            className="h-8 w-8 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-[#004c97] leading-tight">Recebimento KS</h1>
            <p className="text-xs text-slate-500">Conferência de Lotes e Pesagem — KS</p>
          </div>
        </div>
        <span className="rounded bg-slate-100 border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Dados simulados
        </span>
      </div>

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
          onClick={() => {
            setNumeroEnvio('')
            setPlaca('')
            setDataProcessamento('')
            setHoraProcessamento('')
            setStatusPicking('')
            setLotes([])
            setPesos(null)
            setEnvioCarregado(null)
          }}
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
        placa={placa}
        pesos={
          pesos ?? {
            pesoBruto: 0,
            tara: 0,
            pesoColetado: 0,
            pesoLotesRfid: 0,
            pesoLiquidoBalanca: 0,
            diferencaPesoT: 0,
            diferencaPesoPct: 0,
          }
        }
        qtdLotes={lotes.length}
        qtdInconsistencias={qtdInconsistencias}
        onRegistrarHistorico={handleRegistrarHistorico}
      />
    </div>
  )
}

export default RecebimentoKsForm
