import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function AppHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="app-header">
      <Link to="/" className="brand-link">
        <p className="eyebrow">아껴맵</p>
        <h1>승인된 절약 장소 지도</h1>
      </Link>

      <nav className="app-nav" aria-label="주요 메뉴">
        {user ? (
          <>
            <span className="user-chip">{user.nickname}</span>
            <NavLink to="/my/places" className="nav-link">
              내 장소
            </NavLink>
            {user.role === 'ADMIN' && (
              <NavLink to="/admin/places/pending" className="nav-link">
                관리자
              </NavLink>
            )}
            <button type="button" className="secondary-button" onClick={handleLogout}>
              로그아웃
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login" className="nav-link">
              로그인
            </NavLink>
            <NavLink to="/signup" className="primary-button nav-button">
              회원가입
            </NavLink>
          </>
        )}
      </nav>
    </header>
  )
}
