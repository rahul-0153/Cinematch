import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import Nav from '../components/Nav'
import MovieCard from '../components/MovieCard'
import MovieModal from '../components/MovieModal'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function ForYou() {
  const { user, token } = useAuth()
  const [movies, setMovies] = useState([])
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [message, setMessage] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [activeTab, setActiveTab] = useState('foryou')
  const loaderRef = useRef(null)
  const seenTitles = useRef(new Set())
  const loadingMoreRef = useRef(false)

  const fetchRecommendations = useCallback(async (append = false) => {
    if (!token || loadingMoreRef.current) return
    loadingMoreRef.current = true
    append ? setLoadingMore(true) : setLoading(true)

    try {
      const res = await fetch(`${API}/api/foryou`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()

      if (data.message) {
        setMessage(data.message)
        setLoading(false)
        return
      }

      // Filter out already shown movies
      const newMovies = (data.movies || []).filter(m => !seenTitles.current.has(m.title))
      newMovies.forEach(m => seenTitles.current.add(m.title))
      setMovies(prev => append ? [...prev, ...newMovies] : newMovies)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
      setLoadingMore(false)
      loadingMoreRef.current = false
    }
  }, [token])

  const fetchHistory = useCallback(async () => {
    if (!token) return
    const res = await fetch(`${API}/api/history`, { headers: { Authorization: `Bearer ${token}` } })
    const data = await res.json()
    setHistory(data.history || [])
  }, [token])

  useEffect(() => {
    if (!token) { setLoading(false); return }
    fetchRecommendations(false)
    fetchHistory()
  }, [token, fetchRecommendations, fetchHistory])

  // Infinite scroll for For You tab
  useEffect(() => {
    if (activeTab !== 'foryou') return
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingMoreRef.current && movies.length > 0) {
        fetchRecommendations(true)
      }
    }, { threshold: 0.1 })
    const el = loaderRef.current
    if (el) observer.observe(el)
    return () => { if (el) observer.unobserve(el) }
  }, [activeTab, movies.length, fetchRecommendations])

  if (!user) {
    return (
      <div className="page">
        <Nav />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48 }}>🔐</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 28 }}>Sign in to unlock For You</h2>
          <p style={{ color: 'var(--muted)', maxWidth: 380, lineHeight: 1.6 }}>Create an account to track what you've watched and get AI recommendations based on your taste.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <Nav />
      <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '48px 24px' }}>

        <div style={{ marginBottom: 36 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>Personalized for {user.name.split(' ')[0]}</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 48px)', marginBottom: 12 }}>Your Space</h1>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, background: 'var(--surface)', borderRadius: 10, padding: 4, border: '1px solid var(--border)', width: 'fit-content', marginBottom: 36 }}>
          {[{ key: 'foryou', label: '✨ For You' }, { key: 'history', label: '🎬 Watch History' }].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
              padding: '8px 22px', borderRadius: 7, border: 'none', fontSize: 13, cursor: 'pointer',
              fontFamily: 'var(--font-body)', transition: 'all 0.2s',
              background: activeTab === t.key ? 'var(--gold)' : 'transparent',
              color: activeTab === t.key ? '#1a1000' : 'var(--muted)'
            }}>{t.label}</button>
          ))}
        </div>

        {/* FOR YOU TAB */}
        {activeTab === 'foryou' && (
          <>
            {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>}

            {!loading && message && (
              <div style={{ textAlign: 'center', padding: '60px 20px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16 }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🎬</div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 22, marginBottom: 12 }}>{message}</h3>
                <p style={{ color: 'var(--muted)', marginBottom: 24, fontSize: 14 }}>Mark movies as watched to build your taste profile.</p>
                <Link to="/" className="btn btn-gold">Browse Movies →</Link>
              </div>
            )}

            {!loading && movies.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 24 }}>
                {movies.map((movie, i) => (
                  <div key={movie.title + i} onClick={() => movie.tmdb_id && setSelectedId(movie.tmdb_id)} style={{ cursor: 'pointer' }}>
                    <MovieCard movie={movie} index={i % 12} />
                  </div>
                ))}
              </div>
            )}

            {/* Infinite scroll trigger */}
            {!loading && !message && (
              <div ref={loaderRef} style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 32 }}>
                {loadingMore && <div className="spinner" />}
              </div>
            )}
          </>
        )}

        {/* HISTORY TAB */}
        {activeTab === 'history' && (
          <>
            {history.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--muted)' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>📭</div>
                <p>No movies watched yet. Click any movie and mark it as watched!</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 16 }}>
                {history.map(m => (
                  <div key={m.tmdb_id} onClick={() => setSelectedId(m.tmdb_id)} style={{ cursor: 'pointer', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', transition: 'all 0.2s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--border2)'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
                  >
                    {m.poster
                      ? <img src={m.poster} alt={m.title} style={{ width: '100%', aspectRatio: '2/3', objectFit: 'cover' }} />
                      : <div style={{ aspectRatio: '2/3', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🎬</div>
                    }
                    <div style={{ padding: 10 }}>
                      <div style={{ fontSize: 12, fontFamily: 'var(--font-display)', lineHeight: 1.3, marginBottom: 4 }}>{m.title}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted2)' }}>{m.release_year}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {selectedId && <MovieModal tmdbId={selectedId} onClose={() => { setSelectedId(null); fetchHistory() }} />}
    </div>
  )
}
