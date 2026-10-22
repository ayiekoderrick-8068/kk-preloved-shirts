import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom'
import CartDrawer from './components/CartDrawer'
import Footer from './components/Footer'
import Header from './components/Header'
import { CartProvider } from './context/CartContext'
import { ProductsProvider } from './context/ProductsContext'
import { ToastProvider } from './context/ToastContext'
import Home from './pages/Home'
import { About, Contact, DeliveryReturns, Faq } from './pages/Info'
import NotFound from './pages/NotFound'
import ProductPage from './pages/ProductPage'
import Shop from './pages/Shop'

const Admin = lazy(() => import('./pages/Admin'))

/** Move focus and scroll to the top of the new page on navigation. */
function RouteEffects() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    document.getElementById('main')?.focus({ preventScroll: true })
  }, [pathname])
  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <ProductsProvider>
          <CartProvider>
            <RouteEffects />
            <a className="skip-link" href="#main" onClick={(e) => { e.preventDefault(); document.getElementById('main')?.focus() }}>Skip to content</a>
            <Header />
            <main id="main" tabIndex={-1}>
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/shop/:id" element={<ProductPage />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/delivery-returns" element={<DeliveryReturns />} />
                <Route path="/faq" element={<Faq />} />
                <Route path="/admin" element={<Suspense fallback={<p className="section page" role="status">Loading…</p>}><Admin /></Suspense>} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
            <CartDrawer />
          </CartProvider>
        </ProductsProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
