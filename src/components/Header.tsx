import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useSettings } from '../context/SettingsContext'
import LogoImage from './LogoImage'
import SocialLinks from './SocialLinks'
import WhatsAppButton from './WhatsAppButton'

const LINKS: [string, string][] = [
  ['/', 'Home'],
  ['/shop', 'Shop'],
  ['/about', 'About'],
  ['/contact', 'Contact'],
]

export default function Header() {
  const { count, openCart, addPulse } = useCart()
  const { settings } = useSettings()
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
     
    setMenuOpen(false)
  }, [pathname])

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link className="logo" to="/" aria-label={`${settings.shopName} home`}>
          <LogoImage url={settings.logoUrl} size={56} />
          <span className="logo-words">
            <span className="logo-text">{settings.shopName}</span>
            {settings.slogan && <span className="logo-slogan">{settings.slogan}</span>}
          </span>
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
          <button type="button" className="mini-btn bag-btn" onClick={openCart} aria-label={count === 0 ? 'Open bag, empty' : `Open bag, ${count} ${count === 1 ? 'item' : 'items'}`}>
            {/* key={addPulse} restarts the bounce each time a shirt is added */}
            <span key={addPulse} className={`bag-art${addPulse > 0 ? ' bump' : ''}`}>
              <svg className="bag-svg" width="30" height="30" viewBox="0 0 32 32" fill="none" aria-hidden="true">
                <path className="bag-line" d="M7 10h18l-1.400 16.200a2 2 0 0 1-2 1.800H10.400a2 2 0 0 1-2-1.800L7 10Z" />
                <path className="bag-line" d="M11 10V8.500a5 5 0 0 1 10 0V10" />
                <path className="bag-line" d="M9.500 23.500c4 1.700 9 1.700 13 0" />
                <path className="bag-shirt" d="M13.200 14.600l2.800-1.300c.4 1.100 1.600 1.100 2 0l2.800 1.300 1.200 2.400-1.900 1v4.200h-6.200V18l-1.900-1z" />
              </svg>
              {count > 0 && <span className="bag-count" aria-hidden="true">{count > 99 ? '99+' : count}</span>}
            </span>
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
        <div className="mobile-contact">
          <WhatsAppButton label="Chat on WhatsApp" />
          <SocialLinks />
        </div>
      </nav>
    </header>
  )
}
