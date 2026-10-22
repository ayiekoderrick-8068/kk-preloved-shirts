import { pairDealText } from '../lib/pricing'

const SPARK = '#a24d35'

function ShirtsIcon() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">
      <circle cx="44" cy="44" r="30" fill="#eadfce" opacity=".75" />
      <g stroke={SPARK} strokeWidth="2" strokeLinecap="round">
        <path d="M10 27l7 3M14 20l5 5M26 14l1 7" />
      </g>
      <g transform="translate(6 30) rotate(-9 18 20)">
        <path d="M2 10 L11 3 L18 8 L25 3 L34 10 L30 19 L26 16 L26 38 L10 38 L10 16 L6 19 Z" fill="#efe7d8" stroke="#cfc3ab" strokeLinejoin="round" />
        <path d="M11 3 L18 12 L25 3" fill="#fbf8f1" stroke="#cfc3ab" strokeLinejoin="round" />
        <path d="M18 12 V38" stroke="#cfc3ab" />
        <rect x="20.500" y="22" width="5" height="5" rx=".8" fill="none" stroke="#cfc3ab" />
      </g>
      <g transform="translate(34 24) rotate(8 20 22)">
        <path d="M2 11 L12 3 L20 9 L28 3 L38 11 L33 21 L29 18 L29 42 L11 42 L11 18 L7 21 Z" fill="#a24d35" strokeLinejoin="round" />
        <path d="M12 3 L20 13 L28 3" fill="#b9613f" strokeLinejoin="round" />
        <path d="M20 13 V42" stroke="#843c28" />
        <rect x="22.500" y="24" width="5.500" height="6" rx=".8" fill="none" stroke="#843c28" />
      </g>
    </svg>
  )
}

function PhoneIcon() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">
      <circle cx="38" cy="46" r="29" fill="#eadfce" opacity=".75" />
      <g stroke={SPARK} strokeWidth="2" strokeLinecap="round">
        <path d="M56 12l-3 6M63 17l-5 4M66 25l-6 1" />
      </g>
      <rect x="25" y="11" width="30" height="58" rx="6" fill="#2b2b29" />
      <rect x="28" y="16" width="24" height="48" rx="3" fill="#f6f4ef" />
      <circle cx="40" cy="40" r="10" fill="#2f7d57" />
      <path d="M33 52l2-6 5 4z" fill="#2f7d57" />
      <path d="M36.500 35.500c.5 3 3.500 6 7 7l2-2.200-2.500-1.500-1.200.9c-1-.5-2.200-1.700-2.700-2.700l.9-1.200-1.500-2.500z" fill="#fff" />
    </svg>
  )
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 80 80" width="80" height="80" aria-hidden="true">
      <circle cx="38" cy="46" r="29" fill="#eadfce" opacity=".75" />
      <g stroke={SPARK} strokeWidth="2" strokeLinecap="round">
        <path d="M60 14l3 5M67 19l-4 3M69 28l-6 0" />
      </g>
      <path d="M14 30l24-10 24 10v28L38 68 14 58z" fill="#c98f52" />
      <path d="M38 40v28L14 58V30z" fill="#bd8346" />
      <path d="M38 40v28l24-10V30z" fill="#a8723a" />
      <path d="M14 30l24 10 24-10-24-10z" fill="#e0b078" />
      <path d="M30 24l24 10v7l-6-2.500V32z" fill="#b57b3e" opacity=".8" />
      <circle cx="62" cy="58" r="11" fill="#2f7d57" stroke="#fff" strokeWidth="2.500" />
      <path d="M56.500 58l4 4 7-8" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function Connector() {
  return (
    <div className="how-link" aria-hidden="true">
      <span className="how-line" />
      <span className="how-chevron">›</span>
    </div>
  )
}

/** Three-step "how ordering works" strip on the home page. */
export default function HowItWorks() {
  const steps = [
    { n: 1, icon: <ShirtsIcon />, title: 'Pick your pieces', text: pairDealText() },
    { n: 2, icon: <PhoneIcon />, title: 'Send your request on WhatsApp', text: 'Send your selected shirts through WhatsApp.' },
    { n: 3, icon: <BoxIcon />, title: 'The shop confirms', text: 'Size, availability and delivery.' },
  ]
  return (
    <section className="how" aria-label="How ordering works">
      <ol className="section how-grid">
        {steps.flatMap((s, i) => [
          <li className="how-step" key={s.n}>
            <span className="how-icon">{s.icon}</span>
            <span className="how-num" aria-hidden="true">{s.n}</span>
            <span className="how-copy">
              <strong>{s.title}</strong>
              <span>{s.text}</span>
            </span>
          </li>,
          ...(i < steps.length - 1 ? [<li className="how-sep" key={`c${s.n}`} aria-hidden="true"><Connector /></li>] : []),
        ])}
      </ol>
    </section>
  )
}
