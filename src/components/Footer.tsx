import { Link } from 'react-router-dom'
import { config } from '../lib/config'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div>
          <h3>
            KK<span className="dot">.</span> PRELOVED SHIRTS
          </h3>
          <p>Carefully chosen preloved shirts. Every piece is one of a kind, so once it&apos;s gone, it&apos;s gone.</p>
        </div>
        <div>
          <h4>EXPLORE</h4>
          <Link to="/">Home</Link>
          <Link to="/shop">Shop all</Link>
          <Link to="/about">About</Link>
        </div>
        <div>
          <h4>HELP</h4>
          <Link to="/contact">Contact</Link>
          <Link to="/delivery-returns">Delivery &amp; returns</Link>
          <Link to="/faq">FAQ</Link>
          {config.instagramUrl && (
            <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          )}
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} {config.storeName.toUpperCase()}
        </span>
        <span>ORDERS ARE CONFIRMED BY THE SHOP OVER WHATSAPP</span>
      </div>
    </footer>
  )
}
