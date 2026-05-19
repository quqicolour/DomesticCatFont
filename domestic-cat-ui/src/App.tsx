import { useState } from 'react'
import { Home, Image, Trophy, Cat } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'
import WalletButton from './components/WalletButton'
import HomePage from './pages/HomePage'
import MyCatsPage from './pages/MyCatsPage'
import GalleryPage from './pages/GalleryPage'
import PrizePage from './pages/PrizePage'

type Page = 'home' | 'mycats' | 'gallery' | 'prize'

const NAV_ITEMS: { id: Page; label: string; icon: React.ReactNode }[] = [
  { id: 'home', label: 'Home', icon: <Home size={16} /> },
  { id: 'mycats', label: 'My Cats', icon: <Cat size={16} /> },
  { id: 'gallery', label: 'Gallery', icon: <Image size={16} /> },
  { id: 'prize', label: 'Prize', icon: <Trophy size={16} /> },
]

export default function App() {
  const [page, setPage] = useState<Page>('home')

  const renderPage = () => {
    switch (page) {
      case 'home': return <HomePage />
      case 'mycats': return <MyCatsPage />
      case 'gallery': return <GalleryPage />
      case 'prize': return <PrizePage />
    }
  }

  return (
    <div className="app-shell">
      <nav className="navbar">
        <div className="nav-logo">
          <span className="nav-logo-icon">🐱</span>
          DomesticCat
        </div>
        <ul className="nav-links">
          {NAV_ITEMS.map(({ id, label, icon }) => (
            <li key={id}>
              <a
                href="#"
                className={page === id ? 'active' : ''}
                onClick={(e) => { e.preventDefault(); setPage(id) }}
              >
                {icon}
                {label}
              </a>
            </li>
          ))}
        </ul>
        <div className="nav-right">
          <WalletButton />
        </div>
      </nav>
      <main className="main-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
          >
            {renderPage()}
          </motion.div>
        </AnimatePresence>
      </main>
      <footer style={{
        textAlign: 'center', padding: '24px',
        color: 'var(--text-muted)', fontSize: '13px',
        borderTop: '1px solid var(--border)',
        fontFamily: "'Space Mono', monospace"
      }}>
        DomesticCat · 10,000 Unique On-Chain SVG Cats · Powered by AMeow Token
      </footer>
    </div>
  )
}
