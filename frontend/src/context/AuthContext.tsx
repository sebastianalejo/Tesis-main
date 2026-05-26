import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { getFirebaseApp, getFirebaseAuth } from '../firebase/client'
import { friendlyFirebaseLoginError } from '../utils/firebaseAuthErrors'

type AuthContextValue = {
  username: string | null
  authToken: string | null
  isReady: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null)
  const [authToken, setAuthToken] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const app = getFirebaseApp()
    if (!app) {
      setIsReady(true)
      return
    }
    const auth = getFirebaseAuth()
    if (!auth) {
      setIsReady(true)
      return
    }
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const t = await user.getIdToken()
        setAuthToken(`Bearer ${t}`)
        setUsername(user.email ?? user.uid)
      } else {
        setAuthToken(null)
        setUsername(null)
      }
      setIsReady(true)
    })
    return () => unsub()
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const auth = getFirebaseAuth()
    if (!auth)
      throw new Error(
        'Firebase no está configurado. En frontend/public/ crea firebase-config.json con el objeto de tu app web (Consola Firebase) o usa .env.local con VITE_FIREBASE_*; luego npm run build y despliega de nuevo.'
      )
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
    } catch (e) {
      throw new Error(friendlyFirebaseLoginError(e))
    }
  }, [])

  const logout = useCallback(async () => {
    const auth = getFirebaseAuth()
    if (auth) await signOut(auth)
    setUsername(null)
    setAuthToken(null)
  }, [])

  const value = useMemo(
    () => ({
      username,
      authToken,
      isReady,
      login,
      logout,
    }),
    [username, authToken, isReady, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return ctx
}
