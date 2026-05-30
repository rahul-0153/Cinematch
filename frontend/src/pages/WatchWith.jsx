import { useState, useRef } from 'react'
import Nav from '../components/Nav'
import MovieCard from '../components/MovieCard'
import MovieModal from '../components/MovieModal'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const GENRES = ['Action', 'Comedy', 'Drama', 'Horror', 'Romance', 'Sci-Fi', 'Thriller', 'Animation', 'Documentary', 'Fantasy', 'Mystery', 'Adventure']
const MOODS = ['Relaxed & cozy', 'Excited & energetic', 'Emotional & deep', 'Fun & lighthearted', 'Thrilled & on-edge', 'Inspired & motivated']

function PersonForm({ person, label, onChange }) {
  function toggleGenre(g) {
    const genres = person.genres.includes(g) ? person.genres.filter(x => x !== g) : [...person.genres, g]
    onChange({ ...person, genres })
  }

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 28 }}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 20, color: 'var(--gold)' }}>{label}</h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={labelStyle}>Your name</label>
          <input value={person.name} onChange={e => onChange({ ...person, name: e.target.value })} placeholder="e.g. Rahul" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Favourite genres</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {GENRES.map(g => (
              <button key={g} onClick={() => toggleGenre(g)} style={{
                padding: '6px 14px', borderRadius: 100, fontSize: 12, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                background: person.genres.includes(g) ? 'var(--gold)' : 'var(--surface2)',
                color: person.genres.includes(g) ? '#1a1000' : 'var(--muted)',
                outline: person.genres.includes(g) ? 'none' : '1px solid var(--border)'
              }}>{g}</button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>A movie you love</label>
          <input value={person.movies} onChange={e => onChange({ ...person, movies: e.target.value })} placeholder="e.g. Interstellar, The Dark Knight" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Mood tonight</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {MOODS.map(m => (
              <button key={m} onClick={() => onChange({ ...person, mood: m })} style={{
                padding: '6px 14px', borderRadius: 100, fontSize: 12, border: 'none', cursor: 'pointer',
                fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                background: person.mood === m ? 'var(--gold)' : 'var(--surface2)',
                color: person.mood === m ? '#1a1000' : 'var(--muted)',
                outline: person.mood === m ? 'none' : '1px solid var(--border)'
              }}>{m}</button>
            ))}
          </div>
        </div>

        <div>
          <label style={labelStyle}>Avoid (optional)</label>
          <input value={person.avoid} onChange={e => onChange({ ...person, avoid: e.target.value })} placeholder="e.g. no horror, no subtitles" style={inputStyle} />
        </div>
      </div>
    </div>
  )
}

const defaultPerson = { name: '', genres: [], movies: '', mood: '', avoid: '' }

export default function WatchWith() {
  const [person1, setPerson1] = useState({ ...defaultPerson })
  const [person2, setPerson2] = useState({ ...defaultPerson })
  const [movies, setMovies] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const seenTitles = useRef(new Set())

  async function findMovies(append = false) {
    if (!person1.name || !person2.name) return setError('Both names are required')
    if (!person1.genres.length || !person2.genres.length) return setError('Both people need to pick at least one genre')
    if (!person1.mood || !person2.mood) return setError('Both people need to pick a mood')
    setError('')
    if (!append) {
      seenTitles.current = new Set()
      setLoading(true)
    } else {
      setLoadingMore(true)
    }
    try {
      const exclude = [...seenTitles.current]
      const res = await fetch(`${API}/api/watchwith`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          person1: { ...person1, genres: person1.genres.join(', ') },
          person2: { ...person2, genres: person2.genres.join(', ') },
          exclude
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      const newMovies = (data.movies || []).filter(m => !seenTitles.current.has(m.title))
      newMovies.forEach(m => seenTitles.current.add(m.title))
      setMovies(prev => append ? [...prev, ...newMovies] : newMovies)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  return (
    <div className="page">
      <Nav />
      <div style={{ maxWidth: 1100, margin: '0 auto', width: '100%', padding: '48px 24px' }}>

        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>AI Movie Matchmaker</div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 48px)', marginBottom: 16 }}>Watch With Someone</h1>
          <p style={{ color: 'var(--muted)', fontSize: 15, maxWidth: 480, margin: '0 auto' }}>
            Can't agree on what to watch? Enter both your tastes and the AI will find movies you'll both love.
          </p>
        </div>

        {/* Two person forms */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24, marginBottom: 32 }}>
          <PersonForm label="Person 1" person={person1} onChange={setPerson1} />
          <PersonForm label="Person 2" person={person2} onChange={setPerson2} />
        </div>

        {error && <p style={{ textAlign: 'center', color: '#e05252', fontSize: 14, marginBottom: 16 }}>{error}</p>}

        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <button className="btn btn-gold btn-lg" onClick={findMovies} disabled={loading}>
            {loading
              ? <><span className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Finding your perfect match...</>
              : '🎬 Find Movies for Both of Us'
            }
          </button>
        </div>

        {/* Results */}
        {movies.length > 0 && (
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 8, textAlign: 'center' }}>
              Perfect matches for {person1.name} & {person2.name}
            </h2>
            <p style={{ textAlign: 'center', color: 'var(--muted)', fontSize: 14, marginBottom: 32 }}>Movies both of you will enjoy, with reasons for each person</p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {movies.map((movie, i) => (
                <div key={movie.title + i} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', display: 'flex', gap: 0 }}>

                  {/* Poster */}
                  <div style={{ width: 120, flexShrink: 0, cursor: 'pointer' }} onClick={() => movie.tmdb_id && setSelectedId(movie.tmdb_id)}>
                    {movie.poster
                      ? <img src={movie.poster} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', minHeight: 180, background: 'var(--surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🎬</div>
                    }
                  </div>

                  {/* Info */}
                  <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 4 }}>{movie.title} <span style={{ color: 'var(--muted)', fontWeight: 300, fontSize: 14 }}>({movie.year})</span></h3>
                        <div style={{ fontSize: 13, color: 'var(--muted)' }}>{movie.director} · {movie.genres?.slice(0, 3).join(', ')}</div>
                      </div>
                      {movie.match_score && (
                        <div style={{ background: 'var(--gold-dim)', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 8, padding: '6px 14px', textAlign: 'center', flexShrink: 0 }}>
                          <div style={{ color: 'var(--gold)', fontSize: 20, fontWeight: 700 }}>{movie.match_score}%</div>
                          <div style={{ fontSize: 10, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>match</div>
                        </div>
                      )}
                    </div>

                    {/* Why each person */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                      <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 14 }}>
                        <div style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{person1.name}</div>
                        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{movie.why_person1}</p>
                      </div>
                      <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: 14 }}>
                        <div style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{person2.name}</div>
                        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.5 }}>{movie.why_person2}</p>
                      </div>
                    </div>

                    {movie.mood_tags?.length > 0 && (
                      <div className="mood-tags">
                        {movie.mood_tags.map(t => <span key={t} className="mood-tag">{t}</span>)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Load More */}
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <button className="btn btn-ghost" onClick={() => findMovies(true)} disabled={loadingMore} style={{ padding: '12px 32px', fontSize: 14 }}>
                {loadingMore
                  ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} /> Finding more...</>
                  : '✨ Load More Picks'
                }
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedId && <MovieModal tmdbId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  )
}

const labelStyle = { fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 8 }
const inputStyle = { padding: '11px 14px', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)', width: '100%' }
