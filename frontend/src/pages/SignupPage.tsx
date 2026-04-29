import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import type { FormEvent } from 'react'

export function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nickname, setNickname] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await signup({
        email: email.trim(),
        password,
        nickname: nickname.trim(),
      })
      navigate('/login', {
        replace: true,
        state: { notice: '회원가입이 완료되었습니다. 로그인해 주세요.' },
      })
    } catch {
      setError('회원가입에 실패했습니다. 입력값을 확인해 주세요.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="page-panel auth-page">
      <form className="auth-form" onSubmit={handleSubmit}>
        <div>
          <p className="eyebrow">회원가입</p>
          <h2>아껴맵 시작하기</h2>
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
          닉네임
          <input
            required
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            placeholder="닉네임"
          />
        </label>

        <label>
          비밀번호
          <input
            required
            minLength={8}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="8자 이상"
          />
        </label>

        {error && <p className="form-error">{error}</p>}

        <button type="submit" className="primary-button" disabled={submitting}>
          {submitting ? '가입 중' : '회원가입'}
        </button>

        <p className="form-help">
          이미 계정이 있나요? <Link to="/login">로그인</Link>
        </p>
      </form>
    </section>
  )
}
