import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
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

  useEffect(() => {
     
    setMenuOpen(false)
  }, [pathname])

  return (
    <header className="nav">
      <div className="nav-inner">
        <nav className="nav-links" aria-label="Main">
          {LINKS.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'}>
              {label}
            </NavLink>
          ))}
        </nav>
        <Link className="logo" to="/" aria-label={`${config.storeName} home`}>
          <span>
            KK<span className="dot">.</span>
          </span>
          <small>PRELOVED SHIRTS</small>
        </Link>
        <div className="nav-actions">
          <button type="button" className="mini-btn" onClick={openCart} aria-label={`Open bag, ${count} ${count === 1 ? 'item' : 'items'}`}>
            Bag <span className="bag-count">{count}</span>
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
