import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
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
  ShieldCheck,
  FileCheck2,
  Clock,
  ExternalLink,
  Info,
} from 'lucide-react'

export default function Index() {
  const { user, empresaSelecionada } = useAuth()

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Banner de Boas-Vindas */}
      <div className="rounded-lg bg-gradient-to-r from-[#004c97] to-blue-900 p-6 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold backdrop-blur-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-200" />
              <span>HUB Ciafal • Faturamento e Recepção Fiscal</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Olá, {user?.name || 'Colaborador Ciafal'}
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-2xl">
              Você está operando na unidade{' '}
              <span className="font-semibold text-white underline">
                {empresaSelecionada.razaoSocial}
              </span>{' '}
              com permissão de{' '}
              <span className="font-semibold text-white capitalize">
                {user?.role.replace('_', ' ')}
              </span>
              .
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to="/historico">
              <Button
                variant="secondary"
                size="sm"
                className="bg-white text-[#004c97] hover:bg-blue-50 font-semibold text-xs shadow"
              >
                <Clock className="mr-1.5 h-3.5 w-3.5" />
                Histórico Geral
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Alerta de Modo de Demonstração e Premissas */}
      <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-900 text-xs shadow-sm">
        <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-amber-950 text-sm">
            Ambiente de Demonstração e Homologação Funcional
          </div>
          <p className="text-amber-800 leading-relaxed">
            Os dois processos de Subcontratação SDC (<strong>Produto Acabado</strong> e{' '}
            <strong>Argola/Sucata/Carepa</strong>) encontram-se plenamente funcionais com dados
            simulados do SAP ERP, consulta de notas fiscais, conferência de itens, pedidos e
            integração. Os demais 12 processos estão estruturados e aguardam a especificação
            funcional detalhada da Ciafal.
          </p>
          <div className="pt-1 text-[11px] text-amber-700 font-medium">
            * Conforme premissas aprovadas, indicadores reais de volumetria só serão ativados após
            conexão viva com o SAP RFC/S4HANA.
          </div>
        </div>
      </div>

      {/* Acesso Rápido aos dois Processos Funcionais */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <FileCheck2 className="h-4 w-4 text-[#004c97]" />
          <span>Processos Homologados em Demonstração (SDC)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card Produto Acabado */}
          <Card className="border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold text-[10px]">
                  Funcional (Demo)
                </Badge>
                <span className="text-xs font-mono text-slate-400">ENT-01 • Cat. E1</span>
              </div>
              <CardTitle className="text-base font-bold text-slate-900 group-hover:text-[#004c97] flex items-center gap-2 pt-1">
                <PackageCheck className="h-5 w-5 text-[#004c97]" />
                EDI – Subcontratação (Produto Acabado)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Consulta de NF-e, conferência de lotes, validação de pedidos SAP (NB), conciliação
                com almoxarifado WM (DP10) e controle de status de recebimento.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link to="/processos/entradas/edi-subcontratacao-pa">
                <Button className="w-full bg-[#004c97] hover:bg-blue-900 text-white font-medium text-xs justify-between">
                  <span>Abrir Tela de Lançamento EDI</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Card Sucata / Carepa / Argola */}
          <Card className="border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group bg-white">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-semibold text-[10px]">
                  Funcional (Demo)
                </Badge>
                <span className="text-xs font-mono text-slate-400">ENT-02 • Cat. E3</span>
              </div>
              <CardTitle className="text-base font-bold text-slate-900 group-hover:text-[#004c97] flex items-center gap-2 pt-1">
                <Recycle className="h-5 w-5 text-emerald-600" />
                EDI – Subcontratação (Argola / Sucata / Carepa)
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Retorno de subprodutos e resíduos da industrialização externa. Regras para Depósito
                DP34 (movimento 545/311), pesagem e batimento de retorno fiscal.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Link to="/processos/entradas/edi-subcontratacao-sucata">
                <Button className="w-full bg-[#004c97] hover:bg-blue-900 text-white font-medium text-xs justify-between">
                  <span>Abrir Tela de Sucata / Carepa</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Visão dos Dois Menus Gerais: Entradas vs Saídas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
        {/* Entradas */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded bg-blue-50 text-[#004c97]">
                  <ArrowDownToLine className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Menu de Entradas (7 Processos)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Recepção de NFs, subcontratação, compras e devoluções
                  </CardDescription>
                </div>
              </div>
              <Link to="/processos/entradas">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-[#004c97] hover:bg-blue-50"
                >
                  Ver todos
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100">
            {PROCESSOS_ENTRADAS.map((p) => (
              <Link
                key={p.id}
                to={p.route}
                className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors text-xs"
              >
                <div className="space-y-0.5 max-w-[80%]">
                  <div className="font-semibold text-slate-800 flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">{p.codigo}</span>
                    <span className="truncate">{p.titulo}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{p.descricao}</p>
                </div>

                {p.statusImplementacao === 'funcional_demonstracao' ? (
                  <Badge
                    variant="outline"
                    className="border-emerald-300 text-emerald-700 bg-emerald-50 text-[10px]"
                  >
                    Demo
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] text-slate-500 bg-slate-100">
                    Aguardando
                  </Badge>
                )}
              </Link>
            ))}
          </CardContent>
        </Card>

        {/* Saídas */}
        <Card className="border-slate-200 bg-white">
          <CardHeader className="border-b border-slate-100 pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded bg-indigo-50 text-indigo-700">
                  <ArrowUpFromLine className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base font-bold text-slate-900">
                    Menu de Saídas (7 Processos)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Emissão de vendas SD, remessas e transferências
                  </CardDescription>
                </div>
              </div>
              <Link to="/processos/saidas">
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-[#004c97] hover:bg-blue-50"
                >
                  Ver todos
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="p-0 divide-y divide-slate-100">
            {PROCESSOS_SAIDAS.map((p) => (
              <Link
                key={p.id}
                to={p.route}
                className="flex items-center justify-between p-3.5 hover:bg-slate-50 transition-colors text-xs"
              >
                <div className="space-y-0.5 max-w-[80%]">
                  <div className="font-semibold text-slate-800 flex items-center gap-2">
                    <span className="text-[10px] font-mono text-slate-400">{p.codigo}</span>
                    <span className="truncate">{p.titulo}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{p.descricao}</p>
                </div>

                <Badge variant="secondary" className="text-[10px] text-slate-500 bg-slate-100">
                  Aguardando
                </Badge>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
