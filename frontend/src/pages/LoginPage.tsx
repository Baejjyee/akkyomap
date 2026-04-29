import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import type { FormEvent } from 'react'

interface LocationState {
  from?: {
    pathname?: string
  }
}

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await login({ email: email.trim(), password })
      const state = location.state as LocationState | null
      navigate(state?.from?.pathname || '/', { replace: true })
    } catch {
      setError('이메일 또는 비밀번호를 확인해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-panel auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">로그인</p>
          <h2>아껴맵 계정으로 계속하기</h2>
        </div>

        <label>
          이메일
          <input
            required
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="user@example.com"
          />
        </label>

        <label>
          비밀번호
          <input
            required
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호"
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? '로그인 중' : '로그인'}
        </button>

        <p className="form-help">
          계정이 없나요? <Link to="/signup">회원가입</Link>
        </p>
      </form>
    </section>
  )
}
