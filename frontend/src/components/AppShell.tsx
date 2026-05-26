import {
  Database,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  Sparkles,
  X,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navClass = ({ isActive }: { isActive: boolean }) =>
  [
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
    isActive
      ? 'bg-teal-600 text-white shadow-sm'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ')

const items = [
  { to: '/', label: 'Resumen', icon: LayoutDashboard },
  { to: '/prediccion', label: 'Predicción', icon: Sparkles },
  { to: '/mapa', label: 'Mapa de riesgo', icon: Map },
  { to: '/datos', label: 'Importar datos', icon: Database },
] as const

export function AppShell({ children }: { children?: ReactNode }) {
  const { username, logout } = useAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = () => {
    void (async () => {
      await logout()
      navigate('/login', { replace: true })
    })()
  }

  const sidebar = (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        <div className="flex size-10 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm">
          <Sparkles className="size-5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">Riesgo Criminal</p>
          <p className="truncate text-xs text-slate-500">Lima Metropolitana</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 p-3" aria-label="Principal">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={navClass}
            onClick={() => setMobileOpen(false)}
          >
            <Icon className="size-4 shrink-0 opacity-90" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 p-3">
        <div className="mb-2 rounded-xl bg-slate-50 px-3 py-2">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Usuario</p>
          <p className="truncate text-sm font-medium text-slate-800">{username}</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="size-4" aria-hidden />
          Cerrar sesión
        </button>
      </div>
    </div>
  )

  return (
    <div className="flex min-h-svh bg-slate-50">
      <aside className="hidden w-64 shrink-0 lg:block">{sidebar}</aside>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          role="presentation"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] transform transition-transform lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-700 shadow-sm"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
          <span className="truncate text-sm font-semibold text-slate-800">Panel</span>
          <span className="w-10" />
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  )
}
