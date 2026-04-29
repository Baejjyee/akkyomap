import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { fetchMe, login as requestLogin, signup as requestSignup } from '../api/auth'
import {
  getAccessToken,
  removeAccessToken,
  setAccessToken,
} from './authStorage'
import type {
  LoginRequest,
  SignupRequest,
  TokenResponse,
  UserResponse,
} from '../types/auth'
import type { ReactNode } from 'react'

interface AuthContextValue {
  accessToken: string | null
  user: UserResponse | null
  initializing: boolean
  login: (request: LoginRequest) => Promise<TokenResponse>
  signup: (request: SignupRequest) => Promise<UserResponse>
  logout: () => void
  refreshMe: () => Promise<UserResponse | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [accessToken, setTokenState] = useState<string | null>(() =>
    getAccessToken(),
  )
  const [user, setUser] = useState<UserResponse | null>(null)
  const [initializing, setInitializing] = useState(true)

  const logout = useCallback(() => {
    removeAccessToken()
    setTokenState(null)
    setUser(null)
  }, [])

  const refreshMe = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null)
      return null
    }

    try {
      const me = await fetchMe()
      setUser(me)
      return me
    } catch {
      logout()
      return null
    }
  }, [logout])

  useEffect(() => {
    refreshMe().finally(() => setInitializing(false))
  }, [refreshMe])

  const login = useCallback(async (request: LoginRequest) => {
    const tokenResponse = await requestLogin(request)
    setAccessToken(tokenResponse.accessToken)
    setTokenState(tokenResponse.accessToken)
    const me = await fetchMe()
    setUser(me)
    return tokenResponse
  }, [])

  const signup = useCallback((request: SignupRequest) => {
    return requestSignup(request)
  }, [])

  const value = useMemo(
    () => ({
      accessToken,
      user,
      initializing,
      login,
      signup,
      logout,
      refreshMe,
    }),
    [accessToken, user, initializing, login, signup, logout, refreshMe],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}
