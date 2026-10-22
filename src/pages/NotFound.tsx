import { Link } from 'react-router-dom'
import Seo from '../components/Seo'

export default function NotFound({ message = "We couldn't find that page." }: { message?: string }) {
  return (
    <section className="section page">
      <Seo title="Page not found" description={message} noindex />
      <h1>Not found</h1>
      <p>{message}</p>
      <Link to="/shop" className="primary">Back to the shop</Link>
    </section>
  )
}
