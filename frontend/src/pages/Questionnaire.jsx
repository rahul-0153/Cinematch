import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Nav from '../components/Nav'

const QUESTIONS = [
  {
    id: 1,
    question: "How would you describe your mood right now?",
    type: 'choice',
    options: ['Happy & energetic', 'Melancholic & reflective', 'Stressed & need escape', 'Bored & restless', 'Romantic & dreamy', 'Excited & adventurous']
  },
  {
    id: 2,
    question: "How much time do you have?",
    type: 'choice',
    options: ['Under 90 minutes', 'About 2 hours', '2–3 hours', 'As long as it takes']
  },
  {
    id: 3,
    question: "What do you want to feel after watching?",
    type: 'choice',
    options: ['Inspired & motivated', 'Happy & uplifted', 'Emotionally moved', 'Thrilled & pumped', 'Creeped out (in a good way)', 'Mentally stimulated']
  },
  {
    id: 4,
    question: "Pick the vibe that appeals to you most right now",
    type: 'choice',
    options: ['Fast-paced action', 'Slow burn & atmospheric', 'Witty dialogue & comedy', 'Heartwarming story', 'Mind-bending twists', 'Beautiful cinematography']
  },
  {
    id: 5,
    question: "Are you watching alone or with someone?",
    type: 'choice',
    options: ['Solo — my full attention', 'Partner / date night', 'Friends / group', 'Family including kids']
  },
  {
    id: 6,
    question: "How do you feel about subtitles?",
    type: 'choice',
    options: ["Love them — foreign films are great", "Fine with them occasionally", "Prefer English language", "No subtitles please"]
  },
  {
    id: 7,
    question: "What era of film are you in the mood for?",
    type: 'choice',
    options: ['Classic (pre-1980)', '80s & 90s nostalgia', '2000s–2010s', 'Recent (last 5 years)', 'No preference']
  },
  {
    id: 8,
    question: "Name a movie you loved recently",
    type: 'text',
    placeholder: 'e.g. Oppenheimer, The Bear, Interstellar...'
  },
  {
    id: 9,
    question: "Any genres or themes to avoid?",
    type: 'text',
    placeholder: 'e.g. no horror, no sad endings, nothing too violent...'
  },
  {
    id: 10,
    question: "One word to describe what tonight calls for",
    type: 'text',
    placeholder: 'e.g. cozy, intense, hilarious, cathartic...'
  }
]

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function Questionnaire() {
  const [current, setCurrent] = useState(0)
  const [answers, setAnswers] = useState({})
  const [textValue, setTextValue] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const q = QUESTIONS[current]
  const totalAnswered = Object.keys(answers).length
  const progress = (current / QUESTIONS.length) * 100

  function handleChoice(option) {
    const newAnswers = { ...answers, [q.id]: option }
    setAnswers(newAnswers)
    if (current < QUESTIONS.length - 1) {
      setTimeout(() => setCurrent(c => c + 1), 200)
    }
  }

  function handleText() {
    if (!textValue.trim()) return
    const newAnswers = { ...answers, [q.id]: textValue.trim() }
    setAnswers(newAnswers)
    setTextValue('')
    if (current < QUESTIONS.length - 1) {
      setCurrent(c => c + 1)
    }
  }

  async function handleSubmit() {
    const allAnswers = QUESTIONS.map(q => ({
      question: q.question,
      answer: answers[q.id] || 'No preference'
    }))

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ answers: allAnswers })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      navigate('/results', { state: { movies: data.movies, source: 'quiz' } })
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const isLast = current === QUESTIONS.length - 1
  const canSubmit = Object.keys(answers).length >= 7

  return (
    <div className="page">
      <Nav />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', maxWidth: 680, margin: '0 auto', width: '100%', padding: '48px 24px' }}>

        {/* Progress */}
        <div style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--muted)', marginBottom: 10 }}>
            <span>Question {current + 1} of {QUESTIONS.length}</span>
            <span>{Math.round(progress)}% complete</span>
          </div>
          <div style={{ height: 2, background: 'var(--surface2)', borderRadius: 1 }}>
            <div style={{ height: '100%', background: 'var(--gold)', borderRadius: 1, width: `${progress}%`, transition: 'width 0.4s ease' }} />
          </div>
        </div>

        {/* Question */}
        <div key={current} className="fade-up" style={{ flex: 1 }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(22px, 4vw, 32px)', lineHeight: 1.3, marginBottom: 36, fontWeight: 400 }}>
            {q.question}
          </h2>

          {q.type === 'choice' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
              {q.options.map(opt => (
                <button
                  key={opt}
                  onClick={() => handleChoice(opt)}
                  style={{
                    padding: '16px 20px',
                    background: answers[q.id] === opt ? 'var(--gold-dim)' : 'var(--surface)',
                    border: `1px solid ${answers[q.id] === opt ? 'var(--gold)' : 'var(--border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    color: answers[q.id] === opt ? 'var(--gold)' : 'var(--text)',
                    textAlign: 'left',
                    fontSize: 14,
                    transition: 'all 0.15s',
                    fontFamily: 'var(--font-body)',
                    lineHeight: 1.4
                  }}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}

          {q.type === 'text' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input
                type="text"
                value={textValue}
                onChange={e => setTextValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleText()}
                placeholder={q.placeholder}
                style={{
                  padding: '16px 20px',
                  background: 'var(--surface)',
                  border: '1px solid var(--border2)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text)',
                  fontSize: 16,
                  outline: 'none',
                  fontFamily: 'var(--font-body)',
                  width: '100%'
                }}
                autoFocus
              />
              {answers[q.id] && (
                <div style={{ fontSize: 13, color: 'var(--gold)' }}>✓ "{answers[q.id]}"</div>
              )}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn btn-gold" onClick={handleText} disabled={!textValue.trim()}>Confirm →</button>
                <button className="btn btn-ghost" onClick={() => { setAnswers({ ...answers, [q.id]: 'No preference' }); setCurrent(c => Math.min(c + 1, QUESTIONS.length - 1)) }}>Skip</button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
          <button className="btn btn-ghost" onClick={() => setCurrent(c => Math.max(0, c - 1))} disabled={current === 0} style={{ fontSize: 13 }}>
            ← Back
          </button>

          <div style={{ display: 'flex', gap: 8 }}>
            {current < QUESTIONS.length - 1 && answers[q.id] && (
              <button className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => setCurrent(c => c + 1)}>Next →</button>
            )}
            {(isLast || canSubmit) && (
              <button className="btn btn-gold" onClick={handleSubmit} disabled={loading || !canSubmit}>
                {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderWidth: 1.5 }} />Finding films...</> : '✨ Get My Recommendations'}
              </button>
            )}
          </div>
        </div>

        {error && <div style={{ marginTop: 16, color: 'var(--red)', fontSize: 14 }}>{error}</div>}
      </div>
    </div>
  )
}
