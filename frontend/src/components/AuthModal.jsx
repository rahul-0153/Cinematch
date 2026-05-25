import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()

  async function handleSubmit() {
    setError('')
    if (!form.email || !form.password) return setError('All fields required')
    if (mode === 'signup' && !form.name) return setError('Name is required')
    setLoading(true)
    try {
      const res = await fetch(`${API}/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      login(data.token, data.user)
      onClose()
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(6px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--deep)', border: '1px solid var(--border2)', borderRadius: 16, padding: 40, maxWidth: 420, width: '100%' }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, color: 'var(--gold)', marginBottom: 8 }}>CineMatch</div>
          <p style={{ fontSize: 14, color: 'var(--muted)' }}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</p>
        </div>

        {/* Toggle */}
        <div style={{ display: 'flex', background: 'var(--surface)', borderRadius: 8, padding: 4, marginBottom: 28, border: '1px solid var(--border)' }}>
          {['login', 'signup'].map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }} style={{
              flex: 1, padding: '9px 0', borderRadius: 6, border: 'none', fontSize: 13, cursor: 'pointer',
              fontFamily: 'var(--font-body)', transition: 'all 0.2s',
              background: mode === m ? 'var(--gold)' : 'transparent',
              color: mode === m ? '#1a1000' : 'var(--muted)'
            }}>
              {m === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {mode === 'signup' && (
            <input
              placeholder="Your name"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              style={inputStyle}
            />
          )}
          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={inputStyle}
          />
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            style={inputStyle}
          />
        </div>

        {error && <div style={{ marginTop: 14, fontSize: 13, color: '#e05252', textAlign: 'center' }}>{error}</div>}

        <button
          className="btn btn-gold"
          onClick={handleSubmit}
          disabled={loading}
          style={{ width: '100%', justifyContent: 'center', marginTop: 24, padding: '14px 0' }}
        >
          {loading
            ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 1.5 }} /> Please wait...</>
            : mode === 'login' ? 'Log In' : 'Create Account'
          }
        </button>

        <button onClick={onClose} style={{ display: 'block', margin: '16px auto 0', background: 'none', border: 'none', color: 'var(--muted)', fontSize: 13, cursor: 'pointer' }}>
          Cancel
        </button>
      </div>
    </div>
  )
}

const inputStyle = {
  padding: '13px 16px',
  background: 'var(--surface)',
  border: '1px solid var(--border2)',
  borderRadius: 8,
  color: 'var(--text)',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'var(--font-body)',
  width: '100%'
}
