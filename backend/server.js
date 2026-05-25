import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import Groq from 'groq-sdk';
import axios from 'axios';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'cinematch-jwt-secret-dev';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const TMDB_KEY = process.env.TMDB_API_KEY;

// ─── MongoDB connection ───────────────────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cinematch')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err.message));

// ─── Schemas ──────────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const watchedSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  tmdb_id: { type: Number, required: true },
  title: String,
  poster: String,
  genres: [String],
  rating: String,
  release_year: String,
  watchedAt: { type: Date, default: Date.now }
});

watchedSchema.index({ userId: 1, tmdb_id: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);
const Watched = mongoose.model('Watched', watchedSchema);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'cinematch-secret-dev',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

// ─── Auth middleware ──────────────────────────────────────────────────────────
function authMiddleware(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ─── TMDB helpers ─────────────────────────────────────────────────────────────
async function searchTMDB(title) {
  if (!TMDB_KEY) return null;
  try {
    const res = await axios.get('https://api.themoviedb.org/3/search/movie', {
      params: { api_key: TMDB_KEY, query: title, language: 'en-US', page: 1 }
    });
    const movie = res.data.results?.[0];
    if (!movie) return null;
    return {
      tmdb_id: movie.id,
      poster: movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : null,
      backdrop: movie.backdrop_path ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}` : null,
      rating: movie.vote_average?.toFixed(1),
      vote_count: movie.vote_count,
      release_year: movie.release_date?.split('-')[0],
      overview: movie.overview,
      genres: [],
    };
  } catch { return null; }
}

async function enrichMovies(movies) {
  return Promise.all(movies.map(async (m) => {
    const tmdb = await searchTMDB(m.title);
    return { ...m, ...tmdb };
  }));
}

// ─── AUTH ROUTES ──────────────────────────────────────────────────────────────

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  try {
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hashed });
    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password required' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid email or password' });
    const token = jwt.sign({ id: user._id, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// ─── WATCH HISTORY ROUTES ─────────────────────────────────────────────────────

app.post('/api/history', authMiddleware, async (req, res) => {
  const { tmdb_id, title, poster, genres, rating, release_year } = req.body;
  if (!tmdb_id) return res.status(400).json({ error: 'tmdb_id required' });
  try {
    await Watched.findOneAndUpdate(
      { userId: req.user.id, tmdb_id },
      { userId: req.user.id, tmdb_id, title, poster, genres, rating, release_year, watchedAt: new Date() },
      { upsert: true, new: true }
    );
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save' });
  }
});

app.delete('/api/history/:tmdb_id', authMiddleware, async (req, res) => {
  try {
    await Watched.deleteOne({ userId: req.user.id, tmdb_id: parseInt(req.params.tmdb_id) });
    res.json({ ok: true });
  } catch {
    res.status(500).json({ error: 'Failed to remove' });
  }
});

app.get('/api/history', authMiddleware, async (req, res) => {
  try {
    const history = await Watched.find({ userId: req.user.id }).sort({ watchedAt: -1 });
    res.json({ history });
  } catch {
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ─── FOR YOU ROUTE ────────────────────────────────────────────────────────────

app.get('/api/foryou', authMiddleware, async (req, res) => {
  try {
    const history = await Watched.find({ userId: req.user.id }).sort({ watchedAt: -1 }).limit(20);
    if (history.length < 3) {
      return res.json({ movies: [], message: 'Watch at least 3 movies to get personalized recommendations' });
    }

    const historyText = history.map(m => `- ${m.title} (${m.release_year}) [${m.genres?.join(', ')}]`).join('\n');

    const prompt = `You are a world-class film curator. Based on this user's watch history, recommend 6 movies they haven't seen yet.

Watch history:
${historyText}

Analyze their taste patterns (genres, eras, tone) and recommend movies that match their preferences but they likely haven't watched.
Do NOT recommend any movie already in their watch history.

Respond ONLY with a valid JSON array, no markdown:
[
  {
    "title": "Movie Title",
    "year": 2015,
    "director": "Director Name",
    "cast": ["Actor 1", "Actor 2"],
    "genres": ["Genre1", "Genre2"],
    "why": "1-2 sentence explanation of why this matches their specific taste based on what they've watched",
    "mood_tags": ["tag1", "tag2"]
  }
]`;

    const message = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    let raw = message.choices[0].message.content.trim().replace(/```json|```/g, '').trim();
    const movies = JSON.parse(raw);
    const enriched = await enrichMovies(movies);
    res.json({ movies: enriched });
  } catch (err) {
    console.error('ForYou error:', err);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// ─── WATCH WITH ROUTE ─────────────────────────────────────────────────────────

app.post('/api/watchwith', async (req, res) => {
  const { person1, person2 } = req.body;
  if (!person1 || !person2) return res.status(400).json({ error: 'Both profiles required' });

  const prompt = `You are a movie matchmaker. Two people want to watch a movie together but have different tastes. Find 5 perfect compromise movies both will enjoy.

Person 1 (${person1.name}):
- Favourite genres: ${person1.genres}
- Favourite movies: ${person1.movies}
- Mood tonight: ${person1.mood}
- Avoid: ${person1.avoid || 'nothing specific'}

Person 2 (${person2.name}):
- Favourite genres: ${person2.genres}
- Favourite movies: ${person2.movies}
- Mood tonight: ${person2.mood}
- Avoid: ${person2.avoid || 'nothing specific'}

Find movies that genuinely satisfy BOTH people. Be creative — find the real overlap.

Respond ONLY with valid JSON, no markdown:
[
  {
    "title": "Movie Title",
    "year": 2018,
    "director": "Director Name",
    "cast": ["Actor 1", "Actor 2"],
    "genres": ["Genre1", "Genre2"],
    "why_person1": "Why ${person1.name} will love this",
    "why_person2": "Why ${person2.name} will love this",
    "match_score": 92,
    "mood_tags": ["tag1", "tag2"]
  }
]`;

  try {
    const message = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    let raw = message.choices[0].message.content.trim().replace(/```json|```/g, '').trim();
    const movies = JSON.parse(raw);
    const enriched = await enrichMovies(movies);
    res.json({ movies: enriched });
  } catch (err) {
    console.error('WatchWith error:', err);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// ─── EXISTING ROUTES ──────────────────────────────────────────────────────────

app.post('/api/recommend', async (req, res) => {
  const { answers } = req.body;
  if (!answers || !Array.isArray(answers)) return res.status(400).json({ error: 'answers array required' });

  const prompt = `You are a world-class movie sommelier. Based on the following user questionnaire answers, recommend exactly 5 movies.

User's answers:
${answers.map((a, i) => `Q${i + 1}: ${a.question}\nA: ${a.answer}`).join('\n\n')}

Respond ONLY with a valid JSON array (no markdown, no explanation). Format:
[
  {
    "title": "Movie Title",
    "year": 2010,
    "director": "Director Name",
    "cast": ["Actor 1", "Actor 2"],
    "genres": ["Genre1", "Genre2"],
    "why": "2-sentence personalized explanation of why this matches their mood and preferences",
    "mood_tags": ["tag1", "tag2", "tag3"]
  }
]`;

  try {
    const message = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });
    let raw = message.choices[0].message.content.trim().replace(/```json|```/g, '').trim();
    const movies = JSON.parse(raw);
    const enriched = await enrichMovies(movies);
    res.json({ movies: enriched });
  } catch (err) {
    console.error('Recommend error:', err);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

app.post('/api/chat', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: 'message required' });
  if (!req.session.chatHistory) req.session.chatHistory = [];
  req.session.chatHistory.push({ role: 'user', content: message });

  const systemPrompt = `You are CineMatch, an expert movie recommendation assistant with encyclopedic knowledge of cinema.
When recommending movies, ALWAYS respond with valid JSON:
{"reply": "Your conversational response", "movies": [{"title":"","year":0,"director":"","cast":[],"genres":[],"why":"","mood_tags":[]}]}
If not recommending, set "movies" to []. No markdown, pure JSON only.`;

  try {
    const message_obj = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 2000,
      messages: [{ role: 'system', content: systemPrompt }, ...req.session.chatHistory]
    });
    const rawText = message_obj.choices[0].message.content.trim().replace(/```json|```/g, '').trim();
    let parsed;
    try { parsed = JSON.parse(rawText); } catch { parsed = { reply: rawText, movies: [] }; }
    req.session.chatHistory.push({ role: 'assistant', content: message_obj.choices[0].message.content });
    if (req.session.chatHistory.length > 20) req.session.chatHistory = req.session.chatHistory.slice(-20);
    const enriched = parsed.movies?.length ? await enrichMovies(parsed.movies) : [];
    res.json({ reply: parsed.reply, movies: enriched });
  } catch (err) {
    console.error('Chat error:', err);
    res.status(500).json({ error: 'Chat failed' });
  }
});

app.post('/api/chat/reset', (req, res) => {
  req.session.chatHistory = [];
  res.json({ ok: true });
});

app.get('/api/popular', async (req, res) => {
  if (!TMDB_KEY) return res.status(400).json({ error: 'TMDB key not configured' });
  const page = parseInt(req.query.page) || 1;
  const tab = req.query.tab === 'now_playing' ? 'now_playing' : 'popular';
  try {
    const [moviesRes, genreRes] = await Promise.all([
      axios.get(`https://api.themoviedb.org/3/movie/${tab}`, { params: { api_key: TMDB_KEY, language: 'en-US', page } }),
      axios.get('https://api.themoviedb.org/3/genre/movie/list', { params: { api_key: TMDB_KEY, language: 'en-US' } })
    ]);
    const genreMap = {};
    genreRes.data.genres.forEach(g => { genreMap[g.id] = g.name; });
    const formatMovie = (m) => ({
      tmdb_id: m.id, title: m.title,
      poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
      backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : null,
      rating: m.vote_average?.toFixed(1), vote_count: m.vote_count,
      release_year: m.release_date?.split('-')[0], release_date: m.release_date,
      overview: m.overview, genres: m.genre_ids?.map(id => genreMap[id]).filter(Boolean) || []
    });
    res.json({ movies: moviesRes.data.results.map(formatMovie), page: moviesRes.data.page, total_pages: moviesRes.data.total_pages });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch popular movies' });
  }
});

app.get('/api/movie/:id', async (req, res) => {
  if (!TMDB_KEY) return res.status(400).json({ error: 'TMDB key not configured' });
  const { id } = req.params;
  try {
    const [detailRes, creditsRes, providersRes] = await Promise.all([
      axios.get(`https://api.themoviedb.org/3/movie/${id}`, { params: { api_key: TMDB_KEY, language: 'en-US' } }),
      axios.get(`https://api.themoviedb.org/3/movie/${id}/credits`, { params: { api_key: TMDB_KEY } }),
      axios.get(`https://api.themoviedb.org/3/movie/${id}/watch/providers`, { params: { api_key: TMDB_KEY } })
    ]);
    const d = detailRes.data;
    const credits = creditsRes.data;
    const providerData = providersRes.data.results;
    const regionProviders = providerData?.IN || providerData?.US || null;
    const streamingProviders = [
      ...(regionProviders?.flatrate || []),
      ...(regionProviders?.rent || []),
      ...(regionProviders?.buy || [])
    ].filter((p, i, arr) => arr.findIndex(x => x.provider_id === p.provider_id) === i)
     .slice(0, 8)
     .map(p => ({
       name: p.provider_name,
       logo: `https://image.tmdb.org/t/p/w92${p.logo_path}`,
       type: regionProviders?.flatrate?.find(x => x.provider_id === p.provider_id) ? 'stream'
           : regionProviders?.rent?.find(x => x.provider_id === p.provider_id) ? 'rent' : 'buy'
     }));
    res.json({
      tmdb_id: d.id, title: d.title, tagline: d.tagline, overview: d.overview,
      poster: d.poster_path ? `https://image.tmdb.org/t/p/w500${d.poster_path}` : null,
      backdrop: d.backdrop_path ? `https://image.tmdb.org/t/p/w1280${d.backdrop_path}` : null,
      rating: d.vote_average?.toFixed(1), vote_count: d.vote_count,
      release_date: d.release_date, release_year: d.release_date?.split('-')[0],
      runtime: d.runtime, genres: d.genres?.map(g => g.name) || [],
      languages: d.spoken_languages?.map(l => l.english_name) || [],
      cast: credits.cast?.slice(0, 8).map(c => ({ name: c.name, character: c.character, photo: c.profile_path ? `https://image.tmdb.org/t/p/w185${c.profile_path}` : null })) || [],
      director: credits.crew?.find(c => c.job === 'Director')?.name || null,
      streaming: streamingProviders
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

// ─── PASTE THIS BLOCK INTO server.js JUST BEFORE app.listen ─────────────────
// Route: /api/discover  — handles search + genre + rating filters via TMDB

// TMDB genre name → ID map (static, doesn't change)
const GENRE_IDS = {
  'Action': 28, 'Adventure': 12, 'Animation': 16, 'Comedy': 35,
  'Crime': 80, 'Documentary': 99, 'Drama': 18, 'Fantasy': 14,
  'Horror': 27, 'Mystery': 9648, 'Romance': 10749, 'Sci-Fi': 878,
  'Thriller': 53, 'War': 10752
};

const SECTION_DEFS = {
  trending:       { title: '🔥 Trending This Week',       endpoint: 'trending/movie/week', params: {} },
  fan_favourites: { title: '❤️ Fan Favourites',           endpoint: 'movie/popular',       params: {} },
  now_playing:    { title: '🎬 Now Playing in Theatres',  endpoint: 'movie/now_playing',   params: {} },
  new_releases:   { title: '🆕 New Releases',             endpoint: 'discover/movie',      params: { sort_by: 'release_date.desc', 'primary_release_date.gte': new Date(Date.now() - 90*24*60*60*1000).toISOString().split('T')[0], 'vote_count.gte': 50 } },
  award_winners:  { title: '🏆 Award Winners (IMDb 8+)',  endpoint: 'discover/movie',      params: { sort_by: 'vote_average.desc', 'vote_average.gte': 8, 'vote_count.gte': 1000 } },
  top_rated:      { title: '⭐ Top Rated All Time',        endpoint: 'movie/top_rated',     params: {} },
  international:  { title: '🌍 International Cinema',     endpoint: 'discover/movie',      params: { sort_by: 'popularity.desc', with_original_language: 'ko|ja|fr|es|hi|it|de|ta|te', 'vote_count.gte': 200 } },
  mind_benders:   { title: '🧠 Mind Benders',             endpoint: 'discover/movie',      params: { with_genres: '9648|878|53', sort_by: 'vote_average.desc', 'vote_count.gte': 300 } },
  late_night:     { title: '🌙 Late Night Picks',         endpoint: 'discover/movie',      params: { with_genres: '27|9648|53', sort_by: 'popularity.desc', 'primary_release_date.lte': '2005-01-01', 'vote_count.gte': 500 } },
  cry_club:       { title: '💔 Cry Club',                 endpoint: 'discover/movie',      params: { with_genres: 18, sort_by: 'vote_average.desc', without_genres: 28, 'vote_count.gte': 1000 } },
  music_films:    { title: '🎵 Music-Driven Films',       endpoint: 'discover/movie',      params: { with_genres: 10402, sort_by: 'vote_average.desc', 'vote_count.gte': 200 } },
  horror:         { title: '😱 Horror Picks',             endpoint: 'discover/movie',      params: { with_genres: 27, sort_by: 'popularity.desc', 'vote_count.gte': 200 } },
  comedy:         { title: '😂 Comedy Corner',            endpoint: 'discover/movie',      params: { with_genres: 35, sort_by: 'popularity.desc', 'vote_count.gte': 200 } },
  drama:          { title: '🎭 Drama Spotlight',          endpoint: 'discover/movie',      params: { with_genres: 18, sort_by: 'vote_average.desc', 'vote_count.gte': 500 } },
  rewatchable:    { title: '🔁 Must Rewatch',             endpoint: 'discover/movie',      params: { sort_by: 'vote_average.desc', 'vote_average.gte': 7.5, 'vote_count.gte': 5000 } },
  classics:       { title: '💀 All-Time Classics',        endpoint: 'discover/movie',      params: { sort_by: 'vote_average.desc', 'primary_release_date.lte': '1975-01-01', 'vote_count.gte': 500 } },
};

function formatMovie(m, genreMap = {}) {
  return {
    tmdb_id: m.id, title: m.title,
    poster: m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : null,
    backdrop: m.backdrop_path ? `https://image.tmdb.org/t/p/w1280${m.backdrop_path}` : null,
    rating: m.vote_average?.toFixed(1), vote_count: m.vote_count,
    release_year: m.release_date?.split('-')[0], release_date: m.release_date,
    overview: m.overview,
    genres: (m.genre_ids || m.genres?.map(g => g.id) || []).map(id => genreMap[id]).filter(Boolean)
  };
}

async function getGenreMap() {
  const r = await axios.get('https://api.themoviedb.org/3/genre/movie/list', { params: { api_key: TMDB_KEY, language: 'en-US' } });
  const map = {};
  r.data.genres.forEach(g => { map[g.id] = g.name; });
  return map;
}

async function fetchSection(sectionId, page = 1, genreMap = {}) {
  const def = SECTION_DEFS[sectionId];
  if (!def) return { movies: [], total_pages: 0, page: 1 };
  const isTrending = def.endpoint.startsWith('trending');
  const url = `https://api.themoviedb.org/3/${def.endpoint}`;
  const params = { api_key: TMDB_KEY, language: 'en-US', include_adult: false, ...def.params };
  if (!isTrending) params.page = page;
  const res = await axios.get(url, { params });
  return { movies: res.data.results.map(m => formatMovie(m, genreMap)), page: res.data.page || page, total_pages: res.data.total_pages || 1 };
}

app.get('/api/sections', async (req, res) => {
  if (!TMDB_KEY) return res.status(400).json({ error: 'TMDB key not configured' });
  try {
    const genreMap = await getGenreMap();
    const ids = Object.keys(SECTION_DEFS);
    const results = await Promise.all(ids.map(id => fetchSection(id, 1, genreMap).catch(() => ({ movies: [], page: 1, total_pages: 1 }))));
    const sections = ids.map((id, i) => ({ id, title: SECTION_DEFS[id].title, movies: results[i].movies.slice(0, 20), total_pages: results[i].total_pages })).filter(s => s.movies.length > 0);
    res.json({ sections });
  } catch (err) {
    console.error('Sections error:', err.message);
    res.status(500).json({ error: 'Failed to fetch sections' });
  }
});

app.get('/api/section/:id', async (req, res) => {
  if (!TMDB_KEY) return res.status(400).json({ error: 'TMDB key not configured' });
  const { id } = req.params;
  const page = parseInt(req.query.page) || 1;
  if (!SECTION_DEFS[id]) return res.status(404).json({ error: 'Section not found' });
  try {
    const genreMap = await getGenreMap();
    const data = await fetchSection(id, page, genreMap);
    res.json({ ...data, title: SECTION_DEFS[id].title });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch section' });
  }
});

app.get('/api/person', async (req, res) => {
  if (!TMDB_KEY) return res.status(400).json({ error: 'TMDB key not configured' });
  const { name } = req.query;
  if (!name) return res.status(400).json({ error: 'name required' });
  try {
    const r = await axios.get('https://api.themoviedb.org/3/search/person', { params: { api_key: TMDB_KEY, query: name } });
    const person = r.data.results?.[0];
    if (!person) return res.json({ person: null });
    res.json({ person: { id: person.id, name: person.name, photo: person.profile_path ? `https://image.tmdb.org/t/p/w185${person.profile_path}` : null } });
  } catch (err) {
    res.status(500).json({ error: 'Failed to search person' });
  }
});

app.get('/api/discover', async (req, res) => {
  if (!TMDB_KEY) return res.status(400).json({ error: 'TMDB key not configured' });
  const { search, genre, rating, page = 1, language, runtime, sort, platform, decade, director_id, mood, age, rewatchable } = req.query;
  try {
    const genreMap = await getGenreMap();
    let url, params;
    if (search) {
      url = 'https://api.themoviedb.org/3/search/movie';
      params = { api_key: TMDB_KEY, language: 'en-US', query: search, page, include_adult: false };
    } else {
      url = 'https://api.themoviedb.org/3/discover/movie';
      params = { api_key: TMDB_KEY, language: 'en-US', sort_by: sort || 'popularity.desc', page, include_adult: false, 'vote_count.gte': 50 };
      if (genre && GENRE_IDS[genre]) params.with_genres = GENRE_IDS[genre];
      if (rating) params['vote_average.gte'] = parseFloat(rating);
      if (language && LANGUAGE_CODES[language]) params.with_original_language = LANGUAGE_CODES[language];
      if (platform && STREAMING_IDS[platform]) { params.with_watch_providers = STREAMING_IDS[platform]; params.watch_region = 'IN'; }
      if (runtime === 'short') params['with_runtime.lte'] = 90;
      if (runtime === 'long') params['with_runtime.gte'] = 120;
      if (decade) { params['primary_release_date.gte'] = `${decade}-01-01`; params['primary_release_date.lte'] = `${parseInt(decade) + 9}-12-31`; }
      if (director_id) params.with_crew = director_id;
      if (mood) {
        const m = parseInt(mood);
        if (m <= 3) { params.with_genres = params.with_genres ? `${params.with_genres}|35` : '35|16|10751'; params['vote_average.lte'] = 7.5; }
        else if (m >= 7) { params.with_genres = params.with_genres ? `${params.with_genres}|18` : '18|80|53|27'; params['vote_average.gte'] = 7; params['vote_count.gte'] = 300; }
      }
      if (age === 'classic') params['primary_release_date.lte'] = '1975-01-01';
      else if (age === 'vintage') { params['primary_release_date.gte'] = '1975-01-01'; params['primary_release_date.lte'] = '2005-01-01'; }
      else if (age === 'recent') params['primary_release_date.gte'] = '2005-01-01';
      if (rewatchable === 'true') { params['vote_count.gte'] = 5000; params['vote_average.gte'] = Math.max(params['vote_average.gte'] || 0, 7.5); params.sort_by = 'vote_count.desc'; }
    }
    const moviesRes = await axios.get(url, { params });
    res.json({ movies: moviesRes.data.results.map(m => formatMovie(m, genreMap)), page: moviesRes.data.page, total_pages: Math.min(moviesRes.data.total_pages, 500) });
  } catch (err) {
    console.error('Discover error:', err.message);
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});

app.listen(PORT, () => console.log(`CineMatch backend running on :${PORT}`));
