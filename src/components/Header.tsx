import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { config } from '../lib/config'

const LINKS: [string, string][] = [
  ['/', 'Home'],
  ['/shop', 'Shop'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
]

export default function Header() {
  const { count, openCart } = useCart()
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
     
    setMenuOpen(false)
  }, [pathname])

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link className="logo" to="/" aria-label={`${config.storeName} home`}>
          <img src="/logo.png" alt="" width="56" height="56" />
          <span className="logo-text">{config.storeName}</span>
        </Link>
        <nav className="nav-links" aria-label="Main">
          {LINKS.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="nav-actions">
          <button type="button" className="mini-btn search-btn" aria-label="Search shirts" onClick={() => navigate('/shop', { state: { focusSearch: Date.now() } })}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <circle cx="11" cy="11" r="6.500" />
              <path d="m16 16 4 4" />
            </svg>
          </button>
          <span className="nav-divider" aria-hidden="true" />
          <button type="button" className="mini-btn bag-btn" onClick={openCart} aria-label={`Open bag, ${count} ${count === 1 ? 'item' : 'items'}`}>
            <span aria-hidden="true">Bag</span>
            <span className="bag-count" aria-hidden="true">{count}</span>
          </button>
          <button
            type="button"
            className="mini-btn nav-toggle"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>
      <nav id="mobile-nav" className={`mobile-nav${menuOpen ? ' active' : ''}`} aria-label="Mobile" {...(menuOpen ? {} : { inert: true })}>
        {LINKS.map(([to, label]) => (
          <NavLink key={to} to={to} end={to === '/'}>
            {label}
          </NavLink>
        ))}
      </nav>
    </header>
  )
}
