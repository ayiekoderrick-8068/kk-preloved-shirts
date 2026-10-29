import Seo from '../components/Seo'
import WhatsAppButton from '../components/WhatsAppButton'
import { useSettings } from '../context/SettingsContext'
import { config, localDisplay } from '../lib/config'
import { formatKes } from '../lib/inventory'
import { DEFAULT_RULE, pairDealText } from '../lib/pricing'

const TBC = 'To be announced by the shop.'
const fee = formatKes(config.bookingFeeKes)

export function About() {
  const { settings } = useSettings()
  return (
    <section className="section page">
      <Seo title="About" description={`About ${settings.shopName} - curated pre-loved clothing, unique one-of-a-kind pieces.`} path="/about" />
      <p className="eyebrow">About</p>
      <h1>{settings.shopName}</h1>
      {settings.slogan && <p className="about-slogan">{settings.slogan}</p>}
      <img className="about-logo" src={settings.logoUrl} alt={`${settings.shopName} logo`} width="200" height="200" />
      <p>Upgrade your wardrobe with our curated collection of pre-loved clothing. We scour the best thrifts to bring you unique, one-of-a-kind pieces that blend style, comfort and sustainability.</p>
      <p>Join us for a shopping experience that&apos;s all about finding hidden gems and rocking your personal style.</p>
      <p>Every piece is usually the only one we have, so we list size, measurements, condition and flaws for each item once it has been checked. Until then you will see &ldquo;Details to confirm&rdquo; instead of a guess.</p>
      {config.storeCity && <p>Based in {config.storeCity}.</p>}
    </section>
  )
}

export function Contact() {
  const { settings } = useSettings()
  return (
    <section className="section page">
      <Seo title="Contact" description={`Message ${settings.shopName} on WhatsApp about sizes, availability, booking, delivery or pickup.`} path="/contact" />
      <p className="eyebrow">Contact</p>
      <h1>Get in touch</h1>
      <p className="contact-cta">
        <WhatsAppButton label="Chat on WhatsApp" />
      </p>
      <dl className="specs wide">
        <div>
          <dt>Call</dt>
          <dd>
            <span className="phone-row">
              <a href={`tel:+${settings.contactPhone ? settings.contactPhone.replace(/\D/g, '') : config.secondaryPhone}`}>
                {settings.contactPhone || localDisplay(config.secondaryPhone)}
              </a>
            </span>
          </dd>
        </div>
        <div>
          <dt>Booking fee</dt>
          <dd>{fee} per item</dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd className={settings.contactEmail ? '' : 'tbc'}>{settings.contactEmail ? <a href={`mailto:${settings.contactEmail}`}>{settings.contactEmail}</a> : TBC}</dd>
        </div>
        <div>
          <dt>Instagram</dt>
          <dd className={settings.instagramUrl ? '' : 'tbc'}>{settings.instagramUrl ? <a href={settings.instagramUrl} target="_blank" rel="noopener noreferrer">Follow us on Instagram</a> : TBC}</dd>
        </div>
        <div>
          <dt>TikTok</dt>
          <dd className={settings.tiktokUrl ? '' : 'tbc'}>{settings.tiktokUrl ? <a href={settings.tiktokUrl} target="_blank" rel="noopener noreferrer">Follow us on TikTok</a> : TBC}</dd>
        </div>
        <div>
          <dt>Location</dt>
          <dd className={config.storeCity ? '' : 'tbc'}>{config.storeCity || TBC}</dd>
        </div>
        <div>
          <dt>Pickup</dt>
          <dd className={config.pickupInfo ? '' : 'tbc'}>{config.pickupInfo || TBC}</dd>
        </div>
      </dl>
    </section>
  )
}

export function DeliveryReturns() {
  const { settings } = useSettings()
  return (
    <section className="section page">
      <Seo title="Booking, delivery & returns" description={`How booking, payment, delivery and returns work at ${settings.shopName}.`} path="/delivery-returns" />
      <p className="eyebrow">Policies</p>
      <h1>Booking, delivery &amp; returns</h1>
      <h2>Booking &amp; payment</h2>
      <p>Bookings are made at a fee of {fee} per item. Pay via <strong>Pochi la Biashara {config.pochiNumber}</strong> once the shop has confirmed the item is available. This website does not take payments.</p>
      <h2>Delivery &amp; pickup</h2>
      <p>{config.deliveryInfo || 'Delivery areas, fees and timing are confirmed by the shop when it replies to your order request. No delivery fee is added on this website.'}</p>
      {config.pickupInfo && <p>Pickup: {config.pickupInfo}</p>}
      <h2>Returns &amp; exchanges</h2>
      <p>{config.returnsPolicy || 'The shop has not published a returns or exchange policy yet. Please ask before you pay.'}</p>
    </section>
  )
}

export function Faq() {
  const { settings } = useSettings()
  const items: [string, string][] = [
    ['Is every piece one of a kind?', 'Yes, unless a listing shows more than one available. A one-off piece can only be bought once.'],
    ['Why does an item say "Details to confirm"?', 'The size, condition or stock has not been checked yet. We would rather say so than guess.'],
    ['How do I order?', 'Add items to your bag, enter your details and send the request on WhatsApp. The shop replies to confirm availability, the final total and delivery. You can also use the WhatsApp button on any product to ask about it first.'],
    ['How much do the shirts cost?', `${pairDealText()}. With more shirts, each full pair is KES ${DEFAULT_RULE.pair} and a leftover single is KES ${DEFAULT_RULE.unit}. Items with their own price are charged that price. The shop confirms the final total, plus any delivery fee, when it replies.`],
    ['How does booking work?', `Booking is ${fee} per item, paid via Pochi la Biashara ${config.pochiNumber} after the shop confirms the item is available.`],
    ['Do I pay on the website?', 'No. The website takes no payment. Payment is arranged directly with the shop once it confirms your order.'],
    ['Is my order confirmed when I press send?', 'No. It is only a request until the shop confirms it. Asking about an item on WhatsApp never reserves it either.'],
  ]
  return (
    <section className="section page">
      <Seo title="FAQ" description={`Answers about ordering and booking from ${settings.shopName}.`} path="/faq" />
      <p className="eyebrow">Help</p>
      <h1>FAQ</h1>
      {items.map(([q, a]) => (
        <details key={q} className="faq">
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
    </section>
  )
}
