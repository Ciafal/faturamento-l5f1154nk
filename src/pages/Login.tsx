import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Lock, Mail, ShieldCheck, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react'

export default function Login() {
  const { login, recuperarSenha } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('ciafal@ciafal.com.br')
  const [password, setPassword] = useState('Skip@Pass')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [recoveryMode, setRecoveryMode] = useState(false)
  const [recoverySuccess, setRecoverySuccess] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setIsLoading(true)

    const result = await login(email, password)
    setIsLoading(false)

    if (result.success) {
      navigate('/')
    } else {
      setErrorMsg(result.error || 'Falha ao autenticar. Verifique suas credenciais.')
    }
  }

  const handleRecuperarSenha = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setErrorMsg('Informe o e-mail cadastrado.')
      return
    }
    setErrorMsg('')
    setIsLoading(true)

    const result = await recuperarSenha(email)
    setIsLoading(false)
    setRecoverySuccess(result.message)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <div className="w-full max-w-md space-y-4">
        {/* Logo Ciafal */}
        <div className="text-center space-y-1">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-lg bg-[#004c97] text-white text-2xl font-bold shadow-md">
            H
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">HUB CIAFAL</h1>
          <p className="text-sm text-slate-500">Módulo de Faturamento, Entradas e Saídas</p>
        </div>

        <Card className="border-slate-200 shadow-xl bg-white">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold text-[#004c97]">
              {recoveryMode ? 'Recuperação de Acesso' : 'Acesso ao Sistema'}
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">
              {recoveryMode
                ? 'Digite seu e-mail corporativo para receber instruções de troca de senha.'
                : 'Entre com suas credenciais corporativas homologadas para continuar.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {errorMsg && (
              <Alert variant="destructive" className="py-2.5 text-xs">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle className="text-xs font-semibold">Atenção</AlertTitle>
                <AlertDescription>{errorMsg}</AlertDescription>
              </Alert>
            )}

            {recoverySuccess && (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 py-2.5 text-xs">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <AlertTitle className="text-xs font-semibold">E-mail Enviado</AlertTitle>
                <AlertDescription>{recoverySuccess}</AlertDescription>
              </Alert>
            )}

            {!recoveryMode ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-slate-700">
                    E-mail Institucional
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@ciafal.com.br"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-9 text-sm"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pass" className="text-xs font-medium text-slate-700">
                      Senha SAP / HUB
                    </Label>
                    <button
                      type="button"
                      onClick={() => {
                        setRecoveryMode(true)
                        setErrorMsg('')
                        setRecoverySuccess('')
                      }}
                      className="text-xs text-[#004c97] hover:underline"
                    >
                      Esqueceu a senha?
                    </button>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="pass"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pl-9 text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#004c97] hover:bg-[#003c77] text-white font-semibold text-sm shadow"
                >
                  {isLoading ? 'Autenticando...' : 'Acessar Módulo'}
                  {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleRecuperarSenha} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="rec-email" className="text-xs font-medium text-slate-700">
                    E-mail para Redefinição
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="rec-email"
                      type="email"
                      placeholder="seu.email@ciafal.com.br"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="pl-9 text-sm"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-[#004c97] hover:bg-[#003c77] text-white font-semibold text-sm shadow"
                >
                  {isLoading ? 'Enviando instruções...' : 'Solicitar Troca de Senha'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setRecoveryMode(false)
                    setErrorMsg('')
                    setRecoverySuccess('')
                  }}
                  className="w-full text-xs"
                >
                  Voltar ao Login
                </Button>
              </form>
            )}
          </CardContent>

          <CardFooter className="flex flex-col border-t bg-slate-50/50 p-4 text-center text-xs text-slate-500">
            <div className="flex items-center justify-center gap-1.5 font-medium text-slate-600">
              <ShieldCheck className="h-4 w-4 text-[#004c97]" />
              <span>Acesso restrito a colaboradores autorizados Ciafal S/A</span>
            </div>
            <p className="mt-1 text-[11px] text-slate-400">
              Ambiente de Demonstração com dados pré-populados (ciafal@ciafal.com.br / Skip@Pass)
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
