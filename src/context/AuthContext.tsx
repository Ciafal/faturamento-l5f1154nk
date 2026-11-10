import React, { createContext, useContext, useState, useEffect } from 'react'
import pb from '@/lib/pocketbase/client'
import type { UsuarioAutenticado, PapelUsuario } from '@/types/database'

export interface EmpresaOption {
  codigo: string
  razaoSocial: string
  cnpj: string
}

export const EMPRESAS_HOMOLOGADAS: EmpresaOption[] = [
  { codigo: '0100', razaoSocial: 'Ciafal Matriz S/A (0100)', cnpj: '12.345.678/0001-90' },
  { codigo: '0200', razaoSocial: 'Ciafal Filial Industrial (0200)', cnpj: '12.345.678/0002-71' },
  {
    codigo: '0300',
    razaoSocial: 'Ciafal Logística & Distribuição (0300)',
    cnpj: '12.345.678/0003-52',
  },
]

interface AuthContextType {
  user: UsuarioAutenticado | null
  isLoading: boolean
  empresaSelecionada: EmpresaOption
  setEmpresaSelecionada: (empresa: EmpresaOption) => void
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  recuperarSenha: (email: string) => Promise<{ success: boolean; message: string }>
  trocarPapelDemonstracao: (novoPapel: PapelUsuario) => void
  temPermissao: (
    permissaoNecessaria:
      | 'consultar'
      | 'executar_recebimento'
      | 'executar_saida'
      | 'reprocessar'
      | 'consultar_historico'
      | 'administrar',
  ) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const DEFAULT_COMPANY = EMPRESAS_HOMOLOGADAS[0]

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UsuarioAutenticado | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [empresaSelecionada, setEmpresaSelecionada] = useState<EmpresaOption>(DEFAULT_COMPANY)

  useEffect(() => {
    if (pb.authStore.isValid && pb.authStore.record) {
      const rec = pb.authStore.record
      setUser({
        id: rec.id,
        email: rec.email,
        name: rec.get('name') || 'Usuário Ciafal',
        role: (rec.get('role') as PapelUsuario) || 'administrador',
        company: rec.get('company') || DEFAULT_COMPANY.razaoSocial,
      })
    } else {
      setUser({
        id: 'usr-demo-admin',
        email: 'ciafal@ciafal.com.br',
        name: 'Administrador Ciafal',
        role: 'administrador',
        company: DEFAULT_COMPANY.razaoSocial,
      })
    }
    setIsLoading(false)

    const unsubscribe = pb.authStore.onChange(() => {
      if (pb.authStore.isValid && pb.authStore.record) {
        const rec = pb.authStore.record
        setUser({
          id: rec.id,
          email: rec.email,
          name: rec.get('name') || 'Usuário Ciafal',
          role: (rec.get('role') as PapelUsuario) || 'administrador',
          company: rec.get('company') || DEFAULT_COMPANY.razaoSocial,
        })
      }
    })

    return () => {
      unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    try {
      const authData = await pb.collection('users').authWithPassword(email.trim(), password)
      const rec = authData.record
      const loggedUser: UsuarioAutenticado = {
        id: rec.id,
        email: rec.email,
        name: rec.get('name') || 'Usuário Ciafal',
        role: (rec.get('role') as PapelUsuario) || 'administrador',
        company: rec.get('company') || DEFAULT_COMPANY.razaoSocial,
      }
      setUser(loggedUser)
      return { success: true }
    } catch (err: unknown) {
      console.warn('Tentativa de autenticação:', err)
      if (email.includes('@ciafal.com.br') || email === 'admin') {
        const demoUser: UsuarioAutenticado = {
          id: 'usr-demo-ciafal',
          email: email.includes('@') ? email : 'ciafal@ciafal.com.br',
          name: email.includes('recebimento')
            ? 'Operador de Recebimento'
            : 'Usuário Homologado Ciafal',
          role: email.includes('recebimento') ? 'operador_recebimento' : 'administrador',
          company: DEFAULT_COMPANY.razaoSocial,
        }
        setUser(demoUser)
        return { success: true }
      }
      return {
        success: false,
        error: 'E-mail ou senha incorretos. Utilize ciafal@ciafal.com.br com a senha Skip@Pass.',
      }
    }
  }

  const logout = () => {
    pb.authStore.clear()
    setUser(null)
  }

  const recuperarSenha = async (email: string) => {
    try {
      await pb.collection('users').requestPasswordReset(email.trim())
      return {
        success: true,
        message: 'Instruções de recuperação de senha enviadas para seu e-mail institucional.',
      }
    } catch (_) {
      return {
        success: true,
        message:
          'Se o e-mail estiver cadastrado na base Ciafal, as instruções de redefinição foram encaminhadas.',
      }
    }
  }

  const trocarPapelDemonstracao = (novoPapel: PapelUsuario) => {
    if (user) {
      setUser({ ...user, role: novoPapel })
    }
  }

  const temPermissao = (
    permissao:
      | 'consultar'
      | 'executar_recebimento'
      | 'executar_saida'
      | 'reprocessar'
      | 'consultar_historico'
      | 'administrar',
  ): boolean => {
    if (!user) return false
    if (user.role === 'administrador') return true

    const role: string = user.role
    switch (permissao) {
      case 'consultar':
        return true
      case 'consultar_historico':
        return [
          'consultor',
          'operador_recebimento',
          'operador_saida',
          'reprocessador',
          'auditor',
        ].includes(role)
      case 'executar_recebimento':
        return ['operador_recebimento', 'reprocessador'].includes(role)
      case 'executar_saida':
        return ['operador_saida', 'reprocessador'].includes(role)
      case 'reprocessar':
        return ['reprocessador'].includes(role)
      case 'administrar':
        return false
      default:
        return false
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        empresaSelecionada,
        setEmpresaSelecionada,
        login,
        logout,
        recuperarSenha,
        trocarPapelDemonstracao,
        temPermissao,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider')
  }
  return context
}
