import { useState, useRef, useEffect } from 'react'
import Nav from '../components/Nav'
import MovieCard from '../components/MovieCard'
import MovieModal from '../components/MovieModal'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const SUGGESTIONS = [
  "Something like Inception but less confusing",
  "Brad Pitt movies where he plays a villain",
  "Best horror films that aren't actually scary",
  "A feel-good movie for a rainy Sunday",
  "Underrated sci-fi from the 2000s",
  "Movies with stunning cinematography"
]

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Hey! I'm CineMatch. Tell me what kind of movie you're looking for — describe a vibe, mention an actor, or say something like \"a movie like Fight Club but lighter\". I'll find the perfect match.",
      movies: []
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send(text) {
    const msg = text || input.trim()
    if (!msg || loading) return
    setInput('')
    setMessages(prev => [...prev, { role: 'user', text: msg }])
    setLoading(true)

    try {
      const res = await fetch(`${API}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ message: msg })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setMessages(prev => [...prev, {
        role: 'assistant',
        text: data.reply,
        movies: data.movies || []
      }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: 'Sorry, something went wrong. Try again!', movies: [] }])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  async function resetChat() {
    await fetch(`${API}/api/chat/reset`, { method: 'POST', credentials: 'include' })
    setMessages([{ role: 'assistant', text: "Fresh start! What kind of movie are you in the mood for?", movies: [] }])
  }

  return (
    <div className="page" style={{ height: '100vh', overflow: 'hidden' }}>
      <Nav />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 900, margin: '0 auto', width: '100%', padding: '0 24px', overflow: 'hidden', height: 'calc(100vh - 65px)' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 0', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 22 }}>Movie Concierge</h1>
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Ask me anything about movies</p>
          </div>
          <button className="btn btn-ghost" onClick={resetChat} style={{ fontSize: 12, padding: '8px 16px' }}>↺ New chat</button>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: 24, paddingBottom: 8 }}>
          {messages.map((msg, i) => (
            <div key={i} style={{ marginBottom: 28 }}>
              <div style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'assistant' && (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gold-dim)', border: '1px solid rgba(212,168,67,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, marginRight: 10, flexShrink: 0, marginTop: 2 }}>
                    🎬
                  </div>
                )}
                <div style={{
                  maxWidth: '75%', padding: '12px 16px',
                  borderRadius: msg.role === 'user' ? '12px 12px 4px 12px' : '12px 12px 12px 4px',
                  background: msg.role === 'user' ? 'var(--gold)' : 'var(--surface)',
                  color: msg.role === 'user' ? '#1a1000' : 'var(--text)',
                  border: msg.role === 'assistant' ? '1px solid var(--border)' : 'none',
                  fontSize: 14, lineHeight: 1.6,
                  fontWeight: msg.role === 'user' ? 400 : 300
                }}>
                  {msg.text}
                </div>
              </div>

              {/* Movie grid — always 4 per row */}
              {msg.movies?.length > 0 && (
                <div style={{ marginTop: 16, marginLeft: 42 }}>
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: 12
                  }}>
                    {msg.movies.map((movie, mi) => (
                      <div key={movie.title + mi} onClick={() => movie.tmdb_id && setSelectedId(movie.tmdb_id)}
                        style={{ cursor: movie.tmdb_id ? 'pointer' : 'default', display: 'flex', flexDirection: 'column' }}>
                        {/* Poster */}
                        <div style={{ borderRadius: 10, overflow: 'hidden', aspectRatio: '2/3', background: 'var(--surface2)', flexShrink: 0 }}>
                          {movie.poster
                            ? <img src={movie.poster} alt={movie.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🎬</div>
                          }
                        </div>
                        {/* Info */}
                        <div style={{ padding: '8px 4px' }}>
                          <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, lineHeight: 1.3, marginBottom: 3, color: 'var(--text)' }}>{movie.title}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{movie.year}{movie.director ? ` · ${movie.director}` : ''}</div>
                          {movie.why && <div style={{ fontSize: 11, color: 'var(--muted2)', lineHeight: 1.4 }}>{movie.why}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                  {/* More like this */}
                  {msg.role === 'assistant' && msg.movies?.length > 0 && i === messages.length - 1 && (
                    <button onClick={() => send('Give me 4 more movies like these')}
                      style={{ marginTop: 12, fontSize: 12, padding: '7px 16px', background: 'transparent',
                        border: '1px solid var(--border)', borderRadius: 100, color: 'var(--muted)',
                        cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s' }}
                      onMouseEnter={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.color = 'var(--gold)' }}
                      onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--muted)' }}>
                      ✨ More like these
                    </button>
                  )}
                </div>
              )}

              {/* Suggestion chips after first message */}
              {i === 0 && (
                <div style={{ marginTop: 16, marginLeft: 42, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => send(s)} style={{
                      fontSize: 12, padding: '8px 14px', background: 'var(--surface)',
                      border: '1px solid var(--border)', borderRadius: 100, color: 'var(--muted)',
                      cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'var(--font-body)'
                    }}
                      onMouseEnter={e => { e.target.style.borderColor = 'var(--gold)'; e.target.style.color = 'var(--gold)' }}
                      onMouseLeave={e => { e.target.style.borderColor = 'var(--border)'; e.target.style.color = 'var(--muted)' }}>
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--gold-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}>🎬</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {[0, 1, 2].map(i => (
                  <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--gold)', opacity: 0.5, animation: `bounce 1s ease infinite ${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div style={{ padding: '16px 0 24px', flexShrink: 0, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder="e.g. Brad Pitt movies where he's funny..."
              disabled={loading}
              style={{ flex: 1, padding: '14px 18px', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: 14, outline: 'none', fontFamily: 'var(--font-body)' }}
            />
            <button className="btn btn-gold" onClick={() => send()} disabled={loading || !input.trim()} style={{ padding: '14px 20px' }}>
              Send
            </button>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted2)', marginTop: 8, textAlign: 'center' }}>
            The AI remembers your conversation context
          </div>
        </div>
      </div>

      <style>{`@keyframes bounce { 0%, 100% { transform: translateY(0); opacity: 0.5; } 50% { transform: translateY(-6px); opacity: 1; } }`}</style>

      {selectedId && <MovieModal tmdbId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  )
}
