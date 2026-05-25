export default function MovieCard({ movie, index = 0 }) {
  return (
    <div className="movie-card fade-up" style={{ animationDelay: `${index * 0.08}s`, opacity: 0 }}>
      <div className="movie-poster">
        {movie.poster
          ? <img src={movie.poster} alt={movie.title} loading="lazy" />
          : <div className="poster-placeholder"><span>🎬</span><span style={{ fontSize: 12, color: 'var(--muted2)' }}>{movie.title}</span></div>
        }
      </div>
      <div className="movie-info">
        <div className="movie-title">{movie.title} {movie.year && <span style={{ color: 'var(--muted)', fontWeight: 300, fontSize: 14 }}>({movie.year})</span>}</div>
        <div className="movie-meta">
          {movie.director && <span>{movie.director}</span>}
          {movie.rating && (
            <span className="movie-rating">★ {movie.rating}</span>
          )}
        </div>
        {movie.cast?.length > 0 && (
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>{movie.cast.slice(0, 3).join(', ')}</div>
        )}
        {movie.why && <p className="movie-why">{movie.why}</p>}
        {movie.mood_tags?.length > 0 && (
          <div className="mood-tags">
            {movie.mood_tags.map(tag => <span key={tag} className="mood-tag">{tag}</span>)}
          </div>
        )}
      </div>
    </div>
  )
}
