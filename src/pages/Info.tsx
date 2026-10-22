import Seo from '../components/Seo'
import { config, hasWhatsApp } from '../lib/config'

const TBC = 'To be announced by the shop.'

export function About() {
  return (
    <section className="section page">
      <Seo title="About" description="About KK Preloved Shirts - one-off preloved shirts, listed honestly and ordered over WhatsApp." path="/about" />
      <p className="eyebrow">About</p>
      <h1>{config.storeName}</h1>
      <p>We sell preloved shirts. Every piece is photographed individually and is usually the only one we have, so we list the size, measurements, condition and any flaws for each item once they have been checked.</p>
      <p>Until an item&apos;s details are confirmed you will see &ldquo;Details to confirm&rdquo; instead of a guess. Orders are requests: the shop replies on WhatsApp to confirm availability, delivery and payment.</p>
      {config.storeCity && <p>Based in {config.storeCity}.</p>}
    </section>
  )
}

export function Contact() {
  return (
    <section className="section page">
      <Seo title="Contact" description="Contact KK Preloved Shirts about sizes, availability, delivery or pickup." path="/contact" />
      <p className="eyebrow">Contact</p>
      <h1>Get in touch</h1>
      <dl className="specs wide">
        <div>
          <dt>WhatsApp</dt>
          <dd className={hasWhatsApp ? '' : 'tbc'}>
            {hasWhatsApp ? (
              <a href={`https://wa.me/${config.whatsappNumber}`} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
            ) : (
              'Number coming soon.'
            )}
          </dd>
        </div>
        <div>
          <dt>Email</dt>
          <dd className={config.contactEmail ? '' : 'tbc'}>{config.contactEmail ? <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a> : TBC}</dd>
        </div>
        <div>
          <dt>Instagram</dt>
          <dd className={config.instagramUrl ? '' : 'tbc'}>{config.instagramUrl ? <a href={config.instagramUrl} target="_blank" rel="noopener noreferrer">Follow us</a> : TBC}</dd>
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
  return (
    <section className="section page">
      <Seo title="Delivery & returns" description="Delivery, pickup and returns information for KK Preloved Shirts." path="/delivery-returns" />
      <p className="eyebrow">Policies</p>
      <h1>Delivery &amp; returns</h1>
      <h2>Delivery &amp; pickup</h2>
      <p>{config.deliveryInfo || 'Delivery areas, fees and timing are confirmed by the shop when it replies to your order request. No delivery fee is added on this website.'}</p>
      {config.pickupInfo && <p>Pickup: {config.pickupInfo}</p>}
      <h2>Returns &amp; exchanges</h2>
      <p>{config.returnsPolicy || 'The shop has not published a returns or exchange policy yet. Please ask before you pay.'}</p>
    </section>
  )
}

export function Faq() {
  const items: [string, string][] = [
    ['Is every shirt one of a kind?', 'Yes, unless a listing shows more than one available. A one-off piece can only be bought once.'],
    ['Why does a shirt say "Details to confirm"?', 'The size, condition or stock has not been checked yet. We would rather say so than guess.'],
    ['How do I order?', 'Add shirts to your bag, enter your details and send the request on WhatsApp. The shop replies to confirm availability, the final total and delivery.'],
    ['Do I pay on the website?', 'No. The website takes no payment. Payment is arranged directly with the shop once it confirms your order.'],
    ['Is my order confirmed when I press send?', 'No. It is only a request until the shop confirms it.'],
  ]
  return (
    <section className="section page">
      <Seo title="FAQ" description="Answers about ordering preloved shirts from KK Preloved Shirts." path="/faq" />
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
