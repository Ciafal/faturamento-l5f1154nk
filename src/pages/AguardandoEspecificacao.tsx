import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { TODOS_PROCESSOS } from '@/types/processos'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { FileQuestion, ArrowLeft, Clock, ShieldAlert, Sparkles, Send } from 'lucide-react'

export default function AguardandoEspecificacao() {
  const location = useLocation()
  const processoAtual = TODOS_PROCESSOS.find((p) => p.route === location.pathname)

  const titulo = processoAtual?.titulo || 'Processo em Estruturação'
  const codigo = processoAtual?.codigo || 'PROC-SAP'
  const tipo = processoAtual?.tipo === 'saida' ? 'Saída' : 'Entrada'
  const descricao =
    processoAtual?.descricao ||
    'Este fluxo fiscal/operacional faz parte da arquitetura corporativa do HUB Ciafal.'

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Botão Voltar */}
      <div className="flex items-center justify-between">
        <Link to={processoAtual?.tipo === 'saida' ? '/processos/saidas' : '/processos/entradas'}>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-slate-600 hover:text-slate-900 gap-1.5"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao Menu de {tipo}s</span>
          </Button>
        </Link>

        <Badge variant="outline" className="border-amber-300 text-amber-800 bg-amber-50 text-xs">
          Status: Aguardando especificação funcional
        </Badge>
      </div>

      {/* Card Principal */}
      <Card className="border-slate-200 shadow-sm bg-white overflow-hidden">
        <div className="bg-gradient-to-r from-slate-100 to-slate-200 border-b p-6 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-[#004c97] text-white shadow">
            <FileQuestion className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-[#004c97] bg-blue-100 px-2 py-0.5 rounded">
                {codigo}
              </span>
              <span className="text-xs font-semibold text-slate-500 uppercase">
                Fluxo de {tipo}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">{titulo}</h1>
          </div>
        </div>

        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Escopo Preliminar do Processo
            </h2>
            <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-4 rounded-md border border-slate-200">
              {descricao}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-md border border-slate-200 p-4 space-y-2 bg-white">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <Clock className="h-4 w-4 text-amber-500" />
                <span>Status da Documentação ABAP / SAP</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Aguardando envio das especificações funcionais e programas Z customizados da Ciafal.
                Assim que os fluxogramas forem disponibilizados, a tela será enriquecida com os
                campos e regras de negócio específicas.
              </p>
            </div>

            <div className="rounded-md border border-slate-200 p-4 space-y-2 bg-white">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <ShieldAlert className="h-4 w-4 text-[#004c97]" />
                <span>Integração e Contrato de Dados</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                A rota está mapeada no sistema, compatível com o menu corporativo fixo e recolhível,
                pronta para receber o formulário homologado e o contrato de integração SAP RFC/BAPI.
              </p>
            </div>
          </div>

          {/* Dica de Demonstração */}
          <div className="rounded-md border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-[#004c97] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-[#004c97]">
                Experimente os Processos Homologados em Demonstração:
              </div>
              <p className="text-blue-800">
                Para testar a experiência completa de consulta, validação de NF-e e histórico com
                dados simulados do SAP, acesse:
              </p>
              <div className="flex flex-wrap gap-2 pt-1.5">
                <Link to="/processos/entradas/edi-subcontratacao-pa">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs bg-white text-[#004c97] border-blue-300 hover:bg-blue-100"
                  >
                    EDI – Subcontratação (Produto Acabado)
                  </Button>
                </Link>
                <Link to="/processos/entradas/edi-subcontratacao-sucata">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs bg-white text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                  >
                    EDI – Subcontratação (Argola/Sucata/Carepa)
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
