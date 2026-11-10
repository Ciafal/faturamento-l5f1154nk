import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth, EMPRESAS_HOMOLOGADAS } from '@/context/AuthContext'
import { PROCESSOS_ENTRADAS, PROCESSOS_SAIDAS } from '@/types/processos'
import {
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Shield,
  FileText,
  History,
  Home,
  ArrowDownToLine,
  ArrowUpFromLine,
  AlertTriangle,
  Menu,
  X,
  PackageCheck,
  Recycle,
  Truck,
  ArrowLeftRight,
  RotateCcw,
  ShoppingBag,
  Send,
  Boxes,
  Share2,
  Undo2,
  Wrench,
  BadgePercent,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

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

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}) => {
  const location = useLocation()
  const [entradasOpen, setEntradasOpen] = useState(true)
  const [saidasOpen, setSaidasOpen] = useState(true)

  const isActive = (path: string) => location.pathname === path

  const renderIcon = (name: string) => {
    const IconComponent = ICON_MAP[name] || FileText
    return <IconComponent className="h-4 w-4 shrink-0" />
  }

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={onCloseMobile} />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col transition-all duration-300 ease-in-out text-white pantone-2945 shadow-xl lg:static ${
          collapsed ? 'w-20' : 'w-72'
        } ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-blue-800/40 px-4">
          <Link
            to="/"
            className="flex items-center gap-2.5 overflow-hidden font-semibold tracking-tight"
            onClick={onCloseMobile}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-white text-[#004c97] font-bold shadow-md">
              H
            </div>
            {!collapsed && (
              <div className="flex flex-col truncate leading-tight">
                <span className="text-base font-bold tracking-wide">HUB CIAFAL</span>
                <span className="text-xs text-blue-200">Módulo de Faturamento</span>
              </div>
            )}
          </Link>

          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex h-7 w-7 items-center justify-center rounded hover:bg-blue-800/50 text-blue-100"
            title={collapsed ? 'Expandir Menu' : 'Recolher Menu'}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden flex h-8 w-8 items-center justify-center rounded hover:bg-blue-800/50 text-blue-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Content */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 text-sm scrollbar-thin scrollbar-thumb-blue-800">
          {/* Main Links */}
          <div className="space-y-1">
            <Link
              to="/"
              onClick={onCloseMobile}
              className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                isActive('/')
                  ? 'bg-blue-800 text-white font-medium shadow-sm'
                  : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'
              }`}
            >
              <Home className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Início do Módulo</span>}
            </Link>

            <Link
              to="/historico"
              onClick={onCloseMobile}
              className={`flex items-center gap-3 rounded-md px-3 py-2 transition-colors ${
                isActive('/historico')
                  ? 'bg-blue-800 text-white font-medium shadow-sm'
                  : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'
              }`}
            >
              <History className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Histórico de Processamentos</span>}
            </Link>
          </div>

          {/* Seção Entradas (7 Processos) */}
          <div className="space-y-1">
            <div
              className={`flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-blue-200 px-3 py-1 cursor-pointer select-none hover:text-white ${
                collapsed ? 'justify-center' : ''
              }`}
              onClick={() => !collapsed && setEntradasOpen(!entradasOpen)}
            >
              <div className="flex items-center gap-2">
                <ArrowDownToLine className="h-3.5 w-3.5" />
                {!collapsed && <span>Entradas (7 Processos)</span>}
              </div>
              {!collapsed && (
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    entradasOpen ? 'rotate-180' : ''
                  }`}
                />
              )}
            </div>

            {(entradasOpen || collapsed) && (
              <div className="space-y-1 pt-1">
                {PROCESSOS_ENTRADAS.map((proc) => {
                  const active = isActive(proc.route)
                  return (
                    <Link
                      key={proc.id}
                      to={proc.route}
                      onClick={onCloseMobile}
                      title={collapsed ? proc.titulo : undefined}
                      className={`group flex items-center justify-between rounded-md px-3 py-2 text-xs transition-colors ${
                        active
                          ? 'bg-blue-800 text-white font-medium shadow-sm'
                          : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {renderIcon(proc.iconeNome)}
                        {!collapsed && <span className="truncate">{proc.titulo}</span>}
                      </div>

                      {!collapsed && proc.statusImplementacao === 'funcional_demonstracao' && (
                        <span className="shrink-0 rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-200">
                          Demo
                        </span>
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>

          {/* Seção Saídas (7 Processos) */}
          <div className="space-y-1">
            <div
              className={`flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-blue-200 px-3 py-1 cursor-pointer select-none hover:text-white ${
                collapsed ? 'justify-center' : ''
              }`}
              onClick={() => !collapsed && setSaidasOpen(!saidasOpen)}
            >
              <div className="flex items-center gap-2">
                <ArrowUpFromLine className="h-3.5 w-3.5" />
                {!collapsed && <span>Saídas (7 Processos)</span>}
              </div>
              {!collapsed && (
                <ChevronDown
                  className={`h-3.5 w-3.5 transition-transform duration-200 ${
                    saidasOpen ? 'rotate-180' : ''
                  }`}
                />
              )}
            </div>

            {(saidasOpen || collapsed) && (
              <div className="space-y-1 pt-1">
                {PROCESSOS_SAIDAS.map((proc) => {
                  const active = isActive(proc.route)
                  return (
                    <Link
                      key={proc.id}
                      to={proc.route}
                      onClick={onCloseMobile}
                      title={collapsed ? proc.titulo : undefined}
                      className={`group flex items-center justify-between rounded-md px-3 py-2 text-xs transition-colors ${
                        active
                          ? 'bg-blue-800 text-white font-medium shadow-sm'
                          : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        {renderIcon(proc.iconeNome)}
                        {!collapsed && <span className="truncate">{proc.titulo}</span>}
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer SAP Mode Indicator */}
        <div className="border-t border-blue-800/40 p-3 bg-blue-950/40 text-[11px] text-blue-200">
          {!collapsed ? (
            <div className="flex items-center gap-2">
              <span className="flex h-2 w-2 rounded-full bg-amber-400 shrink-0" />
              <span>SAP Simulado (Contrato de Integração)</span>
            </div>
          ) : (
            <div className="flex justify-center" title="Ambiente de Demonstração SAP Homologado">
              <span className="flex h-2 w-2 rounded-full bg-amber-400" />
            </div>
          )}
        </div>
      </aside>
    </>
  )
}

interface HeaderProps {
  onToggleMobileMenu: () => void
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileMenu }) => {
  const { user, empresaSelecionada, setEmpresaSelecionada, logout, trocarPapelDemonstracao } =
    useAuth()
  const navigate = useNavigate()

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b bg-white px-4 shadow-sm lg:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="lg:hidden flex h-9 w-9 items-center justify-center rounded-md border text-slate-700 hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#004c97]">
              HUB Ciafal
            </span>
            <span className="text-slate-300">•</span>
            <h1 className="text-sm font-semibold text-slate-800 lg:text-base">
              Módulo de Faturamento e Lançamentos
            </h1>
          </div>
          <span className="text-[11px] text-slate-500 hidden sm:inline">
            Recebimento SDC, Subcontratação, Entradas e Saídas Fiscais
          </span>
        </div>
      </div>

      {/* Right Controls: Empresa + User Role + Perfil */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Seletor de Empresa Homologada */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 border-slate-300 bg-slate-50 text-xs font-medium text-slate-700 hover:bg-slate-100"
            >
              <Building2 className="h-3.5 w-3.5 text-[#004c97]" />
              <span className="max-w-[120px] truncate sm:max-w-[180px]">
                {empresaSelecionada.razaoSocial}
              </span>
              <ChevronDown className="h-3 w-3 opacity-60" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64">
            <DropdownMenuLabel className="text-xs text-slate-500">
              Empresa Contábil / Centro SAP
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {EMPRESAS_HOMOLOGADAS.map((emp) => (
              <DropdownMenuItem
                key={emp.codigo}
                onClick={() => setEmpresaSelecionada(emp)}
                className={`flex flex-col items-start gap-0.5 text-xs ${
                  empresaSelecionada.codigo === emp.codigo
                    ? 'bg-blue-50 font-semibold text-[#004c97]'
                    : ''
                }`}
              >
                <span>{emp.razaoSocial}</span>
                <span className="text-[10px] text-slate-400">CNPJ: {emp.cnpj}</span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Account & Demo Role Switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="flex h-9 items-center gap-2 px-2 hover:bg-slate-100"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#004c97] text-white text-xs font-bold">
                {user?.name.charAt(0) || 'U'}
              </div>
              <div className="hidden sm:flex flex-col text-left">
                <span className="text-xs font-medium text-slate-800 leading-tight">
                  {user?.name || 'Usuário'}
                </span>
                <span className="text-[10px] text-slate-500 capitalize">
                  {user?.role.replace('_', ' ') || 'Consultor'}
                </span>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none text-slate-900">{user?.name}</p>
                <p className="text-xs leading-none text-slate-500">{user?.email}</p>
                <div className="pt-1">
                  <Badge
                    variant="secondary"
                    className="text-[10px] uppercase font-bold text-[#004c97]"
                  >
                    Papel: {user?.role.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {/* Simulação de Papel para testes de permissão */}
            <DropdownMenuLabel className="text-[11px] text-slate-400 font-semibold uppercase">
              Simular Papel no HUB
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => trocarPapelDemonstracao('administrador')}>
              <Shield className="mr-2 h-3.5 w-3.5 text-[#004c97]" />
              <span className="text-xs">Administrador (Total)</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => trocarPapelDemonstracao('operador_recebimento')}>
              <PackageCheck className="mr-2 h-3.5 w-3.5 text-emerald-600" />
              <span className="text-xs">Operador de Recebimento SDC</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => trocarPapelDemonstracao('consultor')}>
              <User className="mr-2 h-3.5 w-3.5 text-slate-600" />
              <span className="text-xs">Consultor (Apenas Consulta)</span>
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="text-red-600 focus:bg-red-50 focus:text-red-700"
            >
              <LogOut className="mr-2 h-3.5 w-3.5" />
              <span className="text-xs font-medium">Sair da Conta</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
