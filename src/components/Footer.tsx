import { Link } from 'react-router-dom'
import { useSettings } from '../context/SettingsContext'
import SocialLinks from './SocialLinks'
import WhatsAppButton from './WhatsAppButton'

export default function Footer() {
  const { settings } = useSettings()
  return (
    <footer className="footer">
      <div className="footer-main">
        <div>
          <div className="footer-brand">
            <img src={settings.logoUrl} alt="" width="48" height="48" loading="lazy" />
            <h3>{settings.shopName.toUpperCase()}</h3>
          </div>
          {settings.slogan && <p className="footer-slogan">{settings.slogan}</p>}
          <p>{settings.description}</p>
          <div className="footer-contact">
            <WhatsAppButton label="Chat on WhatsApp" />
            <SocialLinks />
          </div>
        </div>
        <div>
          <h4>EXPLORE</h4>
          <Link to="/">Home</Link>
          <Link to="/shop">Shop all</Link>
          <Link to="/shop?sort=newest">New arrivals</Link>
          <Link to="/about">About</Link>
        </div>
        <div>
          <h4>HELP</h4>
          <Link to="/contact">Contact</Link>
          <Link to="/delivery-returns">Delivery &amp; returns</Link>
          <Link to="/faq">FAQ</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <span>
          © {new Date().getFullYear()} {settings.shopName.toUpperCase()}
        </span>
        <span>ORDERS ARE CONFIRMED BY THE SHOP OVER WHATSAPP</span>
      </div>
    </footer>
  )
}
