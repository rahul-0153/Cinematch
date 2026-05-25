import { useLocation, Link } from 'react-router-dom'
import Nav from '../components/Nav'
import MovieCard from '../components/MovieCard'

export default function Results() {
  const { state } = useLocation()
  const movies = state?.movies || []

  if (!movies.length) {
    return (
      <div className="page">
        <Nav />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <div style={{ fontSize: 48 }}>🎬</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 24 }}>No results found</h2>
          <Link to="/quiz" className="btn btn-gold">Take the Quiz</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <Nav />
      <div style={{ maxWidth: 1200, margin: '0 auto', width: '100%', padding: '48px 24px' }}>

        <div style={{ marginBottom: 48 }}>
          <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 12 }}>
            Curated for your mood
          </div>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(28px, 5vw, 48px)', marginBottom: 16 }}>
            Your film recommendations
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: 15 }}>
            {movies.length} films selected based on {state?.source === 'quiz' ? 'your mood quiz' : 'your request'}.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 24, marginBottom: 48 }}>
          {movies.map((movie, i) => (
            <MovieCard key={movie.title + i} movie={movie} index={i} />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <Link to="/quiz" className="btn btn-ghost">↩ Retake Quiz</Link>
          <Link to="/chat" className="btn btn-gold">Chat for more →</Link>
        </div>
      </div>
    </div>
  )
}
