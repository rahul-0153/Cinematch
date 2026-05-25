import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function MovieModal({ tmdbId, onClose }) {
  const [movie, setMovie] = useState(null)
  const [loading, setLoading] = useState(true)
  const [watched, setWatched] = useState(false)
  const [watchLoading, setWatchLoading] = useState(false)
  const { user, token } = useAuth()

  useEffect(() => {
    fetch(`${API}/api/movie/${tmdbId}`)
      .then(r => r.json())
      .then(data => { setMovie(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [tmdbId])

  // Check if already in watch history
  useEffect(() => {
    if (!token || !tmdbId) return
    fetch(`${API}/api/history`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(data => {
        const found = data.history?.find(h => h.tmdb_id === tmdbId)
        if (found) setWatched(true)
      })
  }, [tmdbId, token])

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  async function toggleWatched() {
    if (!token) return
    setWatchLoading(true)
    try {
      if (watched) {
        await fetch(`${API}/api/history/${tmdbId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
        setWatched(false)
      } else {
        await fetch(`${API}/api/history`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ tmdb_id: movie.tmdb_id, title: movie.title, poster: movie.poster, genres: movie.genres, rating: movie.rating, release_year: movie.release_year })
        })
        setWatched(true)
      }
    } finally {
      setWatchLoading(false)
    }
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(6px)' }}>
      <div onClick={e => e.stopPropagation()} style={{ background: 'var(--deep)', border: '1px solid var(--border2)', borderRadius: 16, maxWidth: 860, width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>

        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, zIndex: 10, background: 'rgba(0,0,0,0.6)', border: '1px solid var(--border2)', borderRadius: '50%', width: 36, height: 36, color: 'var(--text)', fontSize: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>×</button>

        {loading && <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}><div className="spinner" /></div>}

        {!loading && movie && (
          <>
            {movie.backdrop && (
              <div style={{ position: 'relative', height: 280, overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
                <img src={movie.backdrop} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, var(--deep) 100%)' }} />
              </div>
            )}

            <div style={{ padding: 32, paddingTop: movie.backdrop ? 0 : 48 }}>
              <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start' }}>
                {movie.poster && (
                  <img src={movie.poster} alt={movie.title} style={{ width: 140, borderRadius: 10, flexShrink: 0, marginTop: movie.backdrop ? -80 : 0, boxShadow: '0 20px 40px rgba(0,0,0,0.5)', border: '2px solid var(--border2)' }} />
                )}
                <div style={{ flex: 1 }}>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 4vw, 34px)', lineHeight: 1.2, marginBottom: 8 }}>
                    {movie.title} <span style={{ color: 'var(--muted)', fontWeight: 300, fontSize: '0.6em' }}>({movie.release_year})</span>
                  </h2>
                  {movie.tagline && <p style={{ color: 'var(--gold)', fontStyle: 'italic', fontSize: 14, marginBottom: 12 }}>"{movie.tagline}"</p>}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16, fontSize: 13, color: 'var(--muted)' }}>
                    {movie.rating && <span>★ <strong style={{ color: 'var(--gold)' }}>{movie.rating}</strong> / 10</span>}
                    {movie.runtime && <span>⏱ {Math.floor(movie.runtime / 60)}h {movie.runtime % 60}m</span>}
                    {movie.release_date && <span>📅 {new Date(movie.release_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>}
                    {movie.director && <span>🎬 {movie.director}</span>}
                  </div>
                  {movie.genres?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                      {movie.genres.map(g => <span key={g} style={{ fontSize: 12, padding: '4px 12px', borderRadius: 100, background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--text)' }}>{g}</span>)}
                    </div>
                  )}

                  {/* Mark as watched button */}
                  {user ? (
                    <button
                      onClick={toggleWatched}
                      disabled={watchLoading}
                      className={watched ? 'btn btn-ghost' : 'btn btn-gold'}
                      style={{ fontSize: 13, padding: '9px 18px', marginTop: 4 }}
                    >
                      {watchLoading ? '...' : watched ? '✓ Watched' : '+ Mark as Watched'}
                    </button>
                  ) : (
                    <p style={{ fontSize: 12, color: 'var(--muted2)', marginTop: 8 }}>Sign in to track this movie</p>
                  )}
                </div>
              </div>

              {movie.overview && (
                <div style={{ marginTop: 24 }}>
                  <h3 style={{ fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 10 }}>Synopsis</h3>
                  <p style={{ fontSize: 15, lineHeight: 1.7 }}>{movie.overview}</p>
                </div>
              )}

              <div style={{ marginTop: 28 }}>
                <h3 style={{ fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>Where to Watch</h3>
                {movie.streaming?.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {movie.streaming.map(p => (
                      <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 8, background: 'var(--surface2)', border: '1px solid var(--border)', fontSize: 13 }}>
                        <img src={p.logo} alt={p.name} style={{ width: 24, height: 24, borderRadius: 4 }} />
                        <span>{p.name}</span>
                        <span style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase' }}>{p.type}</span>
                      </div>
                    ))}
                  </div>
                ) : <p style={{ fontSize: 14, color: 'var(--muted2)' }}>No streaming info available for your region.</p>}
                <p style={{ fontSize: 11, color: 'var(--muted2)', marginTop: 10 }}>Availability shown for India. Data from JustWatch via TMDB.</p>
              </div>

              {movie.cast?.length > 0 && (
                <div style={{ marginTop: 28 }}>
                  <h3 style={{ fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted)', marginBottom: 14 }}>Cast</h3>
                  <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8 }}>
                    {movie.cast.map(c => (
                      <div key={c.name} style={{ flexShrink: 0, textAlign: 'center', width: 80 }}>
                        {c.photo ? <img src={c.photo} alt={c.name} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border2)' }} />
                          : <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>👤</div>}
                        <div style={{ fontSize: 11, marginTop: 6, lineHeight: 1.3 }}>{c.name}</div>
                        <div style={{ fontSize: 10, color: 'var(--muted2)', marginTop: 2 }}>{c.character}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
