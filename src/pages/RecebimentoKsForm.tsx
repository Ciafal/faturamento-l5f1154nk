// Tela ENT-08 "Recebimento KS" — painel em DUAS ABAS:
//   1. "Consulta de Envios" (aba padrão): indicadores, filtros de período,
//      pesquisa e relação de envios (cards).
//   2. "Conferência e Recebimento": a tela original de Recebimento KS,
//      mantida como estava (Nº Envio, Placa, data/hora, status de picking,
//      pesos, Observações, Buscar Lotes/Buscar Peso/Executar/Limpar e grid
//      de 12 colunas).
// Selecionar um envio na Aba 1 abre a Aba 2 automaticamente com o Nº Envio
// preenchido e os dados carregados. Envios Recebidos abrem em MODO CONSULTA.
// Massa de dados de DEMONSTRAÇÃO (recebimentos_ks_demo, migrations 0010/0011/
// 0013) — processamento SAP real bloqueado (regras ABAP pendentes).

import React, { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ListChecks, ClipboardCheck } from 'lucide-react'
import AbaConsultaEnvios from './recebimentoKs/AbaConsultaEnvios'
import AbaConferenciaKs from './recebimentoKs/AbaConferenciaKs'
import pb from '@/lib/pocketbase/client'
import { COLECAO_RECEBIMENTOS_KS, type EnvioRecebimentoKs } from '@/services/recebimentoKs'
import type { LoteRecebimentoKs } from '@/types/recebimentoKs'

function paraEnvio(record: Record<string, unknown>): EnvioRecebimentoKs {
  return {
    id: String(record.id),
    numero_envio: String(record.numero_envio ?? ''),
    placa_veiculo: String(record.placa_veiculo ?? ''),
    data_processamento: String(record.data_processamento ?? ''),
    hora_processamento: String(record.hora_processamento ?? ''),
    status_picking: String(record.status_picking ?? ''),
    peso_bruto: Number(record.peso_bruto ?? 0),
    tara: Number(record.tara ?? 0),
    lotes: (record.lotes_json as LoteRecebimentoKs[] | undefined) ?? [],
    is_simulated: Boolean(record.is_simulated),
    status: String(record.status ?? ''),
    origem: String(record.origem ?? ''),
    destino: String(record.destino ?? ''),
    data_programada: String(record.data_programada ?? ''),
    data_saida: String(record.data_saida ?? ''),
    data_recebimento: String(record.data_recebimento ?? ''),
    peso_previsto: Number(record.peso_previsto ?? 0),
    peso_enviado: Number(record.peso_enviado ?? 0),
    peso_recebido: Number(record.peso_recebido ?? 0),
    situacao_adicional: String(record.situacao_adicional ?? ''),
  }
}

const RecebimentoKsForm: React.FC = () => {
  const navigate = useNavigate()

  const [aba, setAba] = useState('consulta')
  const [envios, setEnvios] = useState<EnvioRecebimentoKs[]>([])
  const [carregando, setCarregando] = useState(true)
  const [envioSelecionado, setEnvioSelecionado] = useState<EnvioRecebimentoKs | null>(null)
  const [modoConsulta, setModoConsulta] = useState(false)

  const carregarEnvios = useCallback(async () => {
    setCarregando(true)
    try {
      const records = await pb.collection(COLECAO_RECEBIMENTOS_KS).getFullList({
        sort: '-numero_envio',
      })
      setEnvios(records.map((r) => paraEnvio(r as unknown as Record<string, unknown>)))
    } catch (error) {
      console.warn('Falha ao carregar envios KS (modo demonstração):', error)
      setEnvios([])
    } finally {
      setCarregando(false)
    }
  }, [])

  useEffect(() => {
    carregarEnvios()
  }, [carregarEnvios])

  const abrirEnvio = useCallback((envio: EnvioRecebimentoKs) => {
    setEnvioSelecionado(envio)
    setModoConsulta(envio.status === 'Recebido')
    setAba('conferencia')
  }, [])

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
            <p className="text-xs text-slate-500">
              Painel de Consulta e Acompanhamento de Envios — KS
            </p>
          </div>
        </div>
        <span className="rounded bg-slate-100 border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          Dados simulados
        </span>
      </div>

      {/* Painel em duas abas */}
      <Tabs value={aba} onValueChange={setAba} className="w-full">
        <TabsList className="h-9 bg-slate-100 p-0.5 rounded-md">
          <TabsTrigger
            value="consulta"
            className="text-xs gap-1.5 px-4 data-[state=active]:bg-[#004c97] data-[state=active]:text-white"
          >
            <ListChecks className="h-3.5 w-3.5" />
            Consulta de Envios
          </TabsTrigger>
          <TabsTrigger
            value="conferencia"
            className="text-xs gap-1.5 px-4 data-[state=active]:bg-[#004c97] data-[state=active]:text-white"
          >
            <ClipboardCheck className="h-3.5 w-3.5" />
            Conferência e Recebimento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="consulta" className="mt-3">
          <AbaConsultaEnvios envios={envios} carregando={carregando} onAbrirEnvio={abrirEnvio} />
        </TabsContent>

        <TabsContent value="conferencia" className="mt-3">
          <AbaConferenciaKs
            envioSelecionado={envioSelecionado}
            modoConsulta={modoConsulta}
            onLimparSelecao={() => setEnvioSelecionado(null)}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default RecebimentoKsForm
