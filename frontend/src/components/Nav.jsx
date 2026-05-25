import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import AuthModal from './AuthModal'

export default function Nav() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const [showAuth, setShowAuth] = useState(false)

  return (
    <>
      <nav className="nav">
        <Link to="/" className="nav-logo">CineMatch</Link>
        <ul className="nav-links">
          <li><Link to="/quiz" className={pathname === '/quiz' ? 'active' : ''}>Mood Quiz</Link></li>
          <li><Link to="/chat" className={pathname === '/chat' ? 'active' : ''}>Chat</Link></li>
          <li><Link to="/watchwith" className={pathname === '/watchwith' ? 'active' : ''}>Watch With</Link></li>
          {user && <li><Link to="/foryou" className={pathname === '/foryou' ? 'active' : ''}>For You</Link></li>}
        </ul>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {user ? (
            <>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>Hi, {user.name.split(' ')[0]}</span>
              <button className="btn btn-ghost" onClick={logout} style={{ padding: '8px 16px', fontSize: 12 }}>Log out</button>
            </>
          ) : (
            <button className="btn btn-gold" onClick={() => setShowAuth(true)} style={{ padding: '8px 20px', fontSize: 13 }}>Sign In</button>
          )}
        </div>
      </nav>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  )
}
