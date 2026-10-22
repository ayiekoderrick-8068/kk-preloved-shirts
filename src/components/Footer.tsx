import { Link } from 'react-router-dom'
import { config, localDisplay } from '../lib/config'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-main">
        <div>
          <h3>{config.storeName.toUpperCase()}</h3>
          <p>We scour the best thrifts for unique, one-of-a-kind pieces. Once a shirt is gone, it&apos;s gone.</p>
          <p>
            Call / WhatsApp: <a href={`tel:+${config.whatsappNumber}`}>{localDisplay(config.whatsappNumber)}</a> /{' '}
            <a href={`tel:+${config.secondaryPhone}`}>{localDisplay(config.secondaryPhone)}</a>
          </p>
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
