import React from 'react'
import { Link } from 'react-router-dom'
import { PROCESSOS_ENTRADAS, PROCESSOS_SAIDAS } from '@/types/processos'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowRight,
  PackageCheck,
  Recycle,
  Truck,
  ArrowLeftRight,
  Building2,
  RotateCcw,
  FileText,
  ShoppingBag,
  Send,
  Boxes,
  Share2,
  Undo2,
  Wrench,
  BadgePercent,
} from 'lucide-react'

const ICON_MAP: Record<string, React.ElementType> = {
  PackageCheck,
  Recycle,
  Truck,
  ArrowLeftRight,
  Building2,
  RotateCcw,
  FileText,
  ShoppingBag,
  Send,
  Boxes,
  Share2,
  Undo2,
  Wrench,
  BadgePercent,
}

interface MenuProcessosProps {
  tipo: 'entrada' | 'saida'
}

export default function MenuProcessos({ tipo }: MenuProcessosProps) {
  const processos = tipo === 'entrada' ? PROCESSOS_ENTRADAS : PROCESSOS_SAIDAS
  const isEntrada = tipo === 'entrada'

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded ${isEntrada ? 'bg-blue-100 text-[#004c97]' : 'bg-indigo-100 text-indigo-700'}`}
            >
              {isEntrada ? (
                <ArrowDownToLine className="h-5 w-5" />
              ) : (
                <ArrowUpFromLine className="h-5 w-5" />
              )}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                {isEntrada ? 'Processos de Entradas (7 Fluxos)' : 'Processos de Saídas (7 Fluxos)'}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                {isEntrada
                  ? 'Recepção física e escrituração fiscal de matérias-primas, insumos, subcontratação e devoluções.'
                  : 'Faturamento de vendas mercantis, remessas para industrialização, transferências e serviços.'}
              </p>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-500 bg-slate-100 px-3 py-1.5 rounded border">
          Total: <strong className="text-slate-800">7 Processos Mapeados</strong>
        </div>
      </div>

      {/* Grid de Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {processos.map((proc) => {
          const IconComp = ICON_MAP[proc.iconeNome] || FileText
          const isDemo = proc.statusImplementacao === 'funcional_demonstracao'

          return (
            <Card
              key={proc.id}
              className={`flex flex-col justify-between border transition-all ${
                isDemo
                  ? 'border-blue-300 hover:border-[#004c97] hover:shadow-md bg-white'
                  : 'border-slate-200 bg-slate-50/70 hover:bg-white hover:border-slate-300'
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-slate-400">
                    {proc.codigo}
                  </span>
                  {isDemo ? (
                    <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold text-[10px]">
                      Demonstração Homologada
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-[10px] text-slate-500 bg-slate-200">
                      Aguardando Especificação
                    </Badge>
                  )}
                </div>

                <div className="flex items-start gap-3 pt-2">
                  <div
                    className={`p-2 rounded shrink-0 ${isDemo ? 'bg-blue-50 text-[#004c97]' : 'bg-slate-200 text-slate-600'}`}
                  >
                    <IconComp className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold text-slate-900 leading-snug">
                      {proc.titulo}
                    </CardTitle>
                    {proc.categoriaSap && (
                      <span className="text-[11px] font-medium text-slate-400">
                        Cat. SAP: {proc.categoriaSap}
                      </span>
                    )}
                  </div>
                </div>

                <CardDescription className="text-xs text-slate-500 pt-2 leading-relaxed">
                  {proc.descricao}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-0">
                <Link to={proc.route}>
                  <Button
                    variant={isDemo ? 'default' : 'outline'}
                    size="sm"
                    className={`w-full text-xs font-semibold justify-between ${
                      isDemo
                        ? 'bg-[#004c97] hover:bg-blue-900 text-white'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span>
                      {isDemo ? 'Acessar Lançamento EDI' : 'Acessar Detalhes do Processo'}
                    </span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
