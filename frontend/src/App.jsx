import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Home from './pages/Home'
import Questionnaire from './pages/Questionnaire'
import Results from './pages/Results'
import Chat from './pages/Chat'
import ForYou from './pages/ForYou'
import WatchWith from './pages/WatchWith'
import './index.css'

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/quiz" element={<Questionnaire />} />
          <Route path="/results" element={<Results />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/foryou" element={<ForYou />} />
          <Route path="/watchwith" element={<WatchWith />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
