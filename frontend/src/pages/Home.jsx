import { Link } from 'react-router-dom'
import { useState, useEffect, useCallback, useRef } from 'react'
import Nav from '../components/Nav'
import MovieModal from '../components/MovieModal'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const GENRES = ['Action','Adventure','Animation','Comedy','Crime','Documentary','Drama','Fantasy','Horror','Mystery','Romance','Sci-Fi','Thriller','War']
const LANGUAGES = ['English','Hindi','Korean','French','Spanish','Japanese','Italian','German','Tamil','Telugu']
const PLATFORMS = ['Netflix','Amazon Prime','Disney+','Apple TV+','Mubi','ZEE5']
const SORT_OPTIONS = [{ label: 'Popularity', value: 'popularity.desc' },{ label: 'Rating', value: 'vote_average.desc' },{ label: 'Newest', value: 'release_date.desc' },{ label: 'Oldest', value: 'release_date.asc' }]
const DECADES = ['1950','1960','1970','1980','1990','2000','2010','2020']
const RUNTIME_OPTIONS = [{ label: 'Any', value: '' },{ label: '< 90 min', value: 'short' },{ label: '2 hr+', value: 'long' }]
const RATINGS = [{ label: 'All', value: 0 },{ label: '6+', value: 6 },{ label: '7+', value: 7 },{ label: '8+', value: 8 },{ label: '9+', value: 9 }]
const AGE_OPTIONS = [{ label: 'Any Era', value: '' },{ label: '🏛 Classic (pre-1975)', value: 'classic' },{ label: '📼 Vintage (1975–2005)', value: 'vintage' },{ label: '🆕 Recent (2005+)', value: 'recent' }]
const MOOD_LABELS = { 1: 'Lightest', 3: 'Light & Easy', 5: 'Balanced', 7: 'Dark & Moody', 10: 'Darkest & Heaviest' }

function getMoodLabel(val) {
  if (val <= 2) return '😊 Light & Easy'
  if (val <= 4) return '😌 Feel-Good'
  if (val <= 6) return '😐 Balanced'
  if (val <= 8) return '😔 Dark & Moody'
  return '💀 Darkest & Heaviest'
}

// Poster card used in both row and grid
function PosterCard({ movie, onClick, width = 150 }) {
  return (
    <div onClick={() => onClick(movie.tmdb_id)} style={{ flexShrink: 0, width, cursor: 'pointer' }}>
      <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--border)', aspectRatio: '2/3', transition: 'all 0.25s' }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.6)'; e.currentTarget.style.borderColor = 'var(--border2)' }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.borderColor = 'var(--border)' }}
      >
        {movie.poster
          ? <img src={movie.poster} alt={movie.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: 'var(--muted2)' }}>🎬</div>
        }
        {movie.rating && <div style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.82)', backdropFilter: 'blur(4px)', borderRadius: 5, padding: '2px 7px', fontSize: 11, color: 'var(--gold)', fontWeight: 600 }}>★ {movie.rating}</div>}
      </div>
      <div style={{ marginTop: 8, paddingRight: 4 }}>
        <div style={{ fontSize: 12, lineHeight: 1.3, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{movie.title}</div>
        <div style={{ fontSize: 11, color: 'var(--muted2)', marginTop: 2 }}>{movie.release_year}{movie.genres?.[0] ? ` · ${movie.genres[0]}` : ''}</div>
      </div>
    </div>
  )
}

// Horizontal scrollable row with See All
function MovieRow({ section, onMovieClick, onSeeAll }) {
  const rowRef = useRef(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)

  function checkScroll() {
    const el = rowRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 10)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10)
  }

  if (!section.movies?.length) return null

  return (
    <div style={{ marginBottom: 44 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', marginBottom: 14 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 19 }}>{section.title}</h2>
        <button onClick={() => onSeeAll(section)} style={{ fontSize: 12, color: 'var(--gold)', background: 'none', border: '1px solid rgba(212,168,67,0.3)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.2s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--gold-dim)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >See All →</button>
      </div>
      <div style={{ position: 'relative' }}>
        {canLeft && (
          <button onClick={() => rowRef.current?.scrollBy({ left: -580, behavior: 'smooth' })} style={{ position: 'absolute', left: 0, top: 0, bottom: 20, width: 44, background: 'linear-gradient(to right, rgba(10,10,10,0.97) 60%, transparent)', border: 'none', color: 'var(--text)', fontSize: 24, cursor: 'pointer', zIndex: 5, display: 'flex', alignItems: 'center', paddingLeft: 8 }}>‹</button>
        )}
        {canRight && (
          <button onClick={() => rowRef.current?.scrollBy({ left: 580, behavior: 'smooth' })} style={{ position: 'absolute', right: 0, top: 0, bottom: 20, width: 44, background: 'linear-gradient(to left, rgba(10,10,10,0.97) 60%, transparent)', border: 'none', color: 'var(--text)', fontSize: 24, cursor: 'pointer', zIndex: 5, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8 }}>›</button>
        )}
        <div ref={rowRef} onScroll={checkScroll} style={{ display: 'flex', gap: 14, overflowX: 'auto', padding: '4px 24px 16px', scrollbarWidth: 'none' }}>
          {section.movies.map((movie, i) => (
            <PosterCard key={movie.tmdb_id + i} movie={movie} onClick={onMovieClick} />
          ))}
        </div>
      </div>
    </div>
  )
}

// Full section grid with infinite scroll
function SectionGrid({ section, onMovieClick, onBack }) {
  const [movies, setMovies] = useState(section.movies || [])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(section.total_pages || 1)
  const [loadingMore, setLoadingMore] = useState(false)
  const loaderRef = useRef(null)
  const loadingMoreRef = useRef(false)
  const pageRef = useRef(1)

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingMoreRef.current && pageRef.current < totalPages) {
        const nextPage = pageRef.current + 1
        loadingMoreRef.current = true
        setLoadingMore(true)
        fetch(`${API}/api/section/${section.id}?page=${nextPage}`)
          .then(r => r.json())
          .then(data => {
            setMovies(prev => [...prev, ...data.movies])
            pageRef.current = data.page
            setPage(data.page)
            setTotalPages(data.total_pages)
          })
          .finally(() => { setLoadingMore(false); loadingMoreRef.current = false })
      }
    }, { threshold: 0.1 })
    const el = loaderRef.current
    if (el) observer.observe(el)
    return () => { if (el) observer.unobserve(el) }
  }, [section.id, totalPages])

  return (
    <div style={{ padding: '0 24px 64px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
        <button onClick={onBack} style={{ background: 'none', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--muted)', padding: '7px 14px', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)' }}>← Back</button>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 26 }}>{section.title}</h2>
        {/* <span style={{ fontSize: 13, color: 'var(--muted2)' }}>{movies.length} movies</span> */}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 20 }}>
        {movies.map((movie, i) => (
          <PosterCard key={`${movie.tmdb_id}-${i}`} movie={movie} onClick={onMovieClick} width="100%" />
        ))}
      </div>
      <div ref={loaderRef} style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 24 }}>
        {loadingMore && <div className="spinner" />}
        {!loadingMore && page >= totalPages && movies.length > 0 && <p style={{ fontSize: 13, color: 'var(--muted2)' }}>All {movies.length} movies loaded ✓</p>}
      </div>
    </div>
  )
}

// Discover grid with infinite scroll
function DiscoverGrid({ filters, onMovieClick }) {
  const [movies, setMovies] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const loaderRef = useRef(null)
  const loadingMoreRef = useRef(false)
  const pageRef = useRef(1)

  const buildUrl = useCallback((pg) => {
    const params = new URLSearchParams({ page: pg })
    Object.entries(filters).forEach(([k, v]) => { if (v !== '' && v !== 0 && v !== false) params.set(k, v) })
    return `${API}/api/discover?${params}`
  }, [filters])

  const fetchPage = useCallback(async (pg, append = false) => {
    if (loadingMoreRef.current && append) return
    loadingMoreRef.current = true
    append ? setLoadingMore(true) : setLoading(true)
    try {
      const res = await fetch(buildUrl(pg))
      const data = await res.json()
      setMovies(prev => append ? [...prev, ...data.movies] : data.movies)
      pageRef.current = data.page; setPage(data.page)
      setTotalPages(data.total_pages)
    } catch (e) { console.error(e) }
    finally { setLoading(false); setLoadingMore(false); loadingMoreRef.current = false }
  }, [buildUrl])

  useEffect(() => { pageRef.current = 1; setMovies([]); fetchPage(1, false) }, [fetchPage])

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !loadingMoreRef.current && pageRef.current < totalPages) fetchPage(pageRef.current + 1, true)
    }, { threshold: 0.1 })
    const el = loaderRef.current
    if (el) observer.observe(el)
    return () => { if (el) observer.unobserve(el) }
  }, [fetchPage, totalPages])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>

  return (
    <div style={{ padding: '0 24px' }}>
      <p style={{ fontSize: 13, color: 'var(--muted2)', marginBottom: 20 }}>{movies.length} results · scroll for more</p>
      {movies.length === 0
        ? <div style={{ textAlign: 'center', padding: 80, color: 'var(--muted)' }}><div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div><p>No movies match your filters.</p></div>
        : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 20, marginBottom: 32 }}>
            {movies.map((movie, i) => <PosterCard key={`${movie.tmdb_id}-${i}`} movie={movie} onClick={onMovieClick} width="100%" />)}
          </div>
      }
      <div ref={loaderRef} style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {loadingMore && <div className="spinner" />}
        {!loadingMore && page >= totalPages && movies.length > 0 && <p style={{ fontSize: 13, color: 'var(--muted2)' }}>All {movies.length} results ✓</p>}
      </div>
    </div>
  )
}

const defaultFilters = { search: '', genre: '', rating: 0, language: '', runtime: '', sort: 'popularity.desc', platform: '', decade: '', director_id: '', mood: 0, age: '', rewatchable: false }

export default function Home() {
  const [sections, setSections] = useState([])
  const [loadingSections, setLoadingSections] = useState(true)
  const [selectedId, setSelectedId] = useState(null)
  const [view, setView] = useState('home') // 'home' | 'section' | 'discover'
  const [activeSection, setActiveSection] = useState(null)
  const [filters, setFilters] = useState(defaultFilters)
  const [searchInput, setSearchInput] = useState('')
  const [directorInput, setDirectorInput] = useState('')
  const [directorPerson, setDirectorPerson] = useState(null)
  const [directorLoading, setDirectorLoading] = useState(false)
  const [showFilterPanel, setShowFilterPanel] = useState(false)

  useEffect(() => {
    fetch(`${API}/api/sections`)
      .then(r => r.json())
      .then(data => { setSections(data.sections || []); setLoadingSections(false) })
      .catch(() => setLoadingSections(false))
  }, [])

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      setFilters(f => ({ ...f, search: searchInput }))
      if (searchInput) setView('discover')
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  // Director lookup
  async function lookupDirector() {
    if (!directorInput.trim()) return
    setDirectorLoading(true)
    try {
      const res = await fetch(`${API}/api/person?name=${encodeURIComponent(directorInput)}`)
      const data = await res.json()
      if (data.person) {
        setDirectorPerson(data.person)
        setFilters(f => ({ ...f, director_id: data.person.id }))
        setView('discover')
      } else {
        setDirectorPerson({ name: 'Not found', id: null })
      }
    } finally { setDirectorLoading(false) }
  }

  function setFilter(key, val) {
    setFilters(f => ({ ...f, [key]: val }))
    setView('discover')
  }

  function clearFilters() {
    setFilters(defaultFilters)
    setSearchInput('')
    setDirectorInput('')
    setDirectorPerson(null)
    setView('home')
  }

  function handleSeeAll(section) {
    setActiveSection(section)
    setView('section')
  }

  const activeFilterCount = [filters.genre, filters.rating, filters.language, filters.runtime, filters.platform, filters.decade, filters.director_id, filters.mood > 0, filters.age, filters.rewatchable].filter(Boolean).length

  return (
    <div className="page">
      <Nav />

      {/* HERO */}
      <section style={{ position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 0, left: '30%', width: 700, height: 400, background: 'radial-gradient(ellipse, rgba(212,168,67,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '60px 40px 52px', display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 56, alignItems: 'center' }}>
          <div className="fade-up">
            <div style={{ fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'var(--gold)', marginBottom: 18 }}>AI-Powered Movie Discovery</div>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(34px, 4.5vw, 60px)', lineHeight: 1.1, marginBottom: 18 }}>
              Find the perfect film<br /><em style={{ color: 'var(--gold)' }}>for this exact moment</em>
            </h1>
            <p style={{ fontSize: 15, color: 'var(--muted)', lineHeight: 1.75, marginBottom: 36, maxWidth: 400 }}>
              Discover movies by mood, watch history, or just describe what you're craving — powered by AI.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <Link to="/quiz" className="btn btn-gold btn-lg">Take the Mood Quiz</Link>
              <Link to="/chat" className="btn btn-ghost btn-lg">Chat with AI →</Link>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="fade-up">
            {[
              { icon: '🎭', title: 'Mood Quiz', desc: '10 questions, perfectly tailored picks for right now.', link: '/quiz' },
              { icon: '💬', title: 'AI Chat', desc: 'Describe it naturally and the AI finds it.', link: '/chat' },
              { icon: '👥', title: 'Watch With', desc: 'Two tastes, compromise picks with match scores.', link: '/watchwith' },
              { icon: '📺', title: 'OTT Info', desc: 'See which platform streams any movie in your region.', link: null },
            ].map((f, i) => (
              <div key={i} onClick={() => f.link && (window.location.href = f.link)}
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 8, transition: 'all 0.2s', cursor: f.link ? 'pointer' : 'default' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.background = 'var(--surface2)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}
              >
                <div style={{ fontSize: 22 }}>{f.icon}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 14 }}>{f.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 }}>{f.desc}</div>
                {f.link && <div style={{ fontSize: 12, color: 'var(--gold)' }}>Try it →</div>}
              </div>
            ))}
          </div>
        </div>
        <div style={{ borderTop: '1px solid var(--border)' }} />
      </section>

      {/* STICKY SEARCH + FILTER BAR */}
      <div style={{ position: 'sticky', top: 65, zIndex: 50, background: 'rgba(10,10,10,0.93)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', padding: '10px 24px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 14, color: 'var(--muted)', pointerEvents: 'none' }}>🔍</span>
            <input type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
              placeholder="Search any movie..."
              style={{ width: '100%', padding: '9px 30px 9px 32px', background: 'var(--surface)', border: `1px solid ${searchInput ? 'var(--gold)' : 'var(--border2)'}`, borderRadius: 8, color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'var(--font-body)' }}
            />
            {searchInput && <button onClick={() => { setSearchInput(''); setFilters(f => ({ ...f, search: '' })) }} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--muted)', fontSize: 16, cursor: 'pointer' }}>×</button>}
          </div>

          {/* Filter toggle */}
          <button onClick={() => setShowFilterPanel(p => !p)}
            style={{ padding: '9px 14px', background: showFilterPanel || activeFilterCount > 0 ? 'var(--gold-dim)' : 'var(--surface)', border: `1px solid ${activeFilterCount > 0 ? 'var(--gold)' : 'var(--border2)'}`, borderRadius: 8, color: activeFilterCount > 0 ? 'var(--gold)' : 'var(--muted)', fontSize: 13, cursor: 'pointer', fontFamily: 'var(--font-body)', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
            ⚙ Filters {activeFilterCount > 0 && <span style={{ background: 'var(--gold)', color: '#1a1000', borderRadius: '50%', width: 18, height: 18, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{activeFilterCount}</span>}
          </button>

          {view !== 'home' && (
            <button onClick={clearFilters} style={{ padding: '9px 14px', background: 'none', border: '1px solid var(--border2)', borderRadius: 8, color: 'var(--muted)', fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', whiteSpace: 'nowrap' }}>← Home</button>
          )}
        </div>

        {/* Filter panel */}
        {showFilterPanel && (
          <div style={{ maxWidth: 1280, margin: '10px auto 0', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Row 1: Genre + Language */}
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div>
                <Label>Genre</Label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <Chip active={!filters.genre} onClick={() => setFilter('genre', '')}>All</Chip>
                  {GENRES.map(g => <Chip key={g} active={filters.genre === g} onClick={() => setFilter('genre', g === filters.genre ? '' : g)}>{g}</Chip>)}
                </div>
              </div>
              <div>
                <Label>Language</Label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  <Chip active={!filters.language} onClick={() => setFilter('language', '')}>Any</Chip>
                  {LANGUAGES.map(l => <Chip key={l} active={filters.language === l} onClick={() => setFilter('language', l === filters.language ? '' : l)}>{l}</Chip>)}
                </div>
              </div>
            </div>

            {/* Row 2: Rating + Runtime + Decade + Sort */}
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div>
                <Label>IMDb Rating</Label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {RATINGS.map(r => <Chip key={r.label} active={filters.rating === r.value} onClick={() => setFilter('rating', r.value === filters.rating ? 0 : r.value)}>{r.value > 0 ? `★ ${r.label}` : r.label}</Chip>)}
                </div>
              </div>
              <div>
                <Label>Runtime</Label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {RUNTIME_OPTIONS.map(r => <Chip key={r.label} active={filters.runtime === r.value} onClick={() => setFilter('runtime', r.value === filters.runtime ? '' : r.value)}>{r.label}</Chip>)}
                </div>
              </div>
              <div>
                <Label>Decade</Label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <Chip active={!filters.decade} onClick={() => setFilter('decade', '')}>Any</Chip>
                  {DECADES.map(d => <Chip key={d} active={filters.decade === d} onClick={() => setFilter('decade', d === filters.decade ? '' : d)}>{d}s</Chip>)}
                </div>
              </div>
              <div>
                <Label>Sort by</Label>
                <div style={{ display: 'flex', gap: 6 }}>
                  {SORT_OPTIONS.map(s => <Chip key={s.value} active={filters.sort === s.value} onClick={() => setFilter('sort', s.value)}>{s.label}</Chip>)}
                </div>
              </div>
            </div>

            {/* Row 3: Platform */}
            <div>
              <Label>Streaming Platform</Label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                <Chip active={!filters.platform} onClick={() => setFilter('platform', '')}>All</Chip>
                {PLATFORMS.map(p => <Chip key={p} active={filters.platform === p} onClick={() => setFilter('platform', p === filters.platform ? '' : p)}>{p}</Chip>)}
              </div>
            </div>

            {/* Row 4: UNIQUE filters */}
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 16, display: 'flex', gap: 32, flexWrap: 'wrap' }}>
              <div style={{ fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '0.1em', width: '100%', marginBottom: -8 }}>✦ Unique Filters</div>

              {/* Director search */}
              <div>
                <Label>🎬 Director</Label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input type="text" value={directorInput} onChange={e => setDirectorInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookupDirector()}
                    placeholder="e.g. Christopher Nolan"
                    style={{ padding: '7px 12px', background: 'var(--surface2)', border: `1px solid ${directorPerson?.id ? 'var(--gold)' : 'var(--border)'}`, borderRadius: 8, color: 'var(--text)', fontSize: 12, outline: 'none', fontFamily: 'var(--font-body)', width: 200 }}
                  />
                  <button onClick={lookupDirector} disabled={directorLoading} style={{ padding: '7px 12px', background: 'var(--gold)', border: 'none', borderRadius: 8, fontSize: 12, cursor: 'pointer', fontFamily: 'var(--font-body)', color: '#1a1000' }}>
                    {directorLoading ? '...' : 'Search'}
                  </button>
                  {directorPerson && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: directorPerson.id ? 'var(--gold)' : 'var(--red)' }}>
                      {directorPerson.photo && <img src={directorPerson.photo} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />}
                      {directorPerson.id ? `✓ ${directorPerson.name}` : 'Not found'}
                      {directorPerson.id && <button onClick={() => { setDirectorPerson(null); setDirectorInput(''); setFilter('director_id', '') }} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 14 }}>×</button>}
                    </div>
                  )}
                </div>
              </div>

              {/* Mood Score slider */}
              <div style={{ minWidth: 280 }}>
                <Label>🌡️ Mood Score — {filters.mood > 0 ? getMoodLabel(filters.mood) : 'Any'}</Label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>😊 Light</span>
                  <input type="range" min="0" max="10" value={filters.mood}
                    onChange={e => setFilter('mood', parseInt(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--gold)', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: 11, color: 'var(--muted)', whiteSpace: 'nowrap' }}>💀 Dark</span>
                </div>
                {filters.mood > 0 && <div style={{ fontSize: 12, color: 'var(--gold)', marginTop: 4 }}>{getMoodLabel(filters.mood)}</div>}
              </div>

              {/* Age of Film */}
              <div>
                <Label>💀 Age of Film</Label>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {AGE_OPTIONS.map(a => <Chip key={a.value} active={filters.age === a.value} onClick={() => setFilter('age', a.value === filters.age ? '' : a.value)}>{a.label}</Chip>)}
                </div>
              </div>

              {/* Rewatchability */}
              <div>
                <Label>🔁 Rewatchability</Label>
                <Chip active={filters.rewatchable} onClick={() => setFilter('rewatchable', !filters.rewatchable)}>
                  {filters.rewatchable ? '✓ Must-Rewatch Only' : 'Show Must-Rewatch Films'}
                </Chip>
                <div style={{ fontSize: 11, color: 'var(--muted2)', marginTop: 6 }}>High votes + high rating = beloved rewatchables</div>
              </div>
            </div>

            {/* Clear */}
            {activeFilterCount > 0 && (
              <div>
                <button onClick={clearFilters} style={{ fontSize: 12, color: 'var(--muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 6, padding: '6px 14px', cursor: 'pointer', fontFamily: 'var(--font-body)' }}>✕ Clear all filters</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONTENT */}
      <div style={{ maxWidth: 1280, margin: '0 auto', width: '100%', paddingTop: 36, paddingBottom: 64 }}>
        {view === 'section' && activeSection && (
          <SectionGrid section={activeSection} onMovieClick={setSelectedId} onBack={() => setView('home')} />
        )}
        {view === 'discover' && (
          <DiscoverGrid filters={filters} onMovieClick={setSelectedId} />
        )}
        {view === 'home' && (
          <>
            {loadingSections && <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><div className="spinner" /></div>}
            {sections.map(section => (
              <MovieRow key={section.id} section={section} onMovieClick={setSelectedId} onSeeAll={handleSeeAll} />
            ))}
          </>
        )}
      </div>

      <footer style={{ padding: '20px 40px', borderTop: '1px solid var(--border)', textAlign: 'center', fontSize: 12, color: 'var(--muted2)' }}>
        Built with Groq AI + TMDB · CineMatch
      </footer>

      {selectedId && <MovieModal tmdbId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  )
}

function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ padding: '5px 13px', borderRadius: 100, fontSize: 12, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s', background: active ? 'var(--gold)' : 'var(--surface2)', color: active ? '#1a1000' : 'var(--muted)', outline: active ? 'none' : '1px solid var(--border)' }}>
      {children}
    </button>
  )
}

function Label({ children }) {
  return <div style={{ fontSize: 11, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'block' }}>{children}</div>
}
