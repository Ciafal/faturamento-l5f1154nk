import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar, Header } from './Navigation'

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900">
      <Sidebar
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <Header onToggleMobileMenu={() => setMobileOpen(true)} />

        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden">
          <Outlet />
        </main>

        <footer className="border-t bg-white px-6 py-3 text-center text-xs text-slate-500">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 max-w-7xl mx-auto">
            <span>© {new Date().getFullYear()} Ciafal S/A — Módulo de Faturamento Integrado</span>
            <span className="flex items-center gap-1.5 font-medium text-slate-600">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
              Ambiente de Demonstração Homologado (Pantone 2945)
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}
