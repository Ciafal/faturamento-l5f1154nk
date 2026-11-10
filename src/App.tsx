/* Main App Component - Handles routing (using react-router-dom), query client and other providers - use this file to add all routes */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as Sonner } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { AuthProvider } from '@/context/AuthContext'

import Layout from './components/Layout'
import Index from './pages/Index'
import Login from './pages/Login'
import MenuProcessos from './pages/MenuProcessos'
import EdiSubcontratacaoForm from './pages/EdiSubcontratacaoForm'
import FaturamentoCiafalForm from './pages/FaturamentoCiafalForm'
import EnvioTarugosSucataForm from './pages/EnvioTarugosSucataForm'
import HistoricoProcessamentos from './pages/HistoricoProcessamentos'
import AguardandoEspecificacao from './pages/AguardandoEspecificacao'
import NotFound from './pages/NotFound'

// ONLY IMPORT AND RENDER WORKING PAGES, NEVER ADD PLACEHOLDER COMPONENTS OR PAGES IN THIS FILE
// AVOID REMOVING ANY CONTEXT PROVIDERS FROM THIS FILE (e.g. TooltipProvider, Toaster, Sonner)

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Rota pública de login */}
          <Route path="/login" element={<Login />} />

          {/* Rotas protegidas dentro do Layout Corporativo Ciafal */}
          <Route element={<Layout />}>
            <Route path="/" element={<Index />} />

            {/* Menus de Entradas e Saídas */}
            <Route path="/processos/entradas" element={<MenuProcessos tipo="entrada" />} />
            <Route path="/processos/saidas" element={<MenuProcessos tipo="saida" />} />

            {/* Os dois processos de Recebimento SDC funcionais em modo de demonstração */}
            <Route
              path="/processos/entradas/edi-subcontratacao-pa"
              element={<EdiSubcontratacaoForm processType="produto_acabado" />}
            />
            <Route
              path="/processos/entradas/edi-subcontratacao-sucata"
              element={<EdiSubcontratacaoForm processType="sucata_carepa_argola" />}
            />

            {/* Os demais 5 processos de Entradas (Aguardando Especificação) */}
            <Route
              path="/processos/entradas/compras-mercadoria"
              element={<AguardandoEspecificacao />}
            />
            <Route
              path="/processos/entradas/retorno-beneficiamento"
              element={<AguardandoEspecificacao />}
            />
            <Route
              path="/processos/entradas/transferencia-filiais"
              element={<AguardandoEspecificacao />}
            />
            <Route
              path="/processos/entradas/devolucao-cliente"
              element={<AguardandoEspecificacao />}
            />
            <Route
              path="/processos/entradas/servicos-diversos"
              element={<AguardandoEspecificacao />}
            />

            {/* Os 7 processos de Saídas (Aguardando Especificação) */}
            <Route
              path="/processos/saidas/faturamento-vendas"
              element={<FaturamentoCiafalForm />}
            />
            <Route
              path="/processos/saidas/envio-tarugos-sucata"
              element={<EnvioTarugosSucataForm />}
            />
            <Route path="/processos/saidas/venda-sucatas" element={<AguardandoEspecificacao />} />
            <Route
              path="/processos/saidas/transferencia-filiais"
              element={<AguardandoEspecificacao />}
            />
            <Route
              path="/processos/saidas/devolucao-fornecedor"
              element={<AguardandoEspecificacao />}
            />
            <Route
              path="/processos/saidas/remessa-conserto"
              element={<AguardandoEspecificacao />}
            />
            <Route
              path="/processos/saidas/faturamento-servicos"
              element={<AguardandoEspecificacao />}
            />

            {/* Histórico Geral de Processamentos */}
            <Route path="/historico" element={<HistoricoProcessamentos />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </TooltipProvider>
    </AuthProvider>
  </BrowserRouter>
)

export default App
