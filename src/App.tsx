import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { HomePage } from './pages/HomePage'
import { SessionPage } from './pages/SessionPage'
import { VotePage } from './pages/VotePage'

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'rgba(30,30,40,0.95)',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
            backdropFilter: 'blur(20px)',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#A855F7', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#EF4444', secondary: '#fff' },
          },
        }}
      />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/session/:code" element={<SessionPage />} />
        <Route path="/vote/:voteId" element={<VotePage />} />
      </Routes>
    </BrowserRouter>
  )
}
