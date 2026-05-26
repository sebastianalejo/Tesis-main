import { AlertCircle, ArrowRight, Lock, User } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getFirebaseApp } from '../firebase/client'
import { friendlyFirebaseLoginError } from '../utils/firebaseAuthErrors'

export function LoginPage() {
  const { authToken, login, isReady } = useAuth()
  const firebaseConfigured = Boolean(getFirebaseApp())
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: string } | null)?.from ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (isReady && authToken) {
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(friendlyFirebaseLoginError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-slate-950 px-4 py-12">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse 80% 50% at 50% -20%, rgb(13 148 136 / 0.45), transparent), radial-gradient(ellipse 60% 40% at 100% 0%, rgb(59 130 246 / 0.2), transparent)',
        }}
      />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-2xl bg-teal-500 text-white shadow-lg shadow-teal-900/30">
            <Lock className="size-7" aria-hidden />
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">Acceso al panel</h1>
          <p className="mt-2 text-sm text-slate-400">
            Usuario de Firebase Authentication (correo y contraseña).
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl backdrop-blur"
        >
          {error && (
            <div
              className="mb-4 flex gap-3 rounded-xl border border-red-500/30 bg-red-950/50 px-3 py-3 text-sm text-red-100"
              role="alert"
            >
              <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-400" aria-hidden />
              <span>{error}</span>
            </div>
          )}

          <label className="block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
              Correo
            </span>
            <div className="relative">
              <User
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                aria-hidden
              />
              <input
                autoComplete="email"
                type="email"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-white outline-none ring-teal-500/0 transition placeholder:text-slate-600 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </label>

          <label className="mt-4 block">
            <span className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-400">
              Contraseña
            </span>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500"
                aria-hidden
              />
              <input
                type="password"
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-700 bg-slate-950 py-2.5 pl-10 pr-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-teal-500 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/30 transition hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Entrando…' : 'Entrar'}
            {!loading && <ArrowRight className="size-4" aria-hidden />}
          </button>
        </form>

        {!firebaseConfigured && (
          <p className="mt-6 text-center text-xs text-slate-500">
            Falta la configuración web del SDK. Copia{' '}
            <span className="font-mono text-slate-400">firebase-config.example.json</span> a{' '}
            <span className="font-mono text-slate-400">firebase-config.json</span> en{' '}
            <span className="font-mono text-slate-400">frontend/public/</span> con los datos de la Consola
            Firebase (app web), luego <span className="font-mono text-slate-400">npm run build</span> y
            despliega.
          </p>
        )}
      </div>
    </div>
  )
}
